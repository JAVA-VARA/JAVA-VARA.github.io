---
title: "football-quiz-project"
date: 2024-05-21
description: "리펙토링"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-4b799b885b48"
---
## 퀴즈 풀기, 정답/오답 여부 확인

### - as-is

서버 쪽에서 퀴즈목록과 현제 문제의 인덱스, 정답/오답 여부를 session에 담아 클라이언트에게 전달했다.

서버가 문제도 출제하고, 서버가 퀴즈의 진행 상태를 관리하고 있다. 또 한 문제를 풀 때마다 서버 ← → 클라이언트 간 통신이 발생하여 불필요하게 서버에 부하를 주고 있는 것은 아닌가 고민하게 되었다.

```
   @GetMapping("/quiz")
    public String showQuiz(@RequestParam String teamName, Model model, HttpSession session) {

        List<QuizDto> quizList =  quizService.pick20PlayersByTeamName(teamName);
        session.setAttribute("quizList", quizList);
        session.setAttribute("currentQuestionIndex", 0);
        QuizDto currentQuestion = quizList.get(0);
        model.addAttribute("quiz", currentQuestion.getQuestion());
        
        return "quizList";
    }
    
    @PostMapping("/quiz/answer")
    public String checkAnswer(@RequestParam String answer, Model model,  HttpSession session){
        //현재 문제
        List<QuizDto> quizList = (List<QuizDto>) session.getAttribute("quizList");
        Integer currentQuestionIndex = (Integer) session.getAttribute("currentQuestionIndex");
        QuizDto currentQuestion = quizList.get(currentQuestionIndex);

        //정답
        String correctAnswer = currentQuestion.getAnswer();
        //사용자가 입력한 정답과 일치하는지 확인
        boolean isCorrect = answer.equalsIgnoreCase(correctAnswer);

        //정답인 경우 count
        if(currentQuestionIndex < quizList.size()-1){
            currentQuestionIndex++;
            session.setAttribute("currentQuestionIndex",currentQuestionIndex);

            QuizDto nextQuestion = quizList.get(currentQuestionIndex);

            model.addAttribute("quiz", nextQuestion.getQuestion());

            model.addAttribute("isCorrect", isCorrect);

            return "quiz";


        } else {
            model.addAttribute("isCorrect", isCorrect);
            return "result";

        }

    }
```

### to-be

서버는 퀴즈 목록을 제공하는 역할만 하고, 클라이언트가 퀴즈의 진행 상태를 관리하도록 역할을 분리하고 서버의 부하를 줄였다.

- 서버

```
@GetMapping("/quiz")
    public String showQuiz(@RequestParam String teamName, Model model, HttpSession session) {

        List<QuizDto> quizList =  quizService.pick20PlayersByTeamName(teamName);

        model.addAttribute("quizListSet", quizList);

        return "test";
    }
```

- 클라이언트

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<div class="quiz-container">
    <div class="question-number">문제
        <span id="questionNumber"></span>
    </div>

    <img id="quizImage" class="quiz-image" src="" alt="Quiz Image">
    <div>
        <input id="answerInput" class="answer-input" type="text" placeholder="Enter your answer">
    </div>

    <div>
        <button id="submitBtn" class="submit-btn" onclick="checkAnswer()">Submit</button>
    </div>

    <div>
        <div id="result" class="result"></div>
    </div>

    <div>
        <button id="nextBtn" class="next-btn" onclick="nextQuestion()" style="display: none;">다음</button>
    </div>
</div>

