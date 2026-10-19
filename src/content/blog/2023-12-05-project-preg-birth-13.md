---
title: "Project_Preg&Birth #13"
date: 2023-12-05
description: "첨부파일 업로드/다운로드-1"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-13-618222b315ec"
theme: adoption
---
첨부 파일 업로드/다운로드 기능을 추가했다. 기능 구현은 크게 3단계로 진행을 했다.

1단계: 첨부파일 업로드 기능만 따로 구현

2단계: 1단계 성공 시 현재 프로젝트에 기능 추가

3단계: 연관된 테이블들과 Join

본 글에서는 1단계와 2단계까지 진행한 사항에 대해 작성하였다.

## 1단계

첨부 파일 업로드 기능만 따로 구현.

- 파일 첨부 버튼을 누르면 첨부 할 수 있는 파일 팝업.
- 제출 버튼을 누르면 DB에 파일 목록 저장.
- 설정해둔 경로로 실제 첨부된 파일 저장.
1. 먼저 파일을 업로드할 수 있는 view 파일을 별도로 작성했다.

### #fileAttachment.html

enctype을 “multipart/form-data” 설정하면 첨부 파일을 “multipart/form-data” 형식으로 서버에 보내게 된다.

```
<form action="/api/upload" method="POST" enctype="multipart/form-data" multiple>
```

input type을 "file” 로 설정하면 파일 첨부 기능이 활성화된다. 그 뒤에 “multiple”을 붙이면 여러 개의 파일을 업로드 할 수 있다. 입력( 파일 업로드)이 완료되면 onchange 함수가 호출된다.

```
<input name="file" type="file" class="custom-file-input" id="customFile" onchange="handleFiles(this.files)" multiple>
```

전체 코드

```
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">


<head>
  <meta charset="UTF-8" />
  <title>게시판 - 글쓰기</title>

  <style>
    #fileList {
      margin-top: 10px;
      font-weight: bold;
    }
  </style>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/css/bootstrap.min.css">
</head>
<body>
<div class="container">
  
  
  <form action="/api/upload" method="POST" enctype="multipart/form-data">

    <div class="form-group row">
      <label for="inputFile" class="col-sm-2 col-form-label"><strong>첨부 파일</strong></label>
      <div class="col-sm-10">
        <div class="custom-file" id="inputFile">
          <label class="custom-file-label" for="customFile" id="fileLabel">파일 선택</label>
          <input name="file" type="file" class="custom-file-input" id="customFile" onchange="handleFiles(this.files)" multiple>
        </div>
        <div id="fileList"></div>
      </div>
    </div>

    <div class="row">
      <div class="col-auto mr-auto"></div>
      <div class="col-auto">
        <input class="btn btn-primary" type="submit" role="button" value="글쓰기" />
      </div>
    </div>
  </form>
</div>
<script src="/js/fileUpload.js"></script>
</body>
</html>
```

### #fileUpload.js

파일이 업로드 되면, 업로드한 파일의 목록을 볼 수 있다.

```
const inputElement = document.getElementById("customFile");
const fileListElement = document.getElementById("fileList"); 

inputElement.addEventListener("change", handleFiles, false);

function handleFiles() {
    const fileList = this.files; 

    const numFiles = fileList.length;
    //파일 이름을 저장할 배열
    const fileNames = []; 

    //파일 이름을 배열에 추가
    for (let i = 0; i < numFiles; i++) {
        const file = fileList[i];
        fileNames.push(file.name); 
    }

    // 파일 이름을 리스트로 표시
    fileListElement.innerHTML = "<strong>선택된 파일:</strong> " + fileNames.join(", ");
}
```

### #fileUploadController

```
@PostMapping(value = "/api/upload", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
public ResponseEntity<Board> addArticle(
//          @RequestPart(required = false) MultipartFile files, => 단일 파일 저장.
            @RequestPart(required = false) MultipartFile files)
    {
        AddArticleRequest request = new AddArticleRequest(files);
        return ResponseEntity.status(HttpStatus.CREATED)

    }
```

### #fileUploadService

```
public Board save(AddArticleRequest request, String userName) throws IOException {

        List<AttachedFileDto> attachedFileDtos = new ArrayList<>();

        //첨부파일 저장.
        if(request.getFile() != null && !request.getFile().isEmpty()){
            UploadFileUtil uploadFileUtil = new UploadFileUtil();

            for(MultipartFile file : request.getFile()){
                AttachedFileDto attachedFileDto = uploadFileUtil.uploadFile(file);
                attachedFileDtos.add(attachedFileDto);
            }
        }
//생략
```

### [Error]

동영상 파일을 업로드하자 아래와 같은 에러가 발생했다.

```
path [] threw exception [Request processing failed: org.springframework.web.multipart.MaxUploadSizeExceededException: Maximum upload size exceeded] with root cause
org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException: The field file exceeds its maximum permitted size of 1048576 bytes.
```

용량을 따로 설정하지 않으면 기본 용량으로 1048576 bytes(약 1MB)가 설정되는데 동영상 파일의 용량이 기본 용량을 넘어가면서 발생한 에러였다. application 파일에 첨부 파일 관련 설정을 추가해 줌으로써 해결할 수 있었다.

