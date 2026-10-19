---
title: "Springboot 실행 시 data.sql 데이터 삽입"
date: 2024-01-26
description: "기능을 만들고 test 할 때 test code를 만들어서 진행하기도 하지만, 직접 app을 실행시켜 test를 하는 경우가 많았다."
source: medium
original: "https://medium.com/@sj.youns1027/springboot-%EC%8B%A4%ED%96%89-%EC%8B%9C-data-sql-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%82%BD%EC%9E%85-2f3651522b41"
theme: learned
---
## Springboot 실행 시 data.sql 데이터 삽입

기능을 만들고 test 할 때 test code를 만들어서 진행하기도 하지만, 직접 app을 실행시켜 test를 하는 경우가 많았다.

그 때마다 게시판에 들어가, 회원가입/로그인/글 쓰기 작업 등을 반복했다. 이 횟수가 점점 늘어남에 따라 app 실행 시에 자동으로 위 작업을 해줄 수 있는 방법을 찾아 내 프로젝트에 적용했다.

### 1. data.sql 파일 삽입

아래의 경로(root/src/main/resources/data.sql)에 data.sql 파일을 추가한다.

![](/images/medium/2f3651522b41/1.png)

### 2. data.sql문 작성

```
Insert INTO board_category(category_id, category_name) VALUES(1, '자유 게시판');
Insert INTO board_category(category_id, category_name) VALUES(2, '정보 공유 게시판');
Insert INTO board_category(category_id, category_name) VALUES(3, '갤러리');
Insert INTO board_category(category_id, category_name) VALUES(4, 'Hot 게시판');
Insert INTO board_category(category_id, category_name) VALUES(5, '공지 게시판');
Insert INTO board_category(category_id, category_name) VALUES(6, '추천 사이트');

INSERT INTO users(user_no, email, hp, name, nick_name, password) VALUES (1, 'sj@gmail.com','010987654321', 'NAME', 'Manager', '$2a$10$zA8p8GljNF/FlghsqE3NF.icXyxiYDOUmI2WWT8Sy9I4BkELCtm/m');

INSERT INTO board (title, author, content, created_at, updated_at, email, views, board_category_id, user_no) VALUES ('[필독]공지사항', 'Manager', '드루와~', now(), now(), 'sj@gmail.com', 0, 5, 1)
```

- *주의사항: users에 값을 넣을 때pw를 PasswordEncoder로 변환하여 저장하고 있기때문에 일반 string 문자를 넣으면 로그인 시 인증이 안된다. 내가 원하는 pw를 변환한 값으로 insert해주어야함.

```
INSERT INTO users(user_no, email, hp, name, nick_name, password) 
VALUES (1, 'sj@gmail.com','010987654321', 'NAME', 'Manager', '$2a$10$zA8p8GljNF/FlghsqE3NF.icXyxiYDOUmI2WWT8Sy9I4BkELCtm/m');
```

### 3. application.yml 파일 수정

application.yml 문 일부 발췌.

```
spring:
  sql:
    init:
      mode: always

  jpa:
    hibernate:
      ddl-auto: create
    show-sql: true

    properties:
      hibernate:
        format_sql: true

    defer-datasource-initialization: true
    generate-ddl: true
```

## sql-init-mode: always

mode: app 시작 시 data.sql에 작성된 코드로 database를 초기화 하도록 지정

## jpa-hibernate-ddl-auto: create

Hibernate가 데이터베이스 스키마를 자동으로 생성하도록 지정

[옵션]

- **create:**   
- app이 실행될 때마다 기존 스키마 삭제 후 새로 생성.**   
- 실제 프로덕션 환경에서는 절대 사용 금지!!!!!!!!!!!!**
- **update**: 애플리케이션이 시작될 때, 현재 엔티티 모델과 데이터베이스 스키마를 비교하여 엔티티 모델의 변경 사항을 반영
- **validate**:  
- 엔티티 모델과 데이터베이스 스키마를 비교하여 차이가 있으면 예외 발생  
- 실제 데이터베이스 조작은 수행하지 않고, 유효성만 검증
- **none**:자동으로 스키마 조작을 수행하지 않는다.

## defer-datasource-initialization: true

데이터베이스 초기화를 지연시키는 옵션. true 로 설정을하면 애플리케이션이 실행될 때 db를 초기화하지 않고 첫 데이터베이스 액세스 시 초기화를 수행(data.sql문 실행)한다.

[출처]

[**스프링부트 실행 시, Database sql 데이터 삽입**  
*협업 프로젝트를 하다가 기획자님의 요구사항이 있었다.기본 질문사항 10가지가 미리 들어가 있을 수 있는지에 대한 여부였는데 스프링부트가 실행되자마자 데이터를 삽입시키면 될거라는 생각이들어 적용하게 되었다.스프링부트…*velog.io](https://velog.io/@jupiter-j/%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8-%EC%8B%A4%ED%96%89-%EC%8B%9C-Database-sql-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%82%BD%EC%9E%85)[](https://velog.io/@jupiter-j/%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8-%EC%8B%A4%ED%96%89-%EC%8B%9C-Database-sql-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%82%BD%EC%9E%85)
