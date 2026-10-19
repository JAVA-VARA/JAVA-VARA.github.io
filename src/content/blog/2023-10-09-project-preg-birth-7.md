---
title: "Project_Preg&Birth #7"
date: 2023-10-09
description: "비밀번호 찾기 기능 구현"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-7-ad6466fcf15f"
theme: adoption
---
### 비밀번호 찾기 기능 구현

## [ Commit message]

지금까지 구현해본 기능 중에 가장 어려웠던 기능이었다. 로직을 어떻게 구성해야할까 고민을 많이 했는데, 결과적으로는 아래와 같이 **controller**-**service**-**repository**를 구성하였다.

```
<User 비밀번호 찾기 기능 구현>
User의 id 입력 시 해당 이메일로 임시 비밀번호 전송하는 기능

[Config]
WebSecurityConfig: "defaultSuccessUrl" 로그인 성공 시 "/articles" url로 이동하도록 설정

[Domain]
EmailMessage: 이메일 송부 시 해당 내용 저장(로그 관리)
User: updatePassword 메서드 추가

[DTO]
FindUserInfo: FindUserInfo 생성자 수정
MailDto: dto 추가

[Controller]
CheckUserController: "/showPwd"에서 param값으로 email을 받으면 해당 이메일을 service -> repository로 전달.
이메일이 유효한 경우 해당 메일로 임시 비밀번호 송부

FindApiController: 입력한 name과 hp와 매칭되는 email이 있는 경우 이메일을 보여줌. 없는 경우 재입력 문구 보여줌.

[Repository]
findIdByEmail 메서드 추가

[Service]
FindUserService: findPwd 메서드 추가. Controller로 전달받은 user info를 Repository로 전달. 매핑되는 email이 있는 경우 반환, 없는 경우 error 메시지 반환

SendEmailService: 비번 찾기
- 임시 비번 생성, encoding. 업데이트된 비번을 repository에 전달하여 db에 해당 정보 저장.
- 메일 생성/송부
```

## [TroubleShootring]

처음에 비밀번호 찾기 기능을 구현하기 위해 단순히 db에 저장되어 있는 user가 email(id)를 입력하면 매칭되는 pw를 불러와 전달하고자 하였으나, encoding된 pw를 user가 다시 읽을 수 있는 형태로 decoding할 수 없다는 것을 알게 되었다.

복호화가 불가능 하다면, 임시 비밀 번호를 생성하여 user의 이메일로 전달해야겠다는 결론에 이르렀고, 비밀 번호 찾기 요청이 오는 경우 임시 비밀 번호 생성 → 암호화되기 전의 pw를 user에게 전달 → 암호화된 pw를 db에 업데이트 하는 방법으로 해결하였다.

```
@RequiredArgsConstructor
@Service
public class SendEmailService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    private final SpringTemplateEngine templateEngine;
    private final JavaMailSender javaMailSender;

    @Transactional
    public User  updatePassword(FindUserInfo findUserInfo){
        User user = userRepository.findByEmail(findUserInfo.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("NOT FOUND" + findUserInfo.getEmail()));

        //임시 비번 생성
        String tempPwd = getTempPassword();
        //임시 비번 encoding
        String encodedTempPwd = passwordEncoder(tempPwd);
        //User의 정보를 업데이트함.
        user.updatePassword(user.getEmail(),encodedTempPwd);

        //메일 생성
        MailDto mailDto = new MailDto();
        mailDto.setSender("sj.youns1027@gmail.com");
        mailDto.setReceiver(findUserInfo.getEmail());
        mailDto.setTitle("쭈쭈르 홈페이지 임시비밀번호 안내");
        mailDto.setMessage("안녕하세요 쭈주르입니다." + user.getName() + " 회원님의 임시 비밀번호는 " + tempPwd + " 입니다.");

        //메일 송부
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try{
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            mimeMessageHelper.setTo(mailDto.getReceiver());
            mimeMessageHelper.setSubject(mailDto.getTitle());
            mimeMessageHelper.setText(mailDto.getMessage(), false);
            javaMailSender.send(mimeMessage);

            return user;

        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }

    }

    //존재하는 user일 경우 임시 비번 생성
    public String getTempPassword(){
        char[] charSet = new char[] { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
                'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'};

        StringBuilder tempPwd = new StringBuilder();

        int idx = 0;
        for (int i = 0; i < 10; i++) {
            idx = (int) (charSet.length * Math.random());
            tempPwd.append(charSet[idx]);
        }
        return tempPwd.toString();
    }

    //임시로 생성한 비번 encoding
    public String passwordEncoder(String tempPwd){
        return bCryptPasswordEncoder.encode(tempPwd);
    }
}
```

![](/images/medium/ad6466fcf15f/1.png)

![](/images/medium/ad6466fcf15f/2.png)

![](/images/medium/ad6466fcf15f/3.png)

![](/images/medium/ad6466fcf15f/4.png)
