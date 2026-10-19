// 판단과 공개 상태는 서버에 저장한다.
(() => {
  const L = window.chartReviewLogic;
  const viewer = new URLSearchParams(location.search).get('viewer') === '1';
  if (viewer) document.body.classList.add('viewer');
  const $ = id => document.getElementById(id);
  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const button = (text, action, cls = 'btn') => {
    const el = node('button', text, cls); el.type = 'button'; el.setAttribute('aria-label', text || '근거 위치로 이동'); el.onclick = action; return el;
  };
  let config = {mode: 'chart'};
  const llmMode = () => config.mode === 'llm';
  const llmReady = v => config.variables?.find(entry => entry.id === v.id)?.ready === true;
  let mode = 'verify';
  try { if (localStorage.getItem('chart-review-mode') === 'blind') mode = 'blind'; } catch (_) {}
  const verifying = () => mode === 'verify';
  let S = emptyState(), summaries = [], progress = [], generation = 0, progressRequest = 0;
  function emptyState() {
    return {batch: '', label: '', data: null, vars: [], rows: {}, savedRows: {}, queue: null,
      rule: '', reviewer: '', type: '', area: '', active: '',
      fold: {}, onlyUn: false, onlyBad: false, sentences: false, revealed: false,
      onlyEvidence: false, evidenceCursor: -1, extraTypes: [],
      mode, drafts: {}, editing: {}, nextAfterSave: '', reveal: null, busy: false, spans: new Map()};
  }
  let docChannel = null, docWindow = null, viewerOpen = false, previousDoc = null, lastPeer = 0, docNavigation = null;
  let fontSize = 14;
  try { fontSize = L.docFont(localStorage.getItem('chart-review-doc-font')); } catch (_) {}
  function setDocFont(value) {
    fontSize = L.docFont(value);
    document.documentElement.style.setProperty('--doc-font', `${fontSize}px`);
    $('doc-font-minus').disabled = fontSize === 12; $('doc-font-plus').disabled = fontSize === 28;
    try { localStorage.setItem('chart-review-doc-font', String(fontSize)); } catch (_) {}
  }
  function sendDoc(message) {
    docChannel?.postMessage({...message, source: viewer ? 'viewer' : 'main', path: location.pathname});
  }
  function popoutStatus(open) {
    const changed = viewerOpen !== open;
    viewerOpen = open; $('doc-popout').textContent = open ? '새 창 열림' : '새 창';
    document.body.classList.toggle('doc-detached', open);
    $('evidence-list-panel').hidden = S.type === '__flow__' || verifying() && !open;
    if (changed && open && verifying() && S.data) renderEvidenceList(evidenceTargets());
  }
  function syncDoc(full = false, navigation = null) {
    if (viewer || !viewerOpen || !docChannel) return;
    const state = {...S, mode};
    if (!full) docNavigation = navigation;
    sendDoc({...L.docMessage(state, previousDoc, full), font: fontSize, navigation: docNavigation});
    previousDoc = state;
  }
  function waitForMain() {
    S = emptyState();
    $('doc-title').textContent = '근거 기록지';
    $('doc').replaceChildren(node('p', '메인 창을 기다리는 중입니다. 차트 검토 창에서 에피소드를 여세요', 'note'));
  }
  function startDocChannel() {
    setDocFont(fontSize);
    for (const [id, delta] of [['doc-font-minus', -1], ['doc-font-plus', 1]]) $(id).onclick = () => {
      setDocFont(fontSize + delta); sendDoc({kind: 'font', font: fontSize});
    };
    if (typeof BroadcastChannel !== 'undefined') docChannel = new BroadcastChannel('chart-review-doc');
    docChannel?.addEventListener('message', ({data: message}) => {
      if (message.path !== location.pathname || message.source === (viewer ? 'viewer' : 'main')) return;
      if (message.kind === 'font') { setDocFont(message.font); return; }
      if (viewer) {
        if (message.kind === 'main-ready') { sendDoc({kind: 'hello'}); return; }
        if (message.kind === 'main-closed') { lastPeer = 0; waitForMain(); return; }
        lastPeer = Date.now();
        if (message.kind === 'alive') return;
        if (!['snapshot', 'state'].includes(message.kind)) return;
        const changed = S.active !== message.state.active || S.type !== message.state.type;
        S = L.applyDocSnapshot(S, message.state); mode = S.mode;
        setDocFont(message.font);
        if (!S.data) { waitForMain(); return; }
        recordTabs(); renderDoc();
        if (changed) $('doc').scrollTop = 0;
        if (message.navigation?.quote) goQuote(message.navigation.quote);
        else if (message.navigation?.record) goRecord(message.navigation.record);
        else if (message.navigation?.evidence != null) goEvidence(message.navigation.evidence);
        else if (message.kind === 'snapshot' && evidenceTargets()[S.evidenceCursor]?.type === S.type)
          goEvidence(S.evidenceCursor);
      } else {
        if (message.kind === 'viewer-closed') { popoutStatus(false); previousDoc = null; return; }
        lastPeer = Date.now(); popoutStatus(true);
        if (message.kind === 'hello') syncDoc(true);
        else if (message.kind === 'ping') sendDoc({kind: 'alive'});
      }
    });
    $('doc-popout').onclick = () => {
      if (!docChannel) { $('evidence-note').textContent = '이 브라우저는 새 창 연결을 지원하지 않습니다'; return; }
      if (viewerOpen && !docWindow) docWindow = window.open('', 'chart-doc-viewer');
      if (docWindow && !docWindow.closed) { docWindow.focus(); return; }
      docWindow = window.open(location.pathname + '?viewer=1', 'chart-doc-viewer', 'popup,width=1100,height=900');
      if (!docWindow) { $('evidence-note').textContent = '새 창이 막혔습니다. 브라우저에서 팝업을 허용하세요'; return; }
      lastPeer = Date.now(); popoutStatus(true); docWindow.focus();
    };
    window.addEventListener('beforeunload', () => {
      if (viewer || !unsaved() && !S.busy && !Object.values(S.drafts).some(draft => draft.dirty))
        sendDoc({kind: viewer ? 'viewer-closed' : 'main-closed'});
    });
    setInterval(() => {
      if (viewer) {
        if (!lastPeer || Date.now() - lastPeer > 6500) { lastPeer = 0; waitForMain(); sendDoc({kind: 'hello'}); }
        else sendDoc({kind: 'ping'});
      } else if (viewerOpen && (docWindow ? docWindow.closed : Date.now() - lastPeer > 6500)) {
        // 창 핸들이 있으면 타이머 감속에 따른 신호 지연을 닫힘으로 오인하지 않는다.
        popoutStatus(false); previousDoc = null;
      }
    }, 2000);
    if (viewer) { waitForMain(); sendDoc({kind: 'hello'}); }
    else sendDoc({kind: 'main-ready'});
  }
  const unsaved = () => S.queue?.unsaved() || 0;
  function saveStatus(variable) {
    const state = S.queue?.state(variable);
    return state?.failed ? '저장 실패 · 다시 시도' : state?.pending.length || state?.running ? '저장 중' : '';
  }
  function saveNotice(variable) {
    const el = node('div', undefined, 'save-state'); el.dataset.saveVariable = variable;
    fillSaveNotice(el, variable); return el;
  }
  function fillSaveNotice(el, variable) {
    el.replaceChildren(); el.append(node('span', saveStatus(variable)));
    if (S.queue?.state(variable).failed) el.append(button('다시 시도', () => S.queue.retry(variable)));
  }
  function storageStatus() {
    const count = unsaved();
    $('storage-note').textContent = count ? `서버 미저장 ${count}개 · 저장 실패 행은 다시 시도하세요.` : '서버 저장';
    $('storage-note').classList.toggle('warning', count > 0);
    head();
    for (const el of document.querySelectorAll('[data-save-variable]')) fillSaveNotice(el, el.dataset.saveVariable);
    for (const v of S.vars) {
      const el = document.getElementById(`state-${v.id}`); if (el) el.textContent = stateText(v);
    }
  }
  function createQueue(state) {
    return L.serialQueue((variable, body) => api(state.mode === 'verify' ? 'api/verify' : 'api/judgment', {}, body),
      () => { if (S === state) { storageStatus(); if (verifying()) renderJudgments(); } },
      (variable, result, latest) => {
        state.savedRows[variable] = result.row;
        if (latest) state.rows[variable] = result.row;
        if (S === state) {
          storageStatus(); void refreshProgress();
          if (verifying()) {
            if (latest) { delete state.drafts[variable]; delete state.editing[variable]; }
            if (latest && state.nextAfterSave === variable) {
              state.nextAfterSave = ''; $('f-next').click();
            }
            renderJudgments();
          }
        }
      });
  }
  function saveRecord(v, record) {
    if (!S.data || S.busy || !S.queue) return;
    S.rows[v.id] = record;
    const body = {batch: S.batch, label: S.label, variable: v.id, mine: record.mine};
    if (S.revealed || verifying()) Object.assign(body, {memo: record.memo, error: record.error, agree: record.agree});
    S.queue.push(v.id, body);
  }
  const mine = v => S.rows[v.id]?.mine;
  const done = v => verifying() ? L.reviewComplete(v, S.savedRows[v.id], mode) : L.complete(v, mine(v));
  const selectedVariable = () => S.vars.find(v => v.id === S.active);
  const revealedSpans = () => (verifying() || S.revealed) ? S.reveal?.highlights?.after_reveal || [] : [];
  const adoptionFor = v => L.adoptionStatus(S.data, v, (verifying() || S.revealed) ? S.reveal : null);
  const evidenceFor = id => {
    const v = S.vars.find(v => v.id === id), adoption = adoptionFor(v);
    if (!adoption?.supported) return L.evidenceRecords(S.data, v || id, revealedSpans());
    const byType = {};
    for (const target of adoption.targets) {
      if (!byType[target.type]) byType[target.type] = {records: [], total: 0};
      byType[target.type].records.push(target.ri); byType[target.type].total++;
    }
    return {total: adoption.targets.length, byType};
  };
  const tabTypes = () => [...new Set([...L.evidenceTypes(selectedVariable(), evidenceFor(S.active)), ...S.extraTypes])];
  const color = v => `hsl(${v.hue} 62% 46%)`;
  const grouped = vs => [...new Set(vs.map(v => v.group))].map(group => [group, vs.filter(v => v.group === group)]);
  function autoValues(v) {
    return Object.fromEntries(v.fields.map(f => [f.code, S.reveal?.auto?.[v.id]?.fields?.[f.code]?.value ?? null]));
  }
  function comparison(v) { return L.compare(v, mine(v), S.rows[v.id]?.auto ?? autoValues(v)); }
  const llmSnapshot = v => S.revealed ? S.reveal?.llm?.[v.id] : null;
  const llmResult = v => L.llmComparison(v, mine(v), S.rows[v.id]?.auto ?? autoValues(v), llmSnapshot(v), llmReady(v));
  function queuedValue(v, field) {
    const automatic = S.reveal?.auto?.[v.id];
    return automatic?.fields?.[field.code]?.reason === 'no_row'
      ? automatic.queued?.fields?.[field.code]?.value : null;
  }
  function queuedNote(parent, v, field) {
    const value = queuedValue(v, field);
    if (!L.hasValue(value)) return;
    const note = node('small', undefined, 'auto-reason dim');
    maskedText(note, `검토 대기 후보값(자동값 아님): ${valueText({fields: [field]}, {[field.code]: value})}`);
    parent.append(note);
  }
  function confirmed(v) {
    if (verifying()) return done(v);
    const r = S.rows[v.id];
    return S.revealed && L.reviewComplete(v, r, 'verify');
  }
  function stateText(v) {
    if (verifying()) return L.verifyState(v, S.savedRows[v.id], autoValues(v));
    const state = confirmed(v) ? '공개·확인함' : done(v) ? '판단함' : '미판단';
    return llmMode() && !llmReady(v) ? `${state} · LLM 준비 중` : state;
  }
  function optionLabel(f, code) { return (f.options || []).find(o => String(o.code) === String(code))?.label ?? String(code); }
  function fieldText(f, value) {
    if (value?.unable) return '판단 불가';
    if (value == null || value === '' || Array.isArray(value) && !value.length) return '—';
    if (f.type === 'checkbox') return L.codes(value).map(code => optionLabel(f, code)).join(' · ');
    return f.options?.length ? optionLabel(f, value) : String(value);
  }
  function valueText(v, values) {
    if (values?.unable) return '판단 불가';
    return v.fields.map(f => `${v.fields.length > 1 ? f.name + ': ' : ''}${fieldText(f, values?.[f.code])}`).join(' / ') || '—';
  }
  function saveMine(v, values) {
    if (S.revealed || S.busy || !S.queue) return;
    saveRecord(v, {...S.rows[v.id], variable: v.id, mine: values});
    renderJudgments();
  }
  function saveAnnotation(v, key, value) {
    if (!S.revealed || S.busy || !S.queue) return;
    saveRecord(v, {...S.rows[v.id], [key]: value});
    head(); panel();
  }
  async function api(path, query = {}, body) {
    if (viewer) throw new Error('보기 전용 창에서는 서버를 요청하지 않습니다');
    const response = await fetch(`${path}?${new URLSearchParams(query)}`, {cache: 'no-store',
      ...(body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '서버 요청에 실패했습니다.');
    return result;
  }
  function fail(error) { $('status').textContent = error.message; }
  async function refreshProgress() {
    const batch = $('batch').value, request = ++progressRequest;
    try {
      const result = await api('api/progress', {batch});
      if (batch !== $('batch').value || request !== progressRequest) return;
      progress = result; updateEpisodeOptions();
    } catch (error) { if (batch === $('batch').value && request === progressRequest) fail(error); }
  }
  function episodeProgress(entry) {
    if (entry.label === S.label && S.data && unsaved()) {
      const entered = S.vars.filter(done).length, total = S.vars.length;
      return L.progressText({entered, total, status: total && S.vars.every(confirmed) ? '완료' : entered ? '진행중' : '미시작'});
    }
    const row = progress.find(p => p.label === entry.label);
    return row ? L.progressText(row) : '진행 조회 실패';
  }
  function updateEpisodeOptions() {
    for (const option of $('episode').options) {
      const entry = summaries.find(e => e.label === option.value);
      if (entry) option.textContent = `${entry.label} · ${episodeProgress(entry)}`;
    }
  }
  function head() {
    $('mode-verify').setAttribute('aria-pressed', String(verifying()));
    $('mode-blind').setAttribute('aria-pressed', String(!verifying()));
    $('steps').hidden = verifying(); $('reveal').hidden = verifying();
    $('evidence-list-panel').hidden = S.type === '__flow__' || verifying() && !viewerOpen;
    $('record-hint').textContent = `색칠된 낱말을 누르면 그 변수가 선택됩니다. ${verifying() ? '오른쪽 출처 카드를' : '근거 목록의 줄을'} 누르면 해당 위치로 이동합니다. 긴 숫자는 클릭하면 펼쳐집니다.`;
    $('f-un').textContent = verifying() ? '미확인만' : '미입력만';
    $('f-next').textContent = verifying() ? '다음 미확인 ▶' : '다음 미입력 ▶';
    $('f-bad').textContent = verifying() ? '수정한 것만' : '불일치만';
    $('col-mine').textContent = verifying() ? '자동 판정' : '내 판단';
    $('col-auto').textContent = verifying() ? '내 확인' : '자동 판정';
    $('col-state').textContent = verifying() ? '상태' : '비교';
    $('col-llm').hidden = !llmMode() || !S.revealed;
    if (llmMode()) {
      $('col-auto').textContent = '규칙';
      $('col-state').textContent = '상태';
    }
    const count = S.vars.filter(done).length;
    $('ep-info').textContent = S.data ? `단계 ${S.data.episode.stage ?? '미지정'} · ${verifying() ? '확인' : '입력'} ${count}/${S.vars.length} · 규칙 ${S.rule || '버전 미제공'}` : '';
    $('reviewer').textContent = S.data ? `검토자 ${S.reviewer || '미제공'}` : '';
    $('step1').classList.toggle('on', !S.revealed); $('step2').classList.toggle('on', S.revealed);
    $('pcount').textContent = `${verifying() ? '확인' : '전체'} ${count}/${S.vars.length}`;
    $('prog').textContent = (verifying() || S.revealed) ? `확인 ${S.vars.filter(confirmed).length}/${S.vars.length}` : `입력 ${count}/${S.vars.length}`;
    $('progbar').style.width = `${S.vars.length ? count / S.vars.length * 100 : 0}%`;
    $('reveal').disabled = !S.data || !S.vars.length || count !== S.vars.length || S.revealed || S.busy || !!unsaved();
    $('reveal').textContent = S.revealed ? '공개됨' : '자동 판정 공개';
    $('download').disabled = !S.data || !!unsaved() || S.busy;
    $('f-bad').hidden = !verifying() && !S.revealed;
    updateEpisodeOptions();
  }
  function recordTabs() {
    const evidence = evidenceFor(S.active), types = [...tabTypes(), '__flow__'];
    $('record-tabs').replaceChildren();
    types.forEach((type, index) => {
      const total = (S.data?.records?.[type] || []).filter(r => r.blocks).length;
      const tab = button(type === '__flow__' ? '흐름' : `${type} · ${adoptionFor(selectedVariable())?.supported ? '채택' : '근거'} ${evidence.byType[type]?.total || 0}/${total}`, () => selectType(type));
      tab.id = `record-tab-${index}`; tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(type === S.type));
      tab.setAttribute('aria-controls', 'doc'); tab.tabIndex = type === S.type ? 0 : -1;
      tab.onkeydown = event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % types.length
          : event.key === 'ArrowLeft' ? (index + types.length - 1) % types.length
            : event.key === 'Home' ? 0 : event.key === 'End' ? types.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); selectType(types[next]); $('record-tabs').children[next]?.focus();
      };
      $('record-tabs').append(tab);
    });
    const current = types.indexOf(S.type);
    if (current >= 0) $('doc').setAttribute('aria-labelledby', `record-tab-${current}`);
    else $('doc').removeAttribute('aria-labelledby');
    $('other-records').replaceChildren(new Option('기록지 선택', ''),
      ...Object.keys(S.data?.records || {}).filter(type => !types.includes(type)).map(type => new Option(type, type)));
    $('other-records').disabled = $('other-records').options.length === 1;
  }
  function selectType(type) {
    S.type = type; recordTabs(); renderDoc();
  }
  function evidenceTargets() {
    const targets = L.evidenceList(S.data, selectedVariable(), [...S.spans.values()].flat());
    const adoption = adoptionFor(selectedVariable());
    const ordered = verifying() || S.revealed ? L.groupEvidence(targets).flatMap(group => group.entries) : targets;
    return adoption?.supported ? L.groupEvidence([...adoption.targets, ...ordered]).flatMap(group => group.entries) : ordered;
  }
  function evidenceSelection(count) {
    for (const card of document.querySelectorAll('[data-source-index]'))
      card.setAttribute('aria-current', String(Number(card.dataset.sourceIndex) === S.evidenceCursor));
    $('e-prev').disabled = S.evidenceCursor <= 0;
    $('e-next').disabled = !count || S.evidenceCursor >= count - 1;
    [...$('evidence-list').children].forEach((entry, index) =>
      entry.firstElementChild.setAttribute('aria-current', String(index === S.evidenceCursor)));
  }
  function renderEvidenceList(targets) {
    const list = $('evidence-list'), scroll = list.scrollTop;
    $('evidence-list-title').textContent = `근거 목록 (${targets.length})`;
    $('evidence-list').replaceChildren();
    for (const [index, target] of targets.entries()) {
      const entry = node('div'); entry.setAttribute('role', 'listitem');
      const row = button('', () => goEvidence(index), 'evidence-row');
      row.style.setProperty('--c', color(selectedVariable()));
      const location = node('span');
      maskedText(location, `${target.type} · ${target.date || '날짜 없음'}${target.pod == null ? '' : ` · POD ${target.pod}`} › `, [], false);
      row.append(location, node('span', target.kind === 'adopted' ? '채택 기록' : target.kind === 'item' ? '보조 · 항목' : '보조 · 후보 낱말', 'evidence-badge'));
      const label = node('span'); maskedText(label, target.kind === 'item' ? ` ${target.item} › ` : ' › ', [], false); row.append(label);
      const preview = node('span');
      const spans = target.kind === 'word' ? [{variable: S.active,
        start: [...target.preview.slice(0, target.matchStart)].length,
        end: [...target.preview.slice(0, target.matchEnd)].length, pattern_key: target.pattern_key}] : [];
      maskedText(preview, target.kind === 'adopted' ? target.fields.join(' · ') : target.preview, spans, false); row.append(preview);
      entry.append(row); $('evidence-list').append(entry);
    }
    evidenceSelection(targets.length);
    list.scrollTop = scroll;
    const current = list.children[S.evidenceCursor]?.firstElementChild;
    if (current && list.clientHeight) {
      if (current.offsetTop < list.scrollTop) list.scrollTop = current.offsetTop;
      else if (current.offsetTop + current.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = current.offsetTop + current.offsetHeight - list.clientHeight;
    }
  }
  function goEvidence(index) {
    const targets = evidenceTargets(), target = targets[index]; if (!target) return;
    S.evidenceCursor = index;
    if (!tabTypes().includes(target.type)) S.extraTypes.push(target.type);
    // 항상 다시 그려 접힌 카드와 문장 필터 아래의 목표 블록도 만든다.
    S.type = target.type; recordTabs(); renderDoc();
    const card = $('doc').querySelector(`[data-record-index="${target.ri}"]`);
    if (!card) return;
    if (card.parentElement.tagName === 'DETAILS') card.parentElement.open = true;
    card.open = true; card.buildBody();
    const block = card.querySelector(`[data-block-index="${target.bi}"]`) || card;
    let focus = [block];
    if (target.kind === 'word') {
      const text = String(S.data.records[target.type][target.ri].blocks[target.bi].text ?? '');
      const offsets = L.codePointOffsets(text);
      const hits = (S.spans.get(JSON.stringify([target.type, target.ri, target.bi])) || [])
        .filter(s => s.variable === S.active && Number.isInteger(s.start) && Number.isInteger(s.end)
          && s.start >= 0 && s.end > s.start && s.end < offsets.length
          && !/[\r\n]/.test(text[offsets[s.start]]))
        .sort((a, b) => a.start - b.start || a.end - b.end);
      const wordIndex = targets.slice(0, index).filter(row => row.kind === 'word'
        && row.type === target.type && row.ri === target.ri && row.bi === target.bi).length;
      const hit = hits[wordIndex];
      const marks = hit ? [...block.querySelectorAll('mark')].filter(mark =>
        JSON.parse(mark.dataset.variables).includes(S.active)
        && Number(mark.dataset.start) < offsets[hit.end] && Number(mark.dataset.end) > offsets[hit.start]) : [];
      if (marks.length) focus = marks;
    }
    focus[0].scrollIntoView({block: 'nearest', behavior: 'instant'});
    for (const el of focus) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); }
    if (viewer) return;
    syncDoc(false, {evidence: index});
    if (verifying()) {
      document.querySelector(`[data-source-index="${index}"]`)?.focus({preventScroll: true});
      evidenceSelection(targets.length);
    } else $('evidence-list').children[index]?.firstElementChild.focus({preventScroll: true});
  }
  function moveEvidence(direction) {
    goEvidence(S.evidenceCursor + direction);
  }
  function indexSpans() {
    S.spans = new Map();
    const spans = [...(S.data.candidates || []), ...((verifying() || S.revealed) ? (S.reveal?.highlights?.after_reveal || []).map(s => ({...s, revealed: true})) : [])];
    for (const span of spans) {
      const key = JSON.stringify([span.type, span.record_index, span.block_index]);
      if (!S.spans.has(key)) S.spans.set(key, []);
      S.spans.get(key).push(span);
    }
  }
  function maskedText(parent, text, spans = [], interactive = true) {
    for (const part of L.highlightSegments(String(text), spans)) {
      if (part.masked) {
        // 목록 행은 button이므로 내부에 버튼을 중첩하지 않는다.
        if (!interactive) { parent.append(node('span', '●●●●●●●●', 'mask')); continue; }
        const mask = button('●●●●●●●●', () => {
          const show = mask.getAttribute('aria-pressed') !== 'true';
          mask.textContent = show ? part.text : '●●●●●●●●'; mask.setAttribute('aria-pressed', String(show));
          mask.setAttribute('aria-label', show ? '숫자를 다시 숨기기' : '긴 숫자 펼치기');
        }, 'mask');
        mask.setAttribute('aria-label', '긴 숫자 펼치기'); mask.setAttribute('aria-pressed', 'false'); parent.append(mask);
      } else if (part.candidates.length || part.evidence.length) {
        const hits = [...part.candidates, ...part.evidence];
        const span = hits.find(s => s.variable === S.active) || hits[0];
        const variable = S.vars.find(v => v.id === span.variable);
        const mark = node('mark', part.text, part.evidence.length ? 'evidence' : '');
        mark.dataset.variables = JSON.stringify(hits.map(s => s.variable));
        mark.dataset.start = part.start; mark.dataset.end = part.end;
        mark.style.setProperty('--c', variable ? color(variable) : 'var(--accent)');
        if (interactive && !viewer) {
          mark.title = hits.map(s => `${S.vars.find(v => v.id === s.variable)?.name || s.variable}${s.pattern_key ? ' · ' + s.pattern_key : ' · 문장 근거'}`).join('\n');
          mark.tabIndex = 0; mark.setAttribute('role', 'button');
          mark.onclick = () => focusRow(span.variable);
          mark.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); focusRow(span.variable); } };
        }
        parent.append(mark);
      } else parent.append(document.createTextNode(part.text));
    }
  }
  function headerText(header) {
    return Object.entries(header || {}).filter(([k]) => !['date', 'count', 'date_note'].includes(k))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' · ') : v}`).join(' / ');
  }
  function emphasize() {
    for (const mark of $('doc').querySelectorAll('mark')) {
      const ids = JSON.parse(mark.dataset.variables);
      mark.classList.toggle('faint', !!S.active && !ids.includes(S.active));
      if (ids.includes(S.active)) mark.style.setProperty('--c', color(S.vars.find(v => v.id === S.active)));
    }
  }
  function renderDoc() {
    buildDoc(); syncDoc();
  }
  function goRecord(target) {
    if (!tabTypes().includes(target.type)) S.extraTypes.push(target.type);
    S.type = target.type; S.onlyEvidence = false; S.sentences = false; S.evidenceCursor = -1;
    recordTabs(); renderDoc();
    const card = $('doc').querySelector(`[data-record-index="${target.ri}"]`);
    if (!card) return;
    if (card.parentElement.tagName === 'DETAILS') card.parentElement.open = true;
    card.open = true; card.buildBody(); card.querySelector('summary').focus({preventScroll: true});
    card.scrollIntoView({block: 'nearest', behavior: 'instant'});
    syncDoc(false, {record: target});
  }
  function buildDoc() {
    const v = selectedVariable(), evidence = evidenceFor(S.active);
    const readStatus = L.readStatus(S.data, v);
    const adoption = adoptionFor(v), flow = S.type === '__flow__';
    $('evidence-list-panel').hidden = flow || verifying() && !viewerOpen;
    $('adoption-status').textContent = !flow && v ? adoption?.text || '' : '';
    $('adoption-status').hidden = flow || !adoption;
    $('read-status').textContent = v ? readStatus.text : '';
    $('doc-title').textContent = flow ? '흐름 · 조회 기록 날짜순' : v ? `${v.name} · ${adoption?.supported ? '채택' : '근거'} 기록 ${evidence.total}건` : '이 변수의 근거 기록';
    $('v-prev').disabled = !v || S.vars.indexOf(v) === 0;
    $('v-next').disabled = !v || S.vars.indexOf(v) === S.vars.length - 1;
    if (!evidence.total) S.onlyEvidence = false;
    $('evidence-only').disabled = !evidence.total;
    $('evidence-only').setAttribute('aria-pressed', String(S.onlyEvidence));
    const targets = evidenceTargets(), target = targets[S.evidenceCursor];
    if (!verifying() || viewerOpen) renderEvidenceList(targets); else evidenceSelection(targets.length);
    $('evidence-note').textContent = !v ? '왼쪽에서 변수를 고르세요.' : !targets.length && ['fallback', 'structured'].includes(readStatus.mode)
      ? '이 변수에 미리 걸린 근거 위치가 없습니다. 연결 기록지 전체를 보여 줍니다 — 직접 읽어서 찾으세요.' : '';
    $('doc').replaceChildren();
    if (!S.data || !v) return;
    if (flow) {
      const timeline = L.flowRecords(S.data);
      $('read-status').textContent = timeline.text;
      $('evidence-note').textContent = '';
      for (const id of ['evidence-only', 'e-prev', 'e-next', 'sentences']) $(id).disabled = true;
      if (!timeline.entries.length) $('doc').append(node('p', '연결된 조회 기록이 없습니다.', 'note'));
      let undated = false;
      for (const entry of timeline.entries) {
        if (!entry.date && !undated) { $('doc').append(node('h3', '날짜 없음')); undated = true; }
        $('doc').append(button(`${entry.date || '날짜 없음'}${entry.pod == null ? '' : ` (POD ${entry.pod})`} | ${entry.type}`,
          () => goRecord(entry), 'source-card'));
      }
      return;
    }
    $('sentences').disabled = false;
    const evidenceIndices = evidence.byType[S.type]?.records || [];
    const items = (S.data.records?.[S.type] || []).map((record, ri) => ({record, ri}))
      .filter(({record, ri}) => adoption?.supported || !S.onlyEvidence || !record.blocks || evidenceIndices.includes(ri)
        || target?.type === S.type && target.ri === ri)
      .sort((a, b) => (a.record.date || '9999').localeCompare(b.record.date || '9999'));
    if (!items.length) $('doc').append(node('p', S.onlyEvidence ? '이 기록지에는 선택 변수의 근거가 없습니다.' : '기록이 없습니다.', 'note'));
    const references = node('details', undefined, 'reference-records');
    references.append(node('summary', '참고 기록 · 조회/탐색 기록(채택 근거로 확인되지 않음)'));
    for (const {record, ri} of items) {
      if (!record.blocks) {
        $('doc').append(node('p', record.error ? '⚠ 기록을 읽지 못했습니다.' : record.used_only ? '이 단계의 변수가 읽은 날짜가 없습니다.' : '기록이 없습니다.', record.error ? 'warning' : 'dim'));
        continue;
      }
      const isEvidence = evidenceIndices.includes(ri);
      const blocks = record.blocks.map((block, bi) => ({block, bi, itemEvidence: L.isItemEvidence(block, v),
        spans: S.spans.get(JSON.stringify([S.type, ri, bi])) || []}))
        .filter(b => !S.sentences || b.spans.length || b.itemEvidence || isEvidence && b.bi === 0
          || target?.type === S.type && target.ri === ri && target.bi === b.bi);
      if (!blocks.length) continue;
      const card = node('details', undefined, 'rec');
      card.dataset.recordIndex = ri;
      card.classList.toggle('has-evidence', isEvidence); card.style.setProperty('--c', color(v));
      const summary = node('summary', undefined, 'rec-h');
      summary.append(node('b', record.header?.date_note || `${record.date} · POD ${record.pod >= 0 ? '+' : ''}${record.pod} · ${record.header?.count || 1}건`));
      if (isEvidence) {
        const count = (S.data.candidates || []).filter(s => s.variable === v.id && s.type === S.type && s.record_index === ri).length;
        const itemCount = record.blocks.filter(block => L.isItemEvidence(block, v)).length;
        summary.append(node('span', adoption?.supported ? '채택 기록 · 기록 단위' : verifying() ? `보조 근거 · 후보 ${count} · 항목 ${itemCount}`
          : `근거 · 후보 ${count}${itemCount ? ` · 항목 ${itemCount}` : ''}`, 'evidence-badge'));
        if (readStatus.mode === 'reads') summary.append(node('small', '읽음', 'evidence-badge'));
      }
      const info = node('span'); maskedText(info, headerText(record.header)); summary.append(info);
      if (S.type === '임상간호기록') {
        for (const id of S.data.used_dates?.variables_by_date?.[String(record.date).slice(0, 10)] || []) {
          const name = S.vars.find(v => v.id === id)?.name || id;
          summary.append(viewer ? node('span', name, 'chip')
            : button(name, event => { event.preventDefault(); focusRow(id); }, 'chip'));
        }
      }
      const body = node('div'); card.append(summary, body);
      let built = false;
      const build = () => {
        if (!card.open || built) return;
        built = true;
        for (const {block, bi, spans, itemEvidence} of blocks) {
          const box = node('div', undefined, 'block');
          box.dataset.blockIndex = bi;
          box.classList.toggle('evidence-block', itemEvidence || spans.some(span => span.variable === S.active));
          box.classList.toggle('item-evidence-block', itemEvidence);
          const heading = node('small'); maskedText(heading, [block.time, block.item, headerText(block.source)].filter(Boolean).join(' · '));
          const content = node('p'); maskedText(content, block.text, spans); box.append(heading, content); body.append(box);
        }
        emphasize();
      };
      card.addEventListener('toggle', build);
      // 근거 없는 원문은 펼칠 때만 DOM을 만든다.
      card.buildBody = build; card.open = isEvidence;
      if (adoption?.supported && !isEvidence) references.append(card);
      else $('doc').append(card);
      build();
    }
    if (references.children.length > 1) $('doc').append(references);
    emphasize();
  }
  function widget(v, field, editor, draft = null) {
    const box = node('fieldset'), legend = node('legend', field.name); box.append(legend);
    const current = (draft || mine(v))?.[field.code];
    const update = value => {
      const existing = draft || mine(v);
      const values = existing?.unable ? {} : {...existing}; values[field.code] = value;
      if (draft) {
        S.drafts[v.id].mine = values; S.drafts[v.id].dirty = true;
        if (['radio', 'checkbox'].includes(field.type)) judgmentPanel();
      }
      else saveMine(v, values);
    };
    if (['radio', 'checkbox'].includes(field.type)) {
      const options = node('div', undefined, 'pills'); options.setAttribute('role', 'group'); options.setAttribute('aria-label', field.name);
      for (const option of field.options) {
        const btn = button(option.label, () => {
          update(field.type === 'checkbox'
            ? L.toggleCheckbox(Array.isArray(current) ? current : [], option.code, field.none_option) : option.code);
          const control = document.getElementById(btn.id) || document.getElementById(`row-${v.id}`)?.querySelector('button');
          control?.focus({preventScroll: true});
        }, '');
        btn.id = `choice-${v.id}-${field.code}-${option.code}`;
        btn.setAttribute('aria-pressed', String(field.type === 'checkbox'
          ? Array.isArray(current) && current.map(String).includes(String(option.code)) : String(current) === String(option.code)));
        options.append(btn);
      }
      box.append(options);
    } else {
      const input = node('input'); input.type = field.type === 'numeric' ? 'number' : field.type === 'date' ? 'date' : 'text';
      if (field.type === 'numeric') input.step = 'any';
      input.setAttribute('aria-label', field.name); input.value = current?.unable ? '' : current ?? '';
      input.onchange = () => {
        if (!input.checkValidity()) { input.reportValidity(); return; }
        update(field.type === 'numeric' && input.value !== '' ? Number(input.value) : input.value);
      };
      if (draft) input.oninput = input.onchange;
      box.append(input);
    }
    const unable = button('이 칸 판단 불가', () => update(current?.unable ? undefined : {unable: true}));
    unable.setAttribute('aria-pressed', String(!!current?.unable)); box.append(unable); editor.append(box);
  }
  function row(v) {
    const el = node('div', undefined, 'row'); el.id = `row-${v.id}`;
    el.style.setProperty('--progress', `${v.fields.length ? v.fields.filter(f => L.hasValue(mine(v)?.[f.code])).length / v.fields.length * 100 : 0}%`);
    if (done(v)) el.style.setProperty('--progress', '100%');
    const heading = button('', () => focusRow(v.id, true), 'rh');
    heading.setAttribute('aria-current', String(S.active === v.id));
    const swatch = node('i', undefined, 'sw'); swatch.style.background = color(v);
    const name = node('span', undefined, 'rn'); name.append(node('b', v.name));
    const selected = node('span', undefined, 'chip mine');
    // 행 안에 중첩 button을 만들지 않고 숫자 마스킹을 유지한다.
    selected.textContent = (verifying() && !Object.values(autoValues(v)).some(L.hasValue)
      ? `자동값 없음${v.fields.some(f => L.hasValue(queuedValue(v, f))) ? ' · 검토 대기 후보 있음' : ''}`
      : valueText(v, verifying() ? autoValues(v) : mine(v))).replace(/[0-9]{8,}/g, '●●●●●●●●'); name.append(selected);
    heading.title = `${v.name} · ${selected.textContent} · ${stateText(v)}`;
    const state = node('small', stateText(v), `row-state ${verifying() ? statusClass(v) : ''}`); state.id = `state-${v.id}`;
    heading.append(swatch, name, state, node('span', `근거 ${evidenceFor(v.id).total}`, 'ev'));
    el.append(heading, saveNotice(v.id)); return el;
  }
  function statusClass(v) {
    return stateText(v) === '확인' ? 'ok' : stateText(v) === '수정' ? 'warn' : 'todo';
  }
  function submitVerify(v, values, error = null, memo = '', next = false) {
    if (!L.complete(v, values, autoValues(v)) || S.busy || unsaved()
      || S.savedRows[v.id]?.revealed && S.savedRows[v.id]?.blind_first !== false) return;
    S.nextAfterSave = next ? v.id : '';
    if (S.drafts[v.id]) S.drafts[v.id].dirty = false;
    saveRecord(v, {variable: v.id, mine: values, error, memo});
    renderJudgments();
  }
  function verifyPanel(v) {
    $('judgment-title').textContent = `${v.name} · 확인`;
    const editor = node('div', undefined, 'ed');
    const auto = autoValues(v), prefilled = L.autoMine(v, auto);
    const locked = S.savedRows[v.id]?.revealed && S.savedRows[v.id]?.blind_first !== false;
    const disabled = locked || S.busy || !!unsaved();
    const automatic = node('section', undefined, 'auto-block'); automatic.append(node('h3', '자동 판정'));
    for (const field of v.fields) {
      const line = node('div', undefined, 'auto-field'); line.append(node('b', `${field.name}: `));
      if (['radio', 'checkbox'].includes(field.type) && field.options) {
        const selected = !L.hasValue(auto[field.code]) ? [] : field.type === 'checkbox'
          ? L.codes(auto[field.code]) : [String(auto[field.code])];
        const options = node('span', undefined, 'auto-options'); options.setAttribute('role', 'list');
        const codes = field.options.map(option => String(option.code));
        for (const code of [...codes, ...selected.filter(code => !codes.includes(code))]) {
          const picked = selected.includes(code), chip = node('span', undefined, `auto-option${picked ? ' picked' : ''}`);
          maskedText(chip, `${picked ? '✓ ' : ''}${optionLabel(field, code)}`, [], false);
          chip.setAttribute('role', 'listitem');
          chip.setAttribute('aria-label', `${chip.textContent}${picked ? ' · 자동 선택' : ''}`);
          options.append(chip);
        }
        line.append(options);
        if (!L.hasValue(auto[field.code])) line.append(node('span', '자동값 없음', 'dim'));
      } else if (!L.hasValue(auto[field.code])) line.append(node('span', '자동값 없음', 'dim'));
      else if (field.type === 'checkbox') for (const code of L.codes(auto[field.code])) {
        const chip = node('span', undefined, 'chip'); maskedText(chip, optionLabel(field, code)); line.append(chip);
      } else maskedText(line, fieldText(field, auto[field.code]));
      automatic.append(line);
      queuedNote(line, v, field);
      const reason = S.reveal?.auto?.[v.id]?.fields?.[field.code]?.reason;
      if (reason) { const note = node('small', undefined, 'auto-reason'); maskedText(note, reason); automatic.append(note); }
    }
    if (!v.fields.length) automatic.append(node('p', '자동값 없음', 'note'));
    editor.append(automatic);
    const actions = node('div', undefined, 'verify-actions');
    const agree = button('맞음', () => submitVerify(v, prefilled), 'btn primary');
    agree.id = 'verify-agree'; agree.title = 'Enter: 맞음 저장 후 다음 변수';
    agree.disabled = disabled || !L.complete(v, prefilled, auto)
      || v.fields.some(f => f.type !== 'checkbox' && Array.isArray(prefilled[f.code]));
    const edit = button('다름 · 수정', () => {
      S.editing[v.id] = !S.editing[v.id];
      if (!S.drafts[v.id]) S.drafts[v.id] = {
        mine: structuredClone(S.savedRows[v.id]?.mine || prefilled),
        error: S.savedRows[v.id]?.error || '', memo: S.savedRows[v.id]?.memo || '', dirty: false};
      judgmentPanel();
    });
    edit.setAttribute('aria-pressed', String(!!S.editing[v.id])); edit.disabled = disabled;
    const unable = button('판단 불가', () => submitVerify(v, {unable: true}));
    unable.setAttribute('aria-pressed', String(!!mine(v)?.unable)); unable.disabled = disabled;
    actions.append(agree, edit, unable); editor.append(actions);
    if (locked) editor.append(node('p', '블라인드로 공개한 판단은 바꿀 수 없다', 'note'));
    if (S.editing[v.id]) {
      const draft = S.drafts[v.id], correction = node('div', undefined, 'correction');
      for (const field of v.fields) widget(v, field, correction, draft.mine);
      const error = node('select'); error.setAttribute('aria-label', '오류 유형');
      error.required = L.compare(v, draft.mine, auto).agree === false;
      error.append(new Option('오류 유형', ''), ...L.ERRORS.map(x => new Option(x, x)));
      error.value = draft.error; error.onchange = () => { draft.error = error.value; draft.dirty = true; };
      const memo = node('input'); memo.placeholder = '한 줄 메모 (선택)';
      memo.setAttribute('aria-label', '한 줄 메모 (선택)'); memo.value = draft.memo;
      memo.oninput = () => { draft.memo = memo.value; draft.dirty = true; };
      const save = button('수정 저장', () => {
        error.required = L.compare(v, draft.mine, auto).agree === false;
        if (!error.reportValidity()) return;
        if (!L.complete(v, draft.mine, auto)) { fail(new Error('모든 칸을 채우거나 판단 불가로 표시해야 한다')); return; }
        submitVerify(v, draft.mine, draft.error, draft.memo);
      });
      const cancel = button('수정 취소', () => { delete S.drafts[v.id]; delete S.editing[v.id]; judgmentPanel(); });
      correction.append(error, memo, save, cancel);
      for (const control of correction.querySelectorAll('button, input, select')) control.disabled = disabled;
      editor.append(correction);
    }
    editor.append(saveNotice(v.id), sourceView(v)); $('judgment').append(editor);
  }
  function sourceView(v) {
    const section = node('section', undefined, 'source-view'); section.append(node('h3', '출처'));
    const adoption = adoptionFor(v);
    section.append(node('p', adoption?.text || '', 'note'));
    if (adoption?.supported) {
      section.append(node('h4', '원천별 채택·결측 사유'));
      for (const status of adoption.statuses) {
        const p = node('p'); maskedText(p, L.sourceStatusText(status, v)); section.append(p);
      }
      section.append(node('p', '기재되지 않은 원천 상태는 추정하지 않습니다. 항목·낱말 강조는 보조 위치입니다.', 'note'));
    }
    const targets = evidenceTargets(); let index = 0;
    const supplemental = node('details'); supplemental.append(node('summary', '보조 근거 · 항목/후보 위치'));
    for (const group of L.groupEvidence(targets)) {
      const primary = group.entries.filter(t => t.kind === 'adopted');
      const title = node('h4');
      maskedText(title, `${group.type} (${adoption?.supported ? primary.length : group.entries.length})`);
      if (primary.length || !adoption?.supported) section.append(title);
      if (adoption?.supported && group.entries.some(t => t.kind !== 'adopted')) supplemental.append(node('h4', group.type));
      for (const target of group.entries) {
        const position = index++, card = button('', () => goEvidence(position), 'source-card');
        card.dataset.sourceIndex = position; card.style.setProperty('--c', color(v));
        card.setAttribute('aria-label', `${target.type} ${target.date || '날짜 없음'} ${target.item} 근거 위치로 이동`.replace(/[0-9]{8,}/g, '●●●●●●●●'));
        card.setAttribute('aria-current', String(position === S.evidenceCursor));
        card.append(node('span', target.kind === 'adopted' ? '채택 기록' : target.kind === 'item' ? '보조 · 항목' : '보조 · 낱말', 'evidence-badge'));
        const date = node('small'); maskedText(date, `${target.date || '날짜 없음'} · POD ${target.pod ?? '—'}`, [], false);
        const item = node('b'); maskedText(item, target.item || '항목명 없음', [], false);
        const quote = node('q');
        const spans = target.kind === 'word' ? [{variable: v.id,
          start: [...target.preview.slice(0, target.matchStart)].length,
          end: [...target.preview.slice(0, target.matchEnd)].length}] : [];
        if (target.kind === 'item') {
          const text = [...String(S.data.records[target.type][target.ri].blocks[target.bi].text ?? '')];
          for (const hit of S.spans.get(JSON.stringify([target.type, target.ri, target.bi])) || []) {
            if (hit.variable !== v.id || hit.revealed) continue;
            const word = text.slice(hit.start, hit.end).join('');
            const start = word ? target.preview.indexOf(word) : -1;
            if (start >= 0) spans.push({variable: v.id, start: [...target.preview.slice(0, start)].length,
              end: [...target.preview.slice(0, start + word.length)].length});
          }
        }
        maskedText(quote, target.kind === 'adopted' ? target.fields.join(' · ') : target.preview, spans, false);
        card.append(date, item, quote);
        (adoption?.supported && target.kind !== 'adopted' ? supplemental : section).append(card);
      }
    }
    if (supplemental.children.length > 1) section.append(supplemental);
    if (!targets.length) section.append(node('p', '이 값의 출처 위치가 없습니다. 연결 기록지를 직접 읽어 확인하세요.', 'note'));
    section.append(node('h4', '자동 규칙'));
    const basis = node('div', undefined, 'basis');
    for (const entry of S.reveal?.basis || []) if (entry.variable === v.id) {
      const field = v.fields.find(f => f.code === entry.field);
      const chip = node('span', undefined, 'chip'); maskedText(chip, `${field?.name || entry.field} ← ${entry.label}`); basis.append(chip);
    }
    section.append(basis);
    const unlocated = L.unlocatedEvidence(S.data, v, S.reveal?.evidence?.[v.id] || []);
    if (unlocated.length) {
      section.append(node('h4', '자동이 읽은 문장'));
      for (const entry of unlocated) { const p = node('p'); maskedText(p, entry.text); section.append(p); }
    }
    return section;
  }
  function judgmentPanel() {
    const v = selectedVariable(); $('judgment').replaceChildren();
    $('judgment-title').textContent = v ? `${v.name} · 판단 입력` : '판단 입력';
    if (!v) { $('judgment').append(node('p', '왼쪽에서 변수를 고르세요', 'note')); return; }
    if (verifying()) { verifyPanel(v); return; }
    const editor = node('div', undefined, 'ed');
    for (const field of v.fields) widget(v, field, editor);
    const unable = button('변수 판단 불가', () => saveMine(v, mine(v)?.unable ? {} : {unable: true}));
    unable.setAttribute('aria-pressed', String(!!mine(v)?.unable)); editor.append(unable);
    if (S.revealed) for (const control of editor.querySelectorAll('button, input')) control.disabled = true;
    if (v.note) { const note = node('p', undefined, 'note'); maskedText(note, v.note); editor.append(note); }
    if (!v.fields.length) editor.append(node('p', '내보낸 입력 칸이 없습니다. 판단 불가로 표시하세요.', 'note'));
    editor.append(saveNotice(v.id));
    if (S.revealed) {
      const line = node('div', undefined, 'autoline'); maskedText(line, `자동 판정 ${valueText(v, S.rows[v.id]?.auto)}`);
      editor.append(line, comparisonView(v));
      if (llmMode()) editor.append(llmMentions(v));
      for (const field of v.fields) queuedNote(line, v, field);
      editor.append(sourceView(v));
    }
    $('judgment').append(editor);
  }
  function llmMentions(v) {
    const section = node('section', undefined, 'source-view');
    section.append(node('h3', 'LLM 근거'));
    const snapshot = llmSnapshot(v);
    if (!llmReady(v)) section.append(node('p', 'LLM 준비 중입니다. 기록을 읽고 규칙과 비교하세요.', 'note'));
    else if (!snapshot) section.append(node('p', '이 에피소드에는 아직 맥미니 결과가 없습니다. 큐에 보냈는지 확인하세요.', 'note'));
    else {
      if (snapshot.status !== 'ok') section.append(node('p', 'LLM이 일부 근거를 격리했거나 실행에 실패했습니다. 큐 결과를 확인하세요.', 'note'));
      for (const item of snapshot.items || []) {
        const entry = button('', () => goQuote(item.term?.quote), 'source-card');
        maskedText(entry, `${item.term?.quote || ''} · ${item.assertion} · ${item.category}`, [], false);
        section.append(entry);
      }
      section.append(node('p', `격리한 근거 ${snapshot.rejected_count || 0}건`, 'note'));
      if (!snapshot.items?.length) section.append(node('p', '표시할 LLM 인용이 없습니다. 기록을 직접 읽어 확인하세요.', 'note'));
    }
    return section;
  }
  function goQuote(quote) {
    const missing = () => { $('status').textContent = '이 기록지에서 인용 문구를 찾지 못했습니다. 다른 기록지를 열어 다시 누르세요.'; };
    const hits = L.quoteMatches(S.data?.records?.[S.type] || [], quote), hit = hits[0];
    if (!hit) {
      missing();
      return;
    }
    S.onlyEvidence = false; S.sentences = false; $('sentences').setAttribute('aria-pressed', 'false');
    indexSpans();
    const key = JSON.stringify([S.type, hit.ri, hit.bi]);
    if (!S.spans.has(key)) S.spans.set(key, []);
    S.spans.get(key).push({...hit, variable: S.active, revealed: true});
    renderDoc();
    const card = $('doc').querySelector(`[data-record-index="${hit.ri}"]`);
    if (!card) { missing(); return; }
    card.open = true; card.buildBody();
    const block = card.querySelector(`[data-block-index="${hit.bi}"]`);
    if (!block) { missing(); return; }
    const text = S.data.records[S.type][hit.ri].blocks[hit.bi].text;
    const offsets = L.codePointOffsets(text);
    const marks = [...block.querySelectorAll('mark')].filter(mark =>
      Number(mark.dataset.start) < offsets[hit.end] && Number(mark.dataset.end) > offsets[hit.start]);
    const target = marks[0] || block;
    target.scrollIntoView({block: 'nearest', behavior: 'instant'});
    for (const mark of marks.length ? marks : [block]) {
      mark.classList.add('flash'); setTimeout(() => mark.classList.remove('flash'), 1600);
    }
    $('status').textContent = `이 기록지에서 인용 문구를 ${hits.length}곳 찾았습니다. 첫 번째 위치를 표시합니다.`;
    syncDoc(false, {quote});
  }
  function panel() {
    const scroll = $('variable-list').scrollTop;
    $('vars').replaceChildren();
    const list = S.vars.filter(v => !S.area || v.id.startsWith(`${S.area}.`));
    $('vtitle').textContent = `변수 목록 (${list.length})`;
    $('f-un').setAttribute('aria-pressed', String(S.onlyUn));
    const expand = grouped(list).every(([group]) => S.fold[group]);
    $('f-fold').textContent = expand && list.length ? '모두 펼치기' : '모두 접기';
    for (const btn of $('areas').querySelectorAll('button')) btn.setAttribute('aria-pressed', String(btn.dataset.area === S.area));
    for (const [group, all] of grouped(list)) {
      const visible = all.filter(v => !S.onlyUn || !done(v));
      if (!visible.length) continue;
      const details = node('details', undefined, 'grp'); details.open = !S.fold[group];
      const summary = node('summary'); summary.append(node('span', group), node('span', `${all.filter(done).length}/${all.length}`, 'gp'));
      details.append(summary, ...visible.map(row));
      details.addEventListener('toggle', () => { if (details.isConnected) S.fold[group] = !details.open; }); $('vars').append(details);
    }
    if (!$('vars').children.length) $('vars').append(node('p', '이 조건의 변수가 없습니다.', 'note'));
    $('variable-list').scrollTop = scroll;
  }
  function comparisonView(v) {
    const result = comparison(v), el = node('div');
    el.append(node('span', result.agree === true ? '일치 · 확인함' : result.agree === false ? '불일치' : result.message || '비교 제외 · 판단 불가', `pill ${result.agree === true ? 'ok' : result.agree === false ? 'bad' : 'todo'}`));
    for (const field of result.fields) {
      if (field.mineOnly?.length) el.append(node('div', `${field.field.name} · 내 판단에만: ${field.mineOnly.map(c => optionLabel(field.field, c)).join(', ')}`, 'dif'));
      if (field.autoOnly?.length) el.append(node('div', `${field.field.name} · 자동에만: ${field.autoOnly.map(c => optionLabel(field.field, c)).join(', ')}`, 'dif'));
      if (field.message) el.append(node('div', `${field.field.name}: ${field.message}`, 'dif'));
    }
    return el;
  }
  function matrix() {
    $('matrix').replaceChildren(); $('f-bad').setAttribute('aria-pressed', String(S.onlyBad));
    for (const [group, all] of grouped(S.vars)) {
      const list = all.filter(v => !S.onlyBad || (verifying() ? stateText(v) === '수정' : !S.revealed || (llmMode() ? llmResult(v).mismatch : comparison(v).agree === false)));
      if (!list.length) continue;
      const header = node('tr', undefined, 'gh'), cell = node('td', group); cell.colSpan = llmMode() && S.revealed ? 5 : 4; header.append(cell); $('matrix').append(header);
      for (const v of list) {
        const tr = node('tr'), name = node('td'); name.append(button(v.name, () => focusRow(v.id)), node('div', v.id, 'vid'), saveNotice(v.id));
        const m = node('td'); maskedText(m, valueText(v, mine(v)));
        const a = node('td'); if (S.revealed) maskedText(a, valueText(v, S.rows[v.id]?.auto)); else a.append(node('span', '●●●●', 'hide'));
        const cmp = node('td');
        if (verifying()) {
          m.replaceChildren(); maskedText(m, valueText(v, autoValues(v)));
          a.replaceChildren(); maskedText(a, valueText(v, S.savedRows[v.id]?.mine));
          cmp.append(node('span', stateText(v), `pill ${statusClass(v)}`));
        } else if (S.revealed) {
          if (llmMode()) {
            const result = llmResult(v);
            cmp.append(node('span', result.status, `pill ${result.mismatch ? 'bad' : result.status === '모두 일치' ? 'ok' : 'todo'}`));
          } else cmp.append(comparisonView(v));
          const confirm = button(S.rows[v.id]?.agree === false ? '불일치 확인' : '일치/비교 제외 확인',
            () => saveAnnotation(v, 'agree', S.rows[v.id]?.agree));
          confirm.disabled = S.busy; cmp.append(confirm);
          if (comparison(v).agree === false) {
            const err = node('div', undefined, 'err'), select = node('select'); select.setAttribute('aria-label', `${v.name} 오류 유형`);
            select.required = true;
            select.append(new Option('오류 유형', ''), ...L.ERRORS.map(x => new Option(x, x)));
            select.value = S.rows[v.id]?.error || ''; select.onchange = () => saveAnnotation(v, 'error', select.value);
            const memo = node('input'); memo.type = 'text'; memo.placeholder = '한 줄 메모 (선택)'; memo.setAttribute('aria-label', `${v.name} 메모 (선택)`);
            memo.value = S.rows[v.id]?.memo || ''; memo.oninput = () => saveAnnotation(v, 'memo', memo.value);
            err.append(select, memo); cmp.append(err);
          }
        } else cmp.append(node('span', done(v) ? '판단함' : '미판단', 'pill todo'));
        tr.append(name, m, a);
        if (llmMode() && S.revealed) {
          const cell = node('td'), snapshot = llmSnapshot(v);
          maskedText(cell, !llmReady(v) ? 'LLM 준비 중' : snapshot?.label && snapshot.status !== 'failed'
            ? valueText(v, snapshot.label) : 'LLM 결과 없음');
          tr.append(cell);
        }
        tr.append(cmp); $('matrix').append(tr);
      }
    }
  }
  function renderJudgments() { head(); panel(); judgmentPanel(); matrix(); }
  function selectVariable(id) {
    const v = S.vars.find(v => v.id === id); if (!v) return;
    const changed = S.active !== id; S.active = id;
    if (changed) {
      const evidence = evidenceFor(id);
      S.extraTypes = []; S.type = L.defaultEvidenceType(v, evidence);
      S.onlyEvidence = evidence.total > 0; S.evidenceCursor = -1;
    }
    recordTabs(); renderDoc(); judgmentPanel();
    $('doc').scrollTop = 0; $('side').scrollTop = 0;
  }
  function focusRow(id, keepScroll = false) {
    if (viewer) return;
    const v = S.vars.find(v => v.id === id); if (!v) return;
    if (S.area && !id.startsWith(`${S.area}.`)) S.area = id.split('.')[0];
    if (S.onlyUn && done(v)) S.onlyUn = false;
    S.fold[v.group] = false;
    selectVariable(id); panel();
    const row = document.getElementById(`row-${id}`); row?.classList.add('flash');
    if (!keepScroll) row?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    row?.querySelector('button')?.focus({preventScroll: true});
    setTimeout(() => row?.classList.remove('flash'), 1600);
  }
  async function loadEpisode() {
    const request = ++generation, batch = $('batch').value, label = $('episode').value;
    S = emptyState(); renderJudgments(); recordTabs(); renderDoc(); storageStatus();
    if (!label) return;
    $('status').textContent = '불러오는 중…';
    try {
      const [data, judgments, automatic] = await Promise.all([api('api/episode', {batch, label}),
        api('api/judgments', {batch, label}),
        verifying() ? api('api/episode/reveal', {batch, label, mode: 'verify'}) : null]);
      if (request !== generation) return;
      S.batch = batch; S.label = label; S.data = data;
      S.vars = (data.catalog || []).map((v, i) => ({...v, hue: (i * 47 + 20) % 360,
        record_types: v.record_types || []}));
      S.rows = {...judgments.rows}; S.savedRows = {...judgments.rows};
      S.rule = judgments.rule; S.reviewer = judgments.reviewer;
      if (verifying()) S.reveal = automatic;
      if (!verifying() && judgments.revealed) {
        const reveal = await api('api/episode/reveal', {batch, label}); if (request !== generation) return;
        S.reveal = reveal; S.revealed = true;
      }
      S.queue = createQueue(S);
      indexSpans(); if (S.vars.length) selectVariable(S.vars[0].id);
      renderJudgments(); recordTabs(); renderDoc(); storageStatus(); $('status').textContent = '';
    } catch (error) {
      if (request === generation) {
        S = emptyState(); renderJudgments(); recordTabs(); renderDoc();
        $('storage-note').textContent = '서버 판단 읽기 실패 · 입력이 차단되었습니다. 에피소드를 다시 여세요.';
        $('storage-note').classList.add('warning'); fail(error);
      }
    }
  }
  async function loadBatch(target = {}) {
    const request = ++generation, batch = $('batch').value;
    S = emptyState(); summaries = []; progress = []; ++progressRequest;
    $('episode').replaceChildren(); renderJudgments(); recordTabs(); renderDoc(); storageStatus();
    if (!batch) return;
    try {
      const [entries, counts] = await Promise.all([api('api/episodes', {batch}), api('api/progress', {batch})]);
      if (request !== generation) return;
      progress = counts;
      summaries = entries; for (const entry of summaries) $('episode').append(new Option(entry.label, entry.label));
      if (summaries.some(entry => entry.label === target.label)) $('episode').value = target.label;
      updateEpisodeOptions(); await loadEpisode();
      if (generation === request + 1 && S.batch === batch && target.variable) focusRow(target.variable);
    } catch (error) { if (request === generation) fail(error); }
  }
  function canLeave() {
    if (Object.values(S.drafts).some(draft => draft.dirty)) {
      $('batch').value = S.batch; $('episode').value = S.label;
      $('status').textContent = '수정 중인 판단이 있습니다. 수정 저장 또는 수정 취소 후 이동하세요.';
      return false;
    }
    if (!unsaved() && !S.busy) return true;
    $('batch').value = S.batch; $('episode').value = S.label;
    $('status').textContent = '미저장 판단 또는 공개 요청이 있습니다. 저장·재시도 완료 후 이동하세요.';
    return false;
  }
  startDocChannel();
  if (viewer) return;
  for (const nextMode of ['verify', 'blind']) $('mode-' + nextMode).onclick = () => {
    if (llmMode() || mode === nextMode || !canLeave()) return;
    mode = nextMode;
    try { localStorage.setItem('chart-review-mode', mode); } catch (_) {}
    void loadEpisode();
  };
  window.addEventListener('keydown', event => {
    if (!verifying() || event.key !== 'Enter' || event.defaultPrevented
      || event.target.closest('input, select, textarea, button, summary, [role=button], [contenteditable=true]')) return;
    const agree = $('verify-agree'), v = selectedVariable();
    if (agree && !agree.disabled && v) {
      event.preventDefault(); submitVerify(v, L.autoMine(v, autoValues(v)), null, '', true);
    }
  });
  $('batch').onchange = () => { if (canLeave()) void loadBatch(); };
  $('episode').onchange = () => { if (canLeave()) void loadEpisode(); };
  window.addEventListener('hashchange', () => {
    const target = L.parseHash(location.hash);
    if ((!target.batch || target.batch === S.batch) && (!target.label || target.label === S.label)) {
      focusRow(target.variable); return;
    }
    if (!canLeave()) return;
    if (target.batch && ![...$('batch').options].some(option => option.value === target.batch)) return;
    if (target.batch) $('batch').value = target.batch;
    void loadBatch(target);
  });
  window.addEventListener('beforeunload', event => {
    if (unsaved() || S.busy || Object.values(S.drafts).some(draft => draft.dirty)) { event.preventDefault(); event.returnValue = ''; }
  });
  $('areas').onclick = event => { const btn = event.target.closest('[data-area]'); if (btn) { S.area = btn.dataset.area; panel(); } };
  $('f-un').onclick = () => { S.onlyUn = !S.onlyUn; panel(); };
  $('f-next').onclick = () => { const list = S.vars.filter(v => !S.area || v.id.startsWith(`${S.area}.`));
    const index = list.findIndex(v => v.id === S.active);
    const v = [...list.slice(index + 1), ...list.slice(0, index + 1), ...S.vars].find(v => !done(v)); if (v) focusRow(v.id); };
  $('f-fold').onclick = () => {
    const groups = [...new Set(S.vars.filter(v => !S.area || v.id.startsWith(`${S.area}.`)).map(v => v.group))], expand = groups.every(g => S.fold[g]);
    for (const group of groups) S.fold[group] = !expand;
    $('f-fold').textContent = expand ? '모두 접기' : '모두 펼치기'; panel();
  };
  $('f-bad').onclick = () => { S.onlyBad = !S.onlyBad; matrix(); };
  $('v-prev').onclick = () => { const v = S.vars[S.vars.indexOf(selectedVariable()) - 1]; if (v) focusRow(v.id); };
  $('v-next').onclick = () => { const v = S.vars[S.vars.indexOf(selectedVariable()) + 1]; if (v) focusRow(v.id); };
  $('other-records').onchange = () => {
    const type = $('other-records').value; if (!type) return;
    S.extraTypes.push(type); selectType(type);
  };
  $('evidence-only').onclick = () => { S.onlyEvidence = !S.onlyEvidence; renderDoc(); };
  $('e-prev').onclick = () => moveEvidence(-1);
  $('e-next').onclick = () => moveEvidence(1);
  $('sentences').onclick = () => { S.sentences = !S.sentences; $('sentences').setAttribute('aria-pressed', String(S.sentences)); renderDoc(); };
  $('reveal').onclick = async () => {
    if (!S.data || !S.vars.every(done) || S.busy || unsaved() || S.revealed) return;
    const request = generation, batch = S.batch, label = S.label;
    let published = false;
    S.busy = true; head();
    try {
      const reveal = await api('api/reveal', {}, {batch, label});
      published = true;
      // 공개 응답에 줄이 없으면 서버의 최신 판단을 다시 읽는다.
      const judgments = reveal.rows ? null : await api('api/judgments', {batch, label});
      if (request !== generation) return;
      S.reveal = reveal; S.revealed = true;
      S.rows = {...(reveal.rows || judgments.rows)}; S.savedRows = {...S.rows};
      if (judgments) { S.rule = judgments.rule; S.reviewer = judgments.reviewer; }
      void refreshProgress();
      indexSpans(); S.evidenceCursor = -1;
      if (S.active) { const v = selectedVariable(), evidence = evidenceFor(S.active);
        S.type = L.defaultEvidenceType(v, evidence); S.onlyEvidence = evidence.total > 0; }
      recordTabs(); renderJudgments(); renderDoc();
    } catch (error) {
      if (request === generation) {
        if (published) {
          S = emptyState(); renderJudgments(); recordTabs(); renderDoc();
          $('storage-note').textContent = '공개 후 판단 읽기 실패 · 에피소드를 다시 여세요.';
          $('storage-note').classList.add('warning');
        }
        fail(error);
      }
    }
    finally { if (request === generation) { S.busy = false; head(); } }
  };
  $('download').onclick = () => {
    if (!S.data || unsaved() || S.busy) return;
    const rows = Object.values(S.savedRows);
    const url = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], {type: 'application/json;charset=utf-8'}));
    const link = node('a'); link.href = url; link.download = `${S.label}-judgments.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('theme').onclick = () => window.kqipsTheme.set(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  renderJudgments(); recordTabs(); renderDoc();
  (async () => {
    try {
      config = await api('api/config');
      if (llmMode()) {
        mode = 'blind'; S = emptyState();
        document.title = config.title; document.querySelector('h1').textContent = config.title;
        document.querySelector('.mode-toggle').hidden = true;
        renderJudgments();
      }
      const batches = await api('api/batches'); for (const batch of batches) $('batch').append(new Option(batch, batch));
      const target = L.parseHash(location.hash);
      if (batches.includes(target.batch)) $('batch').value = target.batch;
      if (batches.length) await loadBatch(target); else $('status').textContent = llmMode()
        ? 'LLM 검토 배치가 없습니다. --llm-review로 배치를 내보내세요.' : '차트 검토 에피소드가 있는 배치가 없습니다.';
    } catch (error) { fail(error); }
  })();
})();
