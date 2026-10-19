---
title: "java.lang.NullPointerException:"
date: 2024-01-26
description: "@RequiredArgsConstructor"
source: medium
original: "https://medium.com/@sj.youns1027/java-lang-nullpointerexception-41cae12b8d5d"
theme: problem-solving
---
## java.lang.NullPointerException: Cannot invoke “sjspring.shop.pregAndBirthDeveloper.service.UserService.findByEmail(String)” because “this.userService” is null

## @RequiredArgsConstructor

Lombok으로 스프링에서 DI(의존성 주입)하는 방법 중 하나. 생성자 주입을 임의의 코드없이 자동으로 설정해주는 어노테이션이다.

초기화 되지않은 final 필드나, @NonNull 이 붙은 필드에 대해 생성자를 생성주어 새로운 필드를 추가할 때 다시 생성자를 만들어서 관리해야하는 번거로움을 없애준다. (@Autowired를 사용하지 않고 의존성 주입이 가능하다.)

```
@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    public void addUserInfo(AddSignupInfoDto addSignupInfoDto, Principal principal) {

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("Unexpected user"));

        String name = addSignupInfoDto.getName();
        String nickName = addSignupInfoDto.getNickname();
        String hp = addSignupInfoDto.getHp();
        Date babyDue = addSignupInfoDto.getBabyDue();

        user.update(name, nickName, hp, babyDue);

        userRepository.save(user);
    }
```

=> 주입하고자하는 UserRepository 에 final을 붙이지 않아서 생긴 exception error 였다.

### @RequiredArgsConstructor을 사용하지 않고 Autowired로 사용 시 코드

- 예시

```
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

@Autowired
public RequiredArgsConstructorExample(UserRepository userRepository, PasswordEncoder encoder){
    this.UserRepository= userRepository;
    this.PasswordEncoder= encoder;
}
```
