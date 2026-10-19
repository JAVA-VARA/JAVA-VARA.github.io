---
title: "Programmers"
date: 2024-02-05
description: "Solution1"
source: medium
original: "https://medium.com/@sj.youns1027/programmers-018203f338eb"
category: coding-test
---
LV02

[**코딩테스트 연습 - 의상**  
*코니는 매일 다른 옷을 조합하여 입는것을 좋아합니다. 예를 들어 코니가 가진 옷이 아래와 같고, 오늘 코니가 동그란 안경, 긴 코트, 파란색 티셔츠를 입었다면 다음날은 청바지를 추가로 입거나 동그란 안경 대신 검정…*school.programmers.co.kr](https://school.programmers.co.kr/learn/courses/30/lessons/42578)[](https://school.programmers.co.kr/learn/courses/30/lessons/42578)

### Solution1

```
import java.util.*;

public class Clothes {
    public int solution(String[][] clothes) {
        Map<String, ArrayList<String>> clothType = new HashMap<>();
        for(String[] cloth : clothes){
            String itemName = cloth[0];
            String part = cloth[1];
            if(!clothType.containsKey(part)){
                clothType.put(part, new ArrayList<>(List.of(itemName)));
            }else {
                ArrayList<String> list = clothType.get(part);
                list.add(itemName);
                clothType.put(part, list);
            }
        }

        int answer=1;
        for(String key : clothType.keySet()) {
            //전체 갯수 + 안입는 경우(1)
            int valueSize = clothType.get(key).size() + 1;
            answer *= valueSize;
            }
        //아무것도 안입은 경우 -1
        return answer-1;
    }
    public static void main(String[] args) {
        Clothes clothes = new Clothes();
        System.out.println(clothes.solution(new String[][] {{"yellow_hat", "headgear"},{"blue_sunglasses", "eyewear"}, {"green_turban", "headgear"}}));
        System.out.println(clothes.solution(new String[][] {{"crow_mask", "face"},{"blue_sunglasses", "face"}, {"smoky_makeup", "face"}}));
    }
}
```

### Solution2

**computeIfAbsent** 메서드를 사용하여 for문 내부를 간결하게 표현해보았다.

```
import java.util.*;

public class Clothes {
    public int solution(String[][] clothes) {
        Map<String, ArrayList<String>> clothType = new HashMap<>();
        for(String[] cloth : clothes){
            String itemName = cloth[0];
            String part = cloth[1];

            clothType.computeIfAbsent(part, item -> new ArrayList<>()).add(itemName);
        }
//생략
}
```
