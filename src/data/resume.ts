// /about/ 이력서 내용 데이터. UI 구성은 src/pages/about.astro에서 관리.
// 연구명·질환명·환자 원문·식별정보는 기재하지 않는다.
// 완료 실적과 개발·검증 중인 기능은 구분하여 표현한다.

export const profile = {
  name: '윤석주',
  role: '임상연구코디네이터(CRC) | 임상 데이터 자동화',
  pitch: 'CRA·CRC 경험을 바탕으로 임상 연구 데이터의 추출·전처리·검증을 자동화합니다. 실제 연구 데이터를 eCRF 업로드 형식으로 변환하고, 판단이 필요한 항목은 원자료와 함께 검토하도록 업무 흐름을 설계했습니다.',
  email: 'javavara.dev@gmail.com',
  github: 'https://github.com/JAVA-VARA',
};

export const careerBar = [
  { name: '리니칼 코리아', role: '임상시험 모니터링·데이터 검증', from: '2019.05', to: '2022.12' },
  { name: '서울대학교병원', role: '임상 연구·데이터 자동화', from: '2024.07', to: '현재' },
];

export const jobs = [
  {
    company: '서울대학교병원 대장항문외과',
    period: '2024.07. ~ 재직 중',
    title: '임상연구코디네이터(CRC) · 연구 데이터 자동화',
    duties: [
      '임상 연구 대상자 관리, 의무기록 검토, 연구 데이터 정리 및 eCRF 업로드 수행',
      'CDW 추출 데이터를 SQL·Python으로 정제·검증하는 변수별 자동화 로직을 주도적으로 도입하여 약 8,600건의 연구 데이터 업로드 수행',
      '변수별 로직을 통합해 데이터 적재부터 오류 검토, eCRF 업로드 파일 생성까지 연결하는 파이프라인 구축 및 전향연구 검증 진행',
    ],
  },
  {
    company: '주식회사 리니칼 코리아',
    period: '2019.05. ~ 2022.12. (3년 8개월)',
    title: '임상시험모니터요원(CRA)',
    duties: [
      'Phase I–IV 임상시험 8건에 참여하여 기관 관리, 임상시험 모니터링 및 진행 현황 보고 수행',
      'CRF·시험계획서 검토, 데이터 Query 해결, 기관 필수문서 관리 및 IRB 관련 업무 수행',
      'SIV 준비와 임상시험계획서·규정에 따른 연구 수행 점검; 일반 CRA 및 Drug Accountability CRA 역할 경험',
    ],
  },
];

export const featured: { name: string; kind: string; period: string; summary: string; points: string[][]; links: string[][] }[] = [
  {
    name: '임상 연구 데이터 전처리·검증 자동화',
    kind: '서울대학교병원 연구 실무 · 통합 파이프라인 구축 중',
    period: '2024.07. ~ 진행 중',
    summary: 'CDW에서 추출한 임상 연구 데이터를 SQL·Python으로 정제·검증하여 eCRF 업로드 형식으로 변환합니다. 기존 변수별 자동화로 약 8,600건을 업로드했으며, 이를 통합한 파이프라인과 사람 검토 체계를 전향연구에서 검증하고 있습니다.',
    points: [
      ['자동화 범위', '후향 연구 에피소드 약 8,600건을 기준으로 eCRF 549칸 중 423칸(77%)의 자동 입력 로직 구축. 변수별 정의·SQL·전처리·검증 로직을 모듈로 관리'],
      ['데이터 품질 검증', '누락·중복·미분류·상충 항목을 검토 대상으로 분리. 기존 분류 로직에서 동반질환 분류 오류 2,771항목(1,657명)을 식별·수정'],
      ['실무 검증', '기존 자동화 결과에 대해 한국외과연구재단의 외부 무작위 20명 감사(Audit)를 받았으며 Major Finding이 보고되지 않음. 통합 시스템의 정확도는 전향 300명 검토로 측정 중'],
      ['통합 처리 흐름', '입력 파일 사전검사 → DuckDB 적재 → 환자·수술 에피소드 연결 → SQL·pandas 전처리 → 원자료 기반 검토 → eCRF 엑셀 생성'],
      ['AI 에이전트 개발 체계', '임상 기준 정의와 결과 승인은 직접 수행하고, Claude Code는 설계·리뷰, Codex·Jules는 구현에 역할별로 활용. 실데이터가 필요한 작업은 로컬, 코드만 필요한 작업은 원격으로 나누고 Git Worktree·Hook으로 편집 제한·리뷰·병합 절차를 구성해 작업 120건을 병합. 공개 데모와 원격 테스트에는 합성 데이터만 사용'],
    ],
    links: [['검토 화면 데모(합성 데이터)', '/demo/hub/'], ['AI 에이전트 작업 지도', '/workflow/']],
  },
  {
    name: '임상시험 Q&A 아카이브',
    kind: '개인 프로젝트 · 서비스 운영',
    period: '2026.08. ~ 운영 중',
    summary: '임상시험 실무자 커뮤니티의 반복 질문과 답변을 검색 가능한 서비스로 구성했습니다. 2026-10-19 기준 공개 Q&A 3,160건, 누적 방문자 676명, 검색 1,420회(운영자 제외)를 기록했습니다.',
    points: [
      ['수집·처리 파이프라인', '대화 내보내기 → LLM 기반 질문·답변 후보 추출 → DB 적재 → 관리자 검토·공개'],
      ['품질 관리', '승인된 답변만 공개하고, 사용자 평가에서 부정확성이 제기된 항목은 재검토'],
      ['운영·개선', '검색어, 검색 결과 0건 비율, 방문·검색 현황을 모니터링하여 콘텐츠 보완에 활용'],
    ],
    links: [],
  },
];

