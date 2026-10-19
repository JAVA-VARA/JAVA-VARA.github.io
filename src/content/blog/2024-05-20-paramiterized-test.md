---
title: "Paramiterized Test"
date: 2024-05-20
description: "유저가 맞춘 문제 개수에 따라 레벨을 반환하는 로직에 대한 test case를 만들었다."
source: medium
original: "https://medium.com/@sj.youns1027/paramiterized-test-e0de92330a5b"
---
유저가 맞춘 문제 개수에 따라 레벨을 반환하는 로직에 대한 test case를 만들었다.

맞춘 개수 별로 레벨이 정확하게 반환되는지 확인하고 싶어 레벨별로 test code를 만들었는데, given 절에 입력한 final String 변수(correctAnswers, level )들만 제외하고 나머지 로직은 동일하게 반복되었다.

코드를 처음만들 때는 복사 붙여넣기만 하면되서 쉬웠지만 맞춘 문제 개수에 따라 반환되는 레벨을 바꾸고 싶을 때마다 모든 코드들을 수정해야 하는 귀찮은 일이 계속 생겼다.

어떻게 하면 편하게 수정할 수 있을까 찾아보던 중 Paramiterized Test 라는 것을 알게 되었다.

### Paramiterized Test

![](/images/medium/e0de92330a5b/1.png)

*[https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests](https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests)*

Junit5 User guide에 보면 하나의 test를 다른 인자들로 여러 번 수행할 수 있게 해준다고 한다.

![](/images/medium/e0de92330a5b/2.png)

*[https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests](https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests)*

또, 넣어주고 싶은 인자의 변수가 여러개 일때는 @CsvSource 어노테이션을 쓸 수 있다.

내 test code는 final String 변수의 값을 제외하고는 모두 동일하기 때문에 변수들(correctAnswers, leve)을 인자값으로 넣어준다면 하나의 test code로 관리할 수 있겠다는 생각이 들어 바로 변경해 주었다.

- as-is

