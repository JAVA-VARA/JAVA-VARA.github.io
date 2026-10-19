// 이력서 내용. 이 파일의 글자만 고치면 /about/ 화면이 바뀐다(화면 모양은 src/pages/about.astro).
//
// 고치는 법
// - 글자는 '작은따옴표' 안에서만 고친다. 문장 안에 작은따옴표를 써야 하면 \' 로 쓴다
// - 항목을 빼려면 { 부터 }, 까지 줄을 통째로 지운다. 더하려면 비슷한 줄을 복사해 고친다
// - 쉼표(,)와 괄호 짝이 틀리면 빌드가 실패한다. 고친 뒤 site 폴더에서 npm run build 로 확인한다
// - 링크는 ['보이는 글자', '주소'] 모양이다. 링크가 없으면 links: [] 로 둔다
//
// 원칙: 연구명·데이터 내용은 쓰지 않는다. 2023년(육아 휴식)은 적지 않는다.

export const profile = {
  name: '윤석주',
  role: '임상연구코디네이터(CRC), 연구 데이터 자동화 담당',
  pitch: '사수 없이 독학으로 배워, AI 전환(AX)이 들어오기 어려운 병원 연구실에 데이터 업무 자동화를 들여오고 있습니다.',
  email: 'sj.youns1027@gmail.com',
  github: 'https://github.com/JAVA-VARA',
};

// 맨 위 경력 막대. 날짜는 'YYYY.MM' 모양이고, 지금 다니는 곳은 to: '현재'
export const careerBar = [
  { name: '리니칼 코리아', role: '임상시험 모니터링', from: '2019.05', to: '2022.12' },
  { name: '서울대학교병원', role: '연구간호사 업무 + 자동화', from: '2024.07', to: '현재' },
];

export const jobs = [
  {
    company: '서울대학교병원 대장항문외과',
    period: '2024.07. ~ 재직 중',
    title: '연구원, 연구간호사 업무',
    duties: [
      '임상 연구 대상자 안내, 차트 검토, eCRF 작성 등 연구 진행 실무',
      '원자료 정리를 손작업에서 파이프라인으로 옮기는 자동화를 혼자 설계·도입(아래 첫 프로젝트)',
    ],
  },
  {
    company: '주식회사 리니칼 코리아',
    period: '2019.05. ~ 2022.12.(3년 8개월)',
    title: '임상팀 사원(CRA)',
    duties: [
      '제약회사를 대신해 병원이 임상시험계획서와 규정대로 연구하도록 지원',
      '임상시험 데이터의 정확성·정합성 검토, 이슈 시정 조치와 재발 방지 대책 수립',
      '연구 문서 개발, 모집·진행 현황 보고, 계획서·규정 교육',
    ],
  },
];

// 대표 프로젝트: 자세히 보이는 것. points 는 ['굵은 제목', '설명']
export const featured: { name: string; kind: string; period: string; summary: string; points: string[][]; links: string[][] }[] = [
  {
    name: '임상 연구 데이터 전처리 자동화',
    kind: '서울대학교병원 대장항문외과 업무',
    period: '2024.07. ~ 진행 중',
    summary: '병원 데이터 웨어하우스에서 뽑은 원자료를 연구별 eCRF 양식의 Excel 로 바꾸는 일을 손으로 하던 것에서 파이프라인으로 옮겼습니다. 사람은 자동화가 이상하다고 표시한 칸만 봅니다.',
    points: [
      ['변수 112개', '변수 하나를 "추출 쿼리 + 정제 + 검증" 한 폴더로 묶어, 고칠 때 그 폴더 안에서 끝나게 함'],
      ['사람 검토 화면', '서술형 기록의 자동 판정을 사람이 원문과 나란히 보며 맞는지 확인하는 화면, 판단이 필요한 일을 모아 두는 대기열'],
      ['AI 에이전트 분업', 'Claude Code 가 설계·리뷰를, Codex·Jules 가 구현을 맡고 커밋 전 리뷰는 훅으로 강제'],
      ['환자 정보 보호', '식별정보는 저장소에 남기지 않고, 테스트 파일 136개는 모두 합성 데이터'],
    ],
    links: [['검토 화면 데모(합성 데이터)', '/demo/hub/']],
  },
  {
    name: '임상시험 Q&A 아카이브',
    kind: '개인 프로젝트, 운영 중',
    period: '2026.08. ~ 운영 중',
    summary: 'CRA·CRC 약 1,500명이 모인 오픈카톡방에서 되풀이되는 질문과 대화에 묻히는 답을 검색할 수 있게 모은 사이트입니다. 2026-10-19 기준 공개 Q&A 3,160건, 누적 방문자 676명, 검색 1,420회(운영자 제외).',
    points: [
      ['자동 수집', '매일 새벽 카카오톡 대화를 내보내고, LLM(Claude)이 질문·답변 쌍을 뽑아 검토 대기로 쌓음'],
      ['사람 검토', '관리자가 승인한 것만 공개. 답이 엇갈리거나 없는 질문은 따로 표시'],
      ['운영 지표', '일일 방문자, 검색어, 결과 0건 검색 비율을 보는 대시보드'],
    ],
    links: [],
  },
];

