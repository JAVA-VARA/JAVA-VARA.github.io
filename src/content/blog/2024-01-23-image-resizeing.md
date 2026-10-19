---
title: "Image resizeing"
date: 2024-01-23
description: "Content-Type"
source: medium
original: "https://medium.com/@sj.youns1027/image-resizeing-1c07ba70e118"
theme: problem-solving
---
첨부파일 업로드 할 때, 아래 if 구문의 조건과 같이 ContentType이 이미지 파일인 경우에만 이미지 리사이징 로직이 진행되도록 코드를 작성했다.

```
if(Objects.requireNonNull(multipartFile.getContentType()).contains("image")){
    //파일 확장자명 추출
    String fileFormat = extractFileFormat(multipartFile); 
    MultipartFile resizedImage = resizer(fileName, fileFormat, multipartFile, 400);

    resizedImage.transferTo(new File(filePath));
    return new AttachedFileDto(originalFilename, fileName,filePath);
}
...생략...
//fileformat 추출하기
private String extractFileFormat(MultipartFile multipartFile) {
        return multipartFile.getContentType().substring(multipartFile.getContentType().lastIndexOf("/") + 1);
    }
...생략...
```

여기서 multipartFile의 ContentType을 어디서 가져오는 건지 궁금해서, chrome network에서 확인해보았다.

![](/images/medium/1c07ba70e118/1.png)

이미지 파일을 첨부하면 request body인 payload에 “Content-Type: image/jpeg” 가 나오는 것을 확인할 수 있다.

그런데 그 위에 Content-Disposition이라는 것이 있는데 용어에 대한 궁금증을 해결하기위해 찾아보았다.(꼬꼬무…)

## HTTP Content-Disposition 이란?

일반적인 HTTP 응답에서 Content-Disposition 헤더는 컨텐츠가 브라우저에 inline 되어야 하는 웹페이지 자체이거나 웹페이지의 일부인지, 아니며 attachment로써 다운로드 되거나 로컬에 저장될 용도로 쓰이는 것인지를 알려주는 헤더.

HTTP Response Body에 오는 콘텐츠의 성향을 알려주는 속성.Content-Disposition에 attachment를 주고 filename과 함께 주게 되면 body에 오는 값을 다운로드 받으라는 뜻이 된다.
