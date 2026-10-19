---
title: "Football Quiz Project-서버 성능 테스트[통합본]"
date: 2024-06-18
description: "서비스를 배포하고, 인터넷 커뮤니티에 광고도 했다. 약 한 달 간 무려 77명의 사용자가 이용했다!!(조작 아님)"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-%EC%84%9C%EB%B2%84-%EC%84%B1%EB%8A%A5-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%86%B5%ED%95%A9%EB%B3%B8-10fb786a2437"
theme: performance
---
## Football Quiz Project-서버 성능 테스트[통합본]

서비스를 배포하고, 인터넷 커뮤니티에 광고도 했다. 약 한 달 간 무려 77명의 사용자가 이용했다!!(조작 아님)

![](/images/medium/10fb786a2437/1.png)

내가 만든 서비스를 누군가 사용한다니 감격스럽다. 앞으로 계속 서비스를 이어나가며 업그레이드를 해나갈 예정인데, 가장 먼저 **성능테스트**를 해보고자 한다.

## 성능테스트 툴

**JMETER**를 사용하기로 했다. GUI모드를 지원해주고 플러그인을 통해 다양한 기능을 쉽게사용해볼 수 있다고 하여 나같은 입문자가 쓰기에 적합하다고 생각했다.

많은 사람들이 사용하는 툴이기도 해서 error나 잘 모르는 부분이 생겼을 때 내가 원하는 정보를 쉽게 찾을 수 있다는 점도 선택의 이유 중 하나다.

## 테스트 환경

**로컬**에서 진행 후 배포한 서버에 대한 성능 테스트를 진행하려한다.

## 테스트 목적

서비스를 사용하는 user가 늘어남에 따라 Response time이 증가한다면 성능이 떨어진다고 볼 수 있기때문에 **number of user(thread) 수 변화에 따른 Response time 에 대해 확인해 볼 것이다.**

아래 4개의 경우의 수에 대해 확인해보고자 한다.  
1) 10초 동안 100개의 요청 (10 req/s)  
2) 5초 동안 100개의 요청 (20 req/s)  
3) 1초 동안 100개의 요청 (100 req/s)

동시에 100명이나 사용할 일이 없겠지만 너무 적은 양의 requset를 보낸다면 성능테스트의 의미가 떨어진다고 생각되기에 user 수는 100명으로 설정했고, Active thread 수에 따라 성능이 어떻게 달라질지 궁금해 단계를 나누어 테스트를 진행했다.

## 테스트 지점

- QuizApiController  
유저가 퀴즈를 완료하면 결과를 저장하고, 결과에 따라 level 과 ranking을 반환하는 메서드를 포함하는 클래스이다.  
많은 요청이 들어왔을 때 병목현상을 일으킬 가능성이 가장 클 것으로 예상되는 구간을 설정하여 테스트를 진행했다.

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

## 결과 확인

1. **10초 동안 100개의 요청 (10req/s)**  
1초에 10개의 요청. 적은 수의 요청을 보냈기에 모든 요청에 대해 0.85초 내로 response 되었음을 확인할 수 있다.

![](/images/medium/10fb786a2437/2.png)

![](/images/medium/10fb786a2437/3.png)

![](/images/medium/10fb786a2437/4.png)

**2. 5초 동안 100개의 요청 (20req/s)  
**1초에 20개의 요청. 내 예상보다 response time이 급증했다. 사용자가 증가함에 따라 response time이 약 3.3초까지 치솟았다.

![](/images/medium/10fb786a2437/5.png)

![](/images/medium/10fb786a2437/6.png)

**3. 1초 동안 100개의 요청 (100req/s)  
**1초에 100개의 요청. response time 약 7초. 로딩 시간이 7초나 걸린다면 한국 사람들은 당장 종료버튼을 누르고 나가버릴 것이다.

![](/images/medium/10fb786a2437/7.png)

![](/images/medium/10fb786a2437/8.png)

**[번외]1초 동안 1000개의 요청 (1000req/s)  
**테스트 계획에는 없었지만 순전한 호기심에 돌려본 테스트.  
response time 약 100초를 돌파해버리고 error가 발생하기 시작했다.

![](/images/medium/10fb786a2437/9.png)

![](/images/medium/10fb786a2437/10.png)

