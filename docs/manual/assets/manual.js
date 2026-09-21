/* Manual de OpenGanttLab — navegación, búsqueda y utilidades. Sin dependencias; funciona sin conexión.
   Ruta: #/capitulo  o  #/capitulo/ancla   (los ids del DOM son «capitulo--ancla»). */
(() => {
  'use strict';
  const CH = window.MANUAL.chapters, GROUPS = window.MANUAL.groups;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const textOf = el => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), out = []; let n; while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t) out.push(t); } return out.join(' '); };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } } };
  const IC = { chev: '<svg class="ic" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>', home: '<svg class="ic" viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>' };

  /* ── Menú lateral ── */
  const side = $('#side');
  let html = '';
  GROUPS.forEach(g => {
    html += `<div class="grp">${g}</div>`;
    CH.filter(c => c.group === g).forEach(c => {
      html += `<a class="nv" href="#/${c.slug}" data-slug="${c.slug}"><span class="n">${c.n}</span><span>${c.title}</span></a><div class="sub" data-sub="${c.slug}"></div>`;
    });
  });
  side.innerHTML = html;
  const arts = Object.fromEntries($$('article[data-slug]').map(a => [a.dataset.slug, a]));
  // Subsecciones (h2) de cada capítulo en el menú
  CH.forEach(c => {
    const box = $(`[data-sub="${c.slug}"]`, side), a = arts[c.slug];
    if (!a) return;
    box.innerHTML = $$('h2[id]', a).map(h => `<a href="#/${c.slug}/${h.id.split('--')[1]}">${h.firstChild.textContent.trim()}</a>`).join('');
  });

  /* ── Encabezados con enlace copiable ── */
  $$('article h2[id], article h3[id]').forEach(h => {
    const [slug, anchor] = h.id.split('--');
    h.insertAdjacentHTML('beforeend', `<a class="anchor" href="#/${slug}/${anchor}" aria-label="Enlace a esta sección">#</a>`);
  });

  /* ── Índice de búsqueda ── */
  const index = [];
  CH.forEach(c => {
    const a = arts[c.slug]; if (!a) return;
    let cur = { slug: c.slug, ch: c.title, id: '', heading: c.title, text: '' };
    const push = () => { if (cur.text.trim() || cur.heading) index.push({ ...cur, nh: norm(cur.heading), nt: norm(cur.text), nc: norm(c.title) }); };
    [...a.children].forEach(el => {
      if (/^H[23]$/.test(el.tagName) && el.id) { push(); cur = { slug: c.slug, ch: c.title, id: el.id.split('--')[1], heading: el.firstChild.textContent.trim(), text: '' }; }
      else cur.text += ' ' + textOf(el);
    });
    push();
  });
  const input = $('#q'), results = $('#results');
  let sel = -1, hits = [];
  const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  function mark(orig, toks) {
    const n = norm(orig); const spans = [];
    toks.forEach(t => { let i = -1; while ((i = n.indexOf(t, i + 1)) >= 0) spans.push([i, i + t.length]); });
    spans.sort((a, b) => a[0] - b[0]);
    let out = '', p = 0;
    spans.forEach(([s, e]) => { if (s < p) return; out += esc(orig.slice(p, s)) + '<mark>' + esc(orig.slice(s, e)) + '</mark>'; p = e; });
    return out + esc(orig.slice(p));
  }
  function search(q) {
    const toks = norm(q).split(/\s+/).filter(t => t.length > 1);
    if (!toks.length) { hits = []; return; }
    hits = index.map(s => {
      let score = 0;
      for (const t of toks) {
        const inH = s.nh.includes(t), inC = s.nc.includes(t), cnt = (s.nt.split(t).length - 1);
        if (!inH && !inC && !cnt) return null;
        score += (inH ? 8 : 0) + (inC ? 2 : 0) + Math.min(5, cnt);
      }
      return { s, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 9).map(h => ({ ...h.s, toks }));
  }
  function render() {
    if (!input.value.trim()) { results.classList.remove('on'); return; }
    results.classList.add('on');
    if (!hits.length) { results.innerHTML = '<div class="none">Sin resultados. Prueba con otra palabra (por ejemplo «dependencias», «XML» o «exportar»).</div>'; return; }
    results.innerHTML = hits.map((h, i) => {
      const pos = h.nt.indexOf(h.toks.find(t => h.nt.includes(t)) || '');
      const from = Math.max(0, pos - 50), snippet = pos >= 0 ? (from ? '…' : '') + h.text.slice(from, from + 150).trim() + '…' : h.text.slice(0, 130).trim() + '…';
      return `<a href="#/${h.slug}${h.id ? '/' + h.id : ''}" data-i="${i}" class="${i === sel ? 'sel' : ''}"><div><span class="rt">${mark(h.heading, h.toks)}</span><span class="rc">${esc(h.ch)}</span></div><div class="rs">${mark(snippet, h.toks)}</div></a>`;
    }).join('');
  }
  input.addEventListener('input', () => { sel = -1; search(input.value); render(); });
  input.addEventListener('focus', () => { if (input.value.trim()) render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!hits.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length; render(); $('.sel', results)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && hits.length) { e.preventDefault(); const h = hits[Math.max(0, sel)]; location.hash = `#/${h.slug}${h.id ? '/' + h.id : ''}`; closeSearch(); }
    else if (e.key === 'Escape') { closeSearch(); input.blur(); }
  });
  function closeSearch() { results.classList.remove('on'); }
  document.addEventListener('click', e => { if (!e.target.closest('.search')) closeSearch(); else if (e.target.closest('#results a')) { closeSearch(); input.value = ''; } });
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); input.focus(); input.select(); }
    if (e.key === 'Escape') { $('#lightbox').classList.remove('on'); document.body.classList.remove('menu'); }
  });

  /* ── Enrutado ── */
  let current = null, spy = null;
  function route(first) {
    const m = location.hash.match(/^#\/([\w-]+)(?:\/([\w-]+))?/);
    const slug = m && arts[m[1]] ? m[1] : CH[0].slug, anchor = m && m[2];
    const c = CH.find(x => x.slug === slug), i = CH.indexOf(c);
    if (current !== slug) {
      Object.values(arts).forEach(a => a.hidden = a.dataset.slug !== slug);
      $$('.nv', side).forEach(a => a.toggleAttribute('aria-current', a.dataset.slug === slug) || a.removeAttribute('aria-current'));
      $$('.nv', side).forEach(a => { if (a.dataset.slug === slug) a.setAttribute('aria-current', 'page'); });
      $('#crumbs').innerHTML = `<a href="#/${CH[0].slug}">${IC.home}</a>${IC.chev}<span>${c.group}</span>${IC.chev}<span aria-current="page">${c.title}</span>`;
      $('#pager').innerHTML = (i > 0 ? `<a class="pv" href="#/${CH[i - 1].slug}"><small>← Anterior</small><b>${CH[i - 1].title}</b></a>` : '<span></span>') +
        (i < CH.length - 1 ? `<a class="nx" href="#/${CH[i + 1].slug}"><small>Siguiente →</small><b>${CH[i + 1].title}</b></a>` : '');
      buildToc(arts[slug]);
      document.title = `${c.title} — Manual de OpenGanttLab`;
      current = slug;
      if (!anchor) window.scrollTo(0, 0);
      const sb = $(`.nv[data-slug="${slug}"]`, side); if (sb && !first) sb.scrollIntoView({ block: 'nearest' });
    }
    if (anchor) { const el = document.getElementById(`${slug}--${anchor}`); if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: first ? 'auto' : 'smooth', block: 'start' })); }
    document.body.classList.remove('menu');
  }
  function buildToc(a) {
    const hs = $$('h2[id],h3[id]', a);
    $('#toc').innerHTML = '<h4>En esta página</h4>' + hs.map(h => `<a class="${h.tagName === 'H3' ? 'l3' : ''}" href="#/${h.id.split('--')[0]}/${h.id.split('--')[1]}" data-h="${h.id}">${h.firstChild.textContent.trim()}</a>`).join('');
    if (spy) spy.disconnect();
    const links = new Map($$('#toc a').map(l => [l.dataset.h, l]));
    let active = null;
    spy = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) active = e.target.id; });
      if (active) { links.forEach(l => l.classList.remove('on')); links.get(active)?.classList.add('on'); }
    }, { rootMargin: '-70px 0px -70% 0px' });
    hs.forEach(h => spy.observe(h));
  }
  window.addEventListener('hashchange', () => route(false));

  /* ── Zoom de figuras ── */
  const lb = $('#lightbox'), lbi = $('img', lb);
  document.addEventListener('click', e => {
    const im = e.target.closest('figure.fig img');
    if (im) { lbi.src = im.currentSrc || im.src; lbi.alt = im.alt; lb.classList.add('on'); }
    else if (e.target.closest('#lightbox')) lb.classList.remove('on');
  });

  /* ── Tema, menú, impresión, subir ── */
  const setTheme = t => { document.documentElement.dataset.theme = t; store.set('ogl-manual-theme', t); };
  $('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('menu'));
  document.addEventListener('click', e => { if (document.body.classList.contains('menu') && !e.target.closest('#side') && !e.target.closest('#menuBtn')) document.body.classList.remove('menu'); });
  $('#printBtn').addEventListener('click', () => { document.body.classList.add('print-all'); window.print(); });
  let fixedPrint = false;
  window.addEventListener('afterprint', () => { if (!fixedPrint) document.body.classList.remove('print-all'); });
  const top = $('#toTop'); top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => top.classList.toggle('on', scrollY > 700), { passive: true });

  if (/[?&]print/.test(location.search)) { fixedPrint = true; document.body.classList.add('print-all'); $$('img').forEach(i => { i.loading = 'eager'; }); }
  route(true);
})();
