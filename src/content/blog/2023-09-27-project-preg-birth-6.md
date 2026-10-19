---
title: "Project_Preg&Birth #6"
date: 2023-09-27
description: "아이디 찾기 기능 구현"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-6-2b1e9394516c"
theme: adoption
---
### 아이디 찾기 기능 구현

## [오늘의 Commit message]

사용자가 가입 시 등록한 name과 hp를 입력하면 id를 찾아주는 기능을 구현했다.

```
User 아이디 찾기 기능 구현
[View]
findId.html
아이디 찾기 화면 구현. user가 name, hp 작성 후 summit하면 controller로 해당 정보 parameter로 전달
```

```
[Controller]
-FindViewController
아이디 찾기 화면 보여주는 기능
```

```
-FindApiController
USER가 입력한 NAME, HP를 Parameter로 받아 서비스로 전달
```

```
[Service]
controller에서 받은 name, hp 를 repository로 전달.
해당 정보가 있으면 반환, 없으면 error 문구 반환
```

```
[Repository]
User table에서
전달 받은 name과 hp 인 email 찾아서 반환한다.
```

```
[DTO]
FindUserInfo dto로 전달받은 name, hp 데이터를 계층 간 이동 시킴.
```

```
[Config]
"/findId" => url 접근 가능하도록 permit.
```

## [TroubleShootring]

1. view, controller, service, repository까지 모두 구현 후 아이디 찾기에 NAME과 HP를 입력했으나 오류 발생.

![](/images/medium/2b1e9394516c/1.png)

2. Payload를 확인했을 때 값이 입력은 되나, Controller에 전달되지 않는 문제가 있는 것으로 확인했다. 값이 전달되지 않아 status code 302가 나오며 login page로 redirection 되었다.

![](/images/medium/2b1e9394516c/2.png)

3. PostMan으로 실행시켰을 때도 해당 요청이 controller로 가지 않는 것으로 확인했다.

![](/images/medium/2b1e9394516c/3.png)

4. FindApiController에 문제가 있어 error 가 발생하는 것으로 예상할 수 있었다. view에서 값을 받을 때 @RequestBody로 값을 받는 것으로 설정하여, client의 요청이 전달되지 않는 것으로 추측하여 annotation을 @RequestParam으로 수정하였다.

![](/images/medium/2b1e9394516c/4.png)

5. PostMan 요청도 body가 아닌 param 로 값을 전달했을 때 짜여진 코드가 돌아가는 것을 확인할 수 있었다.

![](/images/medium/2b1e9394516c/5.png)

6. PostMan 요청 시 정상 작동하였으나, chrome에서 요청 시 302 code와 함께 redirection 되었다.

view에서 get 요청 시 controller에 매핑이 되지 않는 것으로 생각되어 코드를 확인해 보았으나 수정이 필요한 점을 찾을 수 없었다. 오류가 생기는 이유에 대해 한참을 고민하던 중에 설정값에서 “/showId” url을 permit하지 않은 것을 찾을 수 있었다.

![](/images/medium/2b1e9394516c/6.png)

내가 설정해주지 않으면 url 접근이 불가능한 스프링부트의 보안에 다시 한 번 감탄과 함께 허무함을 느꼈다.

![](/images/medium/2b1e9394516c/7.png)

Id 찾기 기능 구현 완성!!
