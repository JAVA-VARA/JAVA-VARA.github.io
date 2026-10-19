---
title: "Football-Quiz-Project"
date: 2024-06-06
description: "성능테스트-2"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-bf8f00ff90be"
---
이전 글에서 아래 4개의 경우의 수에 대해 JMTER를 통해 number of user(thread) 수 변화에 따른 Response time 에 대해 확인했다.  
1) 10초 동안 100개의 요청 (10 req/s)  
2) 5초 동안 100개의 요청 (20 req/s)  
3) 1초 동안 100개의 요청 (100 req/s)  
4) 1초 동안 1000개의 요청(1000 req/s)

## 개선

- ResultService의 quizRankingByTeam메서드

### **as-is: **랭킹 선형 탐색 - 시간복잡도O(n)

```
public RankingDto quizRankingByTeam(int correctAnswer, Long teamId) {
        //teamId 기준 정답 개수를 내림차순으로 불러온다.
        List<QuizHistory> quizTotalParticipantsByTeam = quizHistoryRepository.getRanking(teamId);
        int total = quizTotalParticipantsByTeam.size();

        int i =0;
        int[] rankArray = new int[quizTotalParticipantsByTeam.size()];

        //list를 선형탐색하여 유저의 정답 개수에 띠
        int rank = (int) quizTotalParticipantsByTeam.stream()
                .map(QuizHistory::getCorrectAnswer)
                .filter(answer -> answer >= correctAnswer)
                .count();

        RankingDto rankingDto = new RankingDto();
        rankingDto.setTotalParticipantsByTeam(total);
        rankingDto.setRank(rank);

        return rankingDto;
    }
```

### to-be: 랭킹 이진 탐색 — 시간복잡도O(log n)

```
public RankingDto quizRankingByTeam(int correctAnswer, Long teamId) {
        List<QuizHistory> quizTotalParticipantsByTeam = quizHistoryRepository.getRanking(teamId);
        int total = quizTotalParticipantsByTeam.size();
        
        //이진검색
        int rank = 0;
        int pl = 0;
        int pr = total - 1;

        while (pl <= pr) {
            int pc = (pl + pr) / 2;
            int currentCorrectAnswer = quizTotalParticipantsByTeam.get(pc).getCorrectAnswer();

            if (correctAnswer == currentCorrectAnswer) {
                rank = pc + 1; // 순위는 1부터 시작하므로 pc + 1로 설정
                break;
            } else if (correctAnswer > currentCorrectAnswer) {
                pr = pc - 1;
            } else {
                pl = pc + 1;
            }
        }

        if (pl > pr) {
            rank = pl + 1; // 정확히 일치하는 답이 없는 경우 순위를 계산
        }

        RankingDto rankingDto = new RankingDto();
        rankingDto.setTotalParticipantsByTeam(total);
        rankingDto.setRank(rank);

        return rankingDto;
    }
```

## 결과

- 1초 동안 100개의 요청 보내는 것을 2회 시행했다. 결과는 이전과 비슷하거나 약간 더 오래 걸렸다.

![](/images/medium/bf8f00ff90be/1.png)

### 왜지???????

코드를 보면서 시간 복잡도를 한 번 더 생각해보기로 했다.

### 시간복잡도

**<1번 코드>**

1. **데이터베이스 조회**: `quizTotalParticipantsByTeam` 리스트를 가져오는 부분 => 시간 복잡도: O(N)

**2. 배열 복사**: `quizTotalParticipantsByTeam` 리스트를 배열로 복사하는 부분 => 시간 복잡도: O(N)

**3. 선형 검색**: `rankArray`에서 특정 정답 수를 찾는 부분 => 시간 복잡도: O(N)

**1번 종합 시간 복잡도: O(N) + O(N) + O(N) = O(3N) ≈ O(N)**

**<2번 코드>**

1. **데이터베이스 조회**: `quizTotalParticipantsByTeam` 리스트를 가져오는 부분 => 시간 복잡도: O(N)

**2. 이진 검색**: `quizTotalParticipantsByTeam` 리스트에서 특정 정답 수를 찾는 부분 => 시간 복잡도: O(log N)

**2번 종합 시간 복잡도: O(N) + O(log N) ≈ O(N)**

### 결론

결론은 1,2번 코드 모두 데이터베이스 조회를 하는데 이 때 O(N)의 시간 복잡도를 가지게 되므로 선형탐색이든, 이진 탐색이든 관계없이 종합적이 시간복잡도는 O(N)을 가지게 되는 것이었다.

코드 개선 이 후 내 예상과는 다르게 response time에 유의미한 변화가 없는 이유였다.

![](/images/medium/bf8f00ff90be/2.png)

*코드스테이츠*

마치 교통 체증을 일으키는 곳이 대구 — 부산 라인인데, 나는 서울 — 대구 라인의 길만 확장 공사를 한 셈이었다. 아래는 1번, 2번 코드 성능 테스트에 대한 summery report인데 시간당 처리량을 의미하는 Throughput이 거의 동일한 것을 확인할 수 있다.(응답 시간 개선이 전혀 되지 않았다…)

![](/images/medium/bf8f00ff90be/3.png)

![](/images/medium/bf8f00ff90be/4.png)

## 최종 결론

자주 사용하는 데이터나 값을 memory 공간에 복사하여 동일한 정보를 조회하는 경우에는 성능을 높힐 수 있는 캐시를 사용해보고자 한다. 다음 글에는 redis를 적용해본 과정을 기록할 것이다.

[다음 이야기(성능테스트-3편)](https://medium.com/@sj.youns1027/football-quiz-project-ef83610c22c5)
