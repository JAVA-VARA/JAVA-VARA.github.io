---
title: "Image MIME-TYPE_Convert GIF"
date: 2024-02-01
description: "파일 업로드 후 잘만 움직이던 gif 파일이 image reszing 을 거치니 굳어버렸다."
source: medium
original: "https://medium.com/@sj.youns1027/image-mime-type-51742a9813ec"
---
파일 업로드 후 잘만 움직이던 gif 파일이 image reszing 을 거치니 굳어버렸다.

이유를 찾아보니 이미지를 리사이징을 처리하는 과정에서 프레임 간의 시간 간격이 변경되는 등 gif의 특성을 해치게 되면 움직임이 손실될 수 있다고한다.

손실없이 gif파일을 리사이징하기 위해 별도의 처리가 필요한데, 이전에 heic를 convert할 때 사용했던 imageMagicK라는 프로그램을 이용하여 문제를 해결하기로 했다.

이미 깔려있는 프로그램이라 gif 파일을 resizing하는 방법에 대해서는 공식홈페이지를 참고했다.

[**Resizing or Scaling -- ImageMagick Examples**  
*We look at enlarging and reducing images in various ways. The image remains intact and whole, but individual points of…*imagemagick.org](https://imagemagick.org/Usage/resize/)[](https://imagemagick.org/Usage/resize/)

![](/images/medium/51742a9813ec/1.png)

프로그램이 잘 작동하는지 먼저 window powershell에 접속하여 테스트를 했다.

- 명령어는 아래와 같이 작성하면된다.

```
magick convert original.gif(원본 파일 경로) -resize length x width resized.gif(변환할 파일의 경로)
```

```
PS C:\Users\sjyou> magick convert C:\Users\sjyou\IdeaProjects\PandBproject\PandB_Project\src\main\resources\testingImages\GifTest.gif -resize 64x64 C:\Users\sjyou\IdeaProjects\PandBproject\PandB_Project\src\main\resources\testingImages\test22.gif
```

![](/images/medium/51742a9813ec/2.png)

*리사이징 후 코딱지만해진 코끼리*

### #ImageMagicKResizing.java

1. 임시 디렉터리 생성 & 클라이언트가 요청한 파일 저장

```
public class ImageMagicKResizing {

    public void resizeGif(MultipartFile gifImagefile, String filename, int targetWidth, int targetHeight, String resizedFilePath )
            throws IOException, InterruptedException {
        
        //임시 디렉터리 생성
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
        String orgFilePath = tempRelativePath + filename;
        gifImagefile.transferTo(new File(orgFilePath));
```

2. 저장된 파일을 리사이징 후 프로젝트 디렉터리에 저장하도록 했다.

```
public class ImageMagicKResizing {
  public void resizeGif(MultipartFile gifImagefile, String filename, int targetWidth, int targetHeight, String resizedFilePath )
            throws IOException, InterruptedException {

    // 생략//

    //java에서 실행할 명령문 작성
    String command = String.format("magick convert %s -resize %dx%d %s", orgFilePath, targetWidth, targetHeight, resizedFilePath);

    //imageMagicK 실행하여 gif 파일 리사이징
    Process process = new ProcessBuilder("cmd", "/c", command).start();
    int exitCode = process.waitFor();

    if (exitCode == 0) {
        System.out.println("GIF resizing successful.");
    } else {
        System.err.println("GIF resizing failed. Exit code: " + exitCode);
    }
}

}
```

### #LocalUploadUtil

gif파일인 경우 ImageMagicKResizing 클래스를 불러와 이미지 리사이징하도록 조건문을 추가했다.

```
else if(originalFilename.endsWith("gif") || originalFilename.endsWith("GIF")){
            ImageMagicKResizing imageMagicKResizing = new ImageMagicKResizing();
            imageMagicKResizing.resizeGif(multipartFile, fileName, 400, 400, filePath);
        }
```