예상보다 적은 수의 요청(5초 동안 100개의 요청)이 들어오기만 해도 response time이 급격하게 증가하고, 1초에 1000개의 요청을 보내는 경우에는 모든 요청을 처리하지 못해 error 가 발생했다.

## 개선

#1 ResultService의 quizRankingByTeam메서드

## as-is: 랭킹 선형 탐색 — 시간복잡도O(n)

```
public RankingDto quizRankingByTeam(int correctAnswer, Long teamId) {
        //teamId 기준 정답 개수를 내림차순으로 불러온다.
        List<QuizHistory> quizTotalParticipantsByTeam = quizHistoryRepository.getRanking(teamId);
        int total = quizTotalParticipantsByTeam.size();
        int i =0;
        int[] rankArray = new int[quizTotalParticipantsByTeam.size()];

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

## to-be: 랭킹 이진 탐색 — 시간복잡도O(log n)

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

![](/images/medium/10fb786a2437/11.png)

## 왜지???????

코드를 보면서 시간 복잡도를 한 번 더 생각해보기로 했다.

## 시간복잡도

**<1번 코드>**

1. **데이터베이스 조회**: `quizTotalParticipantsByTeam` 리스트를 가져오는 부분 => 시간 복잡도: O(N)

**2. 배열 복사**: `quizTotalParticipantsByTeam` 리스트를 배열로 복사하는 부분 => 시간 복잡도: O(N)

**3. 선형 검색**: `rankArray`에서 특정 정답 수를 찾는 부분 => 시간 복잡도: O(N)

**1번 종합 시간 복잡도: O(N) + O(N) + O(N) = O(3N) ≈ O(N)**

**<2번 코드>**

1. **데이터베이스 조회**: `quizTotalParticipantsByTeam` 리스트를 가져오는 부분 => 시간 복잡도: O(N)

**2. 이진 검색**: `quizTotalParticipantsByTeam` 리스트에서 특정 정답 수를 찾는 부분 => 시간 복잡도: O(log N)

**2번 종합 시간 복잡도: O(N) + O(log N) ≈ O(N)**

## 결론

결론은 1,2번 코드 모두 데이터베이스 조회를 하는데 이 때 O(N)의 시간 복잡도를 가지게 되므로 선형탐색이든, 이진 탐색이든 관계 없이 종합적으로 O(N)의 시간복잡도를 가지게 되는 것이었다.

코드 개선 이 후 내 예상과는 다르게 response time에 유의미한 변화가 없는 이유였다.

![](/images/medium/10fb786a2437/12.png)

*코드스테이츠*

마치 교통 체증을 일으키는 곳이 대구 — 부산 라인인데, 나는 서울 — 대구 라인의 길만 확장 공사를 한 셈이었다. 아래는 1번, 2번 코드 성능 테스트에 대한 summery report인데 시간당 처리량을 의미하는 Throughput이 거의 동일한 것을 확인할 수 있다.(응답 시간 개선이 전혀 되지 않았다…)

![](/images/medium/10fb786a2437/13.png)

*#1 선형 탐색*

![](/images/medium/10fb786a2437/14.png)

*#2 이진 탐색*

자주 사용하는 데이터나 값을 memory 공간에 복사하여 동일한 정보를 조회하는 경우에는 성능을 높힐 수 있는 캐시를 사용해보고자 한다.

## Cache

Cache란 자주 사용하는 데이터나 값을 미리 복사해 놓는 임시 장소를 가리킨다. 아래와 같은 저장공간 계층 구조에서 확인할 수 있듯이, 캐시는 저장 공간이 작고 비용이 비싼 대신 빠른 성능을 제공한다.

![](/images/medium/10fb786a2437/15.png)

*[https://mangkyu.tistory.com/69](https://mangkyu.tistory.com/69)*

## 툴

spring 내에서 캐싱을 구현해볼 수도 있지만, 다양한 툴을 경험해보고 싶어 Redis*를 사용해 캐시를 구현해보기로 했다.

## *Redis란?

- `영속성을 지원하는 인메모리 데이터 저장소`
- `읽기 성능 증대를 위한 서버 측 복제를 지원`
- `다양한 서비스에서 사용되며 검증된 기술`
- `문자열, 리스트, 해시, 셋, 정렬된 셋과 같은 다양한 데이터형을 지원. 메모리 저장소임에도 불구하고 많은 데이터형을 지원하므로 다양한 기능 구현 가능`

## Redis 적용해보기

## 1. Redis 설치

아래 링크에 접속하여 msi 확장자의 Redis 설치 프로그램을 다운로드한다.

- [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)

## 2. Redis 실행 확인

redis-cli.exe를 실행 후 ping이라는 명령어를 입력하면 PONG이라는 문자를 반환해준다.

![](/images/medium/10fb786a2437/16.png)

## 3. 의존성 추가

```
    //redis
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-cache'
    //ReadFrom
    // https://mvnrepository.com/artifact/io.lettuce/lettuce-core
    implementation group: 'io.lettuce', name: 'lettuce-core', version: '6.3.2.RELEASE'
