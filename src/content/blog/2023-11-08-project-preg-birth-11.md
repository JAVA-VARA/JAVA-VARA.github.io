---
title: "Project_Preg&Birth #11"
date: 2023-11-08
description: "게시글 조회수 기능 수정"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-11-a910714e1ac4"
---
### 게시글 조회수 기능 수정

조회수가 마지막으로 등록된 글만 업데이트 되는 문제가 있음을 발견하여 전체적인 로직을 아래와 같이 수정했다.

```
#BoardApiController:조회수 기능 삭제(BoardViewController에 기능 병합)
#BoardViewController: 조회수 증가 기능 추가
#BoardService
- updateView 메서드 수정: 조회수 기능 메서드명변경
#view.js 삭제: 조회수 기능 로직 변경
(before: 제목 '클릭 이벤트' 발생 시 조회 수 증가
after: 클릭한 글로 url 이동시 조회 수 증가 )
```

## #View

## freeBoardList.html

```
<tr  th:each="boardList : ${boardPage}">
  <input type="hidden" id="view-id" th:value="${boardList.boardNo}">

  <td th:text="${boardList.boardNo}"></td>
  <td>
      <a id="view-btn" th:href="@{/articles/{id}(id=${boardList.boardNo})}" th:text="${boardList.title}" target="blank" />
  </td>
  <td th:text="${boardList.author}"></td>
  <td th:text="${#temporals.format(boardList.createdAt, 'yyyy-MM-dd HH:mm')}"></td>
  <td th:text="${boardList.views}"></td>
</tr>
```

=> error 를 발생시킨 구문

```
<td>
      <a 
          id="view-btn" 
          th:href="@{/articles/{id}(id=${boardList.boardNo})}" 
          th:text="${boardList.title}" target="blank" />
</td>
```

id는 하나의 속성에만 지정이 가능한데, thymleaf로 boardList를 생성하게 되면서 하나의 id 값이 생성되는 글 목록에 지정되었다. 따라서 맨 마지막에 지정된 글 목록에 id 값이 지정되고, 나머지 목록에 지정된 id는 기능을 할 수 없게되어, 맨 마지막에 등록된 글만 조회수 기능이 작동했던 것이었다.

### freeBoardList.html

```
<tr  th:each="boardList : ${boardPage}">
  <td th:text="${boardList.boardNo}"></td>
  <td>
      <a id="view-btn"
         th:class="${boardList.boardNo}"
         th:href="@{/articles/{id}(id=${boardList.boardNo})}"
         th:text="${boardList.title}" target="blank" />
  </td>

   //생략

  <td th:text="${boardList.views}"></td>
</tr>
```

### view.js

```
const viewLink = document.getElementById('view-btn');
if (viewLink) {
    viewLink.addEventListener('click', event => {
        let id = document.getElementById('view-id').value;
        httpRequest('GET',`/api/articles/view/${id}`);
    });
}
```

=> js 전체 삭제

## #Controller

### BoardApiController

```
@GetMapping("/api/articles/view/{board_id}")
    public ResponseEntity<Board> updateView(@PathVariable long board_id){

        //VIEW를 REPOSITORY에서 가져온다
        Board board = boardService.findById(board_id);
        int view = board.getViews();
        //가져온 VIEW에 1을 더한다.
        view = view + 1;

        //업데이트된 값을 저장한다.
        Board updateView = boardService.update(board_id, view);

        //업데이트된 값을 return
        return ResponseEntity.ok()
                .body(updateView);
    }
```

=> updateveView 로직 삭제

### BoardViewController

```
//조회수 기능 추가
    @GetMapping("/articles/{board_no}")
    public String getArticle(@PathVariable Long board_no, Model model){
        Board board = boardService.findById(board_no);
        model.addAttribute("board", new ArticleViewResponse(board));

        int view = board.getViews(); //현재 조회수 가져옴
        view = view + 1; //클릭시마다 조회수 1 증가
        boardService.updateView(board_no, view); //업데이트된 조회수 저장.



        return "freeBoard";
    }
```

=> 서버에서 글 제목 클릭 시 조회수가 증가하는 event를 삭제하고, GetMapping으로 글을 불러올 때마다 조회수가 증가하도록 로직을 변경했다.

위와 같이 변경을 하면서 두 가지 문제점을 해결할 수 있었다.

1. 마지막으로 등록된 글만 조회수가 증가하는 문제
2. 다른 서버에서 링크를 타고 글을 읽는 경우, 내 서버에서 제목을 클릭하지 않았으므로, 글을 조회하였으나 조회수가 증가하지 않는 문제
