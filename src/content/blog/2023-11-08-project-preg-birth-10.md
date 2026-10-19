---
title: "Project_Preg&Birth #10"
date: 2023-11-08
description: "게시판 카테고리 선택 기능"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-10-352d1b290abd"
---
### 게시판 카테고리 선택 기능

## [명세]

1. category table — board table join  
2. category 입력하면 db에 저장되도록 설정

## Commit Message

```
[Category 선택 기능 및 view 개선]
<dto>
1. AddArticleRequest
- 필드 추가
String category: client에서 전달받은 요청 전달
BoardCategory BoardCategory: categoryService에서 전달 받은 값을 controller에 전달

-mappingBoard 메서드 추가
게시글을 카테고리에 추가하는 메소드. 이를 통해 양방향 참조를 설정.


<Entity>
Board: category 항목 추가 및 category entity와 join.(ManyToOne)
BoardCategory: 카테고리 entity 추가 및 Board entity와 join(OneToMany)

<Controller>
BoardApiController:
- UserService, CategoryService 필드 추가
- request(DTO)에 service에서 불러온 BoardCategory값 저장 후 entity에 추가

BoardViewController:
homepage 메서드 추가(홈페이지 화면 추가)

<Service>
CategoryService: categoryName으로 category 항목 db에 저장 후 BoardCategory 클래스 반환

<Repository>
BoardCategoryRepository 추가
BoardRepository에 findByCategory메서드 추가
```

## [Entity]

**#Board:** BoardCategory 필드 추가

```
//생략
    @ManyToOne(fetch =  FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "board_category_id")
    private BoardCategory category;

    @Builder
    public Board(String title, String content, String author, int views, String email, BoardCategory category){
        this.title = title;
        this.content = content;
        this.author = author;
        this.views = views;
        this.email = email;
        this.category = category;
    }
//생략
```

**#BoardCategory:** BoardCategory entity 추가

```
public class BoardCategory {

    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long id;

    @Column(unique = true)
    private String categoryName;

    @OneToMany(mappedBy = "category", cascade = CascadeType.PERSIST)
    private List<Board> boardList = new ArrayList<>();

    public void mappingBoard(Board board){
        if (this.boardList == null) {
            this.boardList = new ArrayList<>();
        }
        this.boardList.add(board);
    }
}
```

## [dto]

#AddArticleRequest

```
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AddArticleRequest {
    private String title;
    private String content;
    private String author;
    private String category;
    private BoardCategory boardCategory;
    private int views;

    public Board toEntity(String username){
        Board board =  Board.builder()
                .title(title)
                .content(content)
                .views(views)
                .author(author)
                .email(username)
                .category(boardCategory)
                .build();

        boardCategory.mappingBoard(board);
        return board;
    }
}
```

## [Repository]

#BoardCategoryRepository

```
@Repository
public interface BoardCategoryRepository extends JpaRepository<BoardCategory, Long> {

    BoardCategory findByCategoryName(String categoryName);

}
```

## [Service]

**#CategoryService**

```
@RequiredArgsConstructor
@Service
public class CategoryService {
    private final BoardCategoryRepository boardCategoryRepository;

    public BoardCategory save(String categoryName) {

        BoardCategory newCategory = BoardCategory.builder()
                .categoryName(categoryName)
                .build();

        boardCategoryRepository.save(newCategory);
        return boardCategoryRepository.findByCategoryName(categoryName);

    }
}
```

### [view]

**#article.js:** 카테고리 생성/수정 기능 추가

```
if (modifyButton) {
    //생략//
        body = JSON.stringify({
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
            categoryName: document.getElementById('categoryName').value //추가
        })

        function success() {
if (createButton) {
    //생략//
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
            category: document.getElementById('category').value //추
        });
        //생략//
```

**#hompage.html: **카테고리에 해당하는 게시판으로 이동하는 기능 추가

