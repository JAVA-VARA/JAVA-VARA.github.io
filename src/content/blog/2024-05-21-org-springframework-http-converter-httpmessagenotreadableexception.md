---
title: "[org.springframework.http.converter.HttpMessageNotReadableException:"
date: 2024-05-21
description: "QuizResultRequestDto에서 퀴즈 결과를 불러올 때 error가 발생했다."
source: medium
original: "https://medium.com/@sj.youns1027/org-springframework-http-converter-httpmessagenotreadableexception-c436291cb4e5"
theme: problem-solving
---
## [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Cannot construct instance of  (although at least one Creator exists): cannot deserialize from Object value (no delegate- or property-based Creator)]

QuizResultRequestDto에서 퀴즈 결과를 불러올 때 error가 발생했다.

```
@Setter
@Getter
@AllArgsConstructor
public class QuizResultRequestDto {
    private int correctAnswers;
    private Long teamId;
}
```

### although at least one Creator exists): cannot deserialize from Object value“

→ 하나 이상의 creator가 존재하지만 Object 값을 역직렬화할 수 없다고 한다.

에러를 검색해보니 jackson library와 연관된 글이 많이 발견되는데, Java 객체를 JSON 형식으로 직렬화하거나 JSON을 Java 객체로 역직렬화하는 데 사용되는 자바 라이브러리라고 한다.

![](/images/medium/c436291cb4e5/1.png)

*[https://www.javatpoint.com/jackson](https://www.javatpoint.com/jackson)*

![](/images/medium/c436291cb4e5/2.png)

*[https://www.javatpoint.com/jackson](https://www.javatpoint.com/jackson)*

![](/images/medium/c436291cb4e5/3.png)

Error가 발생한 원인은 Jackson 라이브러리가 **자바 리플렉션(Reflection)**을 사용하기 때문인데 자바 리플렉션은 구체적인 클래스 타입을 알지 못하더라도 해당 클래스의 타입, 변수, 메서드 등에 접근할 수 있도록 해주는 자바 API다.

**리플렉션의 동작에 의해 기본 생성자로 객체를 생성한 후 setter로 값을 주입 **하게되는데 내가 생성한 dto에 기본 생성자가 없어서 발생한 오류였다.

```
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class QuizResultRequestDto {
    private int correctAnswers;
    private Long teamId;
}
```

=> @NoArgsConstructor 을 추가해 해결할 수 있었다.

### 출처

[https://www.javatpoint.com/jackson](https://www.javatpoint.com/jackson)

[**Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error…**  
*dto클래스에서 comment를 생성하는데 오류가 발생했다. 이 오류를 자세히 들여다보자. Resolved…*dahlia15.tistory.com](https://dahlia15.tistory.com/79)[](https://dahlia15.tistory.com/79)

[https://ittrue.tistory.com/370](https://ittrue.tistory.com/370) [IT is True:티스토리]
