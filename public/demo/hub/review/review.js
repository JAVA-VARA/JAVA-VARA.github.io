const batch = document.querySelector('#batch');
const group = document.querySelector('#group');
const variable = document.querySelector('#variable');
const filter = document.querySelector('#filter');
const chartUndone = document.querySelector('#chart-undone');
const items = document.querySelector('#items');
const status = document.querySelector('#status');
const pageStatus = document.querySelector('#page-status');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const pageSize = document.querySelector('#page-size');
const surgeryItems = document.querySelector('#surgery-items');
let page = 1;
let pageCounts = null;
let summary = null;
let generation = 0;
let summaryGeneration = 0;

async function loadSurgeryReview() {
  if (!batch.value) return;
  const rows = await api(`api/surgery-review?batch=${encodeURIComponent(batch.value)}`);
  surgeryItems.replaceChildren();
  for (const row of rows) {
    const card = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = `${row.patient_id} · ${row.master_date} · ${row.reason}`;
    card.append(title);
    if (row.status !== '보류') {
      const result = document.createElement('p');
      result.textContent = `${row.status}${row.confirmed_date ? ` · ${row.confirmed_date}` : ''}`;
      card.append(result);
    } else {
      const select = document.createElement('select');
      for (const date of row.candidates) select.add(new Option(date, date));
      const approve = document.createElement('button');
      approve.textContent = '승인';
      approve.disabled = !row.candidates.length;
      approve.addEventListener('click', async () => {
        approve.disabled = true;
        try { await api('api/surgery-review', {batch: batch.value, id: row.id, status: '승인', confirmed_date: select.value}); await loadSurgeryReview(); }
        catch (error) { showError(error); approve.disabled = false; }
      });
      const reason = document.createElement('input');
      reason.placeholder = '취소 사유';
      const cancel = document.createElement('button');
      cancel.textContent = '취소';
      cancel.addEventListener('click', async () => {
        cancel.disabled = true;
        try { await api('api/surgery-review', {batch: batch.value, id: row.id, status: '취소', reason: reason.value}); await loadSurgeryReview(); }
        catch (error) { showError(error); cancel.disabled = false; }
      });
      card.append(select, approve, reason, cancel);
    }
    surgeryItems.append(card);
  }
}
try {
  const savedSize = localStorage.getItem('review-page-size');
  if ([...pageSize.options].some(option => option.value === savedSize)) pageSize.value = savedSize;
} catch (_) { /* 저장소를 사용할 수 없어도 기본값으로 계속한다. */ }

