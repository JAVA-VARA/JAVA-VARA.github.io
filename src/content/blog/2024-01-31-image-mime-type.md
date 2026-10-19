---
title: "Image MIME-TYPE"
date: 2024-01-31
description: "Upload WebP format"
source: medium
original: "https://medium.com/@sj.youns1027/image-mime-type-493ff6786264"
theme: problem-solving
---
### Upload WebP format

## [Image types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types)

- `[image/apng](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#apng_animated_portable_network_graphics)`: Animated Portable Network Graphics (APNG)
- `[image/gif](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#gif_graphics_interchange_format)`: Graphics Interchange Format (GIF)
- `[image/jpeg](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#jpeg_joint_photographic_experts_group_image)`: Joint Photographic Expert Group image (JPEG)
- `[image/png](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#png_portable_network_graphics)`: Portable Network Graphics (PNG)
- `[image/webp](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#webp_image)`: Web Picture format (WEBP)

=> 사람들이 많이 사용하는 image type이라고 한다.

위의 image type들에 대해 image reszing과 업로드가 잘 되는지 확인해보는 test case를 만들어보고자한다.

### java에서 기본적으로 제공해주는 MIME-TYPE

![](/images/medium/493ff6786264/1.png)

*[https://docs.w3cub.com/openjdk~11/java.desktop/javax/imageio/package-summary](https://docs.w3cub.com/openjdk~11/java.desktop/javax/imageio/package-summary)*

내가 java에서 Image를 읽어올 때 =사용할 *javax.imageio API는 기본적으로 위 표에 기재된 6가지 type의 image format을 지원해준다. 그렇기에 내가 test할 type 중 WEBP는 image를 읽어올 수 없어 리사이징이 되지 않았다.

## *javax.imageio

The Java Image I/O API (the javax.imageio package) contains the basic classes and interfaces for reading/writing BufferedImages and RenderedImages from/to image files and streams.

## #1 WEBP

온라인 이미지(사진과 그래픽)의 크기를 줄여 웹 사이트가 빠르게 로드 되도록 구글에서 개발한 파일 포맷.

webp 형식은 의외로 간단하게 build.gradle에 의존성만 추가해주면 되었다. 역시 구글:)

- build.gradle

```
implementation group: 'org.sejda.imageio', name: 'webp-imageio', version: '0.1.6'
```

출처: [https://genuinecoder.com/java-webp-image-read-save-tutorial/](https://genuinecoder.com/java-webp-image-read-save-tutorial/), [https://www.adobe.com/kr/creativecloud/file-types/image/raster/webp-file.html](https://www.adobe.com/kr/creativecloud/file-types/image/raster/webp-file.html)

그 외 test 했던 image file들은 정상적으로 리사이징, 업로드됨을 확인할 수 있었다.

## #LocalUploadUtilTest

```
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.util.ResourceUtils;
import sjspring.shop.pregAndBirthDeveloper.domain.AttachedFile;
import sjspring.shop.pregAndBirthDeveloper.domain.User;
import sjspring.shop.pregAndBirthDeveloper.repository.AttachedFileRepository;
import sjspring.shop.pregAndBirthDeveloper.repository.BoardRepository;
import sjspring.shop.pregAndBirthDeveloper.repository.UserRepository;
import sjspring.shop.pregAndBirthDeveloper.service.BoardService;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
//        attachedFileRepository.deleteAll();
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
