---
title: "QuizHistory entity 변경"
date: 2024-06-17
description: "퀴즈 히스토리 테이블은 사용자가 퀴즈를 풀 때 선택한 팀의 ID, 정답 개수, 문제를 풀었던 시간을 기록하고 있다."
source: medium
original: "https://medium.com/@sj.youns1027/quizhistory-entity-%EB%B3%80%EA%B2%BD-0f73cb6bb03b"
---
## QuizHistory entity 변경

퀴즈 히스토리 테이블은 사용자가 퀴즈를 풀 때 선택한 팀의 ID, 정답 개수, 문제를 풀었던 시간을 기록하고 있다.

![](/images/medium/0f73cb6bb03b/1.png)

이 테이블의 목적은 유저의 랭킹을 보여주기 위함이었는데 이 테이블만으로 할 수 있는 것은 그게 전부였다.

유저들이 풀었던 문제의 기록을 추가적으로 활용할 수는 없을까 고민하던 끝에 아래와 같이 table entity를 변경하기로 했다.

```
@Getter
@Setter
@Entity
@EnableJpaAuditing
public class NewQuizHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column
    private Long quizId; //추가

    @Column
    private Long teamId;

    @Column
    private String quizCategory;

    @Column
    private String correctAnswer; //변경

    @Column
    private String userAnswer; //추가

    @Column
    private boolean isCorrect; //추가

    @Column
    private boolean isCompleted; //추가

    @Column
    private String deviceType; //추가

    @Column
    private String userIpAddress; //추가

    @Column
    private String userLocation; //추가

    @Column
    private int attemptCount; //추가

    @Column
    private int numberOfQuestions; //추가

    @Column
    private LocalDateTime startTime; //추가

    @Column
    private LocalDateTime endTime; //추가
}
```

id와 teamId, quizCategory colum을 제외하고 모두 변경되거나 추가되었다.

![](/images/medium/0f73cb6bb03b/2.jpg)

table을 변경함으로써 아래와 같이 서비스에 긍정적인 측면이 생긴다.

- **isCompleted**: 끝까지 푼 사람들의 수를 분석하면 문제점을 파악하고 개선 가능
- **numberOfQuestions**: 현재는 10문제를 한 세트로 문제를 출제하지만, 추후 20문제, 50문제로 늘렸을 때 사람들이 선호하는 문제 수 파악 가능
- **deviceType**: 사용자가 퀴즈를 풀 때 사용하는 기기 정보를 수집하여, 모바일, 데스크탑 등 다양한 플랫폼에 맞는 사용자 경험 개선 가능
- **userLocation**: 지역별 팀 선호도 확인 가능
- **attemptCount**: 한명의 유저가 퀴즈에 몇번 참여했는지 확인 가능
- **userIpAddress**: 회원 가입 없이 퀴즈 서비스를 운영하고 있기에, userId 대신 활용할 수 있음.
- 문제별 정답률을 고려해 난이도 조절 가능

이외에도 지금 생각하지 못한 다양한 아이디어가 떠오를 때, 축적된 정보를 활용하여 새로운 인사이트를 얻고, 이로 인해 퀴즈 서비스의 품질을 높이고 사용자 경험을 개선할 수 있기를 기대해본다.
