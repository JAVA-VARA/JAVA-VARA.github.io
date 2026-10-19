---
title: "java.lang.ClassCastException: class java.util.ArrayList cannot be cast to class java.util.Set"
date: 2024-07-02
description: "Ranking을 계산 시 성능 개선을 위해 직접 캐시 클래스를 구현하여 사용했다.[ 링크]"
source: medium
original: "https://medium.com/@sj.youns1027/java-lang-classcastexception-class-java-util-arraylist-cannot-be-cast-to-class-java-util-set-8586fc5918d9"
---
Ranking을 계산 시 성능 개선을 위해 직접 캐시 클래스를 구현하여 사용했다.[ [링크](https://medium.com/@sj.youns1027/hashmap%EC%9C%BC%EB%A1%9C-cache-%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0-5e300860ed57)]

이 캐시를 랭킹뿐 아니라 다른 곳에도 적용해 성능을 개선할 수 있는 부분을 찾아보던 중, 문제 출제 시 필요한 선수 정보를 캐시 메모리에 저장하기로 결정했다.

![](/images/medium/8586fc5918d9/1.png)

*캐시 줄 먹이를 찾아 어슬렁…*

```
private Set<Players> savePlayersListByTeamIdToCache(Long teamId) {
        Set<Players> players =  playersRepository.findByTeamId(teamId);
        String cacheKey = "playersList_" + teamId;
        cache.put(cacheKey, players);
        return players;
    }
```

teamId를 기준으로 선수 목록을 불러와 cache에 저장하는 메서드 완성! 그러나 코드 실행 시 문제가 발생하는데…

## [문제 상황]

캐시에 저장된 값을 불러오는 아래 코드에서 `java.lang.ClassCastException: class java.util.ArrayList cannot be cast to class java.util.Set` 예외가 발생했다.

```
private Set<Players> getPlayersListFromCache(Long teamId) {
        String cacheKey = "playersList_" + teamId;
        if(cache.containsKey(cacheKey)){
            return (Set<Players>) cache.get(cacheKey);
        }
        return null;
    }
```

## [원인]

캐시에서 가져온 `ArrayList`를 `Set`으로 형 변환할 수 없다는 오류였다.

- **기존에 직접 구현한 캐시 클래스의 Snippet**

```
public class Cache {
    HashMap<Object, Object> cache = new HashMap<>();
    public void put(Object key, Object value) {
        if (cache.size() >= maxCacheSize) {
            this.pop();
        }
        cache.put(key, value);
    }
    public Object get(Object key) {
        return cache.get(key);
    }
    // 생략
}
```

위 코드에서 `HashMap`의 key와 value는 범용성을 높이기 위해 `Object` 타입으로 선언했었는데, 불러온 `Object` 타입(List<Object>)을 필요한 타입(Set<Player>)으로 형변환할 때 문제가 발생했다.

## [해결]

코드가 실행될 때 마다 매번 형변환을 하며 리소스를 낭비하고 있다는 생각을 했다. 또한, 나중에 다른 타입의 key와 value 값을 사용하고 싶을 때에도 쉽게 사용할 수 있고, 문제 발생 가능성을 줄이는 코드를 만들기 위해 고민했다.

### “추상화”

고민하던 중 cache 클래스를 추상화하여 저장하고 싶은 key, value 값의 type에 따라 상속받아 사용하면 되겠다는 생각이 들었다.

### AbstractCache 클래스

```
public abstract class AbstractCache<K, V> {
    protected Map<K, V> cache = new HashMap<>();
    int maxCacheSize = 1000;

    public void put(K key, V value) {
        if (cache.size() >= maxCacheSize) {
            this.pop();
        }
        cache.put(key, value);
    }

    public V get(K key) {
        return cache.get(key);
    }

    public boolean containsKey(K key) {
        return cache.containsKey(key);
    }
    // 생략
}
```

`AbstractCache` 클래스는 제네릭으로 `K`와 `V`를 설정하여 필요한 타입의 key와 value가 있을 때 상속받아 사용하도록 했다.

아래는 `AbstractCache`를 상속받아 사용한 PlayerSetCache 와 RankingCache. 원하는 타입을 입력하고, 컴포넌트로 등록했다.

### PlayerSetCache

```
@Component
public class PlayerSetCache extends AbstractCache<String, Set<Players>> {
}
```

### RankingCache

```
@Component
public class RankingCache extends AbstractCache<String, Map<Integer, Integer>> {
}
```

### ResultService

의존성 주입을 통해 원하는 타입의 캐시를 간단하게 사용할 수 있다.

```
@Service
@RequiredArgsConstructor
public class ResultService {
    private final RankingCache cache;

    private Map<Integer, Integer> getUserCountByCorrectAnswerFromCache(Long teamId) {
        String cacheKey = "quizStat_" + teamId;
        if (cache.containsKey(cacheKey)) {
            return cache.get(cacheKey);
        }
        return null;
    }
    // 생략
}
```

## [결론]

캐시 클래스를 추상화하고 상속받아 사용함으로써, 성능을 개선하고 코드의 유지보수성을 높힐 수 있었다:)
