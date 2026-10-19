---
title: "HTML(Hyper Text Markup Language)"
date: 2023-07-04
description: "[링크]"
source: medium
original: "https://medium.com/@sj.youns1027/html-hyper-text-markup-language-9501c7efdb2b"
---
- <a></a>: 문자가 링크임을 알려준다.(anchor)
- href = “url 주소”: 연결할 url 주소
- target = “ url 주소: 클릭 시 url이 열릴 주소
- title: url에 마우스 올리면 안내가 뜬다.

## [그 외 tag]

- **<ul></ul> **리스트 항목 group으로 묶어준다.(**u**nordered **l**ist)
- **<ol></ol>** 리스트 항목 group으로 묶어준다. + 숫자(**o**rdered **l**ist)
- **<li></li> **: 각 항목을 리스트로 표현하고 싶을 때(list)
- **<p> </p>** 단락 나눔. (**p**aragraph)
- **<br>** 줄 바꿈(forced line **br**eak) *닫히는 tag 필요 없음.
- **<img></img> 이미지**

```
<html>
<body>
    <img src="img.jpg" width=300 height="300" alt="산 이미지" title="산 이미지">
</body>
</html>

*alternative text: 이미지가 깨졌을 때 나오는 text
```

### 테이블

- <table></table>
- <td></td> table column
- <tr> </tr>table row

```
<html>

<head><meta charset="utf-8"></head>
<body>

<table border="2">
    <tr>
        <td>이름</td>     <td>성별</td>   <td>주소</td>
    </tr>

    <tr>
        <td>홍킬동</td>  <td>남</td>      <td >조선</td>
    </tr>

    <tr>
        <td>호랑이</td>  <td>여</td>      <td>청주</td>
    </tr>

</table>

</body>
</html>
```

## <form></form>

사용자가 입력한 정보를 서버로 보냄.

```
<html>
<head>
    <meta charset="utf-8">
</head>
<body>
<form action="http://localhost/login.php"> 
//action에 아래 입력한 정보를 보낼 주소를 입력한다.

    <p>아이디 : <input type="text" name="id"></p>
    <p>비밀번호 : <input type="password" name="pwd"></p>
    <p>주소 : <input type="text" name="address"></p>

    <input type="submit">
    //제출 버튼

</form>
</body>
</html>
```

![](/images/medium/9501c7efdb2b/1.png)

- input: 사용자가 입력할 수 있는 빈칸
- name: 각 컨트롤 별 이름.

<textarea></textarea>

사용자에게 여러 줄의 text를 입력 받을 수 있다.

```
<p>textarea :
   <textarea cols="50" rows="2">default value</textarea>
</p>
```

![](/images/medium/9501c7efdb2b/2.png)

### hidden field

UI에 보이지 않지만 서버에 필요한 정보를 전달할 때 사용

```
<html>
    <head>
        <meta charset="utf-8">
    </head>
    <body>
        <form action="http://localhost/hidden.php">
            <input type="text" name="id">
            <input type="hidden" name="hide" value="egoing">
            <input type="submit">
        </form>
    </body>
</html>
```

## [브라우저의 부가 적인 정보]

<title></title> tab 제목에 표시된다.

<meta charset = “UTF-8”>

=> 본문이 아닌 TAG는 <head></head> 안에 넣는다.

ex)

```
<html>


<head>
  <title>HTML - 수업소개</title>
  <meta charset="utf-8">
</head>


<body>
<h1>HTML</h1>
<ol>
  <li>기술소개</li>
  <li>기본문법</li>
  <li>하이퍼텍스트와 속성</li>
  <li>리스트와 태그의 중첩</li>
</ol>
 
<h2>선행학습</h2>
 
본 수업을 효과적으로 수행하기 위해서는 웹애플리케이션에 대한 전반적인 이해가 필요합니다. 이를 위해서 준비된 수업은 아래 링크를 통해서 접근하실 수 있습니다. 
</body>


</html>
```

## DOCTYPE(Document Type Declaration)

어떤 버전의 html을 사용할 지 선언하는 것.
