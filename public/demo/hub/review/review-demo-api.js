// 공개 데모용 가짜 검토 항목 서버. 응답 모양은 원본 저장소 scripts/serve_review.py 를 따른다.
// 모든 값은 지어낸 합성 데이터이고, 저장은 이 탭 안에서만 유지된다.
(() => {
  const realFetch = window.fetch.bind(window);
  const BATCH = 'demo';
  const now = () => new Date().toLocaleString('sv-SE').slice(0, 16);
  const radio = (code, label, options) => ({code, label, options: options.map(([c, l]) => ({code: c, label: l})),
    required: true, multiple: false, original: '', original_codes: [], original_invalid: false, original_unknown: [], comment_for: null});
  const text = (code, label) => ({code, label, options: [], required: true, multiple: false, original: '',
    original_codes: [], original_invalid: false, original_unknown: [], comment_for: null});

  const rows = [
    {id: 'r1', episode_id: 'EP-0007', variable_id: 'preop.main_symptom', variable_name: '주증상', group: '수술 전 기본정보',
     reason: '원문에 선택지에 없는 증상("잔변감")이 있어 기타 여부 확인',
     columns: [{key: '서식명'}, {key: '원문'}], evidence: {'서식명': '외래 초진 기록', '원문': '2개월 전부터 잔변감과 가는 변. 혈변은 없음.'},
     fields: [{...radio('B', '종류', [[1, '복통'], [2, '혈변'], [3, '배변 습관 변화'], [4, '체중 감소'], [9, '기타']]), multiple: true, original: '3', original_codes: ['3']},
              {...text('C', '기타 내용'), required: false, comment_for: {code: 'B', options: [9]}}],
     chart_review: {state: 'none', label: 'ep-d3e0a1'}},
    {id: 'r2', episode_id: 'EP-0012', variable_id: 'preop.main_symptom', variable_name: '주증상', group: '수술 전 기본정보',
     reason: '외래 기록과 입원 기록의 증상이 서로 다름',
     columns: [{key: '서식명'}, {key: '원문'}], evidence: {'서식명': '입원 기록', '원문': '건강검진 내시경에서 발견. 증상 없음.'},
     fields: [{...radio('B', '종류', [[1, '복통'], [2, '혈변'], [3, '배변 습관 변화'], [4, '체중 감소'], [9, '기타']]), multiple: true, original: '1', original_codes: ['1']},
              {...text('C', '기타 내용'), required: false, comment_for: {code: 'B', options: [9]}}],
     chart_review: null},
    {id: 'r3', episode_id: 'EP-0007', variable_id: 'op.duration', variable_name: '수술 시간(분)', group: '수술',
     reason: '수술 시작·종료 시각이 두 쌍 기록됨(재수술 의심)',
     columns: [{key: '시작'}, {key: '종료'}, {key: '_review_rule'}], evidence: {'시작': '08:52 / 14:10', '종료': '11:57 / 15:02', '_review_rule': 'multiple_pairs'},
     fields: [{...text('VALUE', '분'), original: '185'}], chart_review: {state: 'partial', label: 'ep-d3e0a1'}},
    {id: 'r4', episode_id: 'EP-0021', variable_id: 'op.duration', variable_name: '수술 시간(분)', group: '수술',
     reason: '종료 시각이 시작보다 빠름(자정 넘김 의심)',
     columns: [{key: '시작'}, {key: '종료'}], evidence: {'시작': '22:40', '종료': '01:15'},
     fields: [{...text('VALUE', '분'), original: ''}], chart_review: null},
    {id: 'r5', episode_id: 'EP-0012', variable_id: 'pathology.pn', variable_name: '병리 N', group: '병리',
     reason: '전이 림프절 수(4개)와 N 병기(N1b)가 맞지 않음',
     columns: [{key: '판독문'}], evidence: {'판독문': 'Metastasis in 4 out of 22 regional lymph nodes (pN1b)'},
     fields: [radio('VALUE', 'N', [[0, 'N0'], [1, 'N1a'], [2, 'N1b'], [3, 'N1c'], [4, 'N2a'], [5, 'N2b']])].map(f => ({...f, original: '2'})),
     chart_review: null},
  ].map(row => ({sequence: null, decision: null, ...row}));

  const sources = {
    r1: [['외래 초진 기록', '2026-05-11', '2개월 전부터 잔변감과 가는 변. 혈변은 없음.'], ['입원 기록', '2026-05-30', '직장암 수술 위해 입원.']],
    r2: [['외래 초진 기록', '2026-04-02', '간헐적 복통.'], ['입원 기록', '2026-04-20', '건강검진 내시경에서 발견. 증상 없음.']],
    r3: [['수술 기록', '2026-06-02', '수술 시작 08:52 수술 종료 11:57'], ['수술 기록', '2026-06-02', '재수술: 시작 14:10 종료 15:02']],
    r4: [['수술 기록', '2026-07-08', '수술 시작 22:40 수술 종료 01:15']],
    r5: [['병리 결과지', '2026-04-29', 'Metastasis in 4 out of 22 regional lymph nodes (pN1b)']],
  };
  const surgery = [
    {id: 's1', patient_id: 'SYN-0031', master_date: '2026-07-14', reason: '등록 마스터 수술일과 수술기록 날짜가 다름', status: '보류', candidates: ['2026-07-15', '2026-07-14']},
    {id: 's2', patient_id: 'SYN-0018', master_date: '2026-06-23', reason: '수술기록 없음', status: '승인', confirmed_date: '2026-06-23', candidates: []},
  ];

  const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
  function summary() {
    const groups = [];
    for (const row of rows) {
      let group = groups.find(g => g.name === row.group);
      if (!group) groups.push(group = {name: row.group, pending: 0, total: 0, variables: []});
      let v = group.variables.find(x => x.id === row.variable_id);
      if (!v) group.variables.push(v = {id: row.variable_id, name: row.variable_name, pending: 0, total: 0});
      for (const target of [group, v]) { target.total++; if (!row.decision) target.pending++; }
    }
    return {groups, pending: rows.filter(r => !r.decision).length, total: rows.length};
  }
  function items(q) {
    const size = Number(q.get('size') || 50), state = q.get('status') || 'pending';
    const hits = rows.filter(r => (!q.get('group') || r.group === q.get('group'))
      && (!q.get('variable') || r.variable_id === q.get('variable'))
      && (state === 'all' || (state === 'saved') === Boolean(r.decision))
      && (q.get('chart') !== 'undone' || r.chart_review?.state !== 'done'));
    const pages = Math.max(1, Math.ceil(hits.length / size));
    const page = Math.min(Math.max(1, Number(q.get('page') || 1)), pages);
    return {page, pages, total: hits.length, items: hits.slice((page - 1) * size, page * size)};
  }
  function source(id) {
    const list = sources[id] || [];
    const columns = ['서식명', '작성일', '원문'];
    return {sources: [{name: '외래·입원·수술·병리 기록', filtered: false, total: list.length, shown_total: list.length, rows: list, all_rows: list, columns}]};
  }

  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (!url.pathname.includes('/api/')) return realFetch(input, init);
    const path = url.pathname.slice(url.pathname.lastIndexOf('/api/') + 1);
    const q = url.searchParams;
    if (init.method === 'POST') {
      const body = JSON.parse(init.body || '{}');
      if (path === 'api/answer') {
        const row = rows.find(r => r.id === body.id);
        if (!row) return reply({error: '없는 항목'}, 400);
        row.decision = {values: body.values, at: now()};
        return reply({at: row.decision.at});
      }
      if (path === 'api/publish') return reply({upload: 'data/output/demo/eCRF_upload.xlsx (데모라 파일은 만들지 않습니다)', complete: rows.every(r => r.decision)});
      if (path === 'api/surgery-review') {
        const row = surgery.find(r => r.id === body.id);
        if (!row) return reply({error: '없는 항목'}, 400);
        Object.assign(row, {status: body.status, confirmed_date: body.confirmed_date || null});
        return reply(row);
      }
      return reply({error: '허용하지 않은 요청'}, 405);
    }
    if (path === 'api/batches') return reply([BATCH]);
    if (path === 'api/summary') return reply(summary());
    if (path === 'api/items') return reply(items(q));
    if (path === 'api/source') return reply(source(q.get('id')));
    if (path === 'api/surgery-review') return reply(surgery);
    return reply({error: '없는 주소'}, 404);
  };
})();