async function api(url, body) {
  const response = await fetch(url, body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
function node(tag, content, className) {
  const element = document.createElement(tag);
  if (content !== undefined) element.textContent = content;
  if (className) element.className = className;
  return element;
}
function params(values) { return new URLSearchParams(values).toString(); }
function displaySource(value) { return String(value ?? '').replace(/_x000d_/gi, ''); }
function sourceView(source) {
  const box = node('div');
  const heading = node('h3');
  const body = node('div');
  const toggle = node('button', '전체 행 보기');
  toggle.type = 'button';
  let showAll = false;
  const render = () => {
    const rows = showAll ? source.all_rows : source.rows;
    heading.textContent = source.filtered
      ? `${source.name} · 판단에 쓰인 행 ${source.shown_total}건 / 전체 ${source.total}건 · 표시 ${rows.length}행`
      : `${source.name} · 원천 ${source.total}행 · 표시 ${rows.length}행`;
    toggle.textContent = showAll ? '판단 행만 보기' : '전체 행 보기';
    toggle.setAttribute('aria-pressed', String(showAll));
    body.replaceChildren();
    if (rows.length) {
      const visible = source.columns.map((key, index) => ({key, index})).filter(column => !column.key.startsWith('_'));
      body.append(table(visible.map(({key}) => ({key, label: ''})),
        rows.map(row => visible.map(({index}) => displaySource(row[index])))));
    } else body.append(node('p', '이 원천에는 이 에피소드의 기록이 없습니다.'));
  };
  toggle.addEventListener('click', () => { showAll = !showAll; render(); });
  box.append(heading);
  if (source.filtered) box.append(toggle);
  box.append(body);
  render();
  return box;
}
function showError(error) { status.textContent = error.message; status.className = 'error'; }
function selectedGroup() { return summary?.groups.find(entry => entry.name === group.value); }
function updatePageStatus() {
  if (!pageCounts) return;
  pageStatus.textContent = `${pageCounts.page} / ${pageCounts.pages}쪽 · 조건에 맞는 항목 ${pageCounts.total.toLocaleString()}건` +
    (summary ? ` · 미입력 ${summary.pending.toLocaleString()}건 / 전체 ${summary.total.toLocaleString()}건` : '');
}
function fillVariables() {
  const chosen = variable.value;
  variable.replaceChildren(new Option('전체 변수', ''));
  for (const entry of (selectedGroup()?.variables || summary?.groups.flatMap(part => part.variables) || []))
    variable.append(new Option(`${entry.name} (${entry.pending}/${entry.total})`, entry.id));
  variable.value = [...variable.options].some(option => option.value === chosen) ? chosen : '';
}
function showSummary(data) {
  summary = data;
  const chosen = group.value;
  group.replaceChildren(new Option('전체 그룹', ''));
  for (const entry of data.groups)
    group.append(new Option(`${entry.name} (${entry.pending}/${entry.total})`, entry.name));
  group.value = data.groups.some(entry => entry.name === chosen) ? chosen : '';
  fillVariables();
  rememberSelections();
  updatePageStatus();
}
async function refreshSummary() {
  const request = ++summaryGeneration;
  const currentBatch = batch.value;
  try {
    const data = await api(`api/summary?${params({batch: currentBatch})}`);
    if (request === summaryGeneration && currentBatch === batch.value)
      showSummary(data);
  } catch (_) { /* 저장 결과는 요약 갱신 실패와 무관하다. */ }
}
async function loadSummary() {
  const request = ++generation;
  const summaryRequest = ++summaryGeneration;
  items.replaceChildren();
  pageCounts = null;
  status.className = '';
  status.textContent = '불러오는 중…';
  if (!batch.value) { status.textContent = '검토 배치가 없습니다.'; return; }
  try {
    const data = await api(`api/summary?${params({batch: batch.value})}`);
    if (request !== generation || summaryRequest !== summaryGeneration) return;
    showSummary(data);
    await loadPage(request);
  } catch (error) { if (request === generation) showError(error); }
}
async function loadPage(request = ++generation) {
  if (!batch.value) return;
  status.textContent = '불러오는 중…';
  try {
    const data = await api(`api/items?${params({batch: batch.value, group: group.value,
      variable: variable.value, status: filter.value, chart: chartUndone.checked ? 'undone' : 'all',
      page, size: pageSize.value})}`);
    if (request !== generation) return;
    page = data.page;
    const sections = [];
    for (const row of data.items) {
      const last = sections.at(-1);
      if (last && last[0].variable_id === row.variable_id) last.push(row);
      else sections.push([row]);
    }
    items.replaceChildren(...sections.map(reviewTable));
    pageCounts = {page, pages: data.pages, total: data.total};
    updatePageStatus();
    previous.disabled = page <= 1;
    next.disabled = page >= data.pages;
    status.textContent = data.total ? '' : '이 조건에 맞는 검토 항목이 없습니다.';
    status.className = '';
  } catch (error) { if (request === generation) showError(error); }
}
function table(columns, rows) {
  const box = node('div', undefined, 'table-scroll');
  const element = node('table');
  const head = node('tr');
  for (const column of columns) {
    const th = node('th');
    th.append(node('span', column.label || column.key));
    if (column.label) th.append(node('small', column.key));
    head.append(th);
  }
  element.append(head);
  for (const row of rows) {
    const tr = node('tr');
    for (const value of row) tr.append(node('td', value));
    element.append(tr);
  }
  box.append(element);
  return box;
}
function splitColumns(row) {
  const shown = [];
  const diagnostic = [];
  for (const column of row.columns) {
    if (!column.key.startsWith('_')) { shown.push(column); continue; }
    const value = String(row.evidence[column.key] ?? '').trim();
    if (!value) continue;
    if (column.key !== '_review_reason' && column.key !== '_review_rule' &&
        !/^-?\d+(\.\d+)?$/.test(value) && !/^(true|false|nan|none|nat)$/i.test(value))
      shown.push(column);
    else diagnostic.push(column);
  }
  return {shown, diagnostic};
}
function multiControl(field, saved, updateDirty, saveRow) {
  const details = node('details', undefined, 'multi-choice');
  const summary = node('summary');
  const list = node('div', undefined, 'multi-choice-list');
  const selected = saved === undefined ? field.original_codes :
    String(saved).replace(/^\[|\]$/g, '').split(',').map(code => code.trim()).filter(Boolean);
  const boxes = [];
  for (const option of field.options) {
    const label = node('label', undefined, 'multi-choice-option');
    const checkbox = node('input');
    checkbox.type = 'checkbox';
    checkbox.value = String(option.code);
    checkbox.checked = selected.includes(checkbox.value);
    checkbox.addEventListener('change', () => { refresh(); updateDirty(); });
    checkbox.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); saveRow(); }
    });
    label.append(checkbox, node('span', `${option.label} (${option.code})`));
    list.append(label);
    boxes.push(checkbox);
  }
  function refresh() {
    const labels = field.options.filter((_, index) => boxes[index].checked).map(option => option.label);
    summary.textContent = labels.join(', ') || '선택 안 함';
    summary.title = summary.textContent;
  }
  refresh();
  details.append(summary, list);
  details.setAttribute('aria-label', field.label);
  return {
    element: details,
    get value() {
      const codes = boxes.filter(box => box.checked).map(box => box.value);
      return codes.join(',');
    },
    focus() { details.open = true; boxes[0]?.focus(); },
  };
}
function reviewTable(rows) {
  const first = rows[0];
  const section = node('section', undefined, 'review-section');
  section.append(node('h2', `${first.variable_name} · ${first.variable_id} · ${first.group} · 이 쪽 ${rows.length}건`));
  const hasSequence = rows.some(row => row.sequence !== null && row.sequence !== undefined && row.sequence !== '');
  const fields = [...new Map(rows.flatMap(row => row.fields.map(field => [field.code, field]))).values()];
  const fieldCodes = new Set(fields.map(field => field.code));
  const evidence = [...new Map(rows.flatMap(row => splitColumns(row).shown
    .filter(column => !['RID', 'SUBJID', 'SEQUENCE'].includes(column.key) && !fieldCodes.has(column.key))
    .map(column => [column.key, column]))).values()];
  const columns = [{key: '', label: '에피소드'}];
  if (hasSequence) columns.push({key: '', label: '순번'});
  columns.push({key: '', label: '검토 사유'}, ...evidence, ...fields.map(field => ({key: field.code, label: field.label})),
    {key: '', label: '저장'}, {key: '', label: '원문'});
  const box = node('div', undefined, 'table-scroll review-scroll');
  const element = node('table', undefined, 'review-table');
  const head = node('tr');
  for (const column of columns) {
    const th = node('th');
    th.append(node('span', column.label || column.key));
    if (column.key) th.append(node('small', column.key));
    head.append(th);
  }
  element.append(head);
  for (const row of rows) {
    const tr = node('tr', undefined, row.decision ? 'saved' : undefined);
    tr.append(node('td', row.episode_id));
    if (hasSequence) tr.append(node('td', row.sequence ?? ''));
    const reason = node('td');
    reason.append(node('div', row.reason ?? '', 'clipped-text'));
    tr.append(reason);
    for (const column of evidence) {
      const td = node('td');
      if (row.columns.some(entry => entry.key === column.key))
        td.append(node('div', displaySource(row.evidence[column.key]), 'clipped-text'));
      tr.append(td);
    }
    const controls = new Map();
    const savedValues = new Map();
    const rowFields = new Map(row.fields.map(field => [field.code, field]));
    const save = node('button', '값 저장');
    save.type = 'button';
    save.disabled = !row.fields.length;
    function updateDirty() {
      tr.classList.toggle('dirty', [...controls].some(([code, control]) =>
        (rowFields.get(code).comment_for && !commentEnabled(rowFields.get(code)) ? '' : control.value) !==
        savedValues.get(code)));
    }
    function commentEnabled(field) {
      if (!field.comment_for) return true;
      const parent = controls.get(field.comment_for.code);
      if (!parent) return false;
      const selected = String(parent.value).split(',').map(code => code.trim());
      return field.comment_for.options.some(code => selected.includes(String(code)));
    }
    function syncComments() {
      for (const field of row.fields) {
        if (field.comment_for) controls.get(field.code).disabled = !commentEnabled(field);
      }
      updateDirty();
    }
    async function saveRow() {
      if (save.disabled) return;
      for (const field of row.fields) {
        if (field.multiple && field.original_invalid && !controls.get(field.code).value.trim() &&
            !confirm(`${field.label}: 기존 값(${field.original})을 읽지 못해 빈 값으로 저장됩니다. 저장할까요?`))
          return;
      }
      for (const field of row.fields) {
        if ((field.comment_for ? commentEnabled(field) : field.required) &&
            !controls.get(field.code).value.trim()) {
          status.className = 'error';
          status.textContent = `필수 입력값이 비어 있다: ${field.label}`;
          controls.get(field.code).focus();
          return;
        }
      }
      save.disabled = true;
      const values = Object.fromEntries([...controls].map(([code, control]) =>
        [code, rowFields.get(code).comment_for && !commentEnabled(rowFields.get(code)) ? '' : control.value]));
      try {
        const result = await api('api/answer', {batch: batch.value, id: row.id, values});
        for (const [code, value] of Object.entries(values)) savedValues.set(code, value);
        updateDirty();
        tr.classList.add('saved');
        savedAt.textContent = `저장됨 · ${result.at}`;
        if (!savedAt.isConnected) saveCell.append(savedAt);
        status.className = '';
        status.textContent = `저장했습니다: ${row.episode_id}`;
        refreshSummary();
      } catch (error) { showError(error); }
      finally { save.disabled = false; }
    }
    for (const field of fields) {
      const td = node('td', undefined, 'input-cell');
      const actual = rowFields.get(field.code);
      if (actual) {
        let control;
        if (actual.multiple) {
          control = multiControl(actual, row.decision?.values?.[actual.code], syncComments, saveRow);
        } else if (actual.options.length) {
          control = node('select');
          control.append(new Option('선택', ''));
          for (const option of actual.options)
            control.append(new Option(`${option.label} (${option.code})`, String(option.code)));
        } else { control = node('input'); control.type = 'text'; }
        if (!actual.multiple) {
          control.setAttribute('aria-label', actual.label);
          control.value = row.decision?.values?.[actual.code] ?? actual.original ?? '';
          control.addEventListener('input', updateDirty);
          control.addEventListener('change', updateDirty);
          if (actual.options.length) control.addEventListener('change', syncComments);
          control.addEventListener('keydown', event => {
            if (event.key === 'Enter') { event.preventDefault(); saveRow(); }
          });
        }
        savedValues.set(actual.code, control.value);
        controls.set(actual.code, control);
        td.append(actual.multiple ? control.element : control);
        const original = actual.original === '' || actual.original == null ? '(공란)' : actual.original;
        if (actual.multiple) {
          const labels = actual.options.filter(option => actual.original_codes.includes(String(option.code)))
            .map(option => option.label);
          td.append(node('small', `기존: ${original}${labels.length ? ` → ${labels.join(', ')}` : ''}`));
          if (actual.original_invalid)
            td.append(node('div', '기존 값을 읽지 못했습니다. 직접 골라 저장하세요.', 'error'));
          if (actual.original_unknown.length)
            td.append(node('div', `선택지 밖 코드 ${actual.original_unknown.join(', ')} 는 저장되지 않습니다`, 'error'));
        } else td.append(node('small', `기존: ${original}`));
      }
      tr.append(td);
    }
    syncComments();
    const saveCell = node('td');
    const savedAt = node('small', row.decision ? `저장됨 · ${row.decision.at}` : '');
    save.addEventListener('click', saveRow);
    saveCell.append(save);
    if (row.decision) saveCell.append(savedAt);
    tr.append(saveCell);
    const detailCell = node('td');
    const detailButton = node('button', '원문');
    detailButton.type = 'button';
    detailButton.setAttribute('aria-expanded', 'false');
    detailCell.append(detailButton);
    if (row.chart_review?.state === 'done')
      detailCell.append(node('span', '차트 검토 완료', 'chart-badge done'));
    else if (row.chart_review?.state === 'partial')
      detailCell.append(node('span', '차트 검토 진행중', 'chart-badge'));
    if (row.chart_review && location.pathname.startsWith('/review/')) {
      const link = node('a', '차트에서 보기', 'chart-link');
      link.href = `../chart/#${params({batch: batch.value, label: row.chart_review.label, variable: row.variable_id})}`;
      link.addEventListener('click', event => { if (!mayLeave()) event.preventDefault(); });
      detailCell.append(link);
    }
    tr.append(detailCell);
    element.append(tr);
    const detailRow = node('tr', undefined, 'detail-row hidden');
    const detailContent = node('td');
    detailContent.colSpan = columns.length;
    detailContent.append(node('h3', 'EMR 원문'));
    const sourceBox = node('div', undefined, 'sources');
    detailContent.append(sourceBox);
    detailRow.append(detailContent);
    element.append(detailRow);
    let loaded = false;
    detailButton.addEventListener('click', async () => {
      const opening = detailRow.classList.toggle('hidden') === false;
      detailButton.setAttribute('aria-expanded', String(opening));
      detailButton.textContent = opening ? '원문 닫기' : '원문';
      if (!opening || loaded) return;
      loaded = true;
      sourceBox.replaceChildren(node('p', '불러오는 중…'));
      try {
        const data = await api(`api/source?${params({batch: batch.value, id: row.id})}`);
        sourceBox.replaceChildren();
        for (const source of data.sources) sourceBox.append(sourceView(source));
        if (!data.sources.length) sourceBox.append(node('p', '표시할 원천이 없습니다.'));
      } catch (error) {
        sourceBox.replaceChildren(node('p', error.message, 'error'));
        loaded = false;
      }
    });
  }
  box.append(element);
  section.append(box);
  return section;
}
const selections = new Map();
function rememberSelections() {
  for (const select of [batch, group, variable, filter, pageSize]) selections.set(select, select.value);
}
function mayLeave() {
  return !items.querySelector('tr.dirty') || confirm('저장하지 않은 입력이 있습니다. 이동할까요?');
}
function changeSelection(select, action) {
  if (!mayLeave()) { select.value = selections.get(select); return; }
  action();
  rememberSelections();
}
document.querySelector('#reload').addEventListener('click', () => { if (mayLeave()) loadSummary(); });
document.querySelector('#reload').addEventListener('click', loadSurgeryReview);
batch.addEventListener('change', () => changeSelection(batch, () => {
  page = 1; group.value = ''; variable.value = ''; loadSummary(); loadSurgeryReview();
}));
group.addEventListener('change', () => changeSelection(group, () => {
  page = 1; fillVariables(); variable.value = ''; loadPage();
}));
variable.addEventListener('change', () => changeSelection(variable, () => { page = 1; loadPage(); }));
filter.addEventListener('change', () => changeSelection(filter, () => { page = 1; loadPage(); }));
chartUndone.addEventListener('change', () => {
  if (!mayLeave()) { chartUndone.checked = !chartUndone.checked; return; }
  page = 1; loadPage();
});
pageSize.addEventListener('change', () => {
  changeSelection(pageSize, () => {
    page = 1;
    try { localStorage.setItem('review-page-size', pageSize.value); } catch (_) { /* 저장 실패는 무시한다. */ }
    loadPage();
  });
});
previous.addEventListener('click', () => { if (mayLeave()) { page--; loadPage(); } });
next.addEventListener('click', () => { if (mayLeave()) { page++; loadPage(); } });
document.querySelector('#publish').addEventListener('click', async event => {
  event.target.disabled = true;
  try {
    const result = await api('api/publish', {batch: batch.value});
    status.className = '';
    status.textContent = `생성됨: ${result.upload}${result.complete ? '' : ' · 필수 입력 누락 있음'}`;
  } catch (error) { showError(error); }
  finally { event.target.disabled = false; }
});
(async () => {
  try {
    for (const name of await api('api/batches')) batch.append(new Option(name, name));
    rememberSelections();
    await loadSummary();
    await loadSurgeryReview();
  } catch (error) { showError(error); }
})();
