---
title: "Image MIME-TYPE Test code 리펙토링"
date: 2024-06-13
description: "이전에 사용자가 글 작성할 때 이미지도 업로드할 수 있는 로직을 구현하고 테스트까지 만든 후 블로그에 글을 작성했었는데, 이번에는 추가적인 mime-type을 테스트 해보고, test도 가독성 있고 수정하기 편하도록 리펙토링 했다."
source: medium
original: "https://medium.com/@sj.youns1027/%EC%9D%B4%EB%AF%B8%EC%A7%80%EC%97%85%EB%A1%9C%EB%93%9C-e43e8a9ff9df"
---
## Image MIME-TYPE Test code 리펙토링

이전에 사용자가 글 작성할 때 이미지도 업로드할 수 있는 로직을 구현하고 테스트까지 만든 후 [블로그](https://medium.com/@sj.youns1027/image-mime-type-493ff6786264)에 글을 작성했었는데, 이번에는 추가적인 mime-type을 테스트 해보고, test도 가독성 있고 수정하기 편하도록 리펙토링 했다.

## AS-IS

몇달 전에 작성했던 코드인데, 반복되는 코드가 많아 다른 image mime type을 추가하려고 하니 손도 많이 가고 무엇보다 내 눈에 보기 너무 거슬려서 참을 수가 없었다.

```
@SpringBootTest
@AutoConfigureMockMvc
class LocalUploadUtilTest {

    //중략//

    @Test
    @DisplayName("fileUploadToLocalDir 메서드 테스트")
    void fileUploadToLocalDir() throws Exception {

        //GIVEN
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn("username");

        //BoardApiController 와 동일하게 파일 업로드 진행
        final String url = "/api/articles";
        final String email = "test@gmail.com";
        final String title = "title";
        final String content = "content";
        final String categoryName = "자유게시판";
        final String filePath = "C:\\Users\\sjyou\\IdeaProjects\\PandBproject\\PandB_Project\\src\\main\\resources\\testingImages\\";

        MockMultipartFile webpImageFile = new MockMultipartFile(
                "files",
                "webTest.webp",
                "image/webp",
                new FileInputStream(filePath + "webTest.webp"));

        MockMultipartFile jpgImageFile = new MockMultipartFile(
                "files",
                "JpgTest.jpg",
                "image/jpeg",
                new FileInputStream(filePath + "JpgTest.jpg"));

        MockMultipartFile pngImageFile = new MockMultipartFile(
                "files",
                "PngTest.png",
                "image/png",
                new FileInputStream(filePath + "PngTest.png"));

        MockMultipartFile gifImageFile = new MockMultipartFile(
                "files",
                "GifTest.gif",
                "image/gif",
                new FileInputStream(filePath + "GifTest.gif"));


        //WHEN
        ResultActions WEBPresultAction = mockMvc.perform(multipart(url)
                .file(webpImageFile)
                .param("category", categoryName)
                .param("title", title)
                .param("content", content)
                .principal(() -> email)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE));
        ResultActions JPGresultAction = mockMvc.perform(multipart(url)
                .file(jpgImageFile)
                .param("category", categoryName)
                .param("title", title)
                .param("content", content)
                .principal(() -> email)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE));
        ResultActions PNGresultAction = mockMvc.perform(multipart(url)
                .file(pngImageFile)
                .param("category", categoryName)
                .param("title", title)
                .param("content", content)
                .principal(() -> email)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE));
        ResultActions GIFresultAction = mockMvc.perform(multipart(url)
                .file(gifImageFile)
                .param("category", categoryName)
                .param("title", title)
                .param("content", content)
                .principal(() -> email)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE));

        //THEN
        WEBPresultAction.andExpect(status().isCreated());
        JPGresultAction.andExpect(status().isCreated());
        PNGresultAction.andExpect(status().isCreated());
        GIFresultAction.andExpect(status().isCreated());

    }
}
```

## TO-BE

- 테스트에 사용할 MockMultipartFile를 생성하는 부분을**createMockMultipartFile **메서드로 분리했고, 생성된 파일을 배열에 추가했다.
- 생성된 이미지 파일과 함께 글을 작성하는 기능을 **performMultipartRequest **메서드로 분리했고, 이미지 파일을 넣은 배열을 반복문을 돌면서 실행하도록 했다.

```
@SpringBootTest
@AutoConfigureMockMvc
class LocalUploadUtilTest {

@Test
    @DisplayName("fileUploadToLocalDir 메서드 테스트")
    void fileUploadToLocalDir() throws Exception {

        //GIVEN
        Principal principal = Mockito.mock(Principal.class);
        Mockito.when(principal.getName()).thenReturn("username");

        //BoardApiController 와 동일하게 파일 업로드 진행
        final String url = "/api/articles";
        final String email = "test@gmail.com";
        final String title = "title";
        final String content = "content";
        final String categoryName = "자유게시판";
        final String filePath = "C:\\Users\\sjyou\\IdeaProjects\\PandBproject\\PandB_Project\\src\\main\\resources\\testingImages\\";

        // 테스트할 이미지 파일들 설정
        MockMultipartFile[] imageFiles = {
                createMockMultipartFile("webTest.webp", "image/webp", filePath),
                createMockMultipartFile("JpgTest.jpg", "image/jpeg", filePath),
                createMockMultipartFile("PngTest.png", "image/png", filePath),
                createMockMultipartFile("GifTest.gif", "image/gif", filePath),
                createMockMultipartFile("HeicTest.heic", "application/octet-stream", filePath),
                createMockMultipartFile("AvifTest.avif", "image/avif", filePath)
        };

        //WHEN & THEN
        for (MockMultipartFile imageFile : imageFiles) {
            performMultipartRequest(url, categoryName, title, content, email, imageFile)
                    .andExpect(status().isCreated());
        }
    }

    private MockMultipartFile createMockMultipartFile(String fileName, String contentType, String filePath) throws IOException {
        return new MockMultipartFile(
                "files",
                fileName,
                contentType,
                new FileInputStream(filePath + fileName)
        );
    }

    // Multipart 요청 수행 메서드
    private ResultActions performMultipartRequest(String url, String categoryName, String title, String content, String email, MockMultipartFile file) throws Exception {
        return mockMvc.perform(multipart(url)
                .file(file)
                .param("category", categoryName)
                .param("title", title)
                .param("content", content)
                .principal(() -> email)
                .contentType(MediaType.MULTIPART_FORM_DATA_VALUE));
    }
}
```

=> 이제 내가 테스트하고 싶은 이미지 MIME-TYPE이 생긴다면, imageFiles 배열에만 해당 이미지를 추가하면 된다:)   
여기서는 HEIC와 AVIF 확장자를 추가해주었다.

![](/images/medium/e43e8a9ff9df/1.png)

*테스트 통과!*

일단 현재 내 수준에서는 가장 최적의 방법으로 리펙토링을 한 것 같다. 언젠가 다시 이 코드를 보고 거슬리는 날이 오겠지만, 그만큼 성장했다는 뜻일테니 오히려 좋아.
