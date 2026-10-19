// DOM 없이 검증할 수 있는 위치·입력·비교 함수.
(() => {
  const ERRORS = ['누락', '오탐', '분류 오류', '기타'];
  function docFont(value) {
    const number = Number(value);
    return Math.max(12, Math.min(28, Number.isFinite(number) && value != null && value !== '' ? Math.round(number) : 14));
  }
  function docSnapshot(state) {
    const snapshot = Object.fromEntries(['active', 'type', 'onlyEvidence', 'sentences', 'evidenceCursor',
      'revealed', 'mode', 'extraTypes'].map(key => [key, state[key]]));
    return {...snapshot, data: state.data, vars: state.vars, spans: [...state.spans],
      reveal: state.reveal && (state.mode === 'verify' || state.revealed)
        ? Object.fromEntries(['highlights', 'adopted', 'source_status', 'adopt_unmatched', 'adoption_missing']
          .map(key => [key, state.reveal[key]])) : null};
  }
  function docMessage(state, previous, full = false) {
    if (full || !previous || state.data !== previous.data || state.reveal !== previous.reveal
      || state.revealed !== previous.revealed || state.mode !== previous.mode)
      return {kind: 'snapshot', state: docSnapshot(state)};
    const snapshot = Object.fromEntries(['active', 'type', 'onlyEvidence', 'sentences',
      'evidenceCursor', 'extraTypes'].map(key => [key, state[key]]));
    if (state.spans !== previous.spans) snapshot.spans = [...state.spans];
    return {kind: 'state', state: snapshot};
  }
  function applyDocSnapshot(state, snapshot) {
    return {...state, ...snapshot, spans: snapshot.spans ? new Map(snapshot.spans) : state.spans};
  }
  function parseHash(hash) {
    const query = new URLSearchParams(hash.replace(/^#/, ''));
    return Object.fromEntries(['batch', 'label', 'variable'].map(key => [key, query.get(key) || '']));
  }
  function codePointOffsets(text) {
    const offsets = [0];
    for (const char of text) offsets.push(offsets.at(-1) + char.length);
    return offsets;
  }
  function highlightSegments(text, spans, mask = true) {
    const offsets = codePointOffsets(text);
    const ranges = spans.filter(s => Number.isInteger(s.start) && Number.isInteger(s.end)
      && s.start >= 0 && s.end > s.start && s.end < offsets.length)
      .map((s, order) => ({...s, start: offsets[s.start], end: offsets[s.end], order}));
    const masks = mask ? [...text.matchAll(/[0-9]{8,}/g)].map(m => ({start: m.index, end: m.index + m[0].length})) : [];
    let maskIndex = 0;
    const points = [...new Set([0, text.length, ...ranges.flatMap(s => [s.start, s.end]),
      ...masks.flatMap(s => [s.start, s.end])])].sort((a, b) => a - b).filter(p => {
        while (masks[maskIndex]?.end <= p) maskIndex++;
        return !(masks[maskIndex]?.start < p && p < masks[maskIndex]?.end);
      });
    maskIndex = 0;
    return points.slice(0, -1).map((start, i) => {
      const end = points[i + 1];
      while (masks[maskIndex]?.end <= start) maskIndex++;
      const active = ranges.filter(s => s.start <= start && s.end >= end)
        .sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.order - b.order);
      return {text: text.slice(start, end), start, end,
        masked: masks[maskIndex]?.start === start && masks[maskIndex]?.end === end,
        candidates: active.filter(s => !s.revealed), evidence: active.filter(s => s.revealed)};
    });
  }
  function hasValue(value) {
    return value?.unable === true || (Array.isArray(value) ? value.length > 0
      : value !== undefined && value !== null && value !== '');
  }
  function complete(variable, mine, auto) {
    // 기타 내용은 같은 변수에서 기타 선택지가 선택된 경우에만 필수다.
    const otherSelected = variable.fields.some(f => ['radio', 'checkbox'].includes(f.type)
      && (f.options || []).some(o => String(o.label).includes('기타')
        && codes(o.code).some(code => codes(mine?.[f.code]).includes(code))));
    return mine?.unable === true || (variable.fields.length > 0
      && (auto == null || variable.fields.some(f => hasValue(mine?.[f.code]) || hasValue(auto[f.code])))
      && variable.fields.every(f => f.type === 'text' && (f.name || '').includes('기타')
        ? !otherSelected || hasValue(mine?.[f.code])
        : hasValue(mine?.[f.code]) || auto != null && !hasValue(auto[f.code])));
  }
  function toggleCheckbox(values, value, none) {
    const current = (values || []).map(String), code = String(value);
    if (current.includes(code)) return current.filter(x => x !== code);
    return code === String(none) ? [code] : [...current.filter(x => x !== String(none)), code];
  }
  function codes(value) {
    if (value == null || value === '') return [];
    const parts = Array.isArray(value) ? value : String(value).trim().replace(/^\[|\]$/g, '').split(',');
    return [...new Set(parts.map(v => String(v).trim()).filter(v => v && v !== 'nan')
      .map(v => /^[+-]?\d+(?:\.0+)?$/.test(v) ? String(Number(v)) : v))].sort();
  }
  function compare(variable, mine, auto) {
    if (mine?.unable) return {agree: null, fields: [], message: '판단 불가'};
    const fields = variable.fields.filter(f => f.type !== 'text').map(f => {
      const m = mine?.[f.code], a = auto?.[f.code];
      if (m?.unable) return {field: f, agree: null, message: '판단 불가'};
      if (!hasValue(m) && !hasValue(a)) return {field: f, agree: true};
      if (!hasValue(m) || !hasValue(a)) return {field: f, agree: false, message: '자동값 없음 또는 입력 없음'};
      if (f.type === 'checkbox') {
        const mc = codes(m), ac = codes(a);
        return {field: f, agree: JSON.stringify(mc) === JSON.stringify(ac),
          mineOnly: mc.filter(c => !ac.includes(c)), autoOnly: ac.filter(c => !mc.includes(c))};
      }
      if (Array.isArray(a)) return {field: f, agree: false, message: '자동값 여러 행: 직접 확인'};
      const agree = f.type === 'numeric' ? Number.isFinite(Number(m)) && Number.isFinite(Number(a))
        && Number(m) === Number(a) : f.type === 'date' ? String(m).slice(0, 10) === String(a).slice(0, 10)
          : String(m) === String(a);
      return {field: f, agree};
    });
    return {agree: fields.some(f => f.agree === false) ? false
      : fields.length && fields.every(f => f.agree === true) ? true : null,
    fields, message: fields.length ? '' : '자유 텍스트: 비교 제외'};
  }
  function llmComparison(variable, mine, auto, snapshot, ready = true) {
    const rule = compare(variable, mine, auto).agree;
    const llm = ready && snapshot && snapshot.status !== 'failed' && snapshot.label
      ? compare(variable, mine, snapshot.label).agree : null;
    const status = !ready ? 'LLM 준비 중' : !snapshot ? 'LLM 결과 없음'
      : ['partial', 'failed'].includes(snapshot.status) ? 'LLM 부분·실패'
        : !snapshot.label ? 'LLM 결과 없음' : rule === null || llm === null ? '비교 제외 · 판단 불가'
          : rule && llm ? '모두 일치' : !rule && llm ? '규칙만 불일치'
            : rule && !llm ? 'LLM만 불일치' : '둘 다 불일치';
    return {status, rule, llm, mismatch: rule === false || llm === false};
  }
  function quoteMatches(records, quote) {
    if (!quote) return [];
    const hits = [];
    records.forEach((record, ri) => (record.blocks || []).forEach((block, bi) => {
      const text = String(block.text ?? '');
      for (let from = 0, start; (start = text.indexOf(quote, from)) >= 0; from = start + quote.length) {
        const offset = [...text.slice(0, start)].length;
        hits.push({ri, bi, start: offset, end: offset + [...quote].length});
      }
    }));
    return hits;
  }
  function progressText(progress) {
    return `${progress.status} ${progress.entered}/${progress.total}`;
  }
  function reviewComplete(variable, row, mode) {
    return mode === 'verify' ? !!row?.revealed && complete(variable, row.mine,
      row.blind_first === false ? row.auto : undefined)
      && (row.agree !== false || ERRORS.includes(row.error)) : complete(variable, row?.mine);
  }
  function verifyState(variable, row, auto) {
    if (row?.blind_first === false && row.auto != null) auto = row.auto;
    if (!Object.values(auto || {}).some(hasValue) || !reviewComplete(variable, row, 'verify')) return '미확인';
    return row.agree === false || row.mine?.unable || variable.fields.some(f => row.mine?.[f.code]?.unable
      || f.type === 'text' && String(row.mine?.[f.code]) !== String(auto?.[f.code])) ? '수정' : '확인';
  }
  function autoMine(variable, auto) {
    return Object.fromEntries(variable.fields.map(f => [f.code,
      f.type === 'checkbox' ? codes(auto?.[f.code]) : auto?.[f.code] ?? null]));
  }
  function groupEvidence(targets) {
    const groups = new Map();
    for (const target of targets) {
      if (!groups.has(target.type)) groups.set(target.type, []);
      groups.get(target.type).push(target);
    }
    return [...groups].map(([type, entries]) => ({type, entries}));
  }
  function unlocatedEvidence(data, variable, entries) {
    return entries.filter(entry => !Object.entries(data?.records || {}).some(([type, records]) =>
      (!variable.record_types || variable.record_types.includes(type)) && records.some(record =>
        (record.blocks || []).some(block => cleanText(block.text).includes(cleanText(entry.text))))));
  }
  // 공개 근거는 호출자가 공개된 위치만 전달한다. 원본 after_reveal은 읽지 않는다.
  const cleanText = text => String(text ?? '').replace(/\s+/gu, ' ').trim();
  // 부정·부수·표지 낱말은 양성 근거가 아니므로 이동 목록과 탭 집계에서 함께 제외한다.
  const AUXILIARY_PATTERN_KEY = /^(?:negations.*|negative_marks|none_values|no_values|absent.*|not_.*|stopped.*|incidental.*|noise.*|ambiguous.*|.*_markers)$/i;
  function isItemEvidence(block, variable) {
    const item = cleanText(block.item);
    return !!item && (variable?.evidence_items || []).some(entry => {
      const defined = cleanText(entry.item);
      if (defined === item) return true;
      const [attributes, entity] = defined.split(' <- ');
      return entity !== undefined && attributes.split('·')
        .some(attribute => cleanText(`${attribute} <- ${entity}`) === item);
    });
  }
  function readStatus(data, variable) {
    const id = typeof variable === 'string' ? variable : variable?.id;
    const reads = data?.reads?.[id], counts = data?.read_unmatched?.[id];
    const missing = data?.read_log_missing?.includes(id);
    if (!missing && counts?.rows === 0 && counts.structured > 0)
      return {mode: 'structured', set: null, text: '구조화 값 — 읽은 기록 없음(항목 근거로 표시)'};
    if (!missing && Array.isArray(reads) && (!counts || counts.matched > 0 || counts.rows === 0)) {
      const set = new Set(reads.map(read => `${read.type}\u0000${read.record_index}`));
      const text = counts && counts.matched < counts.rows
        ? `읽기 기록 ${counts.rows}행 중 ${counts.matched}행만 연결됨`
        : counts?.rows === 0 ? '이 변수가 읽은 기록이 없습니다' : `읽은 기록 ${set.size}건`;
      return {mode: 'reads', set, text};
    }
    return {mode: 'fallback', set: null, text: !missing && counts?.rows > 0 && counts.matched === 0
      ? '읽기 기록 연결 실패' : '읽기 기록 없음 — 낱말·항목 후보로 대신 표시'};
  }
  function adoptionStatus(data, variable, reveal) {
    const id = variable?.id;
    if (!reveal) return null;
    const supported = Array.isArray(reveal.adopted?.[id]) && !reveal.adoption_missing?.includes(id);
    if (!supported) return {supported: false, targets: [], text: '채택 로그 없음 — 미지원 또는 이전 JSON', statuses: []};
    const entries = reveal.adopted[id], groups = new Map();
    let invalid = 0;
    for (const entry of entries) {
      const record = data?.records?.[entry.type]?.[entry.record_index];
      if (entry.match !== 'exact' || !Number.isInteger(entry.record_index) || !record?.blocks) { invalid++; continue; }
      const key = JSON.stringify([entry.type, entry.record_index]);
      if (!groups.has(key)) groups.set(key, {kind: 'adopted', type: entry.type, ri: entry.record_index,
        bi: null, date: record.date, pod: record.pod, item: '', preview: '', fields: [], sources: []});
      const target = groups.get(key);
      if (!target.fields.includes(entry.field)) target.fields.push(entry.field);
      if (!target.sources.includes(entry.source)) target.sources.push(entry.source);
    }
    const counts = reveal.adopt_unmatched?.[id];
    const ambiguous = counts?.ambiguous || 0;
    const statuses = reveal.source_status?.[id] || [];
    const direct = statuses.filter(s => s.source === 'enrollment' && s.status === 'adopted').length;
    const unlinked = Math.max(0, (counts?.rows || 0) - (counts?.matched || 0) - ambiguous - direct) + invalid;
    return {supported: true, targets: [...groups.values()], statuses,
      text: [`채택 기록 ${groups.size}건 · 기록 단위 연결(정확한 채택 문장 아님)`,
        direct ? '등록 마스터 값' : '',
        ambiguous ? `채택 기록 연결 확인 필요 · 모호한 연결 ${ambiguous}행` : '',
        unlinked ? `채택 기록 연결 확인 필요 · 연결 실패 ${unlinked}행` : '',
        !statuses.length ? '원천별 상태 로그 없음 — 원천 부재를 뜻하지 않음' : '']
        .filter(Boolean).join(' / ')};
  }
  function sourceStatusText(status, variable) {
    const field = variable?.fields?.find(f => f.code === status.field)?.name || status.field;
    const source = {inpatient_nursing: '입원간호기록', clinical_nursing: '임상간호기록',
      patient_records: '환자 정보', visit_records: '방문 기록', enrollment: '등록 마스터',
      medical_records: '외래·입원 기록'}[status.source] || status.source;
    const label = {adopted: status.source === 'enrollment' ? '등록 마스터 값' : '채택됨(기록 연결은 별도 확인)',
      empty: '값 결측', absent: '원천 없음', out_of_range: '조건 밖'}[status.status] || '상태 확인 필요';
    return `${field} ← ${source} · 순위 ${status.rank} · ${label}`;
  }
  function flowRecords(data) {
    const entries = new Map(), warnings = [];
    for (const variable of data?.catalog || []) {
      const reads = data?.reads?.[variable.id], counts = data?.read_unmatched?.[variable.id];
      if (!Array.isArray(reads) || data.read_log_missing?.includes(variable.id)) {
        warnings.push(variable.id); continue;
      }
      if (!counts || counts.rows > counts.matched) warnings.push(variable.id);
      for (const read of reads) {
        const record = data.records?.[read.type]?.[read.record_index];
        if (!Number.isInteger(read.record_index) || !record?.blocks) { warnings.push(variable.id); continue; }
        entries.set(JSON.stringify([read.type, read.record_index]),
          {type: read.type, ri: read.record_index, date: record.date, pod: record.pod});
      }
    }
    return {entries: [...entries.values()].sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999'))
      || a.type.localeCompare(b.type) || a.ri - b.ri),
      text: warnings.length ? '조회 목록 불완전 — 조회 로그 없음 또는 일부 연결 실패. 전체 조회 이력이 아닙니다.'
        : '연결된 조회 기록의 합집합(채택 여부 표시 없음)'};
  }
  // 위치는 코드포인트, 미리보기의 매칭 위치는 DOM 문자열과 같은 UTF-16이다.
  function evidenceList(data, variable, spans = []) {
    if (!variable) return [];
    if (typeof variable === 'string') variable = data?.catalog?.find(v => v.id === variable) || {id: variable};
    const status = readStatus(data, variable);
    const entries = [], words = new Map();
    for (const span of spans) {
      if (span.variable !== variable.id || AUXILIARY_PATTERN_KEY.test(span.pattern_key || '')) continue;
      const key = JSON.stringify([span.type, span.record_index, span.block_index]);
      if (!words.has(key)) words.set(key, []);
      words.get(key).push(span);
    }
    for (const [type, records] of Object.entries(data?.records || {})) records.forEach((record, ri) => {
      if (status.mode === 'reads' ? !status.set.has(`${type}\u0000${ri}`)
        : variable.record_types && !variable.record_types.includes(type)) return;
      (record.blocks || []).forEach((block, bi) => {
        const base = {type, ri, bi, date: record.date, pod: record.pod, item: block.item || ''};
        const text = String(block.text ?? '');
        if (isItemEvidence(block, variable)) {
          const chars = [...cleanText(text)];
          entries.push({row: {kind: 'item', ...base,
            preview: chars.length > 100 ? chars.slice(0, 99).join('') + '…' : chars.join(''),
            matchStart: null, matchEnd: null, pattern_key: null}, start: 0});
          return;
        }
        if (status.mode === 'structured') return;
        const hits = words.get(JSON.stringify([type, ri, bi])) || [];
        if (!hits.length) return;
        const offsets = codePointOffsets(text);
        hits.filter(s => Number.isInteger(s.start) && Number.isInteger(s.end)
          && s.start >= 0 && s.end > s.start && s.end < offsets.length
          && !/[\r\n]/.test(text[offsets[s.start]]))
          .sort((a, b) => a.start - b.start || a.end - b.end).slice(0, 3).forEach(span => {
            const start = offsets[span.start], end = offsets[span.end];
            const lineStart = text.lastIndexOf('\n', start - 1) + 1;
            const newline = text.indexOf('\n', start), lineEnd = newline < 0 ? text.length : newline;
            const chars = [...text.slice(lineStart, lineEnd).replace(/\r$/, '')];
            const relativeStart = [...text.slice(lineStart, start)].length;
            const from = relativeStart >= 99 ? Math.max(0, relativeStart - 30) : 0;
            const prefix = from ? '…' : '';
            const length = 100 - prefix.length;
            const clipped = chars.length - from > length;
            const shown = chars.slice(from, from + length - Number(clipped)).join('');
            const preview = prefix + shown + (clipped ? '…' : '');
            const removed = chars.slice(0, from).join('').length;
            const matchStart = prefix.length + start - lineStart - removed;
            const matchEnd = prefix.length + Math.min(end - lineStart - removed, shown.length);
            if (matchEnd <= matchStart) return;
            entries.push({row: {kind: 'word', ...base, preview, matchStart, matchEnd,
              pattern_key: span.pattern_key}, start: span.start});
          });
      });
    });
    const types = [...new Set([...(variable.record_types || []), ...Object.keys(data?.records || {})])];
    return entries.sort((a, b) => Number(a.row.kind === 'word') - Number(b.row.kind === 'word')
      || types.indexOf(a.row.type) - types.indexOf(b.row.type)
      || String(a.row.date || '9999').localeCompare(String(b.row.date || '9999'))
      || a.row.ri - b.row.ri || a.row.bi - b.row.bi || a.start - b.start)
      .slice(0, 200).map(entry => entry.row);
  }
  function evidenceRecords(data, variable, revealedSpans = []) {
    // 예전 호출자는 id만 전달한다. 카탈로그가 없어도 기존 집계를 유지한다.
    if (typeof variable === 'string') variable = data?.catalog?.find(v => v.id === variable) || {id: variable};
    const variableId = variable?.id;
    const status = readStatus(data, variable);
    const byType = {};
    for (const [type, records] of Object.entries(data?.records || {})) {
      if (status.mode === 'reads') {
        const indices = records.flatMap((record, ri) => status.set.has(`${type}\u0000${ri}`) ? [ri] : []);
        byType[type] = {records: indices, total: indices.length};
        continue;
      }
      if (variable.record_types && !variable.record_types.includes(type)) continue;
      const hits = new Set([...(data.candidates || []), ...revealedSpans]
        .filter(s => s.variable === variableId && s.type === type && Number.isInteger(s.record_index)
          && !AUXILIARY_PATTERN_KEY.test(s.pattern_key || ''))
        .map(s => s.record_index));
      const indices = records.flatMap((record, ri) => record.blocks && (hits.has(ri)
        || record.blocks.some(block => isItemEvidence(block, variable))
        || type === '임상간호기록' && (data.used_dates?.variables_by_date?.[String(record.date).slice(0, 10)] || [])
          .includes(variableId)) ? [ri] : []);
      byType[type] = {records: indices, total: indices.length};
    }
    return {total: Object.values(byType).reduce((n, entry) => n + entry.total, 0), byType};
  }
  function evidenceTypes(variable, evidence) {
    return [...new Set(variable?.record_types || [])];
  }
  function defaultEvidenceType(variable, evidence) {
    return evidenceTypes(variable, evidence).reduce((best, type) =>
      (evidence.byType[type]?.total || 0) > (evidence.byType[best]?.total || 0) ? type : best, '')
      || variable?.record_types?.[0] || '';
  }
  // 변수별 요청 순서를 보존한다. 실패 시 최신 입력으로 재시도한다.
  function serialQueue(send, changed = () => {}, saved = () => {}) {
    const states = new Map();
    function state(key) {
      if (!states.has(key)) states.set(key, {pending: [], running: false, failed: false, latest: null});
      return states.get(key);
    }
    async function drain(key) {
      const s = state(key);
      if (s.running || s.failed || !s.pending.length) return;
      s.running = true; changed(key);
      while (s.pending.length) {
        const item = s.pending[0];
        try {
          const result = await send(key, item.value);
          s.pending.shift(); saved(key, result, item === s.latest);
        } catch (_) {
          s.pending = [s.latest]; s.failed = true; break;
        }
      }
      s.running = false; changed(key);
    }
    return {
      state,
      push(key, value) {
        const s = state(key), item = {value}; s.latest = item;
        if (s.failed) s.pending = [item]; else s.pending.push(item);
        changed(key); void drain(key);
      },
      retry(key) { state(key).failed = false; void drain(key); },
      unsaved() { return [...states.values()].filter(s => s.running || s.pending.length).length; },
    };
  }
  const logic = {ERRORS, docFont, docSnapshot, docMessage, applyDocSnapshot, llmComparison, quoteMatches, parseHash, codePointOffsets, highlightSegments, hasValue, complete, toggleCheckbox, codes, compare,
    progressText, serialQueue, readStatus, evidenceRecords, evidenceTypes, defaultEvidenceType, evidenceList, isItemEvidence,
    reviewComplete, verifyState, autoMine, groupEvidence, unlocatedEvidence, adoptionStatus, sourceStatusText, flowRecords};
  if (typeof module !== 'undefined') module.exports = logic;
  else window.chartReviewLogic = logic;
})();
