---
title: "Google Cloud Platform에서 Cloud Run Deploy 하기"
date: 2024-03-08
description: "Springboot porject를 Google Cloud Platform에 배포 하면서 알게된 내용과 그 과정들을 기록했다."
source: medium
original: "https://medium.com/@sj.youns1027/google-cloud-platform%EC%97%90%EC%84%9C-cloud-run-deploy-%ED%95%98%EA%B8%B0-564c0ffe0ade"
theme: adoption
---
## Google Cloud Platform에서 Cloud Run Deploy 하기

Springboot porject를 Google Cloud Platform에 배포 하면서 알게된 내용과 그 과정들을 기록했다.

## Google Cloud Platform 사용하는 이유

기존에 배포했었던 프로젝트에서 갑자기 과금이 되어 확인해보니 AWS에서 2024년 2월부터 public IPv4 주소 사용 시 시간 당 0.005USD 의요금을 부과하기로 한 것을 알게 되었다.

![](/images/medium/564c0ffe0ade/1.png)

*[https://aws.amazon.com/ko/blogs/korea/new-aws-public-ipv4-address-charge-public-ip-insights/](https://aws.amazon.com/ko/blogs/korea/new-aws-public-ipv4-address-charge-public-ip-insights/)*

IPv4대신 IPv6를 사용하면 여전히 무료로 사용할 수 있지만, free tier 기간도 끝나가고 있어 이참에 Google Cloud Platform을 사용해 보기로 했다.

## Google Cloud Platform의 Cloud Run Deploy

Cloud Run은 Google의 확장 가능한 인프라에서 직접 컨테이너를 실행할 수 있게 해 주는 관리형 컴퓨팅 플랫폼이다.

내 Source code가 작성된 root directory에 docker file을 작성하고, 터미널에 *docker gcloud run deploy *명령어만 실행하면 알아서 docker image를 build하여 google artifact repository에 push하고 push된 image로 배포를 진행한다.

Serverless이고, 코드 이외의 것들은 GCP에서 알아서 해주기 때문에 배포만 하면 되는 매우 편리한 서비스이다.

## Cloud Run Deploy의 Steps

1. Google Cloud SDK Shell 설치: 해당 파일을 설치해야 GCP 관련 명령어를 사용할 수 있다.
2. Google Cloud Platform Project 생성
3. Source Code 준비

![](/images/medium/564c0ffe0ade/2.png)

4. Dockerfile: source code의 root directory에 dockerfile을 작성

```
# 1. Gradle을 사용하여 Spring Boot application 빌드
FROM gradle:7.6-jdk-alpine as build
WORKDIR /app
COPY . .
#1-1. Gradle Wrapper 스크립트에 실행 권한을 부여
RUN chmod +x ./gradlew
RUN ./gradlew clean build -x test

# 2. 빌드된 JAR 파일을 실행할 amazoncorretto:17 이미지로 이동
FROM amazoncorretto:17-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# 3. Spring Boot 애플리케이션 실행을 위해 Docker 내부에서 포트 8080을 노출
EXPOSE 8080

# 4. Docker 컨테이너 시작 시 Spring Boot 애플리케이션 실행
CMD ["java", "-jar", "app.jar"]
```

5. coludbuild.yaml 파일 생성

```
steps:
  # Docker Build
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t',
           'asia-northeast3-docker.pkg.dev/football-project-416008/cloud-run-source-deploy/test',
           '.']

  # Docker Push
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push',
           'asia-northeast3-docker.pkg.dev/football-project-416008/cloud-run-source-deploy/test']

  # Entrypoint, timeout and environment variables
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    timeout: 240s
    args: ['compute', 'instances',
           'create-with-container', 'my-vm-name',
           '--container-image',
           'asia-northeast3-docker.pkg.dev/football-project-416008/cloud-run-source-deploy/test']
    env:
      - 'CLOUDSDK_COMPUTE_REGION=asia-northeast3'
      - 'CLOUDSDK_COMPUTE_ZONE=asia-northeast3-a'
```

6. 배포: source code가 저장되어 있는 dir에서 아래의 명령어 실행

```
#명령어 입력
$> gcloud run deploy

#소스코드가 저장되어 있는 위치 확인 => enter만 누르면 된다.
Source code location (C:\...소스코드가 저장된 위치 반환됨): 

#service name 설정
Service name (football-board):  test-1

#region 선택택
Please specify a region:
 [1] africa-south1
 ...
 [6] asia-northeast3
 ...
 [41] cancel

Please enter numeric choice or text value (must exactly match list item):  6
...
Building using Dockerfile and deploying container to Cloud Run service [test-1] in project [football-project-416008] region [asia-northeast3]
...
DONE.
Service URL: https://test-1-g75s2pffyq-du.a.run.app
```

BUILD, 배포에 성공하면 URL을 안내해준다.

## Trouble Shooting

### issue #1 : dockerfile 부재

dokcer 파일이 필요한 줄 모르고 배포를 했더니 error가 발생했다.

![](/images/medium/564c0ffe0ade/3.png)

```
[builder] Running "./gradlew clean assemble -x test --build-cache --quiet"
[builder] Done "./gradlew clean assemble -x test --build-cache --quiet" (416.503µs)
[builder] --------------------------------------------------------------------------------
[builder] failed to build: (error ID: 14f2a5b3):
[builder] executing command "./gradlew clean assemble -x test --build-cache --quiet": fork/exec ./gradlew: permission denied
```

**skaffold**라는 것을 이용하여 프로젝트가 빌드되었고, 빌드 과정에서 gradlew에게 실행권한을 주지 않아서 실패.

### solution #1

- **Dockerfile이 있는 경우**  
업로드된 소스 코드가 Dockerfile을 사용하여 빌드된다.

- **Dockerfile 없는 경우**  
1) Google Cloud 빌드팩이 사용 중인 언어를 자동 감지  
2) 코드의 종속 항목을 가져옴  
3) Google에서 관리하는 기본 이미지를 사용하여 컨테이너 이미지를 만듬

