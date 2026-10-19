---
title: "Project_Preg&Birth #4"
date: 2023-09-07
description: "로그인/회원 가입"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-4-18d4809f6fe6"
theme: adoption
---
## [Commit message]

```
[config]
-jwt token 관련 설정 추가

[controller]
UserApiController: User 회원가입, 로그아웃 기능
UserViewController: 로그인, 회원 가입 기능

[domain]
Board:author, view entity 추가 및 entity 명칭과 db 명칭 통일
User: DB의 User내 colmn entity로 추가

[dto]
AddUserRequest: 사용자 email, pw 정보 dto로 만들어 
service / controller간 데이터 전달

[Repository]
인터페이스를 통해 이메일로 사용자 정보 가져오는 기능 추가

[Service]
UserDetailService: 사용자 인증을 위해 repository에서  이메일 정보 가져오는 서비스(없는 경우 예외 발생)
UserService: dto에서 가져온 사용자 정보를 저장하는 기능

[templates]
로그인, 회원가입 관련 view 작성

[application]
DB연결 설정: H2 -> MySql로 설정 변경

[test]
유저 정보를 가져와 토큰 생성 하는 test
- build : thymeleaf, mysql-connector 추가
- DB: MySQL 연결, Jpa 설정 추가
- 변수명 변경(board_no -> boardId)
- 게시글 view 관련 기능(클래스) 추가
```

### Intellij에 MySQL 연결

지금까지는 편의 상 RDMBS로 H2를 사용하였으나, MySQL을 사용하기 위해 Intellij에 MySQL을 연결했다.

DB 연결 과정을 진행하며 error를 만나 추후 비슷한 상황이 발생했을 때 참고하기 위해 글을 남겨둔다.

아래 블로그를 참고하여 연결을 시도했고,

[**[Spring boot | MySQL] Intellij에 MySQL 연결하기 | 모든 프로젝트에서 연결된 디비 연결하기**  
*✔ Java 11 ✔ Gradle 7 ✔ Spring boot 2.6.3 1. 로컬에서 db 생성 및 기본 DB 정보 파악 mysql> CREATE DATABASE tmc_db; Query OK, 1 row…*developerm.tistory.com](https://developerm.tistory.com/220)[](https://developerm.tistory.com/220)

결과는 연결 성공!

![](/images/medium/18d4809f6fe6/1.png)

연결 완료 후 Gradle에 의존성을 추가.

```
dependencies {
    //...생략...
    //mysql
    implementation 'mysql:mysql-connector-java'
```

application.yml에서 datasource 관련 설정 변경까지 하며 DB 연결 최종적으로 완료하였다.

- application.yml

```
//DB연결 설정: H2 -> MySql로 설정 변경
datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://34.64.211.47:3306/sj-baby
    username: sj
    password: "생략"
```

연결이 된 줄 알았던 DB에서 TEST 진행 시 아래와 같은 Error가 발생함을 확인하였다.

> [Error] could not execute statement; nested exception is org.hibernate.exception.GenericJDBCException: could not execute statement

이는 DB와 Entity가 맞지 않아서 발생하는 오류인 것으로 확인하여, Entity와 DB와 일치하도록 Database를 업데이트 했다.

그 이후 아래와 같은 error가 발생했다.

> not-null property references a null or transient value : sjspring.shop.pregAndBirthDeveloper.domain.User.name

TABLE과 비교한 결과 Not Null값이지만 Test 진행 시 일부 insert 하지 않은 값이 있어 추가 해줌으로서 문제를 해결할 수 있었다

```
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_no", updatable = false)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "hp", nullable = false, unique = true)
    private String hp;

    @Column(name = "password")
    private String password;

    @Builder
    public User(String name, String email,String hp,String password, String auth){
        this.name = name;
        this.email = email;
        this.hp = hp;
        this.password = password;
    }
```

### TokenProviderTest.java

```
@SpringBootTest
class TokenProviderTest {
    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtProperties jwtProperties;

    @DisplayName("generateToken(): 유저 정보와 만료 기간을 전달해 토큰을 만들 수 있다.")
    @Test
    void generateToken(){
        //given
        //아래 항목에 Not Null이어야 하는 모든 항목을 추가.
        User testUser = userRepository.save(User.builder()
                .name("홍길동")
                .email("user@gmail.com")
                .hp("01000000000")
                .password("test")
                .build());

        // when
        String token = tokenProvider.generateToken(testUser, Duration.ofDays(14));

        // then
        Long userId = Jwts.parser()
                .setSigningKey(jwtProperties.getSecretKey())
                .parseClaimsJws(token)
                .getBody()
                .get("id", Long.class);

        assertThat(userId).isEqualTo(testUser.getId());
    }


}
```

![](/images/medium/18d4809f6fe6/2.png)

그렇게 수정하여 test 통과! 그러나 test를 한번 더 돌렸는데 또 에러가 발생했다.

> org.springframework.dao.DataIntegrityViolationException: could not execute statement; SQL [n/a]; constraint [users.email_UNIQUE]

![](/images/medium/18d4809f6fe6/3.png)

이는 이미 test 진행 시 해당 값이 db에 들어갔기 때문에 SQL에서 unique로 설정해 놓은 값이 한번 더 들어가게 되면서 발생한 이슈였다.

test 진행 시 삽입되어지는 값을 일부 변경하여 test를 통과할 수 있었다. 그러나 원활한 test 진행을 위해 Unique로 설정해 놓았던 값을 해제하였고, 프로젝트 완성 막바지에 추가 해야 할 것 같다.

![](/images/medium/18d4809f6fe6/4.png)

더불어 Login과 Sign 기능까지 작동하는 것으로 확인할 수 있었다.

![](/images/medium/18d4809f6fe6/5.png)

![](/images/medium/18d4809f6fe6/6.png)
