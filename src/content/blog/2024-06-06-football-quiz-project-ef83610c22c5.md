---
title: "Football-Quiz-Project"
date: 2024-06-06
description: "성능테스트-3"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-ef83610c22c5"
theme: performance
---
이전 글에서는 Response time을 줄여 서비스의 성능을 높히고자 코드 레벨에서 선형 탐색을 이진 탐색으로 변경해보았다. 그러나 결과는 실패. Database 조회 시간을 줄여야한다는 결론을 도출하여 캐시를 사용해보기로 했다.

## Cache

Cache란 자주 사용하는 데이터나 값을 미리 복사해 놓는 임시 장소를 가리킨다. 아래와 같은 저장공간 계층 구조에서 확인할 수 있듯이, 캐시는 저장 공간이 작고 비용이 비싼 대신 빠른 성능을 제공한다.

![](/images/medium/ef83610c22c5/1.png)

*[https://mangkyu.tistory.com/69](https://mangkyu.tistory.com/69)*

### 툴

Database 조회 시간을 줄이기 위해 캐시를 사용할 것이다. spring 내에서 간단하게 캐싱을 구현해볼 수도 있지만, 나중에 실시간으로 quiz를 푼 사람들의 랭킹을 보여주는 랭킹보드를 만들고 싶어 Redis*를 사용해 캐시를 구현해보기로 했다.

### *Redis란?

- `영속성을 지원하는 인메모리 데이터 저장소`
- `읽기 성능 증대를 위한 서버 측 복제를 지원`
- `쓰기 성능 증대를 위한 클라이언트 측 샤딩(Sharding) 지원`
- `다양한 서비스에서 사용되며 검증된 기술`
- `문자열, 리스트, 해시, 셋, 정렬된 셋과 같은 다양한 데이터형을 지원. 메모리 저장소임에도 불구하고 많은 데이터형을 지원하므로 다양한 기능 구현 가능`

## Redis 사용해보기

### 1. Redis 설치

아래 링크에 접속하여 msi 확장자의 Redis 설치 프로그램을 다운로드한다.

- https://github.com/microsoftarchive/redis/releases

### 2. Redis 실행 확인

redis-cli.exe를 실행 후 ping이라는 명령어를 입력하면 PONG이라는 문자를 반환해준다.

![](/images/medium/ef83610c22c5/2.png)

### 3. 의존성 추가

```
     //redis
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-cache'

    //ReadFrom
    // https://mvnrepository.com/artifact/io.lettuce/lettuce-core
    implementation group: 'io.lettuce', name: 'lettuce-core', version: '6.3.2.RELEASE'
```

### 4. application.yml 에 redis 관련 설정 추가

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

//생략
```

### 5. RedisConfig class 추가

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

### 6. @Cacheable 어노테이션 추가

```
@Cacheable(value = "ranking", key = "#teamId", cacheManager = "testCacheManager")
    public RankingDto quizRankingByTeam(int correctAnswer, Long teamId) {
        //맞춘갯수를 내림차순으로 가져온 list
        List<QuizHistory> quizTotalParticipantsByTeam = quizHistoryRepository.getRanking(teamId);
        int total = quizTotalParticipantsByTeam.size();

//생략
```

[다음 이야기(성능테스트-4편)](https://medium.com/@sj.youns1027/football-quiz-project-f5dba57466b9)
