---
title: "Football-Quiz-Project"
date: 2024-05-22
description: "문제 수정 요청 기능 추가"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-172859957dfc"
theme: adoption
---
### 문제 수정 요청 기능 추가

친구들에게 퀴즈 프로그램 테스트를 시켰다. 생각보다 재밌게 게임을 해주는 모습에 뿌듯했다. 테스트 후 몇가지 피드백을 받았는데 그 중 개선한 점 하나를 공유하고자 한다.

## [문제 상황]

선수의 사진과 이름이 매칭되지 않는다.

![](/images/medium/172859957dfc/1.png)

*정답이라고 생각한 문제에서 오답이 나오자 검수를 요청한 친구*

## [원인]

1. **이름 표기의 불일치  
**축구 선수 이름의 정답은 daum 스포츠 기준으로 되어있는데, 통상적으로 스포츠 중계나, 축구 커뮤니티에서 사용되고 있는 이름과 상이한 경우가 있다.

2. **크롤링 시 부정확한 데이터 수집  
**크롤링 시 잘못된 데이터가 저장된 경우, 크롤링 해오는 사이트에 이름이 부정확하게 기재되어 있는 경우

## [해결]

1. 이름 표기의 불일치 문제에 대해서는 같은 선수의 이름을 여러 사이트에서 크롤링해와 복수 정답 처리를 하거나, 퀴즈 공지 사항에 Daum 스포츠 기준으로 정답 입력을 안내한다.
2. 크롤링 시 부정확한 데이터 수집 문제는 상대적으로 발생 가능성이 적기 때문에, 유저가 잘못된 문제를 발견하면 관리자에게 메시지를 보내도록 설정한다.

1번 항목에 대해서는 더 고민이 필요하기에 먼저 2번 항목에 대한 문제 해결 및 예상치 못한 문제에 대한 유저 반응을 확인할 수 있는 **“관리자에게 메시지 송부”** 기능을 추가했다.

## UI개선

- **quiz.html  
**유저가 작성한 메시지와 함께 자동으로 선수의 소속팀과 이름이 보내지도록 설정.

![](/images/medium/172859957dfc/2.png)

![](/images/medium/172859957dfc/3.png)

```
<!DOCTYPE html>
...생략...
<body>
<div class="quiz-container">

    <button class="send-query-btn" onclick="showQueryPopup()">수정 요청</button>

    <div class="question-number">문제 <span id="questionNumber"></span></div>
    <img id="quizImage" class="quiz-image" src="" alt="Quiz Image">
    <div>
        <label for="answerInput"></label><input id="answerInput" class="answer-input" type="text">
    </div>

    <div>
        <button id="submitBtn" class="submit-btn" onclick="checkAnswer()">제출</button>
    </div>
    <div id="result1" class="result1"></div>
    <div id="result2" class="result2"></div>

    <div>
        <button id="nextBtn" class="next-btn" onclick="nextQuestion()">다음</button>
    </div>
</div>

<div class="query-popup" id="queryPopup">
    <label for="queryMessage">
        <textarea id="queryMessage" placeholder="관리자에게 보낼 메시지를 입력하세요.&#13;&#10(최대 100자)"></textarea>
    </label>
    <button class="submit-btn" onclick="sendQuery()">전송</button>
    <button class="submit-btn close-btn" onclick="hideQueryPopup()">닫기</button>
</div>



<script th:inline="javascript">
    /*<![CDATA[*/
    var currentQuestionIndex = 0;
    let countCorrectAnswer = 0;
    var quizList = /*[[${quizListSet}]]*/ null;
    var teamId = /*[[${teamId}]]*/  null;

    function displayQuestion() {
        document.getElementById("questionNumber").textContent = currentQuestionIndex + 1;
        document.getElementById("quizImage").src = quizList[currentQuestionIndex].question;

    }
    
  ...생략...

    function showQueryPopup() {
        document.getElementById("queryPopup").style.display = "block";
    }

    function hideQueryPopup() {
        document.getElementById("queryPopup").style.display = "none";
    }

    function sendQuery() {
        const queryMessage = document.getElementById("queryMessage").value;
        fetch('/admin/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                teamId: teamId,
                playerName: quizList[currentQuestionIndex].fullName,
                message: queryMessage
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                alert('메시지가 성공적으로 전송되었습니다.');
                hideQueryPopup();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert('메시지 전송에 실패했습니다.');
            });
    }

...생략...
    /*]]>*/
</script>
</body>
</html>
```

### Controller, Service Layer

- 전달받은 쿼리를 `Query` 테이블에 저장하도록 `controller`와 `service` 클래스를 만들었습니다.

### - QueryController

```
public class QueryController {

    private final QueryService queryService;
    @PostMapping("/admin/query")
    public ResponseEntity<?> sendQuery(@RequestBody QueryDto queryDto){

        queryService.save(queryDto);
        return ResponseEntity
                .ok()
                .body(queryDto);
    }
}
```

### - QueryDto

```
@Getter
@AllArgsConstructor
public class QueryDto {
    private Long teamId;
    private String playerName;
    private String message;
}
```

### - QueryService

```
@Service
@RequiredArgsConstructor
public class QueryService {

    private final QuizQueryRepository quizQueryRepository;
    @Transactional
    public void save(QueryDto queryDto) {
        QuizQuery quizQuery = new QuizQuery(queryDto.getTeamId(), queryDto.getPlayerName(), queryDto.getMessage());
        quizQueryRepository.save(quizQuery);

    }
}
```

## [결론]

사용자의 피드백을 받아 서비스를 개선하는 경험을 해보았다.

필자가 좋아하는 책 중 하나가 “카산드라의 거울”인데 미래를 내다보고 아직 발생하지 않은 사건을 해결해나가는 소녀의 이야기다. 사용자가 서비스를 이용하면서 어떤 불편함을 느낄지 미리 예측하고, 생각하며 코딩을 하는 개발자가 되도록 노력해야겠다.
