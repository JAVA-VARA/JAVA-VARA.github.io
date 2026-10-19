---
title: "Project_Preg&Birth #5"
date: 2023-09-13
description: "로그인/회원 가입(JWT 인증 기반으로 재구성)"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-5-32764f1bb887"
theme: adoption
---
### 로그인/회원 가입(JWT 인증 기반으로 재구성)

## [오늘의 Commit message]

JWT 인증 기반으로 로그인/로그아웃/회원 가입 기능을 전체적으로 변경하였다.

```
JWT 인증 기반으로 회원가입, 로그인, 로그아웃 구현
[config]
WebSecurityConfig 설정 변경: h2 db -> sql 사용으로 일부 h2 관련 코드 삭제

[controller]
1. TokenApiController: TokenService의 RefreshToken()을 기반으로 새로운 액세스 토큰을 만들어준다.
2.UserApiController: 사용되지않는 annotation 삭제

[Entity]
1. Board table의 column명 변경(createdAt, updatedAt)
2. User table의 column명 변경(nickname)

[DTO]
1. AddUserRequest: NoArgsConstructor 추가, dto로 trnasfer할 정보 추가(hp, name, nickName)
2. CreateAccessTokenRequest 추가: refreshToken 담는 dto
3. CreateAccessTokenResponse 추가 : accessToken 담는 dto

[Repository]
RefreshToken관련 정보에 대한 db를 연결할 repository 추가

[Service]
1. RefreshTokenService: 전달받은 리프레시 토큰으로 리프레시 토큰 객체를 검색해서 전달
2.TokenService: 토큰 유효성 검사
3.UserService: name, nickName, hp 를 repository에 저장하는 메서드 추가
[templates]
signup.html: 업데이트.

[application.yml]
h2 console 사용: false로 변경

[test]
TokenApiControllerTest: 토큰 생성 여부 확인 test 추가
```

## [TroubleShooting]

jwt 인증 기반으로 기능을 변경하면서 error 가 발생하였다.

### [문제 상황]

회원 가입 시 입력한 정보가 Database에 저장되지 않음.

### [해결 방법]

사용자 정보를 담고 있는 DTO에 누락된 Annotation(@NoArgsConstructor) 추가.

생성자 annotation 누락으로 클라이언트가 요청한 정보를 받아줄 객체가 없었고, form에 입력한 사용자 정보가 controller에 전달되지 못해 302 error를 반환했던 것.

```
package sjspring.shop.pregAndBirthDeveloper.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor; //annotation 추가함.

//사용자 정보를 담고 있는 객체
@Getter
@Setter
@NoArgsConstructor
public class AddUserRequest {
    private String email;
    private String password;
    private String hp;
    private String name;
    private String nickName;
}
```

### [해결 과정]

### #Heuristics

1. save 메서드에 문제가 있을 것이다.

```
//생략
public void createNewAccessToken() throws Exception {
        //given
        final String url = "/api/token";
        final String email = "sj@gmail.com";
        final String hp = "01000000000";
        final String name = "풍풍풍";
        final String nickname = "풋팡퐁커리";
        final String password = "test";
        final LocalDateTime babyDue = LocalDateTime.now();

        User testUser = userRepository.save(User.builder() //=> save 메서드
                .email(email)
                .hp(hp)
                .name(name)
                .password(password)
                .nickName(nickname)
                .build());

//생략
```

![](/images/medium/32764f1bb887/1.png)

![](/images/medium/32764f1bb887/2.png)

=> test 진행 시 repository의 save() 메서드가 정상 작동함을 확인함.

2. Database 연결 시 문제가 있을 것이다. => DB를 H2 → SQL 로 변경했는데 이때 일부 H2 관련 코드가 남아있어 에러가 생기는 것이 아닐까 추측
- WebSecurityConfig.java

```
//생략
@Bean
    public WebSecurityCustomizer configure() {
        return (web) -> web.ignoring()
//                .requestMatchers(toH2Console())  => 삭제
                .requestMatchers("/static/**");
    }
//생략
```

- application.yml

```
  h2:
    console:
      enabled: false //=> true에서 faslse로 변경
```

=> h2 관련 코드를 삭제했음에도 여전히 DB에 회원 정보가 저장되지 않음.

### #디버깅

디버그를 위해서 controller에 브레이크포인트를 걸었으나, 앱 실행 시 아무것도 걸리지 않는 것으로 보아 회원가입 요청이 controller에 들어가지 않는 것으로 예상.

```
@RequiredArgsConstructor
@Controller
public class UserApiController {
    private final UserService userService;
@PostMapping("/users")
    public String signup(AddUserRequest request){ // break point
        userService.save(request);  // break point
        return "redirect:/login";  // break point
    }
```

### #로그 파일

회원 가입 Form 완성 후 제출 시 로그 파일을 확인했다.

![](/images/medium/32764f1bb887/3.png)

![](/images/medium/32764f1bb887/4.png)

클라이언트가 /users를 요청하면*** 302 error***가 발생하는 것을 확인하여 302 error에 대해 찾아보았다.

### [15.4.3. ](https://www.rfc-editor.org/rfc/rfc9110#section-15.4.3)[302 Found](https://www.rfc-editor.org/rfc/rfc9110#name-302-found)

The 302 (Found) status code indicates that the target resource resides temporarily under a different URI. Since the redirection might be altered on occasion, the client ought to continue to use the target URI for future requests.

The server **SHOULD** generate a [Location](https://www.rfc-editor.org/rfc/rfc9110#field.location) header field in the response containing a URI reference for the different URI. The user agent **MAY** use the Location field value for automatic redirection. The server’s response content usually contains a short hypertext note with a hyperlink to the different URI(s).

클라이언트가 요청한 리소스가 헤더에 주어진 URL로 일시적으로 이동되었음을 가리키는 리다이렉트 상태 응답 코드

출처: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302)

클라이언트가 폼을 완성하면 “/users” url로 form을 POST 하도록 설정하였으나, 요청이 Controller에 전달되지 않았고 이에 따라 headers에 명시되어있는 location인 “/login”으로 redirect 되는 것으로 확인하였다.

```
//생략
<div class = "m-10">
   <form th:action="@{/users}" th:object="${request}" method="POST">
//생략
```

**컨트롤러에 접근이 되지 않는 이유에 대해**

- **url 문제?**  
“/users” 검사 항목 들어가면form에 입력한 정보가 저장은 되어 있는 것을 확인하여, 저장된 정보가 url에는 전달된 것으로 확인.

![](/images/medium/32764f1bb887/5.png)

- **form tag 문제?**  
저장된 데이터가 매칭이 안되서 controller로 전달이 안되는 것일까 싶었으나, form tag와 controller에 전달될 dto 변수명일치함을 확인.

=> DTO 확인 중에 생성자 누락으로 회원페이지에서 작성한 정보가 DTO에 담기지 않는 것으로 확인하여 생성자 추가. 추가 후 회원 가입 신청 시 회원 정보가 DB에 저장됨을 확인할 수 있었다.

### 회원가입 페이지

![](/images/medium/32764f1bb887/6.png)

### 성공!

![](/images/medium/32764f1bb887/7.png)