```

## 4. application.yml 에 redis 관련 설정 추가

```
spring:
  data:
    redis:
      lettuce:
        pool:
          max-active: 5
          max-idle: 5
          min-idle: 2
      host: localhost
      port: 6379
```

## 5. RedisConfig class 추가

```
@Configuration
@EnableRedisRepositories
public class RedisConfig {
@Value("${spring.data.redis.host}")
    private String host;
    @Value("${spring.data.redis.port}")
    private int port;
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(new RedisStandaloneConfiguration(host, port));
    }
    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory());
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new StringRedisSerializer());
        return redisTemplate;
    }
    @Bean
    public CacheManager testCacheManager(RedisConnectionFactory cf) {
        RedisCacheConfiguration redisCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .entryTtl(Duration.ofMinutes(3L));
        return RedisCacheManager.RedisCacheManagerBuilder.fromConnectionFactory(cf).cacheDefaults(redisCacheConfiguration).build();
    }
}
```

## 6. @Cacheable 어노테이션 추가

```
@Cacheable(value = "ranking", key = "#teamId", cacheManager = "testCacheManager")
    public RankingDto quizRankingByTeam(int correctAnswer, Long teamId) {
        //맞춘갯수를 내림차순으로 가져온 list
        List<QuizHistory> quizTotalParticipantsByTeam = quizHistoryRepository.getRanking(teamId);
        int total = quizTotalParticipantsByTeam.size();

//생략
```

Redis를 이용해 Cache를 적용해보았으니 이제 다시 성능(Number of user수 변화에 따른 Response time)을 테스트해보자!

## 테스트 진행

테스트는 초기에 했던 것과 동일하게 진행했고, 지속적으로 요청을 보냈을 때도 안정적으로 서버가 운영되는지 확인하기 위해 Loop Count만 infinite로 설정을 변경했다.

1) 10초 동안 100개의 요청 (10 req/s)  
2) 5초 동안 100개의 요청 (20 req/s)  
3) 1초 동안 100개의 요청 (100 req/s)  
4)1초 동안 1000개의 요청(1000 req/s)

## 10초 동안 100개의 요청 (10 req/s)

![](/images/medium/10fb786a2437/17.png)

![](/images/medium/10fb786a2437/18.png)

![](/images/medium/10fb786a2437/19.png)

## 5초 동안 100개의 요청 (20 req/s)

![](/images/medium/10fb786a2437/20.png)

![](/images/medium/10fb786a2437/21.png)

- Summary Report

![](/images/medium/10fb786a2437/22.png)

## 1초 동안 100개의 요청 (100 req/s)

![](/images/medium/10fb786a2437/23.png)

![](/images/medium/10fb786a2437/24.png)

- Summary Report

![](/images/medium/10fb786a2437/25.png)

## 1초 동안 1000개의 요청(1000 req/s)

![](/images/medium/10fb786a2437/26.png)

![](/images/medium/10fb786a2437/27.png)

- Summary Report

![](/images/medium/10fb786a2437/28.png)

## 결과

캐시를 사용하면서 성능이 확연하게 개선되었다. 테스트 1번과 2번에서는 응답 시간이 0.5초 이내로, 테스트 3번과 4번에서는 최대 3초 이내로 안정적으로 응답했다. 요청 수에 따라 약 70~97%까지 성능이 향상되었음을 확인할 수 있었다.

![](/images/medium/10fb786a2437/29.png)
