---
title: "Project_Preg&Birth #8"
date: 2023-10-30
description: "OAuth2 로그인 설정 추가"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-8-3362a94daf22"
theme: adoption
---
### OAuth2 로그인 설정 추가

아래의 순서로 게시판의 기능을 구현했다.

1. 기본적인 CRUD 기능
2. jwt를 이용한 form-login
3. ID/PW 찾기

3번까지 진행한 이후 Test를 위해 글을 작성하려고 하였으나 form-login시 token 발급이 되지 않는 error가 발생함을 알게되었다. 이로 인해 게시판 CRUD 기능도 사용자 인증이 되지 않아 사용할 수 없었다.

Token 발급에 대한 해결 및 추가적인 로그인 설정을 위해 token 생성 및 사용자 확인 절차 기능을 전체적으로 수정했고, 해당 작업을 하면서 OAuth2 로그인 설정을 추가해주었다.

```
[Config]
#WebOAuthSecurityConfig:OAuth2 + form 로그인/회원가입 모두 가능하도록 설정 변경
#OAuth2AuthorizationRequestBasedOnCookieRepository
#OAuth2SuccessHandler
#OAuth2UserCustomService

[controller]
#BoardViewController: MVC model attributeName 변경
#UserViewController: OAuth2 + form 로그인/회원가입 모두 가능하도록 설정 변경

[Domain]
불필요한 생성자 삭제

[JS]
#article.js: 수정 기능 수정
#login.html: OAuth2 + form 로그인 기능 추가

[controller]
#UserViewController: login 시 mapping 되는 html 문서 변경

[Service]
#BoardService: delete, update 시 작성자 검증하여, 유효한 경우에만 수정, 삭제 가능한 기능 추가
#UserService:findByEmail 메서드 추가

[Util]
#CookieUtil: 쿠키 add, delete, serialize, serialize 메서드

[static/js]
#article:
#token:

[templates]
#freeBoard.html: 자유게시판 view
#freeBoardList.html 자유게시판 목록 view
#newArticle.html: 작성된 글 view

[img]
#google oauth2 로그인 이미지 추가
```

**[Configuration]**

1. application.yml  
oauth2를 사용하기 위해 스타터를 gradle에 의존성을 추가했다.

```
//oauth2 사용하기 위한 스타터
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
//jws 사용하기 위한 의존성 추
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-impl:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-jackson:0.11.5'
```

2. webOAuthSecurityConfig  
OAuth2로 로그인이 가능하도록 설정을 추가했다

