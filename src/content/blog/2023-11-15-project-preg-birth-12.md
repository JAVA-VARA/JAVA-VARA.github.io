---
title: "Project_Preg&Birth #12"
date: 2023-11-15
description: "게시판 검색 기능"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-12-4e4f21a1fa71"
---
### 게시판 검색 기능

```
[검색 기능]
게시글 제목을 기준으로 검색어를 포함한 게시글 목록을 반환한다. 

#BoardViewController: getAllBoardList 메서드 수정
- String searchKeyword 파라미터 추가
- searchKeyword 가 없는 경우 전체 게시글 불러오기
- searchKeyword 가 있는 경우 검색 리스트 반환

#BoardService: boardSearchList 메서드 추가
#BoardRepository: findByTitleContaining 메서드 추가
```

## <Controller>

#BoardViewController: getAllBoardList 메서드 수정

- **수정 전**

```
@GetMapping("/articles")
    public String  getAllBoardList(
            @PageableDefault(sort = "boardNo",direction = Sort.Direction.DESC) Pageable pageable,
            Model model)
    {
        Page<ArticleViewResponse> boardPage = boardService.getBoardList(pageable);
        model.addAttribute("boardPage",boardPage);
        return "/freeBoardList";
    }
```

- **수정 후**

```
@GetMapping("/articles")
    public String  getAllBoardList(Model model,
                                   @PageableDefault(sort = "boardNo",direction = Sort.Direction.DESC) Pageable pageable,
                                   String searchKeyword){

        //검색 기능 추가
        Page<ArticleViewResponse> list = null;

        //검색어가 없는 경우 전체 list 반환
        if(searchKeyword == null){
            list = boardService.getBoardList(pageable); 

        //검색어가 있는 경우,searchKeyword로 검색 리스트 반환
        } else{
            list = boardService.boardSearchList(searchKeyword,pageable); 
        }

        model.addAttribute("boardPage",list);

        return "/freeBoardList";
    }
```

## <Service>

#boardSearchList 메서드 추가

```
 public Page<ArticleViewResponse> boardSearchList(String searchKeyword, Pageable pageable){
        int page = (pageable.getPageNumber()==0)? 0 : (pageable.getPageNumber() - 1);

        Page<Board> boardList = boardRepository.findByTitleContaining(searchKeyword, pageable);
        Page<ArticleViewResponse> pageList = boardList.map(this::convertToDto);

        return pageList;
    }
```

## <Repository>

#BoardRepository: findByTitleContaining 메서드 추가

```
public interface BoardRepository extends JpaRepository<Board, Long> {

    Page<Board> findAll(Pageable pageable);
    public List<Board> findByCategory(BoardCategory category);

    //검색어가 있는 경우 검색어를 포함하는 게시글을 찾아온다.
    Page<Board> findByTitleContaining(String searchKeyword, Pageable pageable);

}
```

게시글 제목 기준 게시판 검색 기능을 구현 완료:)

![](/images/medium/4e4f21a1fa71/1.png)

![](/images/medium/4e4f21a1fa71/2.png)
