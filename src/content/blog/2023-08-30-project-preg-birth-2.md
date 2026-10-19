---
title: "Project_Preg&Birth #2"
date: 2023-08-30
description: "프로젝트 생성/스토리보드 구상"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-2-7594319b0ad4"
---
### 프로젝트 생성/스토리보드 구상

## 프로젝트 생성

### - 언어

- Front-End: JavaScript, HTML
- Back-End: Java

### - 프레임워크

- Springboot

### - DB

- MySQL

### - IDE

- IntelliJ

### Build System

소스 코드를 이용해서 실행 가능한 애플리케이션을 생성하는 과정을 자동화하는 프로그램. 이 과정에는 의존성 내려받기, 코드 패키징, 컴파일, 테스트 실행 등이 포함되어 있다.

- **Gradle**: 아래와 같은 이유로 Gradle을 선택하였다.
1. 메이븐에 비해 가독성이 좋고 설정이 간단하다.
2. 빌드와 테스트 속도가 Maven에 비해 더 빠르다.

![](/images/medium/7594319b0ad4/1.png)

[review]

- IntelliJ: IntelliJ의 자체 빌드 메커니즘으로 단순하게 프로젝트의 모든 수정 내용과 종속 파일을 컴파일하는 기능.   
Maven과 Gradle과 달리 순수하게 빌드만 수행하기 때문에 아티팩트 생성, 리포지토리 배포, CodeGen과 같은 다른 작업을 수행하지 않는다.

### spring-boot-starter

의존성이 모여 있는 그룹으로 스타터를 사용하면 필요한 기능을 간편하게 설정 가능하다.

- 명명 규칙: spring-boot-starter-{작업유형}

아래와 같이 에 필요한 애플리케이션에 대한 의존성을 추가하였다.

### - build.gradle

```
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.2'
    id 'io.spring.dependency-management' version '1.1.0'
}

group = 'sjspring.shop'
version = '1.0-SNAPSHOT'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    //spring-boot-starter
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'

    //jpa
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    //인메모리 데이터베이스
    runtimeOnly 'com.h2database:h2'

    //롬복
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

test {
    useJUnitPlatform()
}
```

### - PregAndBirthDeveloperApplication.java

@SpringBootApplicatio을 불러와 pringboot을 실행할 준비.

```
package sjspring.shop.pregAndBirthDeveloper;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PregAndBirthDeveloperApplication {
    public static void main(String[] args) {

        SpringApplication.run(PregAndBirthDeveloperApplication.class, args);
    }
}
```

### 스토리보드 구상_draft #1

[**OvenApp.io**  
*Oven(오븐)은 HTML5 기반의 무료 웹/앱 프로토타이핑 툴입니다. (카카오 제공)*ovenapp.io](https://ovenapp.io/)[](https://ovenapp.io/)

오븐 앱 프로토타이핑 툴을 이용하여 아래와 같이 스토리 보드를 구상해보았다. 앞으로 하나씩 기능을 구현할 예정.

![](/images/medium/7594319b0ad4/2.jpeg)

![](/images/medium/7594319b0ad4/3.jpeg)

![](/images/medium/7594319b0ad4/4.jpeg)

![](/images/medium/7594319b0ad4/5.jpeg)

![](/images/medium/7594319b0ad4/6.jpeg)

![](/images/medium/7594319b0ad4/7.jpeg)

![](/images/medium/7594319b0ad4/8.jpeg)

![](/images/medium/7594319b0ad4/9.jpeg)

![](/images/medium/7594319b0ad4/10.jpeg)

![](/images/medium/7594319b0ad4/11.jpeg)

![](/images/medium/7594319b0ad4/12.jpeg)

![](/images/medium/7594319b0ad4/13.jpeg)

![](/images/medium/7594319b0ad4/14.jpeg)

![](/images/medium/7594319b0ad4/15.jpeg)

![](/images/medium/7594319b0ad4/16.jpeg)