```
//생략
<ul class="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
  <li><a href="/homePage" class="nav-link px-2 text-secondary">Home</a></li>
  <li><a href="/articles" class="nav-link px-2 text-white">자유게시판</a></li>
  <li><a href="#" class="nav-link px-2 text-white">정보공유게시판</a></li>
  <li><a href="#" class="nav-link px-2 text-white">갤러리</a></li>
  <li><a href="#" class="nav-link px-2 text-white">Hot 게시판</a></li>
  <li><a href="#" class="nav-link px-2 text-white">공지</a></li>
</ul>
//생략

              
```

**#newArticle.html:** 카테고리 선택 버튼 추가

```
  <article>
      <input type="hidden" id="article-id" th:value="${article.boardNo}">

      <header class="m-20">

          <select class="form-select" aria-label="select category" id="category">
              <option selected value="">카테고리를 선택해주세요</option>
              <option value="자유 게시판">자유 게시판</option>
              <option value="정보 공유 게시판">정보 공유 게시판</option>
              <option value="갤러리">갤러리</option>
              <option value="추천 사이트">추천 사이트</option>
          </select>

          <input type="text" class="form-control" placeholder="제목" id="title" th:value="${article.title}">
      </header>
      <section class="mb-5">
```

## [ERROR Message]

TABLE JOIN이후 서버 실행을 하니 아래와 같은 에러가 발생했다.

```
Failure while trying to resolve exception [org.springframework.http.converter.HttpMessageNotWritableException]
Could not write JSON: Infinite recursion (StackOverflowError)] with root cause

java.lang.StackOverflowError: null
```

=>부모-자식 엔티티 간의 양방향 관계에서 @OneToMany를 사용하면, REST API로 ENTITY를 리턴할 때 순환 참조(Circular Reference)문제가 발생할 수 있다고 한다.

이 문제는 JSON 직렬화 시 무한 루프를 일으키며, 결국 StackOverflowError*가 발생하게 됩니다.

```
Board를 responseEntity로 전달하려면 시스템 내부에서다음과 같은 순서로 실행된다.

1. JAP Repository에서 BoardCategory를 Select Query로 로딩하고 
   BoardCategory Entity 객체를 생성한다.

2. Json Lib에서 BoardCategory Serialize를 시도 => @OneToMany를 발견
3. BoardCategory의 컬럼과 join된 Query를 Board 테이블에 실행한다.
4. 3에서 실행한 Board데이터를 객체로 변환한다.
5. 4의 객체를 Json Serialize한다. => ManyToOne 발견하게 된다.
6. List<Board>의 각각의 객체가 boardCategory를 참조하는 BoardCategory를 조회하는 Query를 실행한다.
7. 6의 BoardCategory에서 ektl @OneToMany에 대한 Query 실행
8. 무한 반복...
=>StackOverflowError 발생
```

### StackOverflowError

메서드 호출하면 호출 stack에 새로운 stack frame 이 생성된다. JVM에서 stack frame을 새롭게 생성할 공간이 없는 경우 error 가 발생하게 된다.

- 종료되지 않는 무한 재귀.
- 클래스 간 순환 관계를 갖도록 설정했을 때, 생성자가 반복적으로 호출되는 경우.

**#BoardCategory Entity**

```
//생략
    @OneToMany(mappedBy = "category", cascade = CascadeType.PERSIST)
    @JsonManagedReference //포워드 방향 참조를 관리
    private List<Board> boardList = new ArrayList<>();
//생략
```

**#Board Entity**

```
//생략
    @ManyToOne(fetch =  FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "board_category_id")
    @JsonBackReference //역방향 참조를 관리
    private BoardCategory category;
//생략
```

=> Jackson 라이브러리의 @JsonManagedReference 및 @JsonBackReference 어노테이션을 사용하여 직렬화 문제를 해결할 수 있었다.

## [table join 관련 annotation 정리]

![](/images/medium/352d1b290abd/1.png)

