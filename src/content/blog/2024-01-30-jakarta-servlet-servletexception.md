---
title: "jakarta.servlet.ServletException:"
date: 2024-01-30
description: "이미지 리사이징 기능 추가 후 TEST 진행 중에 아래와 같은 에러를 만났다."
source: medium
original: "https://medium.com/@sj.youns1027/jakarta-servlet-servletexception-c20699ea6f44"
---
## jakarta.servlet.ServletException: Handler dispatch failed: java.lang.OutOfMemoryError: Java heap space

이미지 리사이징 기능 추가 후 TEST 진행 중에 아래와 같은 에러를 만났다.

![](/images/medium/c20699ea6f44/1.png)

![](/images/medium/c20699ea6f44/2.png)

![](/images/medium/c20699ea6f44/3.png)

## OutOfMemoryError!

이미지 리사이징 기능 메서드를 추가해둔 곳에서 break가 걸렸는데, test 중에 내가 사용하는 메모리가 얼마인지 먼저 확인해보기 위해 아래 코드를 추가해 주었다.

```
Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - runtime.freeMemory();

        System.out.println("Max Memory:" + runtime.maxMemory());
        System.out.println("Total Memory:" + totalMemory);
        System.out.println("Free Memory:" + freeMemory);
        System.out.println("Used Memory:" +usedMemory);
```

### #1 image resizing 안했을 때

Break가 걸리는 이미지 리사이징 메서드 부분을 제외하고 test를 돌려 사용되는 메모리 양을 확인했다.

```
Max Memory:536,870,912
Total Memory:115,343,360
Free Memory:55,594,288
Used Memory:59,749,072
```

내 JVM의 Max Heap memory는 약 537MB이고, TEST를 하면약 60MB의 메모리가 사용된다. (따로 설정을 해주지 않으면 default값으로 537MB가 설정되는 듯 하다.)

이미지 리사이징을 하면서 Max Heap Size가 초과된다는 이야기인데…일단test 시 사용할 수 있는 Max heap size를 늘려주었다.

- **build.gradle**

maxHeapSize를 2GB로 늘려주었다.

```
//상단 생략

test {
    useJUnitPlatform()
    // maximum heap size
    maxHeapSize = "2g" 
}
```

### #2 image resizing 했을 때

maxHeapSize를 늘려준 후 test 진행 시 error 없이 모든 test가 통과하는 것을 확인했다.

![](/images/medium/c20699ea6f44/4.png)

그리고 아까 추가해둔 코드로 이미지 리사이징까지 진행했을 때 사용되는 메모리 용량을 확인할 수 있었는데 600MB 이상이 사용되었다.

```
Max Memory:2,147,483,648
Total Memory:739,246,080
Free Memory:122,252,840
Used Memory:616,993,240
```

Heap Space 용량의 default값이 537MB였는데, test를 진행할 때 600MB이상이 사용되어 Out Of Memeory Error가 발생했던 것이었다.

끝
