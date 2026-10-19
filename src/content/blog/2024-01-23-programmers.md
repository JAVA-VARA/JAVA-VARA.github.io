---
title: "Programmers"
date: 2024-01-23
description: "LV02"
source: medium
original: "https://medium.com/@sj.youns1027/programmers-63cb5c17d365"
---
LV02

[**코딩테스트 연습 - 짝지어 제거하기**  
*문제 설명 짝지어 제거하기는, 알파벳 소문자로 이루어진 문자열을 가지고 시작합니다. 먼저 문자열에서 같은 알파벳이 2개 붙어 있는 짝을 찾습니다. 그다음, 그 둘을 제거한 뒤, 앞뒤로 문자열을 이어 붙입니다. 이…*school.programmers.co.kr](https://school.programmers.co.kr/learn/courses/30/lessons/12973)[](https://school.programmers.co.kr/learn/courses/30/lessons/12973)

### [Solution 1]

시간복잡도가 O(n²)이라 효율성 test에서 탈락했다.

```
package Programmers_Solution.LV02;

public class RemovePair {
    public int solution(String s){
        int answer =0;
        for(int i =1; i < s.length()-1;){

            if(s.charAt(0) == s.charAt(1)){
                s = s.substring(2);
                i=1;
                continue;
            }

            if(s.charAt(i) == s.charAt(i+1)){
                s = s.substring(0,i) + s.substring(i+2);
                i=1;
                continue;
            }

            i++;
        }
        if(s.isEmpty()){
            answer = 1;
        }

        return answer;
    }

    public static void main(String[] args) {
        RemovePair removePair = new RemovePair();
        System.out.println(removePair.solution("baabaa"));
        System.out.println(removePair.solution("cdcd"));
        System.out.println(removePair.solution("aabb"));
    }
}
```

### [Solution 2]

정확도는 통과했지만 효율성 test에서 탈락. replaceAll 메서드를 사용하면서 시간복잡도가 O(n²)이 되어버렸다.

```
package Programmers_Solution.LV02;

import java.util.Arrays;

public class RemovePairing {
    public int solution(String s){
        RemovePairing removePair = new RemovePairing();
        int answer =1;
        char[] chars = s.toCharArray();

        while (chars.length > 0){
            char[] ogChars = chars;
            String result = removePair.removedStr(chars);
            chars = result.toCharArray();

            if(Arrays.equals(ogChars, chars)){
                return 0;
            }
        }

        return answer;
    }

    private String removedStr(char[] chars){
        for(int i =0; i < chars.length-1; i++){


            if(chars[i] == chars[i+1]){
                chars[i] = 65;
                chars[i+1] = 65;
            }
        }
        String newS = new String(chars);
        return newS.replaceAll("A", "");
    }
}
```

![](/images/medium/63cb5c17d365/1.png)

### [Solution 3]

stack을 사용하여 시간복잡도를 O(n)으로 줄여 test에 통과:)

```
import java.util.Stack;

public class RemovingPair {
    public int solution(String s){
        Stack<Character> stack = new Stack<>();

        for(char c : s.toCharArray()){
            if(!stack.isEmpty() && stack.peek() == c){
                stack.pop();
            }else {
                stack.push(c);
            }
        }
        if(stack.isEmpty()){
            return 1;
        }
        return 0;
    }
}
```
