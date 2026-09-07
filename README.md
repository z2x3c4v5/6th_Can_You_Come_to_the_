# Can you come to the ___? · 친구 초대하기

6학년 영어 **초대하고 대답하기** 단원 학습용 웹앱입니다.
교과서의 행사 표현(`Can you come to my birthday party?` 등)뿐 아니라 **초등학생이 좋아할 행사**로
초대하고, **승낙·거절**하고, **약속 장소·시간**까지 말하며 익힐 수 있도록 만들었습니다.
(5학년 *What will you do this summer?* 페이지와 같은 구성, 🎉 파티 테마 디자인)

## 주요 표현

| 역할 | 표현 |
|------|------|
| 초대 | **Can you come to (the) ___?** |
| 승낙 | **Of course.** · Sure. · Yes, I can. · Sounds fun! · Okay, I'll be there. |
| 거절 | **Sorry, but I can't. I have a ___.** |
| 약속 | **Please come to (장소) at (시간).** |

## 기능

- 🎉 **초대하기 (Can you come to ~?)** — 초급·중급·고급 난이도 × 2가지 행사 종류, **총 48문장**
  - 📘 교과서 행사 6개: my birthday party · taekwondo show · laser show · book festival · movie festival · cooking class party
  - 🎈 재미있는 행사 10개: K-pop concert · slime festival · magic show · school festival · pizza party · robot show · game party · dance contest · Halloween party · sleepover party
- 💬 **대답하기** — 승낙 5개 카드 · 거절은 `Sorry, but I can't. I have a ___.` 빈칸에 이유 10개 중 골라 채우기 (piano lesson, math test, soccer game, cold, headache …)
- 📍 **약속 잡기** — `Please come to ___ at ___.` 빈칸에 장소 10개(my house, the park, the library …) · 시간 10개(10 o'clock, noon, 2:30 …)를 골라 채우고 듣기 · ⭐ 담기
- 🧩 **대화 만들기** — `행사` + `대답` (+ 승낙 시 `장소` + `시간`)을 골라 A/B 대화를 조합
  - 거절했는데 장소·시간을 고르거나, 승낙 후 장소·시간이 빠지면 **맞는지 검사**해 알려주고,
    올바른 대화는 **말풍선 대화 + 한글 번역 + 듣기(TTS)** 제공
  - 🎲 무작위 조합 버튼, ⭐로 연습 목록에 담기
- 🎤 **내 문장 연습** — ⭐로 담은 문장·대화를 마이크로 말하면 **발음 정확도** 측정 (Chrome 권장)
- 단어 클릭 시 **뜻 풍선 + 발음**, 말하기 **속도 조절** 슬라이더

브라우저 내장 **Web Speech API**(음성 합성·음성 인식)를 사용합니다.
선택한 문장과 연습 기록은 브라우저(localStorage)에 저장됩니다.

## 사용 방법

`index.html`을 브라우저(크롬 권장)에서 열면 됩니다. 별도 설치가 필요 없습니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 화면 구조(탭·섹션) |
| `style.css`  | 디자인·파티 테마 |
| `data.js`    | 초대·대답·장소·시간 문장, 단어 뜻, 대화 만들기 데이터 |
| `app.js`     | 음성·단어 풍선·대화 만들기·연습 채점 로직 |