```
@RequiredArgsConstructor
@Configuration
public class WebOAuthSecurityConfig {

    private final OAuth2UserCustomService oAuth2UserCustomService;
    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserService userService;

    @Bean
    public WebSecurityCustomizer configure() {
        return (web) -> web.ignoring()
                .requestMatchers("/img/**", "/css/**", "/js/**");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()
                .httpBasic().disable()
                .logout().disable();

        //세션 로그인 사용x
        http.sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        http.addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        http.authorizeHttpRequests()
                .requestMatchers("/api/token").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll();

        http.oauth2Login()
                .loginPage("/login")
                .authorizationEndpoint()
                .authorizationRequestRepository(oAuth2AuthorizationRequestBasedOnCookieRepository())
                .and()
                .successHandler(oAuth2SuccessHandler())
                .userInfoEndpoint()
                .userService(oAuth2UserCustomService);


        http.formLogin()
                .loginPage("/login")
                .defaultSuccessUrl("/articles", true);

        http.logout()
                .logoutSuccessUrl("/login");


        http.exceptionHandling()
                .defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        new AntPathRequestMatcher("/api/**"));


        return http.build();
    }

   @Bean
   public OAuth2SuccessHandler oAuth2SuccessHandler() {
        return new OAuth2SuccessHandler(tokenProvider,
                refreshTokenRepository,
                oAuth2AuthorizationRequestBasedOnCookieRepository(),
                userService
        );
    }

    @Bean
    public TokenAuthenticationFilter tokenAuthenticationFilter() {
        return new TokenAuthenticationFilter(tokenProvider);
    }

    @Bean
    public OAuth2AuthorizationRequestBasedOnCookieRepository oAuth2AuthorizationRequestBasedOnCookieRepository() {
        return new OAuth2AuthorizationRequestBasedOnCookieRepository();
    }

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

3. OAuth2SuccessHandler   
로그인 성공 이후 token 관련된 작업(생성/저장)을 처리하기 위한 handler.

spring security의 기본 로직에서는 별도의 authenticationSuccessHandler를 지정하지 않으면 로그인 성공 이후 SimpleUrlAuthenticationSuccessHandler을 사용한다.

일반적인 로직은 동일하게 사용하고 token 관련된 작업만 추가로 처리하기 위해 SimpleUrlAuthenticationSuccessHandler 상속 받아 SimpleUrlAuthenticationSuccessHandler 메서드만 오버라이드 했다.

```
@RequiredArgsConstructor
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    public static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    public static final Duration REFRESH_TOKEN_DURATION = Duration.ofDays(14);
    public static final Duration ACCESS_TOKEN_DURATION = Duration.ofDays(1);
    public static final String REDIRECT_PATH = "/articles";

    private final TokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OAuth2AuthorizationRequestBasedOnCookieRepository authorizationRequestRepository;
    private final UserService userService;

    @Override
    public void ㅊ(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        User user = userService.findByEmail((String) oAuth2User.getAttributes().get("email"));

        //#1 리프레시 토큰 생성-> 저장 -> 쿠키에 저장
        String refreshtoken = tokenProvider.generateToken(user, REFRESH_TOKEN_DURATION);
        //#2 db에 userId와 리프레시 토큰 저장
        saveRefreshToken(user.getId(), refreshtoken);
        //#3 쿠키에 userId와 리프레시 토큰 저장
        addRefreshTokenToCookie(request, response, refreshtoken);

        //access 토큰 생성
        String accessToken = tokenProvider.generateToken(user, ACCESS_TOKEN_DURATION);
        //액세스 토큰 추가: targetUrl 변수에 accessToken을 파라미터값으로 저장한다.
        String targetUrl = getTargetUrl(accessToken);
        //인증 관련 설정값, 쿠키 제거(인증 프로세스를 진행하면서 
        //세션과 쿠키에 임시로 저장해둔 인증 관련 데이터를 제거한다)
        clearAuthenticationAttributes(request, response);
        //위에서 만든 targetUrl 경로로 리다이렉트 한다.
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }


    //생성된 리프레시 토큰을 전달받아 db에 저장해주는 메서드
    private void saveRefreshToken(Long userId, String newRefreshToken){
        RefreshToken refreshToken = refreshTokenRepository.findByUserId(userId)
                .map(entity->entity.update(newRefreshToken))
                .orElse(new RefreshToken(userId, newRefreshToken));

        refreshTokenRepository.save(refreshToken);
    }

    //생성된 리프레시 토큰을 쿠키에 저장하는 메서드
    private void addRefreshTokenToCookie(HttpServletRequest request, HttpServletResponse response, String refreshToken){
        int cookieMaxAge = (int) REFRESH_TOKEN_DURATION.toSeconds();
        CookieUtil.deleteCookie(request, response, REFRESH_TOKEN_COOKIE_NAME);
        CookieUtil.addCookie(response, REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieMaxAge);
    }

    //인증 관련 설정값, 쿠키 제거해주는 메서드
    private void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }

    //access token을 parameter값에 추가해주는 메서드
    private String getTargetUrl(String token){
        return UriComponentsBuilder.fromUriString(REDIRECT_PATH)
                .queryParam("token", token)
                .build()
                .toUriString();
    }
}
```

4. OAuth2UserCustomService

resource Server에서 보내주는 사용자 정보를 불러오든 loadUser()를 통해 사용자 조회 후 유저가 있다면 업데이트, 없다면 유저 생성/저장한다.

부모 객체인 DefaultOAuth2UserService에서 제공하는 OAuth2User 서비스에서 제공하는 정보를 기반으로 유저 객체를 만들어주는 loadUser()메서드를 사용해 사용자 객체를 불러온다.

```
@RequiredArgsConstructor
@Service
public class OAuth2UserCustomService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // ❶ 요청을 바탕으로 유저 정보를 담은 객체 반환
        OAuth2User user = super.loadUser(userRequest); 
        saveOrUpdate(user);
        return user;
    }

    // ❷ 유저가 있으면 업데이트, 없으면 유저 생성하는 메서드
    private User saveOrUpdate(OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        User user = userRepository.findByEmail(email)
                .map(entity -> entity.update(name))
                .orElse(User.builder()
                        .email(email)
                        .nickName(name)
                        .build());

        return userRepository.save(user);
    }
}
```

5. OAuth2AuthorizationRequestBasedOnCookieRepository  
OAuth2에 필요한 정보를 세션이 아닌 쿠키에 저장해서 쓸 수 있도록 인증 요청과 관련된 상태를 저장할 수 있는 Repository 설정.

```
public class OAuth2AuthorizationRequestBasedOnCookieRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public final static String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request";
    private final static int COOKIE_EXPIRE_SECONDS = 18000;

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, HttpServletResponse response) {
        return this.loadAuthorizationRequest(request);
    }

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        return CookieUtil.deserialize(cookie, OAuth2AuthorizationRequest.class);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest == null) {
            removeAuthorizationRequestCookies(request, response);
            return;
        }

        CookieUtil.addCookie(response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, CookieUtil.serialize(authorizationRequest), COOKIE_EXPIRE_SECONDS);
    }

    public void removeAuthorizationRequestCookies(HttpServletRequest request, HttpServletResponse response) {
        CookieUtil.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
    }
}
```

**[Controller]**

#BoardApiController: 현재 인증 정보를 가져오는 principal 객체를 파라미터로 추가.

```
@PostMapping("/api/articles") 
    public ResponseEntity<Board> addArticle
