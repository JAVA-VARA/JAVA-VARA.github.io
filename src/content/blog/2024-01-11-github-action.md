---
title: "Github Action!"
date: 2024-01-11
description: "Github Action에서 CI/CD 를 했는데 gradle build 과정 중에 error 가 발생했다."
source: medium
original: "https://medium.com/@sj.youns1027/github-action-2083d46e7a25"
theme: problem-solving
---
Github Action에서 CI/CD 를 했는데 gradle build 과정 중에 error 가 발생했다.

![](/images/medium/2083d46e7a25/1.png)

- **Build with Gradle**

```
AdditionalInfoControllerTest 테스트 > Oauth2 회원가입 FAILED
    java.lang.IllegalStateException at DefaultCacheAwareContextLoaderDelegate.java:142
        Caused by: org.springframework.beans.factory.BeanCreationException at AbstractAutowireCapableBeanFactory.java:1751
            Caused by: org.hibernate.service.spi.ServiceException at AbstractServiceRegistryImpl.java:267
                Caused by: org.hibernate.HibernateException at DialectFactoryImpl.java:147

/. 
중략
./

22 tests completed, 13 failed

> Task :test FAILED
```

### [문제 상황]

LOCAL에서 통과하는 TEST가 Github Action에서 build 시 통과가 안된다.

### [원인]

Github Action에서 내 project code를 build, test 할 때 연동된 DB가 없어서 발생한 문제.

### [해결]

1. github에서 내 project repository를 private으로 변경
2. DB연결할 수 있는 정보가 담긴 application.yml 파일을 github에 업로드
3. 배포 성공!

### [해결 과정]

error 문구를 확인해보니***Hibernate Exception ***이라는 단어가 눈에 들어왔다. **Database 쪽에 문제가 있을 것으로 예상**이되는데, 먼저 Github Action이 build 하고 test를 진행할 때 어디에서 실행되는지 궁금해져서 찾아봤다.

### - Runner

GitHub는 워크플로를 실행하는 ***Runner ***라는 호스팅 가상 머신을 제공한다. 이 가상의 환경에서 workflow를 사용하여 스크립트 및 셸 명령을 실행할 수 있다.

이 runner라는 프로그램에서 내가 업로드한 git hub code가 gradle을 통해 build 및 test에 성공하게되면, artifact에 해당 파일 저장 후 배포가 된다.

### - application.yml

내 project는 공부용으로 사용하고 있었기 때문에 pulic repository에 업로드 중이었다. 그렇기 때문에 db의 pw 등 노출되면 안되는 정보들이 담겨 있는 application.yml 파일은 따로 push하지 않고 있었다.

github에 저장된 코드를 가져가 test와 build를 한다는데, application.yml을 업로드 하지 않았으니, runner에서는 내 프로그램을 구동할 때 연결된 db가 없었고, 이 때문에 db 명령문을 실행하지 못하고, test fail이 발생했던 것이었다.

검색을 하다보니 public repository를 사용하면서, application.yml 파일을 암호화하여 ci/cd를 할 수 있는 것 같은데 이 부분은 나중에 내 프로젝트를 포트폴리오로 제출할 일이 있을 때 시도해봐야 겠다.
