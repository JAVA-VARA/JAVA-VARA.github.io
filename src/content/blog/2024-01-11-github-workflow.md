---
title: ".github/workflow에 대하여"
date: 2024-01-11
description: "프로젝트 진행 시 지속적인 통합/배포를 위해 .github/workflow/cicd.yml를 아래와 같이 작성했다."
source: medium
original: "https://medium.com/@sj.youns1027/github-workflow%EC%97%90-%EB%8C%80%ED%95%98%EC%97%AC-e6ab62ea64e2"
theme: adoption
---
프로젝트 진행 시 지속적인 통합/배포를 위해 .github/workflow/cicd.yml를 아래와 같이 작성했다.

여러 문서를 참고하여 작성했으나 각 라인 별로 무슨 뜻인지, 어떤 역할을 하는지 더 자세하게 알아보고자 글을 작성한다.

### 내가 작성한 cicd.yml 전체 코드

```
name: CI/CD
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Java
        uses: actions/setup-java@v3
        with:
          distribution: 'corretto'
          java-version: '17'
      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
      - name: Build with Gradle
        run: ./gradlew clean build
      - name: Get current time
        uses: josStorer/get-current-time@v2.0.2
        id: current-time
        with:
          format: YYYY-MM-DDTHH-mm-ss
          utcOffset: "+09:00"
      - name: Set artifact
        run: echo "artifact=$(ls ./build/libs)" >> $GITHUB_ENV
      - name: Beanstalk Deploy
        uses: einaregilsson/beanstalk-deploy@v20
        with:
          aws_access_key: ${{secrets.AWS_ACCESS_KEY_ID}}
          aws_secret_key: ${{secrets.AWS_SECRET_ACCESS_KEY}}
          application_name: PandBproject
          environment_name: PandBproject-env
          version_label: github-action-${{steps.current-time.outputs.formattedTime}}
          region: ap-northeast-2
          deployment_package: ./build/libs/${{env.artifact}}
```

- 초기 setting

```
#workflow의 이름을 "CI/CD"로 설정.
name: CI/CD 

#main branches에 push 요청이 들어올 때 작업이 실행된다.
on:
  push:
    branches: [ main ]

#실행되는 작업은 최신 버전 ubuntu 환경에서 실행된다. 
jobs:
  build:
    runs-on: ubuntu-latest
```

### steps:

1. GitHub Marketplace에 등록된 checkout v4를 사용하여 현재 워크플로우가 속한 GitHub 리포지토리의 코드(내가 github에 업로드 했던 코드)를 자동으로 가져온다.

```
- uses: actions/checkout@v4
```

**2. 자바 설정:   
**GitHub Marketplace에 등록된 `setup-java` 액션 중 버전 3을 사용하여 자바 환경을 설정한다.

```
- name: Use Java
  uses: actions/setup-java@v3
  with:
    distribution: 'corretto'
    java-version: '17'
```

**3. 실행 권한 부여**

```
- name: Grant execute permission for gradlew
  run: chmod +x gradlew
```

gradlew(gradle wrapper)에 실행 권한을 부여한다.

- `chmod`: change mode의 약자, 파일의 권한을 변경하는 데 사용
- `x`: execute permssion의 약자  
(`r`: 읽기 권한, `w`: 쓰기 권한`x`: 실행 권한

- Gradle Wrapper를 사용하면 프로젝트에 Gradle을 설치하거나 미리 다운로드해 두지 않아도 되는 장점이 있다.

**4. gradle로 project를 build 한다.**

```
- name: Build with Gradle
  run: ./gradlew clean build
```

**5. 배포 시간 설정**  
josStorer/get-current-time@v2.0.2 를 이용해 배포가 진행되는 시간을 가져온다.

```
- name: Get current time
  uses: josStorer/get-current-time@v2.0.2
  id: current-time
  with:
    format: YYYY-MM-DDTHH-mm-ss
    utcOffset: "+09:00"
```

6. GIT HUB 환경 변수에 배포할 파일을 넣어준다.

```
- name: Set artifact
  run: echo "artifact=$(ls ./build/libs)" >> $GITHUB_ENV
```

빌드된 artifact의 이름을GitHub Actions Workflow에서 사용되는 환경 변수에 설정한다.

- `ls ./build/libs`는 `./build/libs` 디렉토리 내의 파일 목록을 나열하는 명령어
- Gradle 빌드 결과물 중에서 프로젝트에서 생성된 JAR 파일을 찾고 해당 경로를 출력
- `>>`는 출력을 파일에 추가하는 리다이렉션 연산자, 결과를 `$GITHUB_ENV`에 추가한다.
- artifact: 소프트웨어 개발에서 생성된 결과물을 나타내는 일반적인 용어. 빌드된 코드, 패키지, 배포 가능한 파일 등을 가리키는 데 사용된다.  
artifact이라는 용어를 사용하지 않고 아래와 같이 설정을 해도 문제는 없지만, 관례상 사용한다고 한다.

```
echo "$(ls ./build/libs)" >> $GITHUB_ENV 
```

7. 배포
- einaregilsson/beanstalk-deploy@v20를 사용하여 배포.
- Secret and variables의 actions에 있는 Repository secret에 추가되어 있는 값을 사용하여 AWS의 ACCESS KEY와 SECRET KEY는 GIT HUB SETTING함.
- application_name 과 environment_name 에는 내가 eb 생성 시 설정한 이름을 넣어준다.
- version_label: 배포 시간을 넣어준다.
- deployment_package: jar 파일이 있는 경로를 넣어준다.

```
- name: Beanstalk Deploy
  uses: einaregilsson/beanstalk-deploy@v20
  with:
    aws_access_key: ${{secrets.AWS_ACCESS_KEY_ID}}
    aws_secret_key: ${{secrets.AWS_SECRET_ACCESS_KEY}}
    application_name: PandBproject
    environment_name: PandBproject-env
    version_label: github-action-${{steps.current-time.outputs.formattedTime}}
    region: ap-northeast-2
    deployment_package: ./build/libs/${{env.artifact}}
```

이렇게 하면 내가 main branch에 push한 코드들이 자동으로 배포되어 적용된다.

끝!
