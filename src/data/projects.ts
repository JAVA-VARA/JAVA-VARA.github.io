// 프로젝트 페이지(/projects/)에 모아 보여 줄 연재. 위에 있는 프로젝트가 먼저 나온다
// slug: 날짜를 뗀 글 slug 가 이 패턴으로 시작하면 이 프로젝트 글이다(끝이 번호든 해시든 상관없다)
// titlePrefix: 목록에서 뗄 제목 앞부분. 떼고 남는 게 없으면(#9 처럼 번호뿐) 글 설명을 대신 쓴다
export type Project = {
  id: string;
  name: string;
  summary: string;
  stack: string[];
  slug: RegExp;
  titlePrefix: RegExp;
};

export const PROJECTS: Project[] = [
  {
    id: 'football-quiz',
    name: 'Football Quiz',
    summary: '축구 선수 사진을 보고 이름을 맞히는 퀴즈 서비스. 배포 후 한 달 동안 77명이 썼고, 그 뒤 성능 테스트로 병목을 찾았다.',
    stack: ['Selenium', 'Redis', 'JPA', 'JMeter'],
    slug: /^football-quiz-project/,
    titlePrefix: /^football[- _]quiz[- _]project\s*[-#]?\s*\d*\s*/i,
  },
  {
    id: 'preg-birth',
    name: 'Project Preg&Birth',
    summary: '임신·출산을 앞둔 부모가 정확한 정보를 한곳에서 보고 서로 묻고 답하는 게시판 서비스.',
    stack: ['Spring Boot', 'JPA', 'MySQL', 'AWS'],
    slug: /^project-preg-birth/,
    titlePrefix: /^project[_ ]preg&birth\s*[-#]?\s*\d*\s*/i,
  },
];
