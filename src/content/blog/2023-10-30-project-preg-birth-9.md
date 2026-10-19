---
title: "Project_Preg&Birth #9"
date: 2023-10-30
description: "게시판 글 작성자, 작성일 추가/조회수 기능"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-9-a4a0d99ef8f1"
theme: adoption
---
### 게시판 글 작성자, 작성일 추가/조회수 기능

게시판에 글 작성 시 작성자가 자동으로 추가되는 기능과, 조회수 기능을 추가하였다.

![](/images/medium/a4a0d99ef8f1/1.png)

## 게시글 작성자/작성일 추가

[Controller]  
#**BoardApiController**

```
 @PostMapping("/api/articles") 
    public ResponseEntity<Board> addArticle(@RequestBody AddArticleRequest request, Principal principal){

        String email = principal.getName();
        Optional<User> user = userRepository.findByEmail(email);
        String author = user.get().getNickName();
        request.setAuthor(author);;

        Board savedArticle = boardService.save(request, principal.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
```

[Entity]  
**#Board :**annotation 추가  
**@EntityListeners(AuditingEntityListener.class):** Spring Data JPA에서 자동으로 시간을 매핑하여 데이터베이스의 테이블에 넣어준다. **@CreatedDateEntity**가 생성되어 저장될 때 시간이 자동 저장**@LastModifiedDate**조회한 Entity의 값을 변경할 때 시간이 자동 저장

```
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@EntityListeners(AuditingEntityListener.class)
@Entity(name = "board")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)

    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
```

### [Main]

#PregAndBirthDeveloperApplication: @EnableJpaAuditing 추가

```
@EnableJpaAuditing
@SpringBootApplication
public class PregAndBirthDeveloperApplication {
    public static void main(String[] args) {

        SpringApplication.run(PregAndBirthDeveloperApplication.class, args);
    }
```

## 조회 수

1. 게시글 list의 각 제목을 view-id를 설정
2. user가 제목을 누르는 event가 발생할 때마다 /api/articles/view/${id} 경로로 GET 요청을 보냄.
3. controller ~ repository를 거치며 서버에서 조회수 업데이트/저장 후 반환.

[Entity]  
**#Board : **update 메서드 추가

```
public void update(int views) {
        this.views = views;
    }
```

[Controller]  
**#BoardApiController**

```
 @GetMapping("/api/articles/view/{board_id}")
    public ResponseEntity<Board> updateView(@PathVariable long board_id){
        //VIEW를 REPOSITORY에서 가져온다
        Board board = boardService.findById(board_id);
        int view = board.getViews();
        //가져온 VIEW에 1을 더한다.
        view = view + 1;
        Board updateView = boardService.update(board_id, view);
        //업데이트된 값을 저장한다.
        return ResponseEntity.ok()
                .body(updateView);
    }
```

[Service]  
**#BoardService**

```
@RequiredArgsConstructor
@Service
public class BoardService {

//생략//

@Transactional
    public Board update(long boardId, int view){
        Board board = boardRepository.findById(boardId)
                .orElseThrow(()-> new IllegalArgumentException("not found:" + boardId));

        board.update(view);
        return board;
    }
```

[Repository]  
**#BoardRepository**

```
public interface BoardRepository extends JpaRepository<Board, Long> { 
 @Modifying
    @Query("update board b set b.views = b.views+1 where b.boardNo = :boardNo")
    int updateView(Long boardNo);
```

[view]

**#views.js**

```
// 조회수 기능
const viewLink = document.getElementById('view-btn');

if (viewLink) {
    viewLink.addEventListener('click', event => {
        let id = document.getElementById('view-id').value;

        httpRequest('GET',`/api/articles/view/${id}`);
    });
}
```

**#freeBoardList.html**

```
<body>
//생략
    <div class="container mt-5" >
        <table class="table">
            <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">제목</th>
                <th scope="col">작성자</th>
                <th scope="col">작성일</th>
                <th scope="col">조회수</th>
            </tr>
            </thead>

            <tbody>
            <tr th:each="item: ${articles}">
                <input type="hidden" id="view-id" th:value="${item.boardNo}">

                <td th:text="${item.boardNo}"></td>
                <td>
                    <a id="view-btn" th:href="@{/articles/{id}(id=${item.boardNo})}" th:text="${item.title}" target="blank" />
 @@ -47,15 +81,15 @@ <h1 class="mb-3">자유게시판</h1>
                <td th:text="${#temporals.format(item.createdAt, 'yyyy-MM-dd HH:mm')}"></td>
                <td th:text="${item.views}"></td>
            </tr>
            </tbody>
        </table>
    </div>

</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>

<script src="/js/views.js"></script>
<script src="/js/article.js"></script>
<script src="/js/token.js"></script>
</body>
```