=> gradlew에 실행 권한을 주는 등 설정이 필요하므로 Dockerfile 작성법을 찾아 추가함.

```
FROM openjdk:17
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar
RUN chmod +x ./gradlew
ENTRYPOINT ["java","-jar","/app.jar"]
```

### issue #2 : ***copy failed: no source files were specified***

```
COPY ${JAR_FILE} app.jar
```

수정 후 배포를 했는데 *COPY ${JAR_FILE} app.jar *라인에서 복사할 file을 찾을 수 없다는 error가 발생했다.

**원인은 docker image를 build하기 전 프로젝트를 build하지 않아 build 파일 경로를 찾지 못해 발생하는 error였다.**

### solution #2–1:

가장 삽질을 오래하게 만든 부분이었는데, local에서 빌드된 *jar file이 있으면 경로를 찾을 수 있을 것이라고 오해했다. 그래서 배포전 gradle → tasks → build에서 app을 빌드해주었다.

![](/images/medium/564c0ffe0ade/4.png)

그러나 여전히 error가 해결되지 않았다.

### solution #2–2:

Dockerfile에 gradle을 이용하여 application을 빌드해주는 과정을 추가해주어야 함을 알게 되었다. Dockerfile에 build workflow 추가해주면서 전체적으로 dockerfile을 수정

```
# 1. Gradle을 사용하여 Spring Boot application 빌드
FROM gradle:7.6-jdk-alpine as build
WORKDIR /app
COPY . .
  #1-1. Gradle Wrapper 스크립트에 실행 권한을 부여
RUN chmod +x ./gradlew
RUN ./gradlew clean build -x test

# 2. 빌드된 JAR 파일을 openjdk:17로 실행
FROM openjdk:17
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# 4. Spring Boot 애플리케이션 실행을 위해 Docker 내부에서 포트 8080을 노출
EXPOSE 8080

# 5. Docker 컨테이너 시작 시 Spring Boot 애플리케이션 실행
CMD ["java", "-jar", "app.jar"]
```

=> #1 과정을 추가함으로써 build된 file을 찾아올 수 있었다.

### issue #3: **COPY — from=build /app/build/libs/*.jar app.jar**