(@RequestBody AddArticleRequest request, Principal principal){
        
        Board savedArticle = boardService.save(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedArticle);
    }
```

**[Service]**

#BoardService

```
@RequiredArgsConstructor
@Service
public class BoardService {
    private final BoardRepository boardRepository;
    public Board save(AddArticleRequest request, String userName){
        return boardRepository.save(request.toEntity(userName));
    }
```

**[View]**

#article.js

```
// 삭제 기능
const deleteButton = document.getElementById('delete-btn');

if (deleteButton) {
    deleteButton.addEventListener('click', event => {
        let id = document.getElementById('article-id').value;
        function success() {
            alert('삭제가 완료되었습니다.');
            location.replace('/articles');
        }

        function fail() {
            alert('삭제 실패했습니다.');
            location.replace('/articles');
        }

        httpRequest('DELETE',`/api/articles/${id}`, null, success, fail);
    });
}

// 수정 기능
const modifyButton = document.getElementById('modify-btn');

if (modifyButton) {
    modifyButton.addEventListener('click', event => {
        let boardNo = document.getElementById('article-id').value;
        let id = params.get('id');

        body = JSON.stringify({
            title: document.getElementById('title').value,
            content: document.getElementById('content').value
        })

        function success() {
            alert('수정 완료되었습니다.');
            location.replace(`/articles/${id}`);
        }

        function fail() {
            alert('수정 실패했습니다.');
            location.replace(`/articles/${id}`);
        }

        httpRequest('PUT',`/api/articles/${id}`, body, success, fail);
    });
}

// 생성 기능
const createButton = document.getElementById('create-btn');

if (createButton) {
    // 등록 버튼을 클릭하면 /api/articles로 요청을 보낸다
    createButton.addEventListener('click', event => {
        body = JSON.stringify({
            title: document.getElementById('title').value,
            content: document.getElementById('content').value
        });
        function success() {
            alert('등록 완료되었습니다.');
            location.replace('/articles');
        };
        function fail() {
            alert('등록 실패했습니다.');
            location.replace('/articles');
        };

        httpRequest('POST','/api/articles', body, success, fail)
    });
}


// 쿠키를 가져오는 함수
function getCookie(key) {
    var result = null;
    var cookie = document.cookie.split(';');
    cookie.some(function (item) {
        item = item.replace(' ', '');

        var dic = item.split('=');

        if (key === dic[0]) {
            result = dic[1];
            return true;
        }
    });

    return result;
}

// HTTP 요청을 보내는 함수
function httpRequest(method, url, body, success, fail) {
    fetch(url, {
        method: method,
        headers: { // 로컬 스토리지에서 액세스 토큰 값을 가져와 헤더에 추가
            Authorization: 'Bearer ' + localStorage.getItem('access_token'),
            'Content-Type': 'application/json',
        },
        body: body,
    }).then(response => {
        if (response.status === 200 || response.status === 201) {
            return success();
        }
        const refresh_token = getCookie('refresh_token');
        if (response.status === 401 && refresh_token) {
            fetch('/api/token', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('access_token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: getCookie('refresh_token'),
                }),
            })
                .then(res => {
                    if (res.ok) {
                        return res.json();
                    }
                })
                .then(result => { // 재발급이 성공하면 로컬 스토리지값을 새로운 액세스 토큰으로 교체
                    localStorage.setItem('access_token', result.accessToken);
                    httpRequest(method, url, body, success, fail);
                })
                .catch(error => fail());
        } else {
            return fail();
        }
    });
}
```

#token.js

```
const token = searchParam('token')

if(token){
    localStorage.setItem("access_token", token)
}

function searchParam(key){
    return new URLSearchParams(loacation.search).get(key);
}
```

**[CookieUtil]**

```
public class CookieUtil {
    public static void addCookie(HttpServletResponse response, String name, String value, int maxAge){
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }

    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name){
        Cookie[] cookies = request.getCookies();
        if (cookies == null){
            return;
        }
        for(Cookie cookie : cookies){
            if(name.equals(cookie.getName())){
                cookie.setValue("");
                cookie.setPath("/");
                cookie.setMaxAge(0);
                response.addCookie(cookie);
            }
        }
    }

    //객체를 직렬화해 쿠키의 값으로 변환
    public static String serialize(Object obj){
        return Base64.getUrlEncoder()
                .encodeToString(SerializationUtils.serialize(obj));
    }

    //쿠키를 역직렬화하여 객체로 변환
    public static <T> T c(Cookie cookie, Class<T> cls){
        return cls.cast(
                SerializationUtils.deserialize(
                        Base64.getUrlDecoder().decode(cookie.getValue())
                )
        );
    }
}
```
