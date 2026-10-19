---
title: "HashMap으로 Cache 구현해보기"
date: 2024-06-18
description: "이전에 Redis cache를 사용해 서버의 성능을 높혀보았다. [성능 테스트 링크]"
source: medium
original: "https://medium.com/@sj.youns1027/hashmap%EC%9C%BC%EB%A1%9C-cache-%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0-5e300860ed57"
---
## HashMap으로 Cache 구현해보기

이전에 Redis cache를 사용해 서버의 성능을 높혀보았다. [[성능 테스트 링크]](https://medium.com/@sj.youns1027/football-quiz-project-%EC%84%9C%EB%B2%84-%EC%84%B1%EB%8A%A5-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%86%B5%ED%95%A9%EB%B3%B8-10fb786a2437)

그런데 “redis가 만약 다운된다면?” 이라는 생각이 들었다. redis를 도입해 성능이 좋아졌지만 본 서버가 작동하지 않을 수도 있는 가능성도 함께 늘어난 것이다.

### Single Point Of Failure(SOF)

시스템 구성 요소 중에서, 동작하지 않으면 전체 시스템을 중단시킬 수 있는요소를 말한다.

![](/images/medium/5e300860ed57/1.png)

*[https://avinetworks.com/glossary/single-point-of-failure/](https://avinetworks.com/glossary/single-point-of-failure/)*

![](/images/medium/5e300860ed57/2.png)

*[https://avinetworks.com/glossary/single-point-of-failure/](https://avinetworks.com/glossary/single-point-of-failure/)*

redis가 다운된다고 전체 서버가 마비되는 것은 아니지만, 유저가 문제를 풀었을 때 결과를 반환해주는 핵심 기능이 안되기 때문에 미리 대비할 필요가 있다고 느껴졌다.

![](/images/medium/5e300860ed57/3.png)

그럼 redis가 없다면(다운 된다면) 어떻게 해야할까? redis가 아닌 또 다른 프로그램을 추가적으로 사용하면 관리하기 번거롭기 때문에 cache의 동작 원리에 대해 체득할 겸 직접 구현을 해보기로 했다.

## Cache 구현하기

현재 결과 반환 로직에서만 cache memory를 사용하고 있기 때문에 그 로직에만 HashMap을 사용해 db에서 불러온 data를 임시로 저장했다.

- ResultService

```
@Service
@RequiredArgsConstructor
public class ResultService {

    // 인메모리 캐시를 인스턴스 변수로 선언
    private final Map<Long, Map<Integer, Integer>> quizStatCache = new HashMap<>();

   //생략
    public RankingDto quizRankingByTeam(int currentUserCorrectAnswer, Long teamId) {
        Map<Integer, Integer> userCountByCorrectAnswer = quizStatCache.getOrDefault(teamId, new HashMap<>());

        if (userCountByCorrectAnswer.isEmpty()) {
            List<QuizHistory> quizTotalParticipantsByTeam = quizHistoryRepository.getRanking(teamId);
            for (QuizHistory quizHistory : quizTotalParticipantsByTeam) {
                int correctAnswer = quizHistory.getCorrectAnswer();
                userCountByCorrectAnswer.put(correctAnswer, userCountByCorrectAnswer.getOrDefault(correctAnswer, 0) + 1);
            }
            quizStatCache.put(teamId, userCountByCorrectAnswer);
        }

        //등수 계산
        int rankInteger=0;
        int totalInteger=0;
        for (Map.Entry<Integer, Integer> entry : userCountByCorrectAnswer.entrySet()) {
            int key = entry.getKey();
            int value = entry.getValue();

            if (key > currentUserCorrectAnswer) {
                rankInteger += value;
            }
            if (key == currentUserCorrectAnswer) {
                userCountByCorrectAnswer.put(key, value + 1);
            }
            totalInteger += value;
        }
        quizStatCache.put(teamId, userCountByCorrectAnswer);

        //생략
    }
```

일단 필요한 부분에만 적용했는데, cache가 필요할 때마다 각각의 class에서 구현해 사용하는 것이 아니라, cache class를 따로 만들고 bean으로 등록해서 사용하는 것이 좋겠다는 생각이 들었다.

## To-BE

- **Cache**  
- Cache 클래스를 만들어 주입받아 사용하도록 함  
- maxCacheSize를 설정하여 일정량 이상의 데이터가 쌓이면 자동으로 삭제되도록 함  
- 1시간 마다 캐시 메모리 초기화 되도록 함.

![](/images/medium/5e300860ed57/4.png)

```
package com.example.footballquizproject.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;

@Component
public class Cache {
    HashMap<Object, Object> cache = new HashMap<>();
    int maxCacheSize = 1000;

    public void put(Object key, Object value) {

        if (cache.size() >= maxCacheSize) {
            this.pop();
        }

        cache.put(key, value);
    }

    public Object get(Object key) {
        return cache.get(key);
    }


    public boolean containsKey(Object key) {
        return cache.containsKey(key);
    }

    public void pop() {
        cache.remove(cache.keySet().iterator().next());
    }

    public int size() {
        return cache.size();
    }

    public void clear() {
        cache.clear();
    }

    @Scheduled(fixedRate = 360000) // 1시간 마다 캐시 메모리 초기화
    public void clearCachePeriodically() {
        System.out.println("Clearing cache at: " + new java.util.Date());
        this.clear();
    }

}
```

- **ResultService**

```
@Service
@RequiredArgsConstructor
public class ResultService {

    private final LevelCategoryRepository levelCategoryRepository;
    private final QuizHistoryRepository quizHistoryRepository;
    private final Cache cache;

    public RankingDto quizRankingByTeam(int currentUserCorrectAnswer, Long teamId) {

        String cacheKey = "quizStat_" + teamId;
        Map<Integer, Integer> userCountByCorrectAnswer;

        if (cache.containsKey(cacheKey)) {
            userCountByCorrectAnswer = (Map<Integer, Integer>) cache.get(cacheKey);

        } else {
            userCountByCorrectAnswer = new HashMap<>();
            List<QuizHistory> quizTotalParticipantsByTeam = quizHistoryRepository.getRanking(teamId);
            for (QuizHistory quizHistory : quizTotalParticipantsByTeam) {
                int correctAnswer = quizHistory.getCorrectAnswer();
                userCountByCorrectAnswer.put(correctAnswer, userCountByCorrectAnswer.getOrDefault(correctAnswer, 0) + 1);
            }

            cache.put(teamId, userCountByCorrectAnswer);
        }

        //생략
    }
```

## 테스트코드

직접 구현한 cache class에 대한 test code를 간단하게 만들었다.

```
package com.example.footballquizproject.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CacheTest {

    Cache cache = new Cache();

    @Test
    void put() {
        cache.put("key", "value");
        assertEquals("value", cache.get("key"));
        assertNotEquals("value2", cache.get("key"));
    }

    @Test
    void put_1001() {
        for(int i = 0; i < 1001; i++) {
            cache.put("key" + i, "value" + i);
        }
        assertEquals(1000, cache.size());
    }

    @Test
    void get() {
        cache.put("key", "value");
        assertEquals("value", cache.get("key"));
        assertNull(cache.get("key_X"));
    }

    @Test
    void containsKey() {
        cache.put("key", "value");
        assertTrue(cache.containsKey("key"));
        assertFalse(cache.containsKey("key_X"));
    }

    @Test
    void clear() {
        cache.put("key", "value");
        cache.put("key1", "value2");
        cache.clear();
        assertNull(cache.get("key"));
        assertNull(cache.get("key1"));
    }

    @Test
    void pop() {
        cache.put("key", "value");
        cache.put("key1", "value2");
        cache.pop();
        assertNull(cache.get("key1"));
    }

}
```

## 성능테스트

약 20초 동안 1초에 100개의 요청을 보냈다. 처음 테스트할 때 캐시메모리를 초기화하지 않아, 처음부터 db가 아닌 캐시 메모리에서 랭킹을 찾아왔기 때문에 모든 응답이 0.5s 이내로 이루어졌다.

정확한 테스트를 위해 캐시 메모리를 초기화 후 다시 테스트해봤을 때(01:22), 첫 요청에서만 약 4초의 응답시간을 보이고 그 이후에는 다시 안정적으로 0.5s 이내에 결과 반환하는 것을 볼 수 있다.

![](/images/medium/5e300860ed57/5.png)

## 마무리

직접 구현한 캐시 클래스를 통해 Redis를 대체해보았고, 성능 테스트를 통해 안정적으로 작동하는 것도 확인했다. 이제 나에게는 캐시 메모리를 사용하기 위한 두 가지 선택지가 생겼다.

기능을 구현하는 것뿐만 아니라 서버를 안정적으로 운영하고, 더 좋은 성능으로 사용자의 불편함을 최소화하는 방법을 고민하는 것도 재미있다.

![](/images/medium/5e300860ed57/6.png)

끝!
