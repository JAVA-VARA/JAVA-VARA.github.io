---
title: "Button Type"
date: 2024-01-11
description: "회원 가입 기능을 수정했다. 이전에는 아무 정보를 입력하지 않아도 form이 제출이 되었으나, 필수 정보를 입력하지 않으면 안내 문구가 뜨도록 회원 가입 각 항목에 required 문구를 추가했다."
source: medium
original: "https://medium.com/@sj.youns1027/button-type-89f75ae695ad"
---
회원 가입 기능을 수정했다. 이전에는 아무 정보를 입력하지 않아도 form이 제출이 되었으나, 필수 정보를 입력하지 않으면 안내 문구가 뜨도록 회원 가입 각 항목에 required 문구를 추가했다.

### #src/main/resources/temlate/signup.html

```
//생략
<form class="row g-3" id="signupForm" >
  <div class="col-md-6">
      <label for="signupEmail" class="col-sm-2 col-form-label">이메일:</label>
      <input type=email class="form-control" id="signupEmail" name="email" required>
      <p ></p>
  </div>

  <div>
      <p th:if="${dto != null}"></p>
      <p th:if="${valid_nickName} != null" th:text="${valid_nickName}"></p>
  </div>


  <div class="col-md-6">
      <label for="signupName" class="col-sm-2 col-form-label">이름:</label>
      //input에 required 추가하여 미 입력시 form 제출이 되지 않도록 함.
      <input type="text" class="form-control" id="signupName" name="name" required>
  </div>

  <div class="col-md-6">
      <label for="signupNickname" class="col-sm-2 col-form-label">닉네임:</label>
      <input type="text" class="form-control" id="signupNickname" name="nickname" placeholder="10 글자 이내" required>
  </div>

  <div class="col-md-6">
      <label for="signupHp" class="col-sm-2 col-form-label">핸드폰:</label>
      <input type="text" class="form-control" id="signupHp" name="hp" placeholder=" - 없이 숫자만 입력">
  </div>

  <div class="col-md-6">
      <label for="signupBabyDue" class="col-sm-5 col-form-label">출산 예정일:</label>
      <input type="date" class="form-control" id="signupBabyDue" name="babyDue">
  </div>

  <div class="col-md-6">
      <label for="signupPassword" class="col-sm-5 col-form-label">비밀번호:</label>
      <input type="password" class="form-control" id="signupPassword" name="password" required>
  </div>

  <div class="col-md-6">
      <label for="signupPasswordConfirm" class="col-sm-5 col-form-label">비밀번호 확인:</label>
      <input type="password" class="form-control" id="signupPasswordConfirm" name="passwordConfirm" required>
  </div>
  <button type="button" class="btn btn-outline-primary" id="signup-btn">회원 가입</button>
</form>

//생략
```

기능을 만들고 test 시에는 잘 작동했으나 아래의 javascript와 연결하니 미입력한 항목이 있어도 form이 제출이 되었다.

### #src/main/resources/static/js/nonOauth2Signup.js

```
const signup = document.getElementById('signup-btn');
if (signup) {
    signup.addEventListener("click", ev => {

        fetch('/users',
            {
                method: 'POST',
                headers:{
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: document.getElementById("signupEmail").value,
                    name: document.getElementById("signupName").value,
                    nickName: document.getElementById("signupNickname").value,
                    hp: document.getElementById("signupHp").value,
                    babyDue: document.getElementById("signupBabyDue").value,
                    password: document.getElementById("signupPassword").value
                })

            })
            .then(response => {
                if(response.status ===200 || response.status === 201){
                    alert('회원 가입이 완료되었습니다.');
                    location.replace("/login")
                }else {
                    alert('회원 가입이 오류입니다. 다시 시도해주세요');
                }
            })
    });
}
```

## [문제의 원인]

button의 type에는 submit, reset, button 3가지가 있는데, signup.html의 input 항목에 “required”를 입력하였으나, form이 제출되는 원인은 바로 button의 type을 button으로 지정했기 때문이었다.

![](/images/medium/89f75ae695ad/1.png)

1. **button type은** default behavior가 없다. button 만 생성해서 누르면 아무일도 일어나지 않아, js와 연결해서 사용해야한다.
2. form data의 필수 항목의 작성 여부와 상관없이, click event가 발생하면 js문이 실행되는 것이 원인.

### #signup.html

```
<form class="row g-3" id="signupForm" >
  //...생략...
  <button type="button" class="btn btn-outline-primary" id="signup-btn">회원 가입</button>
</form>
```

이를 해결하기 위해서는 button type을 “submit”으로 해야한다.

### #변경된 signup.html

button type을 submit으로 변경했다.

```
<button type="submit" class="btn btn-outline-primary" id="signup-btn">회원 가입</button>
```

### #변경된 nonOauth2Signup.js 파일

```
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener("submit", ev => {
        ev.preventDefault();

        fetch('/users',
            {
                //생략
            })
    });
}
```

다만, submit type은 default로 form data를 server로 보내기 때문에 javascript의 fetch를 통해 formdata로 post 요청을 보내려면, default 값을 막고(ev.preventDefault();), 내가 의도한 대로 요청을 보낼 수 있도록 코드를 작성해야 한다.

위와 같이 html 파일과, js파일을 수정함으로써, 회원 가입 시 필수 항목이 모두 작성된 경우에만 post 요청이 가도록 했다.

### 참고:

[**[javascript] 자바스크립트 fetch로 formdata post 보내기**  
*폼 데이터를 전송할 때 JavaScript의 fetch api를 사용하면 데이터 전송을 세밀하게 제어할 수 있습니다. 이는 submit과 동시에 데이터를 전송하고 새 페이지로 리다이렉션하는 표준 HTML 동작으로…*sisiblog.tistory.com](https://sisiblog.tistory.com/261)[](https://sisiblog.tistory.com/261)