*[https://velog.io/@goniieee/JPA-OneToMany-ManyToOne%EC%9C%BC%EB%A1%9C-%EC%97%B0%EA%B4%80%EA%B4%80%EA%B3%84-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0](https://velog.io/@goniieee/JPA-OneToMany-ManyToOne%EC%9C%BC%EB%A1%9C-%EC%97%B0%EA%B4%80%EA%B4%80%EA%B3%84-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0)*

### 다양한 연관 관계

entity 들은 서로 다양한 연관 관계를 맺을 수 있다.

![](/images/medium/352d1b290abd/2.png)

*[https://velog.io/@goniieee/JPA-OneToMany-ManyToOne%EC%9C%BC%EB%A1%9C-%EC%97%B0%EA%B4%80%EA%B4%80%EA%B3%84-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0](https://velog.io/@goniieee/JPA-OneToMany-ManyToOne%EC%9C%BC%EB%A1%9C-%EC%97%B0%EA%B4%80%EA%B4%80%EA%B3%84-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0)*

이 중 가장 많이 사용되는 1:N, N:1 관계에 대해 정리를 하고자 한다.

### 양방향과 단방향 연관관계

`**@OneToMany**` 기준  
- 단방향(unidirectional): 상대 엔티티에 `@ManyToOne`이 없는 경우  
- 양방향(bidirectional): 상대 엔티티에 `@ManyToOne`이 있는 경우

`**@ManyToOne**` 기준으로 설명드리자면,  
- 단방향(unidirectional): 상대 엔티티에 `@OneToMany`가 없는 경우  
- 양방향(bidirectional): 상대 엔티티에 `@OneToMany`가 있는 경우

단뱡향이든 양방향이든 `@OneToMany` 어노테이션을 달고 있는 엔티티가 부모 엔티티가 된다. 즉,** FK를 들고 있는 쪽이 자식 엔티티**가 된다.

### 연관관계의 주인: mappedBy

주인은 연관관계의 관리 주체이며, 주인은 이 연관관계를 관리할 책임을 가지고 있습니다. 연관관계의** 주인만이 외래 키를 관리(등록, 수정, 삭제)** 할 수 있고, **주인이 아닌 엔티티는 읽기**만 할 수 있습니다.

출처: [https://dev-coco.tistory.com/106](https://dev-coco.tistory.com/106) [슬기로운 개발생활:티스토리]  
**(주인 ENTITY != 부모 ENTITY)

- 단방향의 경우, 주인은 어노테이션이 존재하는 엔티티

### @ManyToOne 단방향

`@JoinColumn` 어노테이션과 함께 쓰이며, 이때 `@JoinColumn`은 엔티티 테이블에 FK 칼럼을 정의해줍니다.

### @OneToMany 단방향

상대 엔티티를 참조할 수 있는 매핑이 부모 엔티티 쪽에 존재하지만, FK는 자식 엔티티 테이블에 존재하는 연관관계입니다.

### @ManyToOne 양방향 (@OneToMany 양방향)

DB 관점에서는 단방향 `@ManyToOne`과 차이점이 없으며, 어플리케이션에서 상대 엔티티쪽에서 참조할 수 있는 변수가 생기는 장점이 있습니다.

```
/* User.java */
@OneToMany(mappedBy = "user")
private List<Post> posts;

/* Post.java */
@ManyToOne
@JoinColumn //테이블 내 FK 칼럼을 지정한다.
private User user
```

### @OneToMany, @ManyToOne 편의 옵션

### #프록시 옵션: fetch

1. **Lazy Fetch  
**연관관계에 있는 엔티티에 접근할 때, DB에 쿼리를 날려 엔티티 조회, 접근하지 않는 경우, 쿼리가 발생하지 않는다.

**2. Eager Fetch  
**상대 엔티티의 조회 여부와 상관없이, 쿼리 발생

### #영속성 전파: cascade

PERSIST, MERGE, REMOVE, REFRESH, DETACH, ALL 6가지 TYPE이 있다.영속성 전파를 설정하게 되면, 객체에 해당 작업이 이루어질 때, 자식엔티티에도 작업이 전파된다.  
(EX) 유저의 `posts`에 cascadeType으로 PERSIST가 걸려있으면, 유저 객체에만 저장해도 글 객체에도 저장이 된다.

출처:https://velog.io/@goniieee/JPA-OneToMany-ManyToOne%EC%9C%BC%EB%A1%9C-%EC%97%B0%EA%B4%80%EA%B4%80%EA%B3%84-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0
