---
title: "GitHub Pages에 Chirpy 테마 블로그 배포기: 삽질&해결 기록" # 글의 제목
date: 2025-07-01 11:30:00 +0900 # 글 작성 날짜 및 시간 (현재 시각으로 정확하게)
categories: [회고, 블로그, GitHub] # 글의 카테고리 (자유롭게 설정)
tags: [Jekyll, GitHub Pages, 배포, 오류 해결] # 글의 태그 (자유롭게 설정)
---

## 1. 블로그 배포


## 2. GitHub Pages에 Jekyll 테마 배포 과정
### 2.1. 저장소 생성 및 테마 포크 (초기 설정)
* `jekyll-theme-chirpy` 테마를 포크하고 repository 이름을 `JAVA-VARA.github.io`(내 github ID)로 변경

### 2.2. 로컬 개발 환경 구축 (Ruby, Jekyll, Bundler)

* Ruby 및 Jekyll 설치 과정 (`gem install jekyll bundler`)
* 로컬 저장소 클론 (`git clone ...`)
* `bundle install`을 통한 의존성 설치 (`bundle install` 명령어 실행 위치 포함)

### 2.3. Chirpy 테마 `_config.yml` 설정

* `_config.yml` 파일에서 `url`, `baseurl`, `timezone`, `lang` 등 주요 설정 변경 과정
* 로컬에서 `bundle exec jekyll serve`로 확인했던 과정

## 3. 발생했던 오류와 해결 과정

이 부분이 가장 중요하고, 다른 사람들에게 도움이 될 내용입니다. 발생했던 오류들을 시간순으로 나열하고, 각 오류의 원인과 해결 방법을 상세히 기록합니다.

### 3.1. 오류 1: GitHub Pages 접속 시 빈 페이지와 이상한 텍스트 (`--- layout: home # Index page ---`)

* **발생 상황**: `https://java-vara.github.io` 접속 시 `--- layout: home # Index page ---`만 보였음.
* **원인 파악**:
  * GitHub Actions 워크플로우가 실행되지 않음.
  * GitHub Pages Source 설정이 `GitHub Actions`로 변경되지 않았거나, `.github/workflows/pages-deploy.yml` 파일이 올바른 위치에 없었음.
* **해결 방법**:
  1.  GitHub 저장소 `Settings` -> `Pages`에서 `Source`를 `GitHub Actions`로 변경.
  2.  `.github/workflows/pages-deploy.yml` 파일이 `starter` 하위 디렉토리에 있었던 것을 `.github/workflows/` 바로 아래로 이동.
  3.  파일 이동 후 `git add .`, `git commit`, `git push` 실행.

### 3.2. 오류 2: `git commit` 시 `subject may not be empty` / `type may not be empty` 에러

* **발생 상황**: `git commit -m "feat:test"`와 같이 커밋 메시지를 작성했을 때 에러 발생.
* **원인 파악**: Chirpy 테마에 설정된 `Commitlint`(`husky`를 통해 실행)가 컨벤셔널 커밋 규칙을 강제하기 때문. `: ` 뒤에 공백 및 `subject`가 필요함.
* **해결 방법**: 컨벤셔널 커밋 규칙에 맞춰 `git commit -m "feat: Add initial blog post and configure settings"` 와 같이 **`type: subject` 형식**으로 정확히 작성.

### 3.3. 오류 3: GitHub Actions 빌드 실패 - `Can't find stylesheet to import`

* **발생 상황**: `pages-deploy.yml` 워크플로우 실행 후 `Build with Jekyll` 단계에서 스타일시트를 찾을 수 없다는 에러 발생.
* **원인 파악**: Chirpy 테마는 Node.js 기반의 프론트엔드 자산 빌드가 선행되어야 하는데, 워크플로우에 해당 단계가 누락되었음.
* **해결 방법**:
  `pages-deploy.yml` 파일에 `Setup Node`와 `Build Assets` ( `npm install && npm run build` ) 단계를 `Setup Ruby` 뒤, `Build site` 전에 추가.
    ```yaml
    # pages-deploy.yml 파일 내에서
    - name: Setup Ruby
      # ...
    - name: Setup Node # 이 부분 추가
      uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Build Assets # 이 부분 추가
      run: npm install && npm run build
    - name: Build site # 기존 빌드 단계
      # ...
    ```
  이후 다시 `git add .`, `git commit`, `git push` 실행.

## 4. 마무리하며

* 성공적인 배포 소감과 앞으로의 다짐을 작성합니다.
* 이 경험을 통해 무엇을 배웠는지 (오류 로그 분석의 중요성, 공식 문서 참고의 중요성 등) 정리합니다.
* 블로그를 통해 어떤 내용을 공유하고 싶은지 등 앞으로의 계획을 밝힙니다.