export const more: { name: string; period: string; line: string; links: string[][] }[] = [
  { name: 'usage-limit-resume', period: '2026.10.', line: 'Claude Code 사용량 제한으로 중단된 작업을 제한 해제 이후 재개하도록 지원하는 오픈소스 플러그인', links: [['GitHub', 'https://github.com/JAVA-VARA/usage-limit-resume']] },
  { name: 'term-fit', period: '2026.10. ~', line: '모호한 개발 요청을 현업 용어와 구현 단위로 구체화하고 용어장으로 복습하는 플러그인(개발 중)', links: [] },
  { name: 'Football Quiz Project', period: '2024.03. ~ 06.', line: '축구 선수 사진 퀴즈 웹 서비스. 캐시 도입 후 결과 페이지 응답 시간 100초 → 3초로 개선', links: [['GitHub', 'https://github.com/JAVA-VARA/football-quiz-project'], ['성능 테스트 글', '/blog/2024-06-18-football-quiz-project/']] },
  { name: 'Pregnant And Birth Project', period: '2023.08. ~ 2024.02.', line: '임신·육아 정보 게시판 개발. Spring Boot 3, OAuth2 로그인, 첨부파일, 이미지 리사이징 구현', links: [['GitHub', 'https://github.com/JAVA-VARA/PandB_Project'], ['개발 기록', '/blog/2023-08-29-project-preg-birth-1/']] },
];

export const skills = [
  { group: '임상 데이터 처리·검증', items: ['Python', 'pandas', '정규표현식', 'SQL', 'MySQL', 'DuckDB', 'pytest'] },
  { group: '자동화·협업 개발', items: ['Git', 'Claude Code', 'Codex', 'GitHub Actions'] },
  { group: '웹 서비스 프로젝트 경험', items: ['TypeScript', 'Next.js', 'PostgreSQL', 'Prisma', 'Astro', 'Java', 'Spring Boot', 'Redis', 'Docker', 'GCP'] },
];

export const credentials = [
  ['SQLD', '한국데이터산업진흥원, 2024.09.20.'],
  ['임상병리사', '보건복지부, 2019.03.'],
  ['학사', '연세대학교(원주) 임상병리학과, 2012.03. ~ 2019.02.'],
  ['영어', '비즈니스 회화'],
];

export const activities = [
  ['교환 학생', 'San Diego State University, 2017. Oral Communication 수업에서 다국적 팀 과제·발표 수행'],
  ['Global Village', '연세대학교 원주캠퍼스, 2018. 미국 교환 학생의 학교생활 적응 지원 및 한국어 수업 보조'],
  ['캡스톤 디자인', '연세대학교, 2016. 혈청 기반 반려견 알레르기 진단 키트 개발 프로젝트의 조장으로 일정 관리'],
];
