---
title: "Football-Quiz-Project"
date: 2024-06-07
description: "성능테스트-4"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-f5dba57466b9"
theme: performance
---
### Redis를 이용해 Cache를 적용해보았으니 이제 다시 성능(N**umber of user수 변화에 따른 Response time**)을 테스트해보자!

## 테스트 진행

테스트는 초기에 했던 것과 동일하게 진행했고, 지속적으로 요청을 보냈을 때도 안정적으로 서버가 운영되는지 확인하기 위해 Loop Count만 infinite로 설정을 변경했다.

1) 10초 동안 100개의 요청 (10 req/s)  
2) 5초 동안 100개의 요청 (20 req/s)  
3) 1초 동안 100개의 요청 (100 req/s)  
4)1초 동안 1000개의 요청(1000 req/s)

## 10초 동안 100개의 요청 (10 req/s)

![](/images/medium/f5dba57466b9/1.png)

![](/images/medium/f5dba57466b9/2.png)

![](/images/medium/f5dba57466b9/3.png)

## 5초 동안 100개의 요청 (20 req/s)

![](/images/medium/f5dba57466b9/4.png)

![](/images/medium/f5dba57466b9/5.png)

*Summary Report*

![](/images/medium/f5dba57466b9/6.png)

## 1초 동안 100개의 요청 (100 req/s)

![](/images/medium/f5dba57466b9/7.png)

![](/images/medium/f5dba57466b9/8.png)

*Summary Report*

![](/images/medium/f5dba57466b9/9.png)

## 1초 동안 1000개의 요청(1000 req/s)

![](/images/medium/f5dba57466b9/10.png)

![](/images/medium/f5dba57466b9/11.png)

*Summary Report*

![](/images/medium/f5dba57466b9/12.png)

## 결과

캐시를 사용하면서 성능이 확연하게 개선되었다. 테스트 1번과 2번에서는 응답 시간이 0.5초 이내로, 테스트 3번과 4번에서는 최대 3초 이내로 안정적으로 응답하였습니다. 이를 통해 요청 수에 따라 약 70~97%까지 성능이 향상되었음을 확인할 수 있었다.

![](/images/medium/f5dba57466b9/13.png)

## error!!

초당 처리량이 늘어나다 보니 보낸 요청 중 0.3~3% 에서 이전에 보지 못했던 에러가 발생했다.(하지만 빨랐죠?) 다음 글은 아래의 에러를 해결하는 과정에 대해 기록할 것이다.

![](/images/medium/f5dba57466b9/14.png)