// 그 밖의 프로젝트: 한 줄씩 보이는 것
export const more: { name: string; period: string; line: string; links: string[][] }[] = [
  { name: 'usage-limit-resume', period: '2026.10.', line: 'Claude Code 가 사용량 한도로 멈추면, 한도가 풀린 뒤 작업을 자동으로 이어서 실행하는 오픈소스 플러그인', links: [['GitHub', 'https://github.com/JAVA-VARA/usage-limit-resume']] },
  { name: 'term-fit', period: '2026.10. ~', line: '두루뭉술한 요청을 현장 용어로 다듬어 주고 용어장으로 복습하게 하는 플러그인(개발 중)', links: [] },
  { name: 'Football Quiz Project', period: '2024.03. ~ 06.', line: '선수 사진으로 이름을 맞추는 퀴즈. 캐시로 결과 페이지 응답을 100초에서 3초로 줄임', links: [['GitHub', 'https://github.com/JAVA-VARA/football-quiz-project'], ['성능 테스트 글', '/blog/2024-06-18-football-quiz-project/']] },
  { name: 'Pregnant And Birth Project', period: '2023.08. ~ 2024.02.', line: '임신·육아 정보 게시판. Spring Boot 3, OAuth2 로그인, 첨부파일, 이미지 리사이징', links: [['GitHub', 'https://github.com/JAVA-VARA/PandB_Project'], ['개발 기록', '/blog/2023-08-29-project-preg-birth-1/']] },
];

export const skills = [
  { group: '매일 쓰는 것', items: ['Python', 'SQL', 'MySQL', 'pytest', 'Claude Code', 'Codex'] },
  { group: '서비스를 만들 때', items: ['TypeScript', 'Next.js', 'PostgreSQL', 'Prisma', 'Astro', 'GitHub Actions'] },
  { group: '예전에 익힌 것', items: ['Java', 'Spring Boot', 'Thymeleaf', 'Redis', 'Docker', 'GCP'] },
];

// 자격증·교육: ['왼쪽 굵은 글자', '오른쪽 설명']
export const credentials = [
  ['SQLD', '한국데이터산업진흥원, 2024.09.20.'],
  ['임상병리사', '보건복지부, 2019.03.'],
  ['학사', '연세대학교(원주) 임상병리학과, 2012.03. ~ 2019.02.'],
  ['영어', '비즈니스 회화. San Diego State University 교환 학생(2017)'],
];

// 대외활동(접혀 있는 칸)
export const activities = [
  ['교환 학생', 'San Diego State University, 2017. Oral Communication 수업에서 여러 나라 학생과 그룹 과제·발표'],
  ['Global Village', '연세대학교 원주캠퍼스, 2018. 미국 교환 학생 생활 적응 도움, 주 3회 한국어 수업 보조'],
  ['캡스톤 디자인', '연세대학교, 2016. 혈청으로 개의 알레르기를 진단하는 키트 개발, 조장으로 일정 관리'],
];
