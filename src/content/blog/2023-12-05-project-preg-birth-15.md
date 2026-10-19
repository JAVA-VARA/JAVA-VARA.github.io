---
title: "Project_Preg&Birth #15"
date: 2023-12-05
description: "첨부파일 업로드/다운로드-3"
source: medium
original: "https://medium.com/@sj.youns1027/project-preg-birth-15-43954a965d21"
---
### 이미지 파일 설정 변경 및 다운로드

업로드 한 파일 중 이미지 파일은 게시판에 볼 수 있도록 설정(그 외 파일은 다운로드 받을 수 있도록 설정)

### #WebOAuthSecurityConfig.java

WebMvcConfigurer를 implements 하여 addResourceHandlers를 오버라이드함. addResourceHandler로 파일이 저장되어 있는 위치(addResourceLocations)와 매핑하여 웹브라우저에 전달해준다.

```
public class WebOAuthSecurityConfig implements WebMvcConfigurer{

//생략
@Override
    public void addResourceHandlers(ResourceHandlerRegistry registry){
        registry.addResourceHandler("/photo/**")
                .addResourceLocations("file:///C:/Users/sjyou/IdeaProjects/PandB_Project_updated/files/");
    }
//생략
}
```

### #freeBoard.html

- 다운로드 기능 추가
- board에 매핑된 파일 이미지를 게시판에서 볼 수 있도록 코드 변경.
- 이미지 파일을 게시판에 띄워주도록 변

```
<article>
                <input type="hidden" id="article-id" th:value="${board.boardNo}">

                <div class="card-title">
                    <span class="np_18px_span" th:text="${board.title}"></span>
                </div>

                <div class="top_area ngeb d-flex justify-content-end mt-3">
                    <span th:text="|${board.author}|"></span>
                    <span class="date m_no"
                          th:if="${#strings.equals(#temporals.format(board.createdAt, 'yyyy-MM-dd'), #dates.format(#dates.createNow(), 'yyyy-MM-dd'))}"
                          th:text="${#temporals.format(board.createdAt, 'HH:mm')}"></span>
                    <span class="date m_no"
                          th:unless="${#strings.equals(#temporals.format(board.createdAt, 'yyyy-MM-dd'), #dates.format(#dates.createNow(), 'yyyy-MM-dd'))}"
                          th:text="${#temporals.format(board.createdAt, 'yyyy-MM-dd')}"></span>
                </div>

                <div class="card-body">
                    <span th:text="${board.content}"></span>

                    <div th:each="attachedFile : ${board.attachedFileList}">
                        <img th:if="${#strings.endsWith(attachedFile.originalFileName, '.png') or #strings.endsWith(attachedFile.originalFileName, '.jpg')}"
                             th:src="@{|/photo/${attachedFile.fileName}|}"
                             style="max-width: 50%; height: auto;"
                             alt="지원하지 않는 파일입니다.">
                    </div>

                    <h6 class="top_area mt-5"><strong>[첨부 파일 목록]</strong></h6>
                    <div th:each="attachedFile : ${board.attachedFileList}">
                        <a th:href="@{|/photo/${attachedFile.fileName}|}" download="downloaded_file"
                           th:text="${attachedFile.originalFileName}"></a>
                    </div>

                </div>


            </article>
```
