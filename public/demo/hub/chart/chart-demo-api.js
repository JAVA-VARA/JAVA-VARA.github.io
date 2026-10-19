// 공개 데모용 가짜 차트 검토 서버. api/* 요청을 브라우저 안에서 처리한다.
// 규칙은 원본 저장소 scripts/serve_chart_review.py 와 pipeline/chart_review/store.py 를 옮긴 것이다.
// 판단은 이 탭의 sessionStorage 에만 남는다.
(() => {
  const llm = document.documentElement.dataset.demo === 'llm';
  const BATCH = llm ? 'demo__llm' : 'demo';
  const BLIND = ['catalog', 'records', 'candidates', 'window', 'used_dates', 'record_counts', 'reads', 'read_unmatched', 'read_log_missing'];
  const REVEAL = ['auto', 'evidence', 'basis', 'highlights', 'matching', 'llm', 'adopted', 'source_status', 'adopt_unmatched', 'adoption_missing'];
  const ERRORS = ['누락', '오탐', '분류 오류', '기타'];
  const KEY = `demo-chart-rows:${BATCH}`;
  const realFetch = window.fetch.bind(window);
  let payload = null;
  let rows = {};
  try { rows = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (_) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(rows)); } catch (_) {} };
  const L = () => window.chartReviewLogic;

  async function data() {
    if (!payload) payload = await (await realFetch('demo-episode.json')).json();
    return payload;
  }
  const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
  const autoOf = (p, v) => Object.fromEntries(v.fields.map(f => [f.code, p.auto?.[v.id]?.fields?.[f.code]?.value ?? null]));
  const allRevealed = p => p.catalog.length > 0 && p.catalog.every(v => rows[v.id]?.revealed === true);

  // LLM 스냅샷의 선택지 이름을 필드 코드로 바꾼다(store.llm_values)
  function llmSnapshot(p, v) {
    const label = p.llm_demo?.[v.id];
    return label ? {status: 'ok', model: 'demo', label} : null;
  }
  function llmCodes(v, snapshot) {
    if (!snapshot?.label) return null;
    const values = {...snapshot.label};
    for (const f of v.fields.filter(x => x.type !== 'text')) {
      const names = Object.fromEntries((f.options || []).map(o => [o.label, o.code]));
      const value = values[f.code];
      values[f.code] = Array.isArray(value) ? value.map(x => names[x] ?? x) : names[value] ?? value;
    }
    return values;
  }

  function statusFor(p) {
    let entered = 0, revealed = 0, confirmed = 0;
    for (const v of p.catalog) {
      const row = rows[v.id] || {};
      const auto = row.blind_first === false ? row.auto : null;
      const done = L().complete(v, row.mine || {}, auto);
      entered += done;
      const shown = done && row.revealed === true;
      revealed += shown;
      confirmed += shown && (row.agree !== false || ERRORS.includes(row.error));
    }
    const total = p.catalog.length;
    const status = total && confirmed === total ? '완료' : Object.keys(rows).length ? '진행중' : '미시작';
    return {entered, revealed, confirmed, total, status};
  }
  function publicRows() {
    return Object.fromEntries(Object.entries(rows).map(([id, row]) => [id,
      Object.fromEntries(Object.entries(row).filter(([k]) => row.revealed === true || !['llm', 'llm_agree', 'rule_llm_agree'].includes(k)))]));
  }
  function revealed(p) {
    const result = Object.fromEntries(REVEAL.map(k => [k, p[k] ?? null]));
    result.llm = Object.fromEntries(Object.entries(rows).filter(([, r]) => r.revealed === true).map(([id, r]) => [id, r.llm ?? null]));
    return result;
  }
  function reveal(p, v, record) {
    const auto = autoOf(p, v);
    const snapshot = llm ? llmSnapshot(p, v) : null;
    const label = llmCodes(v, snapshot);
    rows[v.id] = {llm: null, llm_agree: null, rule_llm_agree: null, ...record, revealed: true, auto,
      agree: L().compare(v, record.mine, auto).agree, at: new Date().toISOString()};
    if (snapshot) Object.assign(rows[v.id], {llm: snapshot,
      llm_agree: L().compare(v, record.mine, label).agree, rule_llm_agree: L().compare(v, auto, label).agree});
  }

  async function get(path, query) {
    const p = await data();
    if (path === 'api/config') return reply(llm
      ? {mode: 'llm', title: 'LLM REVIEW', variables: p.catalog.map(v => ({id: v.id, ready: Boolean(p.llm_demo?.[v.id])}))}
      : {mode: 'chart'});
    if (path === 'api/batches') return reply([BATCH]);
    if (query.get('batch') !== BATCH) return reply({error: '이 화면의 배치를 선택하세요'}, 400);
    const summary = {label: p.episode.label, stage: 'full', variable_count: p.catalog.length, record_counts: p.record_counts, json_bytes: 48213};
    if (path === 'api/episodes') return reply([summary]);
    if (path === 'api/progress') return reply([{label: p.episode.label, ...statusFor(p)}]);
    if (path === 'api/judgments') return reply({rule: 'demo', reviewer: 'demo', revealed: allRevealed(p), rows: publicRows()});
    if (path === 'api/episode') {
      const result = Object.fromEntries(BLIND.map(k => [k, p[k] ?? null]));
      result.episode = {label: p.episode.label, stage: 'full', pod: 0, pod45: 45};
      return reply(result);
    }
    if (path === 'api/episode/reveal') {
      if (query.get('mode') === 'verify' && llm) return reply({error: 'LLM 검토는 블라인드로 먼저 입력하세요'}, 409);
      if (query.get('mode') !== 'verify' && !allRevealed(p)) return reply({error: '판단 입력이 필요하다'}, 403);
      return reply(revealed(p));
    }
    return reply({error: '없는 주소'}, 404);
  }

  async function post(path, body) {
    const p = await data();
    if (llm && (path === 'api/verify' || body.mode === 'verify')) return reply({error: 'LLM 검토는 블라인드로 먼저 입력하세요'}, 409);
    if (path === 'api/reveal') {
      if (!p.catalog.every(v => L().complete(v, rows[v.id]?.mine))) return reply({error: '모든 변수의 판단 입력이 필요하다'}, 409);
      for (const v of p.catalog) if (rows[v.id].revealed !== true) reveal(p, v, rows[v.id]);
      save();
      return reply(revealed(p));
    }
    const v = p.catalog.find(x => x.id === body.variable);
    if (!v) return reply({error: '알 수 없는 변수'}, 400);
    const previous = rows[v.id] || {};
    const shown = previous.revealed === true;
    if (path === 'api/verify') {
      const auto = autoOf(p, v);
      if (!L().complete(v, body.mine, auto)) return reply({error: '모든 칸을 채우거나 판단 불가로 표시해야 한다'}, 409);
      if (shown && previous.blind_first !== false) return reply({error: '블라인드로 공개한 판단은 바꿀 수 없다'}, 409);
      const agree = L().compare(v, body.mine, auto).agree;
      reveal(p, v, {variable: v.id, rule: 'demo', mine: body.mine, blind_first: false,
        error: agree === false ? body.error || null : null, memo: agree === false ? body.memo || '' : ''});
    } else {
      if (shown && JSON.stringify(body.mine) !== JSON.stringify(previous.mine)) return reply({error: '공개 뒤에는 내 판단을 바꿀 수 없다'}, 409);
      rows[v.id] = {...previous, variable: v.id, rule: 'demo', mine: shown ? previous.mine : body.mine,
        auto: shown ? previous.auto : null, agree: shown ? body.agree ?? previous.agree : null,
        error: body.error ?? previous.error ?? null, memo: body.memo ?? previous.memo ?? '',
        blind_first: llm ? true : previous.blind_first ?? true, revealed: shown, at: new Date().toISOString()};
    }
    save();
    return reply({row: publicRows()[v.id]});
  }

  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    const path = url.pathname.slice(url.pathname.lastIndexOf('/api/') + 1);
    if (!url.pathname.includes('/api/')) return realFetch(input, init);
    try {
      return init.method === 'POST' ? await post(path, JSON.parse(init.body || '{}')) : await get(path, url.searchParams);
    } catch (_) {
      return reply({error: '차트 자료 또는 요청 형식을 확인하세요'}, 400);
    }
  };
})();
