---
title: "ArrayList 와 LinkedList의 차이"
date: 2024-05-21
description: "ArrayList 는 index가 있고 LinkedList는 각 원소마다 앞,뒤 원소의 위치값을 가지고 있다. 이에 따라 조회, 삽입, 삭제 시 성능의 차이가 발생한다."
source: medium
original: "https://medium.com/@sj.youns1027/arraylist-%EC%99%80-linkedlist%EC%9D%98-%EC%B0%A8%EC%9D%B4-8ea025326c3d"
---
![](/images/medium/8ea025326c3d/1.png)

**ArrayList** 는 index가 있고 **LinkedList**는 각 원소마다 앞,뒤 원소의 위치값을 가지고 있다. 이에 따라 조회, 삽입, 삭제 시 성능의 차이가 발생한다.

### **ArrayList**

기본적으로 배열을 사용. 일반 배열은 처음에 메모리를 할당할 때 크기를 지정해야 하지만 ArrayList는 **크기를 지정하지 않고 동적으로 값을 삽입하고 삭제**할 수 있다.

- **조회**: 각 데이터의 index를 가지고 있고, 무작위 접근이 가능하므로 O(1)의 시간 복잡도를 가진다.
- **삽입**·**삭제**: 삽입, 삭제 시 index 조정이 필요하므로 O(n)의 시간복잡도를 가진다.

### LinkedList

내부적으로 양방향의 연결 리스트로 구성되어 있어 참조하려는 원소에 따라 처음부터 정방향 또는 역순으로 순회가 가능하다.

- **조회: **순차적으로 접근하기 때문에 검색 속도가 느리다. O(n)의 시간 복잡도를 가진다.
- **삽입**·**삭제**: 가리키고 있는 주소값만 변경해주면 되기 때문에 ArrayList에 비해 효율적이다. O(1)의 시간복잡도를 가진다.

![](/images/medium/8ea025326c3d/2.png)

### [번외] Array와 ArrayList의 차이

![](/images/medium/8ea025326c3d/3.png)

출처:

[https://dev-coco.tistory.com/19](https://dev-coco.tistory.com/19)
