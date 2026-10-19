---
title: "Project_Preg&Birth #3"
date: 2023-08-31
description: "게시판 CRUD 기본 기능 구현"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-3-c4f86d3d1694"
---
### 게시판 CRUD 기본 기능 구현

## 2023–08–31 프로젝트 진행 현황

#1 Github와 연동 및 업데이트  
#2 게시판에 기본 CRUD 기능 구현  
#3 자유게시판 화면 구성 진행

## #1 Github와 연동 및 업데이트

Github에 새로운 repository를 생성하여 프로젝트를 저장하였다. 프로젝트에 대한 자세한 진행 현황은 앞으로 github를 통해 업데이트할 예정이다.

[**GitHub - JAVA-VARA/PandB_Project**  
*Contribute to JAVA-VARA/PandB_Project development by creating an account on GitHub.*github.com](https://github.com/JAVA-VARA/PandB_Project)[](https://github.com/JAVA-VARA/PandB_Project)

### [Github 연동 시 발생한 error]

깃허브 연동 후 commit and push를 진행하였으나 아래와 같은 error 발생

> “fatal: Could not read from remote repository. Please make sure you have the correct access rights and the repository exists.”

다시 연동을 시도했으나, 이번에는 아래의 error가 발생

> Git Remote origin already exists ~~

아래 명령어를 통해 현재 나의 project와 연결된 repository를 확인했고 이전에 공부하면서 연동해두었던 다른 repository와 연결되어 있었던 것을 확인할 수 있었다.

```
git remote -v
```

### Solution

1. **git remote remove origin** 명령어를 입력하여 기존에 연결되어 있는 원격 저장소와의 연결을 끊어준다.
2. **git remote add origin [새롭게 연결할 Git repository주소]** 입력

## #2 게시판에 기본 CRUD 기능 구현

기본적인 Create, Read, Update, Delete 기능을 구현했다. 자세한 사항은 github에 업데이트 하였다.

## #3 자유게시판 화면 구성 진행

현재까지 화면 구성만 진행되었고, 추가적으로 아래의 기능을 구현할 계획이다.

- 게시글의 제목을 클릭 시 내용을 확인할 수 있는 기능
- 게시글 클릭 시 조회수 업데이트 기능
- 내가 쓴 글을 클릭하면 수정/삭제 버튼이 보이도록.

![](/images/medium/c4f86d3d1694/1.png)
