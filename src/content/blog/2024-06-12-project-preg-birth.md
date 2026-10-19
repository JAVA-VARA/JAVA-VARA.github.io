---
title: "Project_Preg&Birth- 비밀번호 찾기 기능 코드 리펙토링"
date: 2024-06-12
description: "as-is"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8-%EC%B0%BE%EA%B8%B0-%EA%B8%B0%EB%8A%A5-%EC%BD%94%EB%93%9C-%EB%A6%AC%ED%8E%99%ED%86%A0%EB%A7%81-2f18bbf05398"
---
## Project_Preg&Birth- 비밀번호 찾기 기능 코드 리펙토링

## as-is

- controller

```
@RestController
public class CheckUserController {
    private final FindUserService findUserService;
    private final SendEmailService sendEmailService;

    @GetMapping("/showPwd")
    public String findPwd(@RequestParam(value = "email", required = false) String email){

        FindUserInfo findUserInfoDto = new FindUserInfo(email);
        User userInfo = findUserService.findPwd(findUserInfoDto);
        String userEmail = userInfo.getEmail();
        FindUserInfo findUserInfoToUpdate = new FindUserInfo(userInfo);

        if(!userEmail.isEmpty()){
            User updatedUser = sendEmailService.updatePassword(findUserInfoToUpdate);
            return "입력하신 이메일로 임시 비밀번호를 전송하였습니다. ";
        }
        return "입력하신 이메일 주소는 유효하지 않는 아이디 입니다.";
    }
```

- service

```
@RequiredArgsConstructor
@Service
public class SendEmailService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JavaMailSender javaMailSender;

    @Transactional
    public User  updatePassword(FindUserInfo findUserInfo){
        User user = userRepository.findByEmail(findUserInfo.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("NOT FOUND" + findUserInfo.getEmail()));

        String tempPwd = getTempPassword();
        String encodedTempPwd = passwordEncoder(tempPwd);
        user.updatePassword(user.getEmail(),encodedTempPwd);

        MailDto mailDto = new MailDto();
        mailDto.setSender("sj.youns1027@gmail.com");
        mailDto.setReceiver(findUserInfo.getEmail());
        mailDto.setTitle("쭈쭈르 홈페이지 임시비밀번호 안내");
        mailDto.setMessage("안녕하세요 쭈주르입니다." + user.getName() + " 회원님의 임시 비밀번호는 " + tempPwd + " 입니다.");

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
    public String passwordEncoder(String tempPwd){
        return bCryptPasswordEncoder.encode(tempPwd);
    }
}
```

- MailDto

```
@Getter
@Setter
@NoArgsConstructor
public class MailDto {
    private String sender;
    private String receiver;
    private String title;
    private String message;
}
```

## to-be

- Controller  
user email이 없어 예외가 발생하는 경우, service에서 처리하도록 변경.

```
@Controller
public class CheckUserController {
    private final SendEmailService sendEmailService;

    @GetMapping("/showPwd")
        public String findPwd(
              @RequestParam(value = "email", required = false) String email, 
              Model model) 
      `{
            FindUserInfo findUserInfoDto = new FindUserInfo(email);
            FindUserInfo responseDto  = sendEmailService.updateAndSendPwd(findUserInfoDto);
            model.addAttribute("userInfo", responseDto);
            return "/showPwd";
        }
```

- Service  
emailSender 메서드를 만들어 기능별로 메서드를 구분했다.

```
@RequiredArgsConstructor
@Service
public class SendEmailService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JavaMailSender javaMailSender;

    @Transactional
    public FindUserInfo updateAndSendPwd(FindUserInfo findUserInfoDto){
        String email = findUserInfoDto.getEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("NOT FOUND" + email));

        String tempPwd = getTempPassword();
        user.updatePassword(email, passwordEncoder(tempPwd));

        findUserInfoDto.setPassword(tempPwd);
        emailSender(findUserInfoDto);

        return findUserInfoDto;
    }
    
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

    public void emailSender(FindUserInfo findUserInfo){
        MailDto mailDto = new MailDto(findUserInfo);
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();

        try{
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            mimeMessageHelper.setTo(mailDto.getReceiver());
            mimeMessageHelper.setSubject(mailDto.getTitle());
            mimeMessageHelper.setText(mailDto.getMessage(), false);
            javaMailSender.send(mimeMessage);

        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }

    }
    public String passwordEncoder(String tempPwd){
        return bCryptPasswordEncoder.encode(tempPwd);
    }
}
```

- MailDto

```
public class MailDto {
    private final String sender = "sj.youns1027@gmail.com";
    private final  String title = "쭈쭈르 홈페이지 임시비밀번호 안내";
    private  String message;
    private  String receiver;

    public MailDto(FindUserInfo findUserInfo){
        this.receiver = findUserInfo.getEmail();
        this.message =  "안녕하세요 쭈주르입니다." + findUserInfo.getName() + " 회원님의 임시 비밀번호는 " + findUserInfo.getPassword() + " 입니다.";
    }
}
```
