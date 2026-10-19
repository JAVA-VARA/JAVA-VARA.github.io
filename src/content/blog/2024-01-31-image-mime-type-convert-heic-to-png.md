---
title: "Image MIME-TYPE_Convert HEIC to PNG"
date: 2024-01-31
description: "[문제 상황]"
source: medium
original: "https://medium.com/@sj.youns1027/image-mime-type-0784475563fa"
---
## Image MIME-TYPE_Convert HEIC to PNG

## [문제 상황]

게시판에서 이미지 리사이징/업로드 기능을 만들고 이미지 유형에 따른 업로드 test 진행 중 아이폰으로 찍은 사진이 업로드되지 않는 문제를 확인했다. 이유는 애플이 독자적으로 heic라는 확장자를 사용하기 때문.

이 글에서는 heic 확장자가 무엇인지 알아보고, heic를 png 파일로 변환하여 업로드할 수 있도록 한 과정을 기록했다.

### HEIC란 무엇일까?

### HEIC(High Efficiency Image Container) Image Type

2017년 iOS11과 macOS High Sierra 출시 이후 Apple 사용자의 표준 이미지가 된 파일 형식. 고급 압축 기술을 기반으로 공간을 덜 사용하면서 JPEG보다 높은 품질로 이미지를 저장한다.

### HEIC 파일의 장점

