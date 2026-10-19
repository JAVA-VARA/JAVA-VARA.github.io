---
title: "Programmers"
date: 2024-02-07
description: "LV02"
source: medium
original: "https://medium.com/@sj.youns1027/programmers-1089fe484fb8"
---
LV02

[**코딩테스트 연습 - [1차] 캐시**  
*지도개발팀에서 근무하는 제이지는 지도에서 도시 이름을 검색하면 해당 도시와 관련된 맛집 게시물들을 데이터베이스에서 읽어 보여주는 서비스를 개발하고 있다. 이 프로그램의 테스팅 업무를 담당하고 있는 어피치는 서비스를…*school.programmers.co.kr](https://school.programmers.co.kr/learn/courses/30/lessons/17680)[](https://school.programmers.co.kr/learn/courses/30/lessons/17680)

### Solution

```
import java.util.LinkedList;

public class Cash {
    public int solution(int cacheSize, String[] cities) {
        int answer = 0;

        if(cacheSize == 0){
            answer = cities.length * 5;
            return answer;
        }
        LinkedList<String> cacheMemory = new LinkedList<>();
        for(String city : cities) {
            String processedCity = city.toLowerCase();

            //#1 cache hit
            if (cacheMemory.contains(processedCity)) {
                cacheMemory.remove(processedCity);
                cacheMemory.add(processedCity);
                answer++;
                continue;
            }
            //#2 cache miss
            if (cacheMemory.size() < cacheSize) {
                cacheMemory.add(processedCity);
            } else {
                cacheMemory.removeFirst();
                cacheMemory.add(processedCity);
            }
            answer += 5;
        }
        return answer;
    }

    public static void main(String[] args) {
        Cash cash = new Cash();
        System.out.println(cash.solution(3, new String[]{"Jeju", "Pangyo", "Seoul", "NewYork", "LA", "Jeju", "Pangyo", "Seoul", "NewYork", "LA"})); //50
        System.out.println(cash.solution(3, new String[]{"Jeju", "Pangyo", "Seoul", "Jeju", "Pangyo", "Seoul", "Jeju", "Pangyo", "Seoul"})); //21
        System.out.println(cash.solution(2, new String[]{"Jeju", "Pangyo", "Seoul", "NewYork", "LA", "SanFrancisco", "Seoul", "Rome", "Paris", "Jeju", "NewYork", "Rome"})); //60
        System.out.println(cash.solution(5, new String[]{"Jeju", "Pangyo", "Seoul", "NewYork", "LA", "SanFrancisco", "Seoul", "Rome", "Paris", "Jeju", "NewYork", "Rome"})); //52
        System.out.println(cash.solution(2, new String[]{"Jeju", "Pangyo", "NewYork", "newyork"})); //16
        System.out.println(cash.solution(0, new String[]{"Jeju", "Pangyo", "Seoul", "NewYork", "LA"})); //25
    }
}
```