**When using COPY with more than one source file, the destination must be a directory and end with a /**

build된 file이 있으나, 1개 이상의 file이 있어 COPY 시오류가 발생했다. Springboot gradle plugin 2.5 버전부터 별도의 설정을 하지 않으면, gradle 빌드 시 2개의 JAR 파일(*.jar, * -plain.jar)이 생성된다.

```
1. Plain Archive: 
application 실행에 필요한 모든 dㅢ존성을 포함하지 않고, 
작성된 소스코드의 클래스 파일 리소스 파일만 포함되어 있는 파일.

2. Execuatable Archive:
application 실행에 필요한 모든 의존성을 함께 빌드한다.
모든 의존성을 포함하기 때문에 "java -jar" 명령어를 통해 실행 가능하다.
```

### solution #3:

두개의 jar 파일이 생성되어 발생하는 error 이므로 빌드 시 plain jar 생성하지 않도록 설정해주었다. build.gradle 파일에 아래와 같이 jar 파일과 관련된 설정을 해주면 executable 파일만 생성된다.

```
plugins {
    ...
}

dependencies {
    ...
}

jar{
    enabled=false
}
```

### issue #4 :배포 오류

빌드까지 성공적으로 완료되었으나, 이번에는 배포 단계에서 error가 발생했다.

```
Ready condition status changed to False for Revision test-1-00001-w6s with message: 
The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable. 
Logs for this revision might contain more information.
```

```
"Default STARTUP TCP probe failed 1 time consecutively for container "test-1-1" on port 8080. The instance was not started."
```

### solution #4

1. [공식 문서](https://cloud.google.com/run/docs/troubleshooting?hl=ko#container-failed-to-start)를 찾아보니 위와 같은 경우로 배포에 실패한 경우, 컨테이너 이미지를 local에서 실행할 수 있는지 먼저 확인해보라고 한다.

=> Artifact Registry에 업로드 된 image pulling 하여 local에서 실행  
(Artifact Registry → Repository → image → pull)

```
2024-03-08 14:49:08 Error: LinkageError occurred while loading main class org.springframework.boot.loader.launch.JarLauncher
2024-03-08 14:49:08     java.lang.UnsupportedClassVersionError: org/springframework/boot/loader/launch/JarLauncher has been compiled by a more recent version of the Java Runtime (class file version 61.0), this version of the Java Runtime only recognizes class file versions up to 55.0
```

=> java version 문제로 local에서도 실행 되지 않는 것을 확인할 수 있었다.

=> local에서 사용하고 있는 java version과 build 시 사용하는 java version이 동일하지 않은 경우 error가 발생하는 것으로 확인

=>빌드된 JAR 파일을 실행할 java version을 local과 일치시켜주었다.

- local에서 사용 중인 java version

![](/images/medium/564c0ffe0ade/5.png)

- Dockerfile에 빌드된 JAR 파일을 amazoncorretto:17로 실행하는 것으로 변경

```
//생략

FROM amazoncorretto:17-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

//생략
```

## 배포 성공!

배포에 성공한 application을 아래와 같이 Cloud Run에서 확인할 수 있다.

![](/images/medium/564c0ffe0ade/6.png)

![](/images/medium/564c0ffe0ade/7.png)

출처:

[https://cloud.google.com/run/docs/troubleshooting?hl=ko#container-failed-to-start](https://cloud.google.com/run/docs/troubleshooting?hl=ko#container-failed-to-start)

[**소스 코드에서 배포 | Cloud Run 문서 | Google Cloud**  
*디지털 혁신을 이제 막 시작한 기업이든 이미 일정 수준에 도달한 기업이든 Google Cloud를 사용하면 가장 까다로운 도전과제를 해결할 수 있습니다.*cloud.google.com](https://cloud.google.com/run/docs/deploying-source-code?hl=ko)[](https://cloud.google.com/run/docs/deploying-source-code?hl=ko)[**[SpringBoot 2.5↑] 빌드 시 2가지 jar가 생성되는 현상 (executable jar & plain jar)**  
*들어가기 전에 기존에 쓰던 springboot 2.4.11 버전을 빌드할 때에는 문제가 없었지만, springboot 2.5 버전 이후를 사용하니 빌드 시 jar가 2개 생겨 github action을 통해…*earth-95.tistory.com](https://earth-95.tistory.com/132)[](https://earth-95.tistory.com/132)

[https://velog.io/@coastby/Docker-gradle%EB%A1%9C-%EB%B9%8C%EB%93%9C%ED%95%98%EC%97%AC-%EB%8F%84%EC%BB%A4%EB%A1%9C-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0](https://velog.io/@coastby/Docker-gradle%EB%A1%9C-%EB%B9%8C%EB%93%9C%ED%95%98%EC%97%AC-%EB%8F%84%EC%BB%A4%EB%A1%9C-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0)
