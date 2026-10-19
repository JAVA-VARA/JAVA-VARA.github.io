---
title: "Project_Preg&Birth #17"
date: 2024-01-11
description: "배포(feat. AWS)-3"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-1x-b81c193287d2"
theme: adoption
---
## [문제 상황]

### Error: EISDIR: illegal operation on a directory, read 발생

![](/images/medium/b81c193287d2/1.png)

### [가설]

디렉토리에 대한 잘못된 읽기 작업을 시도라니. elastic beanstalk의 nginx 설정 변경을 위해 .platform 디렉토리를 배포 시 추가해주었는데 문제가 발생한 것으로 추정.

### [해결]

# .github/workflows/cicd.yml 에 deployment package를 ZIP 파일로 만들어 달라는 명령어를 추가하여 ERROR를 해결했다.

-AS IS:

```
name: CI/CD

on:
  push:
    branches: [main]

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

      - name: Create deployment package
        run: |
          mkdir deployment-package
          cp build/libs/*.jar deployment-package/application.jar
          cp -r .platform deployment-package/.platform

      - name: Get current time
        uses: josStorer/get-current-time@v2.0.2
        id: current-time
        with:
          format: YYYY-MM-DDTHH-mm-ss
          utcOffset: "+09:00"

      - name: Set artifact
        run: echo "artifact=deployment-package/deployment-package.zip" >> $GITHUB_ENV

      - name: Beanstalk Deploy
        uses: einaregilsson/beanstalk-deploy@v20
        with:
          aws_access_key: ${{secrets.AWS_ACCESS_KEY_ID}}
          aws_secret_key: ${{secrets.AWS_SECRET_ACCESS_KEY}}
          application_name: PandBproject
          environment_name: PandBproject-env
          version_label: github-action-${{steps.current-time.outputs.formattedTime}}
          region: ap-northeast-2
          deployment_package: ${{env.artifact}}
```

- TO BE:

```
//생략
      - name: Create deployment package
        run: |
          mkdir deployment-package
          cp build/libs/*.jar deployment-package/application.jar
          cp -r .platform deployment-package/.platform
          cd deployment-package && zip -r deployment-package.zip .
//생략
```

찾아보니 AWS Elastic Beanstalk은 배포할 때 ZIP 파일을 받아서 내부적으로 압축을 풀고 필요한 작업을 수행한다고 한다. 따라서 내가 그냥 업로드 했던 파일을 EB가 인식할 수 없어서 발생했던 문제였다.
