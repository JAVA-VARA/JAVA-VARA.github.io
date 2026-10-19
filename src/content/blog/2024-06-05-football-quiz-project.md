---
title: "Football-Quiz-Project"
date: 2024-06-05
description: "성능테스트-1"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-e7b7f0b15faa"
theme: performance
---
서비스를 배포하고, 인터넷 커뮤니티에 광고도 했다. 약 한 달 간 무려 77명의 사용자가 이용했다!!(조작 아님)

![](/images/medium/e7b7f0b15faa/1.png)

내가 만든 서비스를 누군가 사용한다니 감격스럽다. 앞으로 계속 서비스를 이어나가며 업그레이드를 해나갈 예정인데, 가장 먼저 **성능테스트**를 해보고자 한다.

### 성능테스트 툴

**JMETER**를 사용하기로 했다. GUI모드를 지원해주고 플러그인을 통해 다양한 기능을 쉽게사용해볼 수 있다고 하여 나같은 입문자가 쓰기에 적합하다고 생각했다.

많은 사람들이 사용하는 툴이기도 해서 error나 잘 모르는 부분이 생겼을 때 내가 원하는 정보를 쉽게 찾을 수 있다는 점도 선택의 이유 중 하나다.

### 테스트 환경

**로컬**에서 진행 후 배포한 서버에 대한 성능 테스트를 진행하려한다.

### 테스트 목적

서비스를 사용하는 user가 늘어남에 따라 Response time이 증가한다면 성능이 떨어진다고 볼 수 있기때문에 **number of user(thread) 수 변화에 따른 Response time 에 대해 확인해 볼 것이다.**

아래 4개의 경우의 수에 대해 확인해보고자 한다.  
 1) 10초 동안 100개의 요청 (10 req/s)  
 2) 5초 동안 100개의 요청 (20 req/s)  
 3) 1초 동안 100개의 요청 (100 req/s)

동시에 100명이나 사용할 일이 없겠지만 너무 적은 양의 requset를 보낸다면 성능테스트의 의미가 떨어진다고 생각되기에 user 수는 100명으로 설정했고, Active thread 수에 따라 성능이 어떻게 달라질지 궁금해 단계를 나누어 테스트를 진행했다.

### 테스트 지점

- QuizApiController  
유저가 퀴즈를 완료하면 결과를 저장하고, 결과에 따라 level 과 ranking을 반환하는 메서드를 포함하는 클래스이다.  
많은 요청이 들어왔을 때 병목현상을 일으킬 가능성이 가장 커보이는 구간을 설정하여 테스트를 진행했다.

```
@PostMapping("/result")
    public String showResult(@RequestBody QuizResultRequestDto request, Model model) {

        int correctAnswers = request.getCorrectAnswers();
        Long teamId = request.getTeamId();
        String team =teamCategoryService.getTeamName(teamId);

        resultService.saveQuizHistory(correctAnswers, teamId);

        LevelCategory level = resultService.determineResult(correctAnswers);
        RankingDto rankingInfo = resultService.quizRankingByTeam(correctAnswers, teamId);

        model.addAttribute("correctAnswers", correctAnswers);
        model.addAttribute("level", level);
        model.addAttribute("team", team);
        model.addAttribute("ranking", rankingInfo);

        return "result";
    }
```

### **결과 확인**

1. **10초 동안 100개의 요청 (10req/s)**  
1초에 10개의 요청. 적은 수의 요청을 보냈기에 모든 요청에 대해 0.85초 내로 response 되었음을 확인할 수 있다.

![](/images/medium/e7b7f0b15faa/2.png)

![](/images/medium/e7b7f0b15faa/3.png)

![](/images/medium/e7b7f0b15faa/4.png)

**2. 5초 동안 100개의 요청 (20req/s)  
**1초에 20개의 요청. 내 예상보다 response time이 급증했다. 사용자가 증가함에 따라 response time이 약 3.3초까지 치솟았다.

![](/images/medium/e7b7f0b15faa/5.png)

![](/images/medium/e7b7f0b15faa/6.png)

**3. 1초 동안 100개의 요청 (100req/s)  
**1초에 100개의 요청. response time 약 7초. 로딩 시간이 7초나 걸린다면 한국 사람들은 당장 종료버튼을 누르고 나가버릴 것이다.

![](/images/medium/e7b7f0b15faa/7.png)

![](/images/medium/e7b7f0b15faa/8.png)

**[번외]1초 동안 1000개의 요청 (1000req/s)  
**테스트 계획에는 없었지만 순전한 호기심에 돌려본 테스트.  
 response time 약 100초를 돌파해버리고 error가 발생하기 시작했다. 1초에 1000개의 요청이면 대규모 트래픽이라고 부를 수 없는 수이지만 내가 만든 서비스는 감당하지 못했다.

![](/images/medium/e7b7f0b15faa/9.png)

![](/images/medium/e7b7f0b15faa/10.png)

예상보다 적은 수의 요청(5초 동안 100개의 요청)이 들어오기만 해도 response time이 급격하게 증가하고, 1초에 1000개의 요청을 보내는 경우에는 모든 요청을 처리하지 못해 error 가 발생했다.

[다음 이야기(성능테스트-2편)](https://medium.com/@sj.youns1027/football-quiz-project-bf8f00ff90be)