<script th:inline="javascript">
    /*<![CDATA[*/
    var currentQuestionIndex = 0;
    let countCorrectAnswer = 0;
    var quizList = /*[[${quizListSet}]]*/ null;

    function displayQuestion() {
        document.getElementById("questionNumber").textContent = currentQuestionIndex + 1;
        document.getElementById("quizImage").src = quizList[currentQuestionIndex].question;
    }

    function checkAnswer() {

        let answer = document.getElementById("answerInput").value;
        let correctAnswer = quizList[currentQuestionIndex].answer;


        //정답 확인
        let isCorrect = answer === correctAnswer;

        let resultMsg;
        if(isCorrect){
            countCorrectAnswer++;
            resultMsg = "정답";
        }else {
            resultMsg = "오답" +  correctAnswer;
        }

        document.getElementById("result").textContent = resultMsg;
        document.getElementById("submitBtn").style.display = "none"; // submit 버튼 숨기기
        document.getElementById("nextBtn").style.display = "block"; // next 버튼 보이기
    }

    function nextQuestion(){
        //다음문제로 넘어가기
        if (currentQuestionIndex < quizList.length - 1) {
            currentQuestionIndex++;

            displayQuestion();
            document.getElementById("result").textContent = ""; // 결과 메시지 초기화
            document.getElementById("answerInput").value = ""; // 입력 필드 초기화
            document.getElementById("submitBtn").style.display = "block"; // submit 버튼 보이기
            document.getElementById("nextBtn").style.display = "none"; // next 버튼 숨기기
        }else {

            //TO-DO: 퀴즈 끝나면 RESULT PAGE로 FECTCH 요청 countCorrectAnswer 도 함께 보내 유저의 퀴즈 결과에 대한 안내를 한다.
            alert("퀴즈 끝")
            console.log(countCorrectAnswer);
        }
    }

    // 페이지 로드 시 첫번째 문제 표시
    window.onload = function () {
        displayQuestion();
    };

    /*]]>*/
</script>
</body>
</html>
```

## 유저가 선택한 팀 선수 랜덤으로 20명 불러오기

### as-is

1. db에서 teamName 기준으로 모든 선수들을 불러온다.
2. list를 섞는다.
3. 섞은 list에서 순서대로 20개 반환
- **service**

```
@Service
@RequiredArgsConstructor
public class QuizService {

    private final PlayersRepository playersRepository;

    public List<QuizDto> pick20PlayersByTeamName(String teamName){

        List<Players> players = playersRepository.findRandomPlayersByTeamName(teamName);

        //팀별로 선수 선택 후 섞음.
        List<Players> playersList = playersRepository.findByTeamTeamName(teamName);
        Collections.shuffle(playersList);

        //섞은 list에서 20개 선택 후 반환
        int numOfSelectedList = 20;
        List<Players> selectedPlayers = new ArrayList<>();
        for(int i=0; i< numOfSelectedList; i++){
            selectedPlayers.add(playersList.get(i));
        }

        //dto에 필요한 정보만 저장 후 controller로 전달
        List<QuizDto> quizSetOfPlayers = new ArrayList<>();

        for(Players player : players){
            QuizDto playersDto = new QuizDto(player.getImageUrl(), player.getName());
            quizSetOfPlayers.add(playersDto);
        }
        return quizSetOfPlayers;
    }
}
```

- **repository**

```
public interface PlayersRepository extends JpaRepository<Players, Long> {
    List<Players> findByTeamTeamName(String teamName);
```

- 모든 선수들의 데이터를 메모리에 로드해야 하므로 메모리 사용량이 많아진다.
- Collections.shuffle(playersList) => O(n)의 시간 복잡도를 가진다.

=> 선수가 많아질수록 성능이 떨어진다.

### to-be

repository에 @Query annotation을 사용하여 랜덤으로 20명의 선수 반환.

```
package com.example.footballquizproject.service;

import com.example.footballquizproject.domain.Players;
import com.example.footballquizproject.dto.QuizDto;
import com.example.footballquizproject.repository.PlayersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final PlayersRepository playersRepository;

    public List<QuizDto> pick20PlayersByTeamName(String teamName){
        List<Players> players = playersRepository.findRandomPlayersByTeamName(teamName);
        List<QuizDto> quizSetOfPlayers = new ArrayList<>();

        for(Players player : players){
            QuizDto playersDto = new QuizDto(player.getImageUrl(), player.getName());
            quizSetOfPlayers.add(playersDto);
        }
        return quizSetOfPlayers;
    }
}
```

```
public interface PlayersRepository extends JpaRepository<Players, Long> {
    @Query(value = "SELECT * FROM players WHERE team_name = :teamName ORDER BY RAND() LIMIT 20", nativeQuery = true)
    List<Players> findRandomPlayersByTeamName(@Param("teamName") String teamName);
}
```

- 필요한 데이터만 가져오므로메모리 사용량이 적다.
- service layer에서 불필요하게 섞어주는 로직이 삭제된다.
