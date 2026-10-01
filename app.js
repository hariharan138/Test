(() => {
  const $ = s => document.querySelector(s);
  const KEY = 'chit.notes.v1';

  // ---------- icon set ----------
  const PALETTE = [
    ['#b794ff', '#8a5cf0'], ['#ff7aa6', '#f0457f'], ['#9a8cff', '#6b52e8'], ['#ff9f80', '#f2693f'],
    ['#6fa8ff', '#4b86ee'], ['#ffb066', '#f58b2a'], ['#7be08f', '#3cc15c'], ['#ff8cc6', '#ec4fa0'],
    ['#7cc8ff', '#3fa3ee'], ['#ff9482', '#f2563f'], ['#86e69a', '#43c864'], ['#ffd666', '#f2b020'],
  ];
  const GLYPHS = [
    'M6 20V11a6 6 0 0112 0v9l-2.5-2-2 2-1.5-2-1.5 2-2-2zM10 11h.01M14 11h.01',        // ghost
    'M8 20a3 3 0 100-.01M16 18a3 3 0 100-.01M8 17c0-6 3-10 8-12M16 15c0-4-1-7-2-10',   // cherry
    'M12 3c3 2 4 6 4 10l-1.500 3h-5L8 13c0-4 1-8 4-10zM9.500 18l-1 3M14.500 18l1 3M12 10h.01', // rocket
    'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8a4 4 0 100 8 4 4 0 000-8zM12 12h.01',        // target
    'M3 15l5-5 3 2 8 1 1 2v0H3zM3 19h18',                                              // sneaker
    'M12 4l2.500 5 5.500.8-4 3.900 1 5.500-5-2.700-5 2.700 1-5.500-4-3.900 5.500-.8z',         // star
    'M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19l7-7',                                   // leaf
    'M9 18V6l10-2v12M9 18a2.500 2.500 0 11-5 0 2.500 2.500 0 015 0zM19 16a2.500 2.500 0 11-5 0 2.500 2.500 0 015 0z', // music
    'M3 19l6-10 4 6 3-4 5 8z',                                                         // mountain
    'M12 20s-7-4.500-7-10a4 4 0 017-2.500A4 4 0 0119 10c0 5.500-7 10-7 10z',             // heart
    'M13 3L5 14h6l-1 7 8-11h-6z',                                                      // bolt
    'M5 9h11v5a4 4 0 01-4 4H9a4 4 0 01-4-4zM16 10h2a2 2 0 010 4h-2M8 3v3M12 3v3',      // cup
  ];
  const HOUSE = 'M4 11l8-7 8 7v8a1 1 0 01-1 1H5a1 1 0 01-1-1zM10 20v-5h4v5';
  const MARK = 'M7 4h10a1 1 0 011 1v15l-6-4-6 4V5a1 1 0 011-1z';
  const icoHTML = (i, path) => {
    const [a, b] = PALETTE[i];
    return `<div class="ico" style="--c1:${a};--c2:${b}"><svg viewBox="0 0 24 24"><path d="${path || GLYPHS[i]}"/></svg></div>`;
  };
  const makeIco = (i, cls = '', path) => {
    const d = document.createElement('div');
    d.innerHTML = icoHTML(i, path);
    const e = d.firstChild; if (cls) e.classList.add(...cls.split(' ')); return e;
  };

  // ---------- data ----------
  const H = 3600e3;
  let notes;
  try { notes = JSON.parse(localStorage.getItem(KEY)); } catch { notes = null; }
  if (!Array.isArray(notes)) {
    const now = Date.now();
    notes = [
      { id: 1, title: 'Buy fresh cherries', body: 'Buy fresh cherries', icon: 1, ts: now - 2 * H },
      { id: 2, title: 'Launch day checklist', body: 'Launch day checklist', icon: 2, ts: now - 26 * H },
    ];
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch {} };
  const sorted = () => [...notes].sort((a, b) => b.ts - a.ts);

  const ago = ts => {
    const m = (Date.now() - ts) / 60e3;
    if (m < 1) return 'Just now';
    if (m < 60) return `${Math.floor(m)}m ago`;
    if (m < 60 * 24) return `${Math.floor(m / 60)}h ago`;
    if (m < 60 * 48) return 'Yesterday';
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };
  const stampOf = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' +
      d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
  };
  const line = n => (n.body.trim().split('\n')[0] || n.title);

  // ---------- state ----------
  let tab = 'home', query = '', draft = null, step = 1;

  const screens = { home: $('#home'), editor: $('#editor'), fold: $('#fold') };
  const show = name => {
    for (const k in screens) screens[k].hidden = k !== name;
    $('#tabs').classList.toggle('away', name !== 'home');
  };

  // ---------- home ----------
  function renderHome() {
    $('#date').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#count').textContent = notes.length;
    const all = sorted();
    $('#peek').innerHTML = '';
    const top3 = all.slice(0, 3);
    const order = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;
    order.forEach(n => $('#peek').append(makeIco(n.icon, n === top3[0] ? '' : 'round')));

    const showAll = tab === 'saved' || query;
    $('#list-title').textContent = query ? 'Results' : tab === 'saved' ? 'All notes' : 'Recent';
    $('#see-all').hidden = tab === 'saved' || !!query;
    let items = all.filter(n => !query || (n.title + ' ' + n.body).toLowerCase().includes(query));
    if (!showAll) items = items.slice(0, 3);
    const list = $('#list'); list.innerHTML = '';
    if (!items.length) list.innerHTML = '<div class="empty">No notes yet. Tap + to add one.</div>';
    items.forEach((n, i) => {
      const b = document.createElement('button');
      b.className = 'row'; b.style.animationDelay = i * 40 + 'ms';
      b.innerHTML = `${icoHTML(n.icon)}<div class="t"><b></b><small>${ago(n.ts)}</small></div>
        <svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`;
      b.querySelector('b').textContent = line(n);
      b.onclick = () => openEditor(n);
      list.append(b);
    });
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  }

  document.querySelectorAll('.tab').forEach(t => t.onclick = () => { tab = t.dataset.tab; renderHome(); });
  $('#see-all').onclick = () => { tab = 'saved'; renderHome(); };
  $('#search-btn').onclick = () => {
    const s = $('#search'); s.hidden = !s.hidden;
    if (!s.hidden) $('#q').focus(); else { $('#q').value = query = ''; renderHome(); }
  };
  $('#q').oninput = e => { query = e.target.value.trim().toLowerCase(); renderHome(); };

  // ---------- editor ----------
  function openEditor(existing) {
    draft = existing
      ? { ...existing, editing: true }
      : { id: Date.now(), title: 'Morning note', body: '', icon: 4, ts: Date.now() };
    buildGrid();
    $('#title').value = draft.title;
    $('#body').value = draft.body;
    $('#del').hidden = !existing;
    show('editor');
    setStep(existing ? 2 : 1);
  }

  function buildGrid() {
    const g = $('#grid'); g.innerHTML = '';
    PALETTE.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'cell' + (i === draft.icon ? ' on' : '');
      b.style.setProperty('--c2', c[1]);
      b.append(makeIco(i));
      b.onclick = () => { draft.icon = i; buildGrid(); };
      g.append(b);
    });
    $('#big-ico').innerHTML = icoHTML(draft.icon);
  }

  function setStep(n) {
    step = n;
    $('#step1').hidden = n !== 1;
    $('#step2').hidden = n !== 2;
    $('#bar-step').textContent = `Step ${n} of 2`;
    $('#bar-title').textContent = draft.editing ? 'Edit note' : 'New note';
    if (n === 2) {
      $('#p-ico').innerHTML = icoHTML(draft.icon);
      $('#p-ico').firstChild.classList.add('sm');
      $('#stamp').textContent = stampOf(draft.ts);
      setTimeout(() => $('#body').focus(), 80);
    } else document.activeElement.blur();
  }

  $('#fab').onclick = () => openEditor();
  $('#close').onclick = () => { show('home'); renderHome(); };
  $('#back').onclick = () => (step === 2 && !draft.editing) ? setStep(1) : $('#close').click();
  $('#del').onclick = () => {
    notes = notes.filter(n => n.id !== draft.id); save(); $('#close').click();
  };
  $('#go').onclick = () => {
    if (step === 1) return setStep(2);
    draft.title = $('#title').value.trim() || 'Untitled';
    draft.body = $('#body').value;
    if (!draft.body.trim()) { $('#body').focus(); return shake($('#paper')); }
    document.activeElement.blur();
    if (draft.editing) {
      const i = notes.findIndex(n => n.id === draft.id);
      notes[i] = { id: draft.id, title: draft.title, body: draft.body, icon: draft.icon, ts: notes[i].ts };
      save(); show('home'); renderHome();
    } else {
      notes.push({ id: draft.id, title: draft.title, body: draft.body, icon: draft.icon, ts: Date.now() });
      save(); foldAway();
    }
  };
  const shake = el => el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 250 });

  // keep the Next button above the on-screen keyboard
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const upd = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.body.classList.toggle('kb', kb > 80);
      document.documentElement.style.setProperty('--kb', kb + 'px');
    };
    vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd);
  }

  // ---------- fold animation ----------
  async function foldAway() {
    const stage = $('#fold-stage');
    stage.innerHTML = `
      <div class="fico"></div>
      <div class="paper"><div class="p-head"><div class="ico sm"></div><div><input disabled><small></small></div></div>
      <textarea disabled></textarea><span class="tag">#daily</span></div>
      <div class="folder"><div class="f-back"></div><div class="f-mid"></div>
      <div class="f-front"><div class="count">${notes.length - 1}</div><div class="pill"><span>Notes</span><i></i></div></div></div>`;
    const paper = stage.querySelector('.paper');
    paper.querySelector('.p-head .ico').outerHTML = icoHTML(draft.icon).replace('class="ico"', 'class="ico sm"');
    paper.querySelector('input').value = draft.title;
    paper.querySelector('small').textContent = stampOf(draft.ts);
    paper.querySelector('textarea').value = draft.body;
    const fico = stage.querySelector('.fico');
    fico.innerHTML = icoHTML(draft.icon); fico.firstChild.classList.add('xl');
    fico.firstChild.style.cssText += ';width:60px;height:60px';
    const folder = stage.querySelector('.folder');
    show('fold');
    const E = 'cubic-bezier(.5,0,.2,1)';
    const run = (el, kf, o) => el.animate(kf, { duration: 600, easing: E, fill: 'forwards', ...o }).finished;

    await run(paper, [{ transform: 'scale(.92)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350 });
    await new Promise(r => setTimeout(r, 450));
    run(folder, [{ opacity: 0, transform: 'translateY(60px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450 });
    run(paper, [{ transform: 'none' }, { transform: 'translateY(60px) scale(.7)' }], { duration: 500 });
    await run(fico, [{ transform: 'none' }, { transform: 'translateY(40px)' }], { duration: 500 });
    const fy = folder.getBoundingClientRect().top - fico.getBoundingClientRect().top - 20;
    run(paper, [{ transform: 'translateY(60px) scale(.7)', opacity: 1 }, { transform: `translateY(${fy + 80}px) scale(.35)`, opacity: 0 }], { duration: 600 });
    await run(fico, [{ transform: 'translateY(40px)', opacity: 1 }, { transform: `translateY(${fy}px) scale(.65)`, opacity: .9 }], { duration: 600 });
    tab = 'home'; query = ''; $('#q').value = ''; $('#search').hidden = true;
    show('home'); renderHome();
    const first = $('#peek').children[$('#peek').children.length === 3 ? 1 : $('#peek').children.length - 1]; first && first.classList.add('drop');
    const f = $('#folder'); f.classList.remove('bounce'); void f.offsetWidth; f.classList.add('bounce');
  }

  // ---------- tab icons ----------
  document.querySelectorAll('.tab').forEach(t => {
    t.querySelector('svg').replaceWith(makeIco(0, 'sm', t.dataset.tab === 'home' ? HOUSE : MARK));
  });

  // ---------- init ----------
  show('home'); renderHome();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
