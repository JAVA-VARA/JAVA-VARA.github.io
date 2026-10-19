---
title: "Java_compile"
date: 2023-06-22
description: "Compile"
source: medium
original: "https://medium.com/@sj.youns1027/java-67bf3b260179"
theme: learned
---
**컴파일**은 **인간이 이해할 수 있는 언어로 작성된 소스 코드**(고수준 언어 : C, C++, Java 등)를 **CPU가 이해할 수 있는 언어**(저수준 언어 : 기계어)로 **번역(변환)하는 작업**

(출처:[https://beginnersbook.com/2013/05/jvm/](https://beginnersbook.com/2013/05/jvm/))

## Java Virtual Machin(JVM)

![](/images/medium/67bf3b260179/1.png)

*출처:[https://www.scientecheasy.com/2021/03/what-is-jvm.html/](https://www.scientecheasy.com/2021/03/what-is-jvm.html/)*

![](/images/medium/67bf3b260179/2.png)

*출처:[https://aboullaite.me/understanding-jit-compiler-just-in-time-compiler/](https://aboullaite.me/understanding-jit-compiler-just-in-time-compiler/)*

Java source가 .class와 같은 Byteocde로 compile되고, 변환된 코드는 JIT(Just In Time) Compiler로 다시 변환되어 Native code가 되어 OS가 명령을 수행할 수 있게 해준다.
