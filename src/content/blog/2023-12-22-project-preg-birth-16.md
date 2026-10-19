---
title: "Project_Preg&Birth #16"
date: 2023-12-22
description: "배포(feat. AWS)-2"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-1x-a3917c158c3f"
theme: adoption
---
배포한 직후 만난 문제 상황과 해결 과정에 대해 기록해두고자 한다.

### 회원 가입 로직

- **일반 회원 가입: **  
/“signup” 으로 GET 요청 → 회원 정보 입력 → /“users”로 POST 요청 →   
회원 정보 DB에 저장 →token 발행 → hompage로 redirection

- **OAuth2(google) 회원 가입:**  
OAuth2로 회원 가입 → DB에 email, name 저장 → token 발행  
→ user에게 추가 정보 입력 요청(db에 저장된 회원 정보를 불러와 추가 정보 입력 요청)   
→ 정보 기입 후 “/submit-additional-info” 로 PUT 요청  
→ 회원 정보 DB에 저장 → hompage로 redirection

## [문제 상황]

- 일반 회원 가입 정보를 입력 후 “/users”로 POST 요청 시 500 error 발생

## [해결 과정]

### **#jar 파일 자체 문제**

로컬에서 java -jar *.jar 로 실행 후 확인 결과 정상적으로 동작하였음.

### #DB 문제

OAuth2 로 회원 가입 시 받은 정보를 통해 server에서 정상적으로 token(access, refresh)을 발행하고, local storage, cookie에 저장됨. token은 db의 user 정보를 통해 발행하게 되므로 server에서 db에 접근 가능함을 확인.

그러나 추가 정보 입력 후 최종 회원 가입 진행 시 일반 회원 가입과 동일하게 500 error가 발생함.

### #Http 통신 문제

1. Network 확인 => user가 기입한 정보가 payload에 담겨 PUT, POST 요청이 전송되는 것을 확인함.
2. 로그인이 필요 없는 아래의 요청들을 보내보았을 때 500 error 가 발생함을 확인.  
- 비밀번호 찾기  
- ID 찾기(존재하지 않는 ID일 경우)  
- 게시글 보기  
- 검색

![](/images/medium/a3917c158c3f/1.png)

![](/images/medium/a3917c158c3f/2.png)

![](/images/medium/a3917c158c3f/3.png)

![](/images/medium/a3917c158c3f/4.png)

![](/images/medium/a3917c158c3f/5.png)

![](/images/medium/a3917c158c3f/6.png)

![](/images/medium/a3917c158c3f/7.png)

3. 위 기능들이 controller에서 thymleaf를 사용한 html 파일을 return 값으로 가지는 것들임을 확인.

### **#로그 파일(로그 파일 위치: var/jar/web.stdout)**

### **[1]**로그 파일에서 thymleaf 오류 확인

아래와 같은 오류가 발생했음을 확인할 수 있었다. ec2 환경에서 발생한 thymleaf 오류로 발생 원인은 크게 두 가지 이다.

**[Exception Message]**  
TemplateEngine : [THYMELEAF][http-nio-5000-exec-3] Exception processing template “/freeBoardList”: Error resolving template [/freeBoardList], template might not exist or might not be accessible by any of the configured Template Resolverst exist or might not be accessible by any of the configured Template Resolvers

**[발생 원인]**  
1. template이 존재하지 않음  
2. template resolver에서 접근하지 못함.

후자에 해당하는 경우일 것으로 예상되었고, 구글링 한 결과 Controller의 반환값 맨 앞에 /가 들어가 있으면 thymleaf 리졸버가 읽지 못한다는 사실을 알게 되었다.

=> Controller 반환값 앞에 / 를 모두 지우고, 재배포. 회원 가입 기능 외 다른 500 error 들은 모두 해결되었다.

### **[2]회원 가입 시 Duplicate entry error가 발생함을 확인.**

1. AWS RDS와 연동한 db 확인 시 저장되어 있는 회원 정보가 없음을 확인.
2. DB에 저장된 정보가 없는데 왜 Entry error가 발생하는지 고민하던 중에AWS에서 RDS 생성 후 local에 연결한 Datasource URL과 Elastic Beanstalk 생성 시 설정한 Datasource URL이 다른 것을 확인….
3. EB에 설정된 DB를 local 환경에 연동. DB를 확인해보니, Gradle에서 application을 build하는 과정에서 test case가 진행되는데, 이 때 생성된 user의 정보가 DB에 저장되어 있었음.
4. 일반 회원 가입 시 내가 입력한 회원 정보와, testcase 진행 시 입력된 회원 정보가 일치하여, ID, HP 번호 중복 → Duplicated entry로 회원 가입 오류가 발생함을 확인.
5. test case 진행 시 생성되었던 정보들을 모두 삭제함.

Database와 서버가 어떻게 연동되는지 정확한 이해 없이 사용하여 발생한 문제였다.

더불어서 TEST CASE가 완료되면 TEST를 위해 임시로 입력된 정보가 삭제되도록 코드를 추가하여 오늘과 같은 혼선이 일어나지 않도록 주의해야겠다.
