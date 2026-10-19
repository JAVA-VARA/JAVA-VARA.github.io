// 공개 데모용 가짜 판단 대기열 서버. 응답 모양은 원본 저장소 scripts/serve_decisions.py 를 따른다.
// 항목은 실제 대기열을 본뜬 지어낸 예시이고, 답은 이 탭 안에서만 유지된다.
(() => {
  const realFetch = window.fetch.bind(window);
  const files = [
    {file: 'docs/decisions/worktree-op-duration.md', branch: 'worktree-op-duration', session: '수술 시간 규칙', items: [
      {id: 'D1', kind: '차단', status: '대기', title: '재수술이 같은 날 있으면 수술 시간을 어떻게 셀까', answer: '', applied: '', body: [
        '정할 것: 같은 날 수술 기록이 두 쌍이면 eCRF 수술 시간에 무엇을 넣을지',
        '선택지: 1) 첫 수술만 2) 두 수술의 합 3) 사람 검토로 보냄',
        '영향: 1) 합성 배치 기준 3건 값이 바뀜 2) 2건이 eCRF 상한을 넘음 3) 검토 3건 늘어남',
        '추천: 1 — eCRF 정의서의 "index operation" 기준과 맞음',
        '근거: 합성 배치에서 같은 날 두 쌍인 에피소드 3건']},
      {id: 'D2', kind: '잠정', status: '잠정진행', title: '자정 넘긴 종료 시각은 다음 날로 본다', answer: '', applied: '', body: [
        '정할 것: 종료 시각이 시작보다 빠를 때 처리',
        '추천: 1 — 종료 시각에 하루를 더함(커밋 a1b2c3d 로 먼저 반영)',
        '근거: 22시 이후 시작한 수술 2건 모두 다음 날 새벽 종료']},
    ]},
    {file: 'docs/decisions/worktree-main-symptom.md', branch: 'worktree-main-symptom', session: '주증상 사전', items: [
      {id: 'D1', kind: '잠정', status: '대기', title: '"잔변감"을 배변 습관 변화로 묶을까', answer: '', applied: '', body: [
        '정할 것: 사전 낱말 "잔변감"의 선택지',
        '선택지: 1) 배변 습관 변화 2) 기타',
        '추천: 2 — 정의서 예시에 없는 표현은 기타로 두고 내용 칸에 적음']},
      {id: 'D2', kind: '차단', status: '승인', title: '검진에서 발견된 무증상은 "없음"으로 둔다', answer: '1번', applied: '사전 갱신 커밋 9f8e7d6', body: [
        '정할 것: 건강검진 발견 기록의 주증상', '선택지: 1) 없음 2) 판단 불가', '추천: 1 — 원문에 "증상 없음"이 명시됨']},
    ]},
  ];
  const history = [{at: '2026-10-15T14:02', branch: 'worktree-main-symptom', item_id: 'D2', kind: '차단',
    title: '검진에서 발견된 무증상은 "없음"으로 둔다', status: '승인', answer: '1번'}];
  const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});

  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.includes('/api/')) return realFetch(input, init);
    const path = url.pathname.slice(url.pathname.lastIndexOf('/api/') + 1);
    if (path === 'api/items') return reply(files);
    if (path === 'api/history') return reply(history);
    if (path === 'api/answer' && init.method === 'POST') {
      const body = JSON.parse(init.body || '{}');
      const file = files.find(f => f.file === body.file);
      const item = file?.items.find(i => i.id === body.id);
      if (!item) return reply({error: '없는 항목'}, 400);
      Object.assign(item, {status: body.status, answer: body.answer});
      history.unshift({at: new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T'), branch: file.branch,
        item_id: item.id, kind: item.kind, title: item.title, status: body.status, answer: body.answer});
      return reply({ok: true});
    }
    return reply({error: '없는 주소'}, 404);
  };
})();
