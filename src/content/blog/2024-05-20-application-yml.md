---
title: "application.yml 설정 뜯어보기"
date: 2024-05-20
description: "완전하게 이해하지 못한 코드를 구글에서 가져오다보니 코드의 양은 점점 많아지는데 머릿속은 점점 더 하얘지는 것 같다."
source: medium
original: "https://medium.com/@sj.youns1027/application-yml-%EC%84%A4%EC%A0%95-%EB%9C%AF%EC%96%B4%EB%B3%B4%EA%B8%B0-857de5830894"
theme: learned
---
## application.yml 설정 뜯어보기

완전하게 이해하지 못한 코드를 구글에서 가져오다보니 코드의 양은 점점 많아지는데 머릿속은 점점 더 하얘지는 것 같다.

먼저 내가 쓴 application.yml 설정 파일의 코드들이 각각 어떤 역할을 하는지, 무슨 의미인지 라인별로 파악해 보고자 한다.

```
//springboot에서
spring:
  //JPA 사용하는데
  jpa:
    //JAP의 interface를 구현한 hibernate ORM framwork를 사용한다.
    hibernate:
      //Hibernate가 db schema를 자동으로 생성하도록 지시.
      ddl-auto: create
      //create: 시작할 때마다 기존의 db table 삭제하고 새로 db를 생성하도록 함.

    //Hibernate가 실행하는 sql 쿼리를 콘솔에 출력. 디버깅, 모니터링 목적으로 사용.
    show-sql: true
    
    //Hibernate가 출력하는 SQL을 읽기 쉽게 형식화
    properties:
      hibernate:
        format_sql: true
    
    //datasoucre 초기화 지연 설정
    ///true로 설정하면 애플리케이션 구동 중에 데이터베이스 커넥션을 초기화하지 않고, 최초로 데이터베이스에 접근할 때 초기화 시킨다.
    defer-datasource-initialization: true
    
    //Hibernate가 데이터베이스 스키마를 생성하는 DDL(Data Definition Language) 스크립트를 생성하도록 한다.
    //(ddl-auto가 create로 설정된 경우에만 유효)
    generate-ddl: true
```