### #application.yml

```
  servlet: 
    multipart:
      maxFileSize: 1000MB # 파일 하나의 최대 크기
      maxRequestSize: 3000MB  # 한 번에 최대 업로드 가능 용량
```

## 2단계

1단계에서 첨부파일 업로드 기능을 현재 프로젝트에 병합했다.

## <Entity>

### #AttachedFile

```
@Entity
@Getter
@Setter
@NoArgsConstructor
public class AttachedFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false)
    private Long fileNo;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath;

    @Builder
    public AttachedFile(String originalFileName,String fileName, String filePath, Board board){
        this.originalFileName = originalFileName;
        this.fileName = fileName;
        this.filePath = filePath;
        this.board = board;
    }
}
```

## <DTO>

### #AddArticleRequest:

AttachedFile 필드 추가, 생성자 추가

```
    private AttachedFile attachedFile;
    private int views;
    private MultipartFile file;

    public AddArticleRequest(@NotNull String category, @NotNull String title, @NotNull String content, MultipartFile file) {
        this.category =category;
        this.title = title;
        this.content = content;
        this.file =file;
    }

    public AddArticleRequest(@NotNull String title, @NotNull String content, @NotNull String author, @NotNull String categoryName, BoardCategory boardCategory, int views) {
        this.title = title;
        this.content = content;
        this.author = author;
        this.category = categoryName;
        this.boardCategory = boardCategory;
        this.views = views;
    }
```

### #UpdateArticleRequest:

AttachedFile 필드 추가, 생성자 추가

```
    private MultipartFile files;

    public UpdateArticleRequest(String category, String title, String content, MultipartFile files) {
        this.category =category;
        this.title = title;
        this.content = content;
        this.files = files;
    }

    public UpdateArticleRequest(String category, String title, String content, LocalDateTime updatedAt) {
        this.category =category;
        this.title = title;
        this.content = content;
        this.updatedAt = updatedAt;
    }
```

### #AttachedFileDto:

```
@Getter
@Setter
@ToString
@NoArgsConstructor
public class AttachedFileDto {
    private String originalFileName;
    private String fileName;
    private String filePath;


    public AttachedFile toEntity() {

        return AttachedFile.builder()
                .originalFileName(originalFileName)
                .fileName(fileName)
                .filePath(filePath)
                .build();
    }

    @Builder
    public AttachedFileDto(String originalFileName, String fileName, String filePath){
        this.originalFileName = originalFileName;
        this.fileName = fileName;
        this.filePath = filePath;
    }

}
```

## <CONTROLLER>

### #BoardApiController:

- 기본 글 생성/수정 로직에 첨부파일 업로드 기능 추가  
- MediaType 지정(MULTIPART_FORM_DATA_VALUE)  
- http 요청을 받는 annotation 변경  
(@requestbody → @RequestParam, @RequestPart)

```
//생성 
@PostMapping(value = "/api/articles", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Board> addArticle(
            @RequestParam String category,
            @RequestParam String title,
            @RequestParam String content,
            @RequestPart(required = false) MultipartFile files,
            Principal principal) throws IOException
    {
        AddArticleRequest request = new AddArticleRequest(category, title, content, files);

        //생략

        Board savedArticle = boardService.save(request, principal.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
    }

//수정
@PutMapping("/api/articles/{board_id}")
public ResponseEntity<Board> updateArticle(
            @PathVariable long board_id,
            @RequestParam String category,
            @RequestParam String title,
            @RequestParam String content,
            @RequestPart(required = false) 
            MultipartFile files) throws IOException 
{
        UpdateArticleRequest request = new UpdateArticleRequest(category, title, content, files);
        Board updatedArticle = boardService.update(board_id, request);
        return ResponseEntity.ok()
```

## <SERVICE>

### #BoardService:

글 생성/수정 로직에 첨부 파일 저장 로직 추가

```
public class BoardService {
    private final BoardRepository boardRepository;
    private final BoardCategoryRepository boardCategoryRepository;
    private final AttachedFileRepository attachedFileRepository;

    public Board save(AddArticleRequest request, String userName) 
      throws IOException {

        //첨부파일 저장.
        if(request.getFile() != null){
            UploadFileUtil uploadFileUtil = new UploadFileUtil();
            AttachedFileDto attachedFileDto = uploadFileUtil.uploadFile(request.getFile());
            attachedFileRepository.save(attachedFileDto.toEntity());
        }

        //글 저장
        Board board = request.toEntity(userName);
        request.getBoardCategory().mappingBoard(board);

        //생략


 @Transactional
    public Board update(long boardId, UpdateArticleRequest request) throws IOException {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(()-> new IllegalArgumentException("not found:" + boardId));

        authorizeArticleAuthor(board);

        BoardCategory boardCategory = (BoardCategory) boardCategoryRepository.findByCategoryName(request.getCategory());
        if(boardCategory == null){
            boardCategory = BoardCategory.builder()
            public Board update(long boardId, UpdateArticleRequest request){
            board.update(request.getTitle(), request.getContent(), boardCategory);
            boardCategory.mappingBoard(board);

            return board;
        }

        //첨부파일 저장.
        if(request.getFiles() != null){
            UploadFileUtil uploadFileUtil = new UploadFileUtil();
            AttachedFileDto attachedFileDto = uploadFileUtil.uploadFile(request.getFiles());
            attachedFileRepository.save(attachedFileDto.toEntity());
        }

        board.update(request.getTitle(), request.getContent(), boardCategory);
        return board;
    }
```