```
    @Test
    @DisplayName("유저가 맞춘 정답 갯수를 기준으로 별칭을 반환한다_뉴비_0to3")
    void showResult_0to3() throws  Exception{

        //given 유저가 맞춘 갯수 지정 / 갯수에 따른 레벨 지정
        int correctAnswers = 3;
        final String level = "뉴비";
        final String url = "/quizzes/result";
        QuizResultRequestDto request = new QuizResultRequestDto(correctAnswers,teamId);
        final String requestBody = objectMapper.writeValueAsString(request);

        //when 맞춘 갯수를 controller에 전달
        ResultActions resultActions = mockMvc.perform(
                MockMvcRequestBuilders.post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody));

        //then 반환한 별칭 == given에 지정한 별칭 일치하는지 확인
        resultActions
                .andExpect(status().isOk())
                .andExpect(view().name("result"))
                .andExpect(model().attributeExists("correctAnswers"))
                .andExpect(model().attribute("correctAnswers", correctAnswers))
                .andExpect(model().attributeExists("level"))
                .andExpect(model().attribute("level", Matchers.hasProperty("levels", Matchers.is(level))));
    }

    @Test
    @DisplayName("유저가 맞춘 정답 갯수를 기준으로 별칭을 반환한다_패션_4to6")
    void showResult_4to6() throws  Exception{

        //given 유저가 맞춘 갯수 지정 / 갯수에 따른 레벨 지정
        int correctAnswers = 6;
        final String level = "패션";
        final String url = "/quizzes/result";
        QuizResultRequestDto request = new QuizResultRequestDto(correctAnswers,teamId);
        final String requestBody = objectMapper.writeValueAsString(request);

        //when 맞춘 갯수를 controller에 전달
        ResultActions resultActions = mockMvc.perform(
                MockMvcRequestBuilders.post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody));

        //then 반환한 별칭 == given에 지정한 별칭 일치하는지 확인
        resultActions
                .andExpect(status().isOk())
                .andExpect(view().name("result"))
                .andExpect(model().attributeExists("correctAnswers"))
                .andExpect(model().attribute("correctAnswers", correctAnswers))
                .andExpect(model().attributeExists("level"))
                .andExpect(model().attribute("level", Matchers.hasProperty("levels", Matchers.is(level))));

    }
    @Test
    @DisplayName("유저가 맞춘 정답 갯수를 기준으로 별칭을 반환한다_라이트 팬_7to9")
    void showResult_7to9() throws  Exception{

        //given 유저가 맞춘 갯수 지정 / 갯수에 따른 레벨 지정
        int correctAnswers = 8;
        final String level = "라이트 팬";
        final String url = "/quizzes/result";
        QuizResultRequestDto request = new QuizResultRequestDto(correctAnswers,teamId);
        final String requestBody = objectMapper.writeValueAsString(request);

        //when 맞춘 갯수를 controller에 전달
        ResultActions resultActions = mockMvc.perform(
                MockMvcRequestBuilders.post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody));

        //then 반환한 별칭 == given에 지정한 별칭 일치하는지 확인
        resultActions
                .andExpect(status().isOk())
                .andExpect(view().name("result"))
                .andExpect(model().attributeExists("correctAnswers"))
                .andExpect(model().attribute("correctAnswers", correctAnswers))
                .andExpect(model().attributeExists("level"))
                .andExpect(model().attribute("level", Matchers.hasProperty("levels", Matchers.is(level))));
    }

    @Test
    @DisplayName("유저가 맞춘 정답 갯수를 기준으로 별칭을 반환한다_썩은물_10")
    void showResult_10() throws  Exception{

        //given 유저가 맞춘 갯수 지정 / 갯수에 따른 레벨 지정
        int correctAnswers = 10;
        final String level = "그 자체";
        final String url = "/quizzes/result";
        QuizResultRequestDto request = new QuizResultRequestDto(correctAnswers,teamId);
        final String requestBody = objectMapper.writeValueAsString(request);

        //when 맞춘 갯수를 controller에 전달
        ResultActions resultActions = mockMvc.perform(
                MockMvcRequestBuilders.post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody));

        //then 반환한 별칭 == given에 지정한 별칭 일치하는지 확인
        resultActions
                .andExpect(status().isOk())
                .andExpect(view().name("result"))
                .andExpect(model().attributeExists("correctAnswers"))
                .andExpect(model().attribute("correctAnswers", correctAnswers))
                .andExpect(model().attributeExists("level"))
                .andExpect(model().attribute("level", Matchers.hasProperty("levels", Matchers.is(level))));

    }
```

- to-be

4개의 test 테스트로 관리되던 것을 1개로 합칠 수 있었다.

```
    @ParameterizedTest
    @DisplayName("유저가 맞춘 정답 갯수를 기준으로 레벨을 반환한다")
    @CsvSource({
            "3, 뉴비",
            "6, 패션",
            "8, 라이트 팬",
            "10, 그 자체"
    })
    void showResult(int correctAnswers, String level) throws Exception {

        final String url = "/quizzes/result";
        QuizResultRequestDto request = new QuizResultRequestDto(correctAnswers,teamId);
        final String requestBody = objectMapper.writeValueAsString(request);

        //when 맞춘 갯수를 controller에 전달
        ResultActions resultActions = mockMvc.perform(
                MockMvcRequestBuilders.post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody));

        //then 반환한 별칭 == given에 지정한 별칭 일치하는지 확인
        resultActions
                .andExpect(status().isOk())
                .andExpect(view().name("result"))
                .andExpect(model().attributeExists("correctAnswers"))
                .andExpect(model().attribute("correctAnswers", correctAnswers))
                .andExpect(model().attributeExists("level"))
                .andExpect(model().attribute("level", Matchers.hasProperty("levels", Matchers.is(level))));
    }
```

후훗!
