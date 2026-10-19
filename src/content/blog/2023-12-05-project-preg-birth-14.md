---
title: "Project_Preg&Birth #14"
date: 2023-12-05
description: "첨부 파일 업로드/다운로드-2"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-14-e655f02bcd83"
---
1. AttachedFile과 Board table join
2. 여러 개의 파일을 저장할 수 있도록 변경

### <ENTITY>  
#AttachedFile:

board 필드 추가

```
 @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "board_no")
    @JsonBackReference
    private Board board;
```

### #Board

- attachedFileList 필드 추가
- mappingAttachedFileToBoard 메서드 추가

```
@OneToMany(mappedBy = "board", cascade = CascadeType.PERSIST)
    @JsonManagedReference
    private List<AttachedFile> attachedFileList = new ArrayList<>();

//생략

public void mappingAttachedFileToBoard(AttachedFile attachedFile){
        if(this.attachedFileList == null){
            this.attachedFileList = new ArrayList<>();
        }
        this.attachedFileList.add(attachedFile);
    }
```

### #AddArticleRequest

file 필드를 List<MultipartFile> 로 변경

```
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class AddArticleRequest {
    private int views;
    private List<MultipartFile> file;
    public AddArticleRequest(@NotNull String category, @NotNull String title, @NotNull String content, List<MultipartFile> file) {
        this.category =category;
        this.title = title;
        this.content = content;
        this.file = file;
    }
```

### #ArticleViewResponse

인자로 받는 MultipartFile file => List<MultipartFile> file 로 수정

```
public class ArticleViewResponse {
    private BoardCategory category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttachedFile> attachedFileList;



    public ArticleViewResponse(Board board){
        this.createdAt = board.getCreatedAt();
        this.updatedAt = board.getUpdatedAt();
        this.views = board.getViews();
        this.attachedFileList = board.getAttachedFileList();
        }
}
```

### #AttachedFileDto

- toEntity 메서드: builder에 board 추가

```
public class AttachedFileDto {
    private String originalFileName;
    private String fileName;
    private String filePath;
    private Board board;


    public AttachedFile toEntity() {
        public AttachedFile toEntity() {
                .originalFileName(originalFileName)
                .fileName(fileName)
                .filePath(filePath)
                .board(board)
                .build();
    }
```

### #BoardApiController

단일 파일 저장 → 여러 개의 파일을 저장할 수 있도록 List 형식으로 변경.

```
public ResponseEntity<Board> addArticle(
    @RequestPart(name = "files", required = false) List<MultipartFile> files,
}
```

### #BoardService:

- mappingAttachedFileToBoard 추가하여 board entity와 매핑
- 반복문으로 다수의 파일 저장 하는 것으로 변경

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

        //글 저장
        Board board = request.toEntity(userName);
        request.getBoardCategory().mappingBoard(board);

        for(AttachedFileDto attachedFileDto : attachedFileDtos){

            attachedFileDto.setBoard(board);
            attachedFileRepository.save(attachedFileDto.toEntity());

            AttachedFile attachedFile = attachedFileRepository.findAttachedFileByFileName(attachedFileDto.getFileName());
            board.mappingAttachedFileToBoard(attachedFile);

        }
        return boardRepository.save(board);
    }
```

### #AttachedFileRepository

- findAttachedFileByFileName메서드 추가

```
public interface AttachedFileRepository extends JpaRepository<AttachedFile, Long
    List<AttachedFile> findAttachedFileByFileNo(Long fileNo);
    AttachedFile findAttachedFileByFileName(String fileName);
}
```

## <VIEW>

### #formDataArticle:

- 다수의 파일 업로드할 수 있도록  
formData.append(‘files’, inputFile.files[0]) → (‘files’, files[i]); 로 변경

```
const inputFile = document.getElementById('customFile');
        const files = inputFile.files;
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        function success() {
            alert('등록 완료되었습니다.');
```
