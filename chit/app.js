(() => {
  const $ = s => document.querySelector(s);
  const KEY = 'chit.notes.v1';

  // ---------- icon set ----------
  const PALETTE = [
    ['#c9b0ff', '#8a6cf0'], ['#ff9bb8', '#f0568a'], ['#b3a6ff', '#7058e6'], ['#ffc29a', '#f58b4c'],
    ['#8fb4ff', '#5b8df5'], ['#ffc08a', '#f58b4c'], ['#9be6a8', '#4cc36a'], ['#ffa6cf', '#ee5fa7'],
    ['#9ad3ff', '#4aa9ee'], ['#ffa28f', '#f2694f'], ['#a6eab0', '#52c46f'], ['#ffe08a', '#f2b53b'],
  ];
  const GLYPHS = [
    'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',                                   // house
    'M8 20a3 3 0 100-.01M16 18a3 3 0 100-.01M8 17c0-6 3-10 8-12M16 15c0-4-1-7-2-10', // cherry
    'M12 4l6 16M12 4L6 20M8.5 14h7',                                     // A
    'M3 17h18v-2l-6-2-3-3-5 3-4 1zM8 17v-3',                             // sneaker
    'M5 8h14v10H5zM9 8V6h6v2',                                           // bag
    'M12 4l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z',     // star
    'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.500-7 10-7 10z', // heart
    'M5 12l5 5 9-10',                                                    // check
    'M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19l7-7',                     // leaf
    'M12 8a4 4 0 100 8 4 4 0 000-8zM12 3v2M12 19v2M3 12h2M19 12h2',      // sun
    'M13 3L5 14h6l-1 7 8-11h-6z',                                        // bolt
    'M5 5h6a3 3 0 013 3v11a2 2 0 00-2-2H5zM19 5h-5',                     // book
  ];
  const icoHTML = i => {
    const [a, b] = PALETTE[i];
    return `<div class="ico" style="--c1:${a};--c2:${b}"><svg viewBox="0 0 24 24"><path d="${GLYPHS[i]}"/></svg></div>`;
  };
  const makeIco = (i, cls = '') => {
    const d = document.createElement('div');
    d.innerHTML = icoHTML(i);
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
    all.slice(0, 3).reverse().forEach(n => $('#peek').append(makeIco(n.icon)));

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
      <div class="folder"><div class="f-back"></div><div class="f-back2"></div>
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
    const first = $('#peek').lastElementChild; first && first.classList.add('drop');
    const f = $('#folder'); f.classList.remove('bounce'); void f.offsetWidth; f.classList.add('bounce');
  }

  // ---------- init ----------
  show('home'); renderHome();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