- HEIC 파일은 JPEG의 절반 크기이며, 하나의 파일에 여러 장의 이미지를 저장할 수 있습니다. 따라서 디바이스나 클라우드에서 저장 공간을 많이 차지하지 않습니다.
- HEIC 파일은 다른 [이미지 파일 유형](https://www.adobe.com/kr/creativecloud/file-types/image.html)보다 크기는 작지만 동일한 고품질 이미지를 제공하며, 보다 유연한 편집을 위해 16비트 색상을 지원합니다.
- HEIC 파일은 시간, 위치, 높이, 너비(픽셀) 등 이미지에 대한 중요한 데이터를 저장합니다. 이미지 편집 내용을 저장하기 때문에 나중에 원래 상태로 되돌릴 수 있습니다.

### HEIC 파일의 단점

- **HEIC는 Apple 에코시스템 안에서만 사용**됩니다.
- **HEIC 파일은 다양한 플랫폼의 소프트웨어와 호환되지 않습니다.** 이로 인해 이미지를 원본 형식으로 편집하거나 업로드하는 데 어려움을 겪을 수 있습니다. 그만큼 실용성이 떨어집니다.

위 설명처럼 heic는 장점도 있지만, 다른 소프트웨어와 호환되지 않고, window 환경에서는 별도의 툴을 설치해야만 볼 수 있다.

## [해결]

### HEIC 파일을 변환하여 업로드 하기

java pacakage 중 image I/O API는 다양한 image type을 read, wirte 할 수 있도록 해주는데, 이 때 heic 확장자는 지원되지 않는다. 그래서 아래의 방법으로 heic확장자에 대해이미지 리사이징/업로드 기능을 구현했다.

1. 클라이언트가 업로드한 이미지가 heic 확장자인 경우
2. 외부프로그램([imageMagicK](https://imagemagick.org/index.php)*)을 이용하여 heic를 png로 변환
3. 변환된 png file을 multipartFile로 반환
4. 반환 받은 png파일을 resizing 후 저장/업로드

### *[imageMagicK](https://imagemagick.org/index.php) 선택한 이유

- 무료 오픈소스 소프트웨어
- 이미지 확장자 변환 프로그램이지만 CLI를 제공하여 비교적 쉽게 사용할 수 있다.
- 사용자가 많아 정보를 찾기 쉽고, 공식홈페이지에도 사용 방법이 친절하게 나와 있다.(초심자인 나에게 가장 중요한 부분)
- 나중에 배포할 때 신경써야할 부분이 늘어나겠지만 라이브러리가 아닌 외부프로그램을 사용해보는 방법을 경험해보고 싶었다.

### 1. 클라이언트가 업로드한 이미지가 heic 확장자인 경우

- LocalUploadUtil

```
if(Objects.requireNonNull(multipartFile.getContentType()).contains("image")) {
    MultipartFile resizedImage = resizer(fileName, fileFormat, multipartFile, 400);
    resizedImage.transferTo(new File(filePath));

// 확장자가 heic인 경우 실행할 LOGIC
} else if(originalFilename.endsWith("heic") || originalFilename.endsWith("HEIC")) {

    //1) 변환
    ImageProcessingUtil imageProcessingUtil = new ImageProcessingUtil();
    MultipartFile convertedMultipartFile = imageProcessingUtil.convertHEICtoPNG(multipartFile);

    //2) 변환된 file을 image reszier에 넣고 리사이징
    fileFormat = extractFileFormat(convertedMultipartFile);
    filePath = relativePath + "\\" + uuid + "_" + convertedMultipartFile.getOriginalFilename();
    fileName = convertedMultipartFile.getOriginalFilename();
    MultipartFile convertedImage = resizer(fileName, fileFormat, convertedMultipartFile, 400);

    convertedImage.transferTo(new File(filePath));
        }
```

확장자를 Content-Type으로 구분하고 싶었으나, application/octet-stream이라는 type으로 들어오는 것으로 확인되어, filename에 붙은 확장자로 조건을 설정했다.

![](/images/medium/0784475563fa/1.png)

사용자가 HEIC파일을 업로드하면 imageProcessingUtil 클래스를 불러와 로Image를 PNG로 convert했다.

```
//1) 변환
ImageProcessingUtil imageProcessingUtil = new ImageProcessingUtil();
MultipartFile convertedMultipartFile = imageProcessingUtil.convertHEICtoPNG(multipartFile);
```

### 2. 외부프로그램을 이용하여 heic를 png로 변환

- ImageProcessingUtil
1. 전달받은 heic 파일을 저장할 폴더 생성하고, 파일을 저장했다.

```
//1 전달받은 HEIC 파일을 저장
        //#1 저장할 폴더 생성
        String tempRelativePath = "src/main/resources/tempFiles/";
        if(!new File(tempRelativePath).exists()){
            try {
                File tempFile = new File(tempRelativePath);
                tempFile.mkdirs();
            } catch (Exception e) {
                e.getStackTrace();
            }
        }
        //#2 전달 받은 파일 저장
        String filename = originalHEICImage.getOriginalFilename();
        String orgFilePath = tempRelativePath + filename;
        originalHEICImage.transferTo(new File(orgFilePath));
```

2. ImageMagick 프로그램을 이용하여 .heic → .png로 변환한다.

```
//ImageMagick 프로그램의 경로
String magick_path = "C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe";

//#1_변환할 이미지의 경로
String org_file = orgFilePath;


//#2_변환 후 저장될 이미지의 경로
String relativePath = "src/main/resources/files/";
String newFilename = filename.substring(0,filename.lastIndexOf("."))+".png";
String new_file = relativePath + newFilename;

//#3_외부 프로그램 실행하여 이미지 확장자 변환
Process process = 
          new ProcessBuilder(
                "cmd", "/c",
                magick_path, "convert",
                org_file, new_file)
                .start();
```

### 3. 변환된 png file을 multipartFile로 반환

- 변환되어 저장된 파일을 저장된 경로에서 불러온다.
- InputStream 객체를 이용해 file data를 읽어온다.
- 가져온 파일의 정보, inputstream을 통해 multipartFile로 반환한다.

```
    File file = ResourceUtils.getFile(new_file);
    InputStream inputStream = new FileInputStream(file);

return new MockMultipartFile("file", newFilename, "image/png", inputStream);
```

### 4. 반환 받은 png파일을 resizing 후 저장/업로드

```
//2) 변환된 file을 image reszier에 넣고 리사이징
    fileFormat = extractFileFormat(convertedMultipartFile);
    filePath = relativePath + "\\" + uuid + "_" + convertedMultipartFile.getOriginalFilename();
    fileName = convertedMultipartFile.getOriginalFilename();
    MultipartFile convertedImage = resizer(fileName, fileFormat, convertedMultipartFile, 400);

    convertedImage.transferTo(new File(filePath));
```

## #TestCode

```
@SpringBootTest
@AutoConfigureMockMvc
class LocalUploadUtilTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    UserRepository userRepository;
    @Autowired
    BoardRepository boardRepository;

    @Autowired
    AttachedFileRepository attachedFileRepository;

    @Autowired
    ResourceLoader loader;

    User user;
    @BeforeEach
    void setUpUserInfo(){
        userRepository.deleteAll();
        boardRepository.deleteAll();

        user = userRepository.save(User.builder()
                    .email("Test@gmail.com")
                    .name("name")
                    .hp("12345678")
                    .nickname("author")
                    .password("Test")
                    .build());

        SecurityContext context = SecurityContextHolder.getContext();
        context.setAuthentication(
                new UsernamePasswordAuthenticationToken(user, user.getPassword(), user.getAuthorities()));
        }

    @Test
    @DisplayName("fileUploadToLocalDir 메서드 테스트")
    void fileUploadToLocalDir() throws Exception {

        //GIVEN
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn("username");
        final String url = "/api/articles";
        final String email = "test@gmail.com";
        final String title = "title";
        final String content = "content";
        final String categoryName = "자유게시판";
        final String filePath = "C:\\Users\\sjyou\\IdeaProjects\\PandBproject\\PandB_Project\\src\\main\\resources\\testingImages\\";

        //생략//
        MockMultipartFile hiecImageFile = new MockMultipartFile(
                "files",
                "HeicTest.heic",
                "application/octet-stream",
                new FileInputStream(filePath + "HeicTest.heic"));


        //WHEN
        ResultActions HEICresultAction = mockMvc.perform(multipart(url)
          .file(hiecImageFile)
          .param("category", categoryName)
          .param("title", title)
          .param("content", content)
          .principal(() -> email)
          .contentType(MediaType.MULTIPART_FORM_DATA_VALUE));

        //THEN
        HEICresultAction.andExpect(status().isCreated());
```

## 배운 점

- 사용자가 어떤 확장 프로그램을 사용할지 예측할 수 없기 때문에 다양한 시나리오를 고려하여 미리 대비해야 한다 .
- 외부 프로그램을 연결하여 사용하는 방법도 학습.

끝:)

출처:

[**Resizing or Scaling -- IM v6 Examples**  
*We look at enlarging and reducing images in various ways. The image remains intact and whole, but individual points of…*legacy.imagemagick.org](https://legacy.imagemagick.org/Usage/resize/)[](https://legacy.imagemagick.org/Usage/resize/)[**[Java] 이미지변환 HEIC 등등**  
*ImageMagick 설치 https://imagemagick.org/script/download.php [설치테스트] cmd 실행 magick logo: logo.gif magick identify…*dgblog.tistory.com](https://dgblog.tistory.com/261)[](https://dgblog.tistory.com/261)[**heic-convert | HEIC 이미지 JPEG로 변환하기**  
*어떻게하면 HEIC을 JPEG로 변환하고, 이를 자동화 시킬 수 있을까요? 이 글은 게시글에 첨부된 heic-convert 라이브러리를 사용하여 HEIC-JPEG 포맷 변환을 개인적으로 공부했던 기록입니다.*velog.io](https://velog.io/@oneook/heic-convert-HEIC-%EC%9D%B4%EB%AF%B8%EC%A7%80-JPEG%EB%A1%9C-%EB%B3%80%ED%99%98%ED%95%98%EA%B8%B0)[](https://velog.io/@oneook/heic-convert-HEIC-%EC%9D%B4%EB%AF%B8%EC%A7%80-JPEG%EB%A1%9C-%EB%B3%80%ED%99%98%ED%95%98%EA%B8%B0)[**How to convert images in apple's new HEIC format to jpg in java?**  
*I have few thousand images in HEIC format that need to be converted to jpg/png. Conversion needs to happen in a backend…*stackoverflow.com](https://stackoverflow.com/questions/50301554/how-to-convert-images-in-apple-s-new-heic-format-to-jpg-in-java)[](https://stackoverflow.com/questions/50301554/how-to-convert-images-in-apple-s-new-heic-format-to-jpg-in-java)[**How to Convert HEIC to JPG in Java - DZone**  
*Convert between over 100 file formats, including key formats such as Photoshop (PSD), PNG, JPG, GIF, NEF, and BMP.*dzone.com](https://dzone.com/articles/how-to-convert-heic-to-jpg-in-java)[](https://dzone.com/articles/how-to-convert-heic-to-jpg-in-java)

[https://www.adobe.com/kr/creativecloud/file-types/image/raster/heic-file.html](https://www.adobe.com/kr/creativecloud/file-types/image/raster/heic-file.html)