## <REPOSITORY>

### #AttachedFileRepository

```
@Repository
public interface AttachedFileRepository extends JpaRepository<AttachedFile, Long> {
    List<AttachedFile> findAttachedFileByFileNo(Long fileNo);
}
```

## <UTIL>

### #UploadFileUtil:

파일 업로드 기능 util 생성, 프로젝트 경로 지정 및 첨부 파일 저장 기능

```
@RequiredArgsConstructor
public class UploadFileUtil {

    public AttachedFileDto uploadFile(MultipartFile files) throws IOException {

        String originalFilename = files.getOriginalFilename();
        UUID uuid = UUID.randomUUID();
        String fileName = uuid + "_" + originalFilename;

        //프로젝트의 경로 지정
        String savedPath = System.getProperty("user.dir") + "\\files";

        //directory 생성
        if(!new File(savedPath).exists()){
            try {
                boolean wasSuccessful = new File(savedPath).mkdir();
            }
            catch (Exception e){
                e.getStackTrace();
            }
        }

        //첨부파일 저장
        String filePath = savedPath + "\\" + fileName;
        files.transferTo(new File(filePath));

        return new AttachedFileDto(originalFilename, fileName,filePath);
    }
}
```

## <VIEW>

### #formDataArticle.js:

글 생성/수정/삭제 로직 이벤트 변경  
(http 요청 시 requestbody를 application/json -> form data로 변경)

```
// 생성 기능
const createButton = document.getElementById('create-btn');
if (createButton) {
    // 등록 버튼을 클릭하면 /api/articles로 요청을 보낸다
    createButton.addEventListener('click', event => {
        const formData = new FormData();
        formData.append('title' , document.getElementById('title').value)
        formData.append('content' , document.getElementById('content').value)
        formData.append('category' , document.getElementById('category').value)
        const inputFile = document.getElementById('customFile');
        formData.append('files', inputFile.files[0]);
        function success() {
            alert('등록 완료되었습니다.');
            location.replace('/articles');
        }
        function fail() {
            alert('등록 실패했습니다.');
            location.replace('/articles');
        }
        httpRequest('POST', '/api/articles', formData, success, fail);
    });
}

// 수정 기능
const modifyButton = document.getElementById('modify-btn');
if (modifyButton) {
    modifyButton.addEventListener('click', event => {
        let boardNo = document.getElementById('article-id').value;
        const formData = new FormData();
        formData.append('title' , document.getElementById('title').value)
        formData.append('content' , document.getElementById('content').value)
        formData.append('category' , document.getElementById('category').value)
        const inputFile = document.getElementById('customFile');
        formData.append('files', inputFile.files[0]);
        function success() {
            alert('수정 완료되었습니다.');
            location.replace("/articles/" + boardNo);
        }

        function fail() {
            alert('수정 실패했습니다.');
            location.replace("/articles/" + boardNo);
        }
        httpRequest('PUT',"/api/articles/" + boardNo, formData, success, fail);
    });
}

// 삭제 기능
const deleteButton = document.getElementById('delete-btn');
if (deleteButton) {
    deleteButton.addEventListener('click', event => {
        let id = document.getElementById('article-id').value;
        function success() {
            alert('삭제가 완료되었습니다.');
            location.replace('/articles');
        }
        function fail() {
            alert('삭제 실패했습니다.');
            location.replace('/articles');
        }
        httpRequest('DELETE',`/api/articles/${id}`, null, success, fail);
    });
}

// 쿠키를 가져오는 함수
function getCookie(key) {
    let result = null;
    let cookie = document.cookie.split(';');
    cookie.some(function (item) {
        item = item.replace(' ', '');
        let dic = item.split('=');
        if (key === dic[0]) {
            result = dic[1];
            return true;
        }
    });
    return result;
}

// HTTP 요청을 보내는 함수
function httpRequest(method, url, body, success, fail) {

    fetch(url, {
        method: method,
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('access_token'),
        },
        body: body,
    }).then(response => {
        if (response.status === 200 || response.status === 201) {
            return success();
        }
        const refresh_token = getCookie('refresh_token');
        if (response.status === 401 && refresh_token) {
            fetch('/api/token', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('access_token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: getCookie('refresh_token'),
                }),
            })
                .then(res => {
                    if (res.ok) {
                        return res.json();
                    }
                })
                .then(result => {
                    localStorage.setItem('access_token', result.accessToken);
                    httpRequest(method, url, body, success, fail);
                })
                .catch(error => fail());
        } else {
            return fail();
        }
    });
}
```

### #newArticle.html:

파일 첨부 관련 view 추가

```
<img th:src = "@{#.filepath}" alt="#">            
```
