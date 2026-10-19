---
title: "github 커밋 히스토리에서 application.yml, application.yaml같은 중요파일 모두 삭제하기"
date: 2024-05-20
description: "개인 프로젝트를 진행하면서 git repository를 pirvate으로 두고 모든 파일을 push 했다."
source: medium
original: "https://medium.com/@sj.youns1027/github-%EC%BB%A4%EB%B0%8B-%ED%9E%88%EC%8A%A4%ED%86%A0%EB%A6%AC%EC%97%90%EC%84%9C-application-yml-application-yaml%EA%B0%99%EC%9D%80-%EC%A4%91%EC%9A%94%ED%8C%8C%EC%9D%BC-%EB%AA%A8%EB%91%90-%EC%82%AD%EC%A0%9C%ED%95%98%EA%B8%B0-979695003292"
---
## github 커밋 히스토리에서 application.yml, application.yaml같은 중요파일 모두 삭제하기

개인 프로젝트를 진행하면서 git repository를 pirvate으로 두고 모든 파일을 push 했다.

포트폴리오로 프로젝트를 제출하기 위해 repository를 public으로 변경하려고 하니 주요 키 값과 개인 정보가 남아있는 application.yml 파일을 삭제해야 했다.

파일 자체를 삭제하는 것은 간단하지만 문제는 **commit history에 기록이 남아있다는 것**.

![](/images/medium/979695003292/1.png)

이것을 해결한 과정을 기록하고자 한다.

### 1. .gitignore에 application.yml 파일을 추가하여 git 관리 대상에서 제외시킨다.

![](/images/medium/979695003292/2.png)

### 2. terminal에 아래 명령어를 입력한다.

```
git filter-branch -f --prune-empty --index-filter "git rm -r --cached --ignore-unmatch **/application.yml" HEAD
```

1. git filter-branch: Git 저장소의 전체 커밋 히스토리를 재작성하는데 사용. 특정 파일을 제거하거나 커밋 메시지를 변경하는 등의 작업에 사용될 수 있다.
2. -f(--force): 이미 filter-branch가 실행된 적있는 경우에도 명령어가 강제로 실행되도록 한다.
3. — prune-empty: 파일 변경 사항이 없는 커밋을 제거한다.
4. — index-filter: 작업 디렉터리를 확인하지 않고 스테이징 영역에서만 작업을 수행하게 한다.
5. “git rm -r — cached — ignore-unmatch **/application.yml”
- git rm: git에서 파일 제거할 때 사용
- — cached: 파일을 작업 디렉토리에서는 제거하지 않고 Git 인덱스(스테이징 영역)에서만 제거하는 데 사용. 즉, 파일은 로컬 디렉토리에 남아 있지만, Git은 더 이상 해당 파일의 변경 사항을 추적하지 않는다.
- — ignore-unmatch: 이리하는 파일이 없는 경우에도 에러를 반환하지 않도록 한다.
- **/application.yml: 모든 디렉토리의 `application.yml` 파일을 대상으로 한다.
6. HEAD: filter-branch가 적용될 커밋 범위를 지정한다. HEAD는 가장 최근의 커밋을 가리킨다. → 현재 branch의 전체 커밋 히스토리에 적용된다.

### 3. 명령어를 실행하면 rewrite이 완료되었다는 안내 문구가 나오고, git branch 상태가 변경된다.

![](/images/medium/979695003292/3.png)

![](/images/medium/979695003292/4.png)

![](/images/medium/979695003292/5.png)

### 4. terminal에 push 명령어 입력.

```
git push -u origin master --force
```

명령어를 입력하면 branch가 rewirte 되면서 hitory에 있는 모든 application.yml 파일이 삭제된다.

![](/images/medium/979695003292/6.png)

## [완료!!!!]

![](/images/medium/979695003292/7.png)

이제 repository를 public으로 바꾸면 된다.

[출처]

[https://shout-to-my-mae.tistory.com/335](https://shout-to-my-mae.tistory.com/335)
