'use strict';
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const iconPaths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  book: 'M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z',
  flask: 'M9 3h6M10 3v6L4 19q-1 2 2 2h12q3 0 2-2L14 9V3M7 15h10',
  cards: 'M7 3h13v15H7ZM4 7H2v15h14v-2M10 7h7M10 11h5',
  chart: 'M4 3v18h17M8 16v-5M13 16V7M18 16V4',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  back: 'M20 12H5m6-6-6 6 6 6',
  moon: 'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',
  sun: 'M12 3V1M12 23v-2M3 12H1M23 12h-2M5 5 3.5 3.5M20.5 20.5 19 19M5 19l-1.5 1.5M20.5 3.5 19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  phone: 'M7 2h10q2 0 2 2v16q0 2-2 2H7q-2 0-2-2V4q0-2 2-2M10 18h4',
  info: 'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  spark: 'M12 2c0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10C8 12 12 8 12 2Z',
  wave: 'M2 12c4-14 6-14 10 0s6 14 10 0',
  system: 'M3 3h6v6H3ZM15 15h6v6h-6ZM6 9v9h9M9 6h9v9',
  check: 'M4 12l5 5L20 6',
  zoom: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0M7 10h6M10 7v6',
  clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  refresh: 'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-1l1 3M4 15l1 3a8 8 0 0 0 14-1',
};
const icon = (n) =>
  '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="' +
  (iconPaths[n] || iconPaths.book) +
  '"/></svg>';
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
}
const subjects = {
  cdd: {
    name: 'Chimie & développement durable',
    short: 'CDD',
    icon: 'flask',
    desc: 'Solubilité, acides et bases. Les bons réflexes en chimie.',
  },
  ondes: {
    name: 'Ondes & oscillations',
    short: 'Ondes',
    icon: 'wave',
    desc: 'Des phénomènes oscillants à la propagation des ondes.',
  },
  sp: {
    name: 'Systèmes & procédés',
    short: 'Systèmes & procédés',
    icon: 'system',
    desc: 'Distillation, évaporation et cristallisation, pas à pas.',
  },
};
const statusNames = { todo: 'À découvrir', review: 'À revoir', mastered: 'Maîtrisé' };
const shortTitle = (c) => c.titre.replace(/^(Chapitre|Séquence)\s+\d+\s*:\s*/i, '');
let appData, labData, diagramData, cardData, supplements, chapters, chapterMap, labMap, searchIndex;
let state = { version: 1, chapters: {}, exercises: {}, checks: {}, cards: {}, lastChapter: null },
  storageAvailable = true,
  cardSession = null,
  imageZoom = 1,
  toastTimer,
  offlineReady = false;
try {
  const saved = JSON.parse(localStorage.getItem('revise-progress') || 'null');
  if (saved) state = validateState(saved);
} catch (e) {
  if (e instanceof SyntaxError) {
    console.warn('Sauvegarde illisible.');
  } else {
    storageAvailable = false;
  }
}
function validateState(input) {
  if (!input || input.version !== 1 || typeof input !== 'object')
    throw new Error('Format de sauvegarde non reconnu.');
  const clean = {
    version: 1,
    chapters: {},
    exercises: {},
    checks: {},
    cards: {},
    lastChapter: null,
  };
  for (const key of ['chapters', 'exercises', 'checks', 'cards']) {
    if (!input[key] || typeof input[key] !== 'object' || Array.isArray(input[key]))
      throw new Error('Sauvegarde incomplète.');
    for (const [id, value] of Object.entries(input[key])) {
      if (
        !/^[a-zA-Z0-9_-]{1,90}$/.test(id) ||
        ['__proto__', 'constructor', 'prototype'].includes(id)
      )
        continue;
      if (key === 'chapters' && ['todo', 'review', 'mastered'].includes(value))
        clean[key][id] = value;
      if (key === 'cards' && ['review', 'mastered'].includes(value)) clean[key][id] = value;
      if (['exercises', 'checks'].includes(key) && typeof value === 'boolean')
        clean[key][id] = value;
    }
  }
  if (typeof input.lastChapter === 'string' && /^[a-z0-9-]+$/.test(input.lastChapter))
    clean.lastChapter = input.lastChapter;
  return clean;
}
function persist() {
  try {
    localStorage.setItem('revise-progress', JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
    toast('La progression reste disponible pour cette session. Exporte une sauvegarde.');
  }
  updateStorageLabel();
}
function updateStorageLabel() {
  const note = $('.local-note');
  if (note)
    note.innerHTML =
      '<i></i>' +
      (storageAvailable ? 'Progression sur cet appareil' : 'Sauvegarde locale indisponible');
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3400);
}
function math(root) {
  if (typeof renderMathInElement !== 'function') {
    toast('Les formules sont affichées en texte : recharge le carnet.');
    return;
  }
  renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
    strict: 'ignore',
    trust: false,
  });
}
const mastered = (spe) =>
  (spe ? appData[spe] : chapters).filter((c) => state.chapters[c.id] === 'mastered').length;
const labChecked = (l) => l.check.filter((_, i) => state.checks[l.id + '-' + i]).length;
const labDone = () => labData.filter((l) => labChecked(l) === l.check.length).length;
const countCards = () => cardData.filter((c) => state.cards[c.id] === 'mastered').length;
const courseHref = (c, mode = 'cours') => '#chapter/' + c.id + '/' + mode;
const figure = (file, title, vector = true) =>
  '<figure class="science-figure ' +
  (vector ? 'vector' : '') +
  '"><button data-image="assets/diagrams/' +
  file +
  '" data-caption="' +
  escapeHTML(title) +
  '" aria-label="Agrandir : ' +
  escapeHTML(title) +
  '"><img src="assets/diagrams/' +
  file +
  '" alt="' +
  escapeHTML(title) +
  '" loading="lazy" decoding="async"></button><figcaption><span>' +
  escapeHTML(title) +
  '</span>' +
  icon('zoom') +
  '</figcaption></figure>';
const originalLink = (file) =>
  '<button class="text-button" data-image="assets/originals/' +
  escapeHTML(file) +
  '" data-caption="Document fourni : ' +
  escapeHTML(file) +
  '">' +
  icon('zoom') +
  'Voir le document fourni</button>';
const tabs = (active = 'all') =>
  '<nav class="subject-tabs" aria-label="Spécialités"><a class="chip ' +
  (active === 'all' ? 'active' : '') +
  '" href="#courses" ' +
  (active === 'all' ? 'aria-current="page"' : '') +
  '>Tous les cours</a>' +
  Object.entries(subjects)
    .map(
      ([id, s]) =>
        '<a class="chip ' +
        (active === id ? 'active' : '') +
        '" href="#courses/' +
        id +
        '" ' +
        (active === id ? 'aria-current="page"' : '') +
        '>' +
        s.short +
        '</a>',
    )
    .join('') +
  '</nav>';
const statusSelect = (c) =>
  '<label class="status-control">Mon niveau <select data-status="' +
  c.id +
  '" aria-label="Niveau : ' +
  escapeHTML(shortTitle(c)) +
  '">' +
  Object.entries(statusNames)
    .map(
      ([v, n]) =>
        '<option value="' +
        v +
        '" ' +
        ((state.chapters[c.id] || 'todo') === v ? 'selected' : '') +
        '>' +
        n +
        '</option>',
    )
    .join('') +
  '</select></label>';
function heroArt() {
  return '<svg viewBox="0 0 410 300" class="hero-art" aria-hidden="true"><defs><pattern id="grid" width="23" height="23" patternUnits="userSpaceOnUse"><path d="M23 0H0V23" fill="none" stroke="#b7c7a8" stroke-width=".5" opacity=".5"/></pattern></defs><rect width="410" height="300" fill="url(#grid)"/><circle cx="233" cy="154" r="96" fill="#dce6cd"/><circle cx="233" cy="154" r="118" fill="none" stroke="#b3c19f" stroke-dasharray="3 6" opacity=".5"/><g transform="translate(79 33) rotate(-9 130 125)"><rect x="54" y="32" width="205" height="223" rx="14" fill="#fffef6" stroke="#b9c8ac"/><path d="M76 65H139M76 77H171" stroke="#ccd6c0" stroke-width="3" stroke-linecap="round"/><path d="M80 214H235M90 214V107" stroke="#c8d2bd" stroke-width="1.5"/><path d="M90 191C113 191 115 128 140 128S166 197 189 197 214 132 237 132" fill="none" stroke="#6d8c62" stroke-width="3"/><path d="M90 171H237" stroke="#bac9b0" stroke-dasharray="4 5"/><circle cx="140" cy="128" r="5" fill="#91ac71"/><text x="178" y="63" fill="#597849" font-family="Georgia" font-style="italic" font-size="23">λ = vT</text><text x="108" y="237" fill="#84927b" font-family="Arial" font-size="10" letter-spacing="2">COMPRENDRE · RELIER</text></g><g transform="translate(41 171) rotate(-12)"><path d="M40 0H68M46 0V42L10 110Q6 122 20 123H91Q105 122 98 110L62 42V0" fill="#edf3e5" stroke="#6d8964" stroke-width="2"/><path d="M28 84Q54 73 84 84L98 111Q102 119 91 119H21Q10 119 14 111Z" fill="#abc68d"/><circle cx="47" cy="97" r="4" fill="#edf3e5"/><circle cx="66" cy="106" r="3" fill="#edf3e5"/><circle cx="56" cy="77" r="3" fill="#91ac71"/></g><g stroke="#779368" stroke-width="1.5" fill="#e8eddf"><path d="M312 43 338 58 338 88 312 103 286 88 286 58Z"/><circle cx="312" cy="43" r="5"/><circle cx="338" cy="88" r="5"/><circle cx="286" cy="88" r="5"/></g><path d="M345 217v19m-9-9h18M43 98v12m-6-6h12" stroke="#8fa779" stroke-width="2"/></svg>';
}
function renderHome() {
  const last = chapterMap.get(state.lastChapter) || chapters[0];
  const date = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  $('#main').innerHTML =
    '<div class="page-intro"><div><h1>Un nouveau pas vers le Bac.</h1><p>Ton espace pour apprendre, comprendre et progresser.</p></div><span class="date-label">' +
    date +
    '</span></div><section class="hero"><div class="hero-text"><span class="eyebrow">' +
    icon('spark') +
    ' OBJECTIF 17,5 / 20</span><h2>Un peu chaque jour.<br><em>Beaucoup plus loin.</em></h2><p>Tes cours, tes exercices et tes gestes de laboratoire. Tout pour avancer avec confiance.</p><a class="button" href="' +
    courseHref(last) +
    '">' +
    (state.lastChapter ? 'Reprendre ma révision' : 'Commencer à réviser') +
    icon('arrow') +
    '</a></div>' +
    heroArt() +
    '</section><div class="stat-strip">' +
    [
      [icon('book'), chapters.length, 'chapitres à explorer'],
      [icon('check'), chapters.reduce((n, c) => n + c.exercices.length, 0), 'exercices type Bac'],
      [icon('flask'), labData.length, 'manipulations ECE'],
      [icon('chart'), mastered() + ' / ' + chapters.length, 'chapitres maîtrisés'],
    ]
      .map(
        ([i, n, l]) =>
          '<div class="stat"><span class="stat-icon">' +
          i +
          '</span><div><strong>' +
          n +
          '</strong><span>' +
          l +
          '</span></div></div>',
      )
      .join('') +
    '</div><div class="section-head"><div><h2>À chaque matière, son carnet.</h2><p>Les essentiels et les détails qui font la différence.</p></div><a class="inline-link" href="#courses">Tous les cours ' +
    icon('arrow') +
    '</a></div><div class="subjects-grid">' +
    Object.entries(subjects)
      .map(
        ([id, s]) =>
          '<a class="subject-card" data-spe="' +
          id +
          '" href="#courses/' +
          id +
          '"><div class="subject-top"><span class="subject-icon">' +
          icon(s.icon) +
          '</span><span>' +
          appData[id].length +
          ' chapitres</span></div><h3>' +
          s.name +
          '</h3><p>' +
          s.desc +
          '</p><div class="card-end"><span>' +
          mastered(id) +
          ' / ' +
          appData[id].length +
          ' maîtrisés</span><div class="progress-track"><i style="width:' +
          (mastered(id) / appData[id].length) * 100 +
          '%"></i></div><span class="card-arrow">' +
          icon('arrow') +
          '</span></div></a>',
      )
      .join('') +
    '</div><div class="lower-grid"><section class="lab-feature"><div class="feature-copy"><span class="label-pill">LE LABO · ECE</span><h3>Les bons gestes.<br>Les bons réflexes.</h3><p>Des montages à comprendre,<br>des protocoles à maîtriser.</p><a class="inline-link" href="#labs">Entrer au laboratoire ' +
    icon('arrow') +
    '</a></div><img src="assets/diagrams/reflux.svg" alt="" loading="lazy"></section><section class="daily-card"><span class="eyebrow">LE PETIT DÉCLIC</span><h3>Et si tu testais<br>ce que tu sais déjà ?</h3><p>' +
    cardData.length +
    ' flashcards pour réviser activement.</p><a href="#cards">Je me lance ' +
    icon('arrow') +
    '</a></section></div>';
}
function renderCourses(spe) {
  const valid = subjects[spe] ? spe : 'all',
    list = valid === 'all' ? chapters : chapters.filter((c) => c.spe === valid);
  $('#main').innerHTML =
    '<div class="page-intro"><div><h1>Mes cours</h1><p>Comprendre le cours, puis passer à la pratique.</p></div><span class="label-pill">6 CHAPITRES · 3 SPÉCIALITÉS</span></div>' +
    tabs(valid) +
    '<div class="chapter-grid">' +
    list
      .map(
        (c) =>
          '<a class="chapter-card" href="' +
          courseHref(c) +
          '"><span class="chapter-n">' +
          escapeHTML(subjects[c.spe].short.toUpperCase()) +
          ' · ' +
          escapeHTML(c.titre.match(/^(Chapitre|Séquence)\s+\d+/)?.[0] || 'COURS') +
          '</span><h2>' +
          escapeHTML(shortTitle(c)) +
          '</h2><p>' +
          escapeHTML(c.description) +
          '</p><div class="card-end"><span>' +
          c.exercices.length +
          ' exercice' +
          (c.exercices.length > 1 ? 's' : '') +
          ' · ' +
          statusNames[state.chapters[c.id] || 'todo'] +
          '</span><span class="card-arrow">' +
          icon('arrow') +
          '</span></div></a>',
      )
      .join('') +
    '</div>';
}
function renderChapter(id, mode = 'cours') {
  const c = chapterMap.get(id);
  if (!c) return renderMissing();
  mode = mode === 'exercices' ? 'exercices' : 'cours';
  state.lastChapter = id;
  persist();
  $('#main').innerHTML =
    '<a class="detail-back" href="#courses/' +
    c.spe +
    '">' +
    icon('back') +
    ' ' +
    subjects[c.spe].short +
    '</a><div class="eyebrow muted">' +
    escapeHTML(c.titre.match(/^(Chapitre|Séquence)\s+\d+/)?.[0] || 'COURS') +
    ' · TERMINALE STL</div><h1 class="detail-title">' +
    escapeHTML(shortTitle(c)) +
    '</h1><p class="detail-desc">' +
    escapeHTML(c.description) +
    '</p>' +
    tabs(c.spe) +
    '<div class="detail-toolbar"><nav class="mode-switch" aria-label="Contenu du chapitre"><a href="' +
    courseHref(c) +
    '" class="' +
    (mode === 'cours' ? 'active' : '') +
    '" ' +
    (mode === 'cours' ? 'aria-current="page"' : '') +
    '>' +
    icon('book') +
    'Le cours</a><a href="' +
    courseHref(c, 'exercices') +
    '" class="' +
    (mode === 'exercices' ? 'active' : '') +
    '" ' +
    (mode === 'exercices' ? 'aria-current="page"' : '') +
    '>' +
    icon('check') +
    'Exercices · ' +
    c.exercices.length +
    '</a></nav>' +
    statusSelect(c) +
    '</div><div id="chapter-content"></div>';
  if (mode === 'cours') {
    $('#chapter-content').innerHTML =
      '<div class="course-layout"><article class="course-body" id="course-body">' +
      c.cours +
      '</article><nav class="toc" aria-label="Sommaire du cours"><p class="eyebrow">DANS CE CHAPITRE</p><div id="toc-items"></div><a href="#cards/' +
      c.spe +
      '">' +
      icon('cards') +
      ' Réviser avec les cartes</a></nav></div>';
    enhanceCourse(c);
    math($('#course-body'));
  } else {
    $('#chapter-content').innerHTML =
      '<p class="muted small" style="margin-bottom:22px">Cherche d’abord au brouillon, puis compare ta démarche aux trois étapes de la correction.</p>' +
      c.exercices
        .map(
          (e, i) =>
            '<article class="exo-card"><span class="exo-number">ENTRAÎNEMENT ' +
            String(i + 1).padStart(2, '0') +
            '</span><div class="exo-question">' +
            e.enonce +
            '</div><button class="button secondary" data-correction="' +
            i +
            '" aria-expanded="false" aria-controls="corr-' +
            i +
            '">Voir la correction type Bac ' +
            icon('arrow') +
            '</button><div class="correction" id="corr-' +
            i +
            '" hidden>' +
            e.correction +
            '<div class="correction-bottom"><a class="inline-link" href="' +
            courseHref(c) +
            '">' +
            icon('book') +
            ' Revenir au cours</a><label class="check-label"><input type="checkbox" data-exercise="' +
            id +
            '-' +
            i +
            '" ' +
            (state.exercises[id + '-' + i] ? 'checked' : '') +
            '>J’ai repris cet exercice</label></div></div></article>',
        )
        .join('');
    math($('#chapter-content'));
  }
}
function enhanceCourse(c) {
  const body = $('#course-body');
  for (const node of [...body.children]) {
    if (node.tagName === 'DIV' && !node.classList.contains('bristol')) {
      node.dataset.bristol = 'true';
      node.classList.add('bristol');
    }
  }
  $$('div[style*="display:flex"], div[style*="display: flex"]', body).forEach((el) => {
    if (el.querySelector('svg')) el.classList.add('diagram-row');
  });
  const graphs = $$('svg', body);
  graphs.forEach((svg, i) => {
    const name = diagramData.mapping[c.id]?.[i];
    if (!name) return;
    const holder = svg.parentElement;
    holder.classList.add('old-graph-wrapper');
    const node = document.createElement('div');
    node.innerHTML =
      figure(name + '.svg', diagramData.titles[name]) +
      '<details class="original-diagram"><summary>Schéma original du cours</summary>' +
      svg.outerHTML +
      '</details>';
    svg.replaceWith(node);
  });
  $$('h4', body).forEach((h, i) => {
    h.id = 'section-' + i;
    h.innerHTML = h.innerHTML.replace(/^📌\s*BRISTOL\s*\d+\s*:\s*/i, '');
    const link = document.createElement('a');
    link.href = '#' + h.id;
    link.textContent = String(i + 1).padStart(2, '0') + ' · ' + h.textContent;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
    $('#toc-items').append(link);
  });
  if (c.id === 'cdd-ch1')
    body.insertAdjacentHTML('beforeend', figure('qr.svg', diagramData.titles.qr));
  if (c.id === 'sp-ch7')
    body.insertAdjacentHTML('beforeend', figure('binaire.svg', diagramData.titles.binaire));
  if (supplements[c.id])
    body.insertAdjacentHTML(
      'beforeend',
      '<aside class="course-note">' + supplements[c.id] + '</aside>',
    );
  body.insertAdjacentHTML(
    'beforeend',
    '<a class="button" href="' +
      courseHref(c, 'exercices') +
      '">Passer aux exercices ' +
      icon('arrow') +
      '</a>',
  );
}
function renderLabs(category = 'all') {
  const filtered = category === 'all' ? labData : labData.filter((l) => l.category === category);
  $('#main').innerHTML =
    '<div class="page-intro"><div><h1>Le laboratoire</h1><p>Les manipulations, du schéma au geste juste.</p></div><a class="inline-link" href="#gallery">Tous les documents ' +
    icon('arrow') +
    '</a></div><section class="labs-intro">' +
    icon('flask') +
    '<div><h2>Comprendre le montage.<br>Maîtriser la manipulation.</h2><p>9 fiches pour préparer les ECE : matériel, protocole, exploitation et questions à l’oral. Les quantités et les réglages sont toujours ceux du sujet réalisé au laboratoire.</p></div></section><nav class="subject-tabs" aria-label="Types de manipulation">' +
    ['all', 'Titrages', 'Synthèse', 'Séparation']
      .map(
        (cat) =>
          '<a class="chip ' +
          (cat === category ? 'active' : '') +
          '" href="#labs' +
          (cat === 'all' ? '' : '/' + encodeURIComponent(cat)) +
          '">' +
          (cat === 'all' ? 'Toutes les fiches' : cat) +
          '</a>',
      )
      .join('') +
    '</nav><div class="labs-grid">' +
    filtered
      .map(
        (l) =>
          '<a class="lab-card" href="#lab/' +
          l.id +
          '"><div class="lab-thumb"><img src="assets/diagrams/' +
          l.image +
          '" alt="Montage : ' +
          escapeHTML(l.title) +
          '" loading="lazy" decoding="async"><span class="label-pill">' +
          escapeHTML(l.category.toUpperCase()) +
          '</span></div><div class="lab-card-copy"><h2>' +
          escapeHTML(l.title) +
          '</h2><p>' +
          escapeHTML(l.subtitle) +
          '</p><div class="card-end"><span>' +
          l.time +
          ' min de révision</span><span class="card-arrow">' +
          icon(labChecked(l) === l.check.length ? 'check' : 'arrow') +
          '</span></div></div></a>',
      )
      .join('') +
    '</div>';
}
function renderLab(id) {
  const l = labMap.get(id);
  if (!l) return renderMissing();
  $('#main').innerHTML =
    '<a class="detail-back" href="#labs">' +
    icon('back') +
    ' Toutes les manipulations</a><div class="eyebrow muted">ECE · ' +
    escapeHTML(l.category.toUpperCase()) +
    ' · ' +
    l.time +
    ' MIN DE RÉVISION</div><h1 class="detail-title">' +
    escapeHTML(l.title) +
    '</h1><p class="detail-desc">' +
    escapeHTML(l.subtitle) +
    '</p><nav class="subject-tabs" aria-label="Accès rapide dans la manipulation"><button class="chip" data-scroll="lab-material">Le matériel</button><button class="chip" data-scroll="lab-steps">Le protocole</button><button class="chip" data-scroll="lab-results">L’exploitation</button></nav><div class="lab-layout"><aside class="lab-visual">' +
    figure(l.image, l.title, false) +
    '<p class="small muted">' +
    (l.preview
      ? 'Schéma extrait de tes previews.'
      : 'Schéma vectoriel redessiné à partir du montage fourni.') +
    ' Touche le schéma pour l’agrandir.</p><div class="safety-box"><strong>LES PRÉCAUTIONS DU MONTAGE</strong>' +
    escapeHTML(l.safety) +
    '</div><section class="panel" style="margin-top:18px"><h2 style="font-size:16px">Mes repères ECE</h2><p class="small muted">Coche ce que tu sais expliquer sans aide.</p>' +
    l.check
      .map(
        (s, i) =>
          '<label class="check-label"><input type="checkbox" data-check="' +
          l.id +
          '-' +
          i +
          '" ' +
          (state.checks[l.id + '-' + i] ? 'checked' : '') +
          '>' +
          escapeHTML(s) +
          '</label>',
      )
      .join('') +
    '<p class="small muted" id="check-count">' +
    labChecked(l) +
    ' / ' +
    l.check.length +
    ' repères acquis</p></section>' +
    l.originals.map(originalLink).join('') +
    '</aside><article class="lab-content"><section><span class="eyebrow muted">01 · COMPRENDRE</span><h2 style="margin-top:7px">L’objectif et le principe</h2><p>' +
    escapeHTML(l.objective) +
    '</p><p style="margin-top:12px;color:var(--muted)">' +
    escapeHTML(l.principle) +
    '</p></section><section id="lab-material"><span class="eyebrow muted">02 · IDENTIFIER</span><h2 style="margin-top:7px">Le matériel et son rôle</h2>' +
    l.equipment
      .map(
        ([n, r]) =>
          '<div class="role-row"><strong>' +
          escapeHTML(n) +
          '</strong><p>' +
          escapeHTML(r) +
          '</p></div>',
      )
      .join('') +
    '</section><section id="lab-steps"><span class="eyebrow muted">03 · RÉALISER</span><h2 style="margin-top:7px">Le protocole, étape par étape</h2>' +
    l.steps
      .map(
        ([t, p], i) =>
          '<div class="step"><span class="step-number">' +
          (i + 1) +
          '</span><div><h3>' +
          escapeHTML(t) +
          '</h3><p>' +
          escapeHTML(p) +
          '</p></div></div>',
      )
      .join('') +
    '</section><section id="lab-results"><span class="eyebrow muted">04 · EXPLOITER</span><h2 style="margin-top:7px">Faire parler les résultats</h2><div class="course-body">' +
    l.exploitation +
    '</div></section><section><h2>Les erreurs à éviter</h2><ul>' +
    l.errors.map((e) => '<li>' + escapeHTML(e) + '</li>').join('') +
    '</ul><details class="oral-question"><summary>' +
    escapeHTML(l.question) +
    '</summary><p>' +
    escapeHTML(l.answer) +
    '</p></details></section><div class="sources">Repères pédagogiques · fiches de révision adaptées aux documents fournis, sans valeur de sujet officiel.' +
    l.sources
      .map(
        (s, i) =>
          '<a target="_blank" rel="noopener noreferrer" href="' +
          escapeHTML(s) +
          '">Ressource pédagogique ' +
          (i + 1) +
          ' ↗</a>',
      )
      .join('') +
    '</div><a class="button" href="#cards/ece">M’entraîner avec les cartes ECE ' +
    icon('arrow') +
    '</a></article></div>';
  math($('.lab-content'));
}
const originalFiles = [
  'preview.webp',
  'preview (1).webp',
  'preview (2).webp',
  'preview (3).webp',
  'preview (4).webp',
  'preview (5).webp',
  'preview (6).webp',
  'appareil Dean et Stark1.jpg',
  'image.avif',
  'image (1).avif',
  'image (2).avif',
  'image (3).avif',
  'image.webp',
  'image (1).webp',
  'image (2).webp',
  'image (3).webp',
];
const originalTitles = [
  'Courbes de suivi expérimental',
  'Planche des montages ECE',
  'pH-métrie et filtration Büchner',
  'Potentiométrie et conductimétrie',
  'Montage de Dean-Stark',
  'Planche des cours · sombre',
  'Planche des cours · clair',
  'Dean-Stark · document initial',
  'Distillation simple · document initial',
  'Distillation fractionnée · document initial',
  'Titrage colorimétrique · document initial',
  'Chauffage à reflux · document initial',
  'Büchner · document initial',
  'pH-métrie · document initial',
  'Conductimétrie · document initial',
  'Potentiométrie · document initial',
];
function renderGallery() {
  $('#main').innerHTML =
    '<a class="detail-back" href="#labs">' +
    icon('back') +
    ' Retour au laboratoire</a><div class="page-intro"><div><h1>Les schémas & documents</h1><p>Les 16 images fournies sont conservées, avec leurs planches d’origine.</p></div></div><p class="course-note">Les fiches de manipulation expliquent les montages et précisent leurs conditions d’utilisation. Pour la conductimétrie avec GBF, retiens : ampèremètre en série et voltmètre aux bornes de la cellule.</p><div class="gallery-grid">' +
    originalFiles
      .map(
        (f, i) =>
          '<button data-image="assets/originals/' +
          escapeHTML(f) +
          '" data-caption="' +
          escapeHTML(originalTitles[i]) +
          '"><img src="assets/originals/' +
          escapeHTML(f) +
          '" alt="' +
          escapeHTML(originalTitles[i]) +
          '" loading="lazy" decoding="async"><span>' +
          escapeHTML(originalTitles[i]) +
          '</span></button>',
      )
      .join('') +
    '</div>';
}
function renderCards(group = 'all', keep = false) {
  if (!['all', 'cdd', 'ondes', 'sp', 'ece', 'review'].includes(group)) group = 'all';
  if (!keep || !cardSession || cardSession.group !== group) {
    let deck = cardData.filter(
      (c) =>
        group === 'all' ||
        (group === 'review' ? state.cards[c.id] !== 'mastered' : c.category === group),
    );
    cardSession = { group, deck, index: 0, revealed: false };
  }
  const s = cardSession;
  $('#main').innerHTML =
    '<div class="page-intro"><div><h1>Un peu de rappel actif.</h1><p>Cherche la réponse avant de retourner la carte.</p></div><span class="label-pill">' +
    cardData.length +
    ' FLASHCARDS</span></div><nav class="subject-tabs" aria-label="Choix des flashcards">' +
    [
      ['all', 'Toutes'],
      ['cdd', 'CDD'],
      ['ondes', 'Ondes'],
      ['sp', 'Procédés'],
      ['ece', 'ECE'],
      ['review', 'À revoir'],
    ]
      .map(
        ([id, t]) =>
          '<a class="chip ' +
          (id === group ? 'active' : '') +
          '" href="#cards/' +
          id +
          '">' +
          t +
          '</a>',
      )
      .join('') +
    '</nav><div class="cards-shell" id="card-stage"></div>';
  renderCardStage();
}
function renderCardStage() {
  const s = cardSession;
  if (!s.deck.length) {
    $('#card-stage').innerHTML =
      '<div class="empty-state"><h2>Tout est au clair pour l’instant.</h2><p>Tu as marqué toutes ces cartes comme maîtrisées. Tu peux refaire une série quand tu veux.</p><a href="#cards/all" class="button">Toutes les cartes</a></div>';
    return;
  }
  if (s.index >= s.deck.length) {
    $('#card-stage').innerHTML =
      '<div class="empty-state">' +
      icon('spark') +
      '<h2>Série terminée.</h2><p>Les réponses que tu as évaluées sont enregistrées dans ta progression.</p><button class="button" data-action="restart-cards">Recommencer cette série</button> <a class="inline-link" href="#progress">Voir mes progrès ' +
      icon('arrow') +
      '</a></div>';
    return;
  }
  const c = s.deck[s.index];
  $('#card-stage').innerHTML =
    '<div class="cards-header"><span>Carte ' +
    (s.index + 1) +
    ' sur ' +
    s.deck.length +
    '</span><button class="text-button" data-action="shuffle">' +
    icon('refresh') +
    ' Mélanger</button></div><div class="progress-track" style="margin-bottom:20px"><i style="width:' +
    (s.index / s.deck.length) * 100 +
    '%"></i></div><article class="flashcard"><span class="label-pill">' +
    (c.category === 'ece'
      ? 'MANIPULATIONS ECE'
      : escapeHTML(subjects[c.category].short.toUpperCase())) +
    '</span><h2>' +
    escapeHTML(c.q) +
    '</h2>' +
    (s.revealed
      ? '<div class="flash-answer">' + c.a + '</div>'
      : '<p class="flash-hint">Prends quelques secondes pour formuler ta réponse.</p><button class="button" data-action="reveal">Voir la réponse ' +
        icon('arrow') +
        '</button>') +
    '</article>' +
    (s.revealed
      ? '<div class="flash-actions"><button class="button secondary" data-rating="review">À revoir</button><button class="button" data-rating="mastered">Je le savais ' +
        icon('check') +
        '</button></div>'
      : '') +
    '<div class="cards-footer"><button class="text-button" data-action="previous-card" ' +
    (s.index === 0 ? 'disabled' : '') +
    '>' +
    icon('back') +
    ' Précédente</button><a class="inline-link" href="' +
    (c.category === 'ece' ? '#lab/' + c.chapter : courseHref(chapterMap.get(c.chapter))) +
    '">Revoir la fiche</a><button class="text-button" data-action="next-card">Passer ' +
    icon('arrow') +
    '</button></div>';
  math($('#card-stage'));
}
function renderProgress() {
  const allExos = chapters.reduce((n, c) => n + c.exercices.length, 0),
    doneExos = chapters.reduce(
      (n, c) => n + c.exercices.filter((_, i) => state.exercises[c.id + '-' + i]).length,
      0,
    );
  $('#main').innerHTML =
    '<div class="page-intro"><div><h1>Chaque acquis compte.</h1><p>Une progression déclarée par toi, pour savoir quoi revoir.</p></div></div><div class="progress-grid">' +
    [
      [mastered(), chapters.length, 'chapitres maîtrisés'],
      [labDone(), labData.length, 'manipulations : tous les repères acquis'],
      [countCards(), cardData.length, 'flashcards maîtrisées'],
    ]
      .map(
        ([n, total, t]) =>
          '<div class="progress-card"><strong>' +
          n +
          '<span class="muted" style="font-size:17px"> / ' +
          total +
          '</span></strong><h2>' +
          t +
          '</h2><div class="progress-track"><i style="width:' +
          (n / total) * 100 +
          '%"></i></div></div>',
      )
      .join('') +
    '</div><section class="panel"><div class="section-head" style="margin-top:0"><h2>Mes chapitres</h2><span class="small muted">' +
    doneExos +
    ' / ' +
    allExos +
    ' exercices repris</span></div>' +
    chapters
      .map(
        (c) =>
          '<div class="progress-row"><a href="' +
          courseHref(c) +
          '">' +
          escapeHTML(shortTitle(c)) +
          '</a>' +
          statusSelect(c) +
          '</div>',
      )
      .join('') +
    '</section><section class="panel"><h2>Mes gestes de laboratoire</h2>' +
    labData
      .map(
        (l) =>
          '<div class="progress-row"><a href="#lab/' +
          l.id +
          '">' +
          escapeHTML(l.title) +
          '</a><span class="small">' +
          labChecked(l) +
          ' / ' +
          l.check.length +
          ' repères ' +
          (labChecked(l) === l.check.length ? '✓' : '') +
          '</span></div>',
      )
      .join('') +
    '</section><section class="panel"><h2>Garder une copie de mes progrès</h2><p class="backup-note" style="margin-top:10px">Tes données restent dans ce navigateur, sur cet appareil. Exporte-les pour les conserver ou les transférer ; une suppression des données du navigateur peut les effacer.</p><div class="backup-bar"><button class="button secondary" data-action="export">' +
    icon('download') +
    ' Exporter</button><button class="button secondary" data-action="import">Restaurer une copie</button></div><p class="backup-note">La restauration fusionne les éléments présents dans le fichier avec ta progression actuelle. Une valeur importée remplace la valeur correspondante.</p></section>';
}
function renderMissing() {
  $('#main').innerHTML =
    '<div class="empty-state"><h1>Cette fiche n’existe pas.</h1><p>Retrouve les cours et manipulations dans ton carnet.</p><a class="button" href="#home">Retour à l’accueil</a></div>';
}
function route() {
  if (!appData) return;
  let parts;
  try {
    parts = decodeURIComponent(location.hash.slice(1) || 'home').split('/');
  } catch {
    parts = ['home'];
  }
  const [page, arg, mode] = parts;
  const nav = ['chapter', 'courses'].includes(page)
    ? 'courses'
    : ['lab', 'labs', 'gallery'].includes(page)
      ? 'labs'
      : page;
  $$('[data-nav]').forEach((a) => {
    const active = a.dataset.nav === nav;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  $('#breadcrumb').textContent =
    {
      home: 'Mon espace',
      courses: 'Mes cours',
      labs: 'Manipulations',
      cards: 'Flashcards',
      progress: 'Ma progression',
    }[nav] || 'Mon espace';
  for (const dlg of $$('dialog[open]')) dlg.close();
  switch (page) {
    case 'home':
      renderHome();
      break;
    case 'courses':
      renderCourses(arg);
      break;
    case 'chapter':
      renderChapter(arg, mode);
      break;
    case 'labs':
      renderLabs(arg || 'all');
      break;
    case 'lab':
      renderLab(arg);
      break;
    case 'cards':
      renderCards(arg || 'all');
      break;
    case 'progress':
      renderProgress();
      break;
    case 'gallery':
      renderGallery();
      break;
    default:
      renderMissing();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#main').focus({ preventScroll: true });
  document.title = ($('#main h1')?.textContent || 'Révise.') + ' · Révise STL';
}
function showImage(src, title) {
  const valid = /^assets\/(diagrams|originals)\/[^/]+$/.test(src);
  if (!valid) return;
  imageZoom = 1;
  $('#zoom-image').src = src;
  $('#zoom-image').alt = title;
  $('#image-title').textContent = title;
  $('#image-open').href = src;
  $('#zoom-image').style.width = '100%';
  $('#zoom-value').textContent = '100 %';
  $('#image-dialog').showModal();
}
function showInfo(title, html) {
  $('#info-title').textContent = title;
  $('#info-body').innerHTML = html;
  $('#info-dialog').showModal();
}
function installInfo() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  showInfo(
    'Ton carnet, toujours à portée de main',
    standalone
      ? '<p>Le carnet est déjà ouvert comme une application autonome.</p><p>' +
          $('#network-status').textContent +
          '</p>'
      : '<h3>Sur iPhone · Safari</h3><ol><li>Ouvre le lien HTTPS de ton site GitHub Pages dans Safari.</li><li>Touche <b>Partager</b> (le carré avec la flèche vers le haut).</li><li>Choisis <b>Sur l’écran d’accueil</b>, puis <b>Ajouter</b>.</li><li>Ouvre Révise depuis sa nouvelle icône et attends l’indication <b>Prêt hors ligne</b> avant de te déconnecter.</li></ol><h3>Sur ordinateur</h3><p>Ouvre le site dans ton navigateur. Quand il le propose, utilise l’icône d’installation dans la barre d’adresse ou le menu du navigateur.</p><p>Le cache et la progression sont locaux. Garde une sauvegarde de tes progrès depuis l’onglet Progrès.</p>',
  );
}
function about() {
  showInfo(
    'Un carnet pour apprendre vraiment',
    '<p>Révise réunit les <b>6 chapitres et 12 exercices fournis</b>, leurs corrections intégrales, 9 fiches de manipulation et 27 flashcards. Le contenu initial de data.json est conservé.</p><p>Les schémas des cours ont été redessinés en s’appuyant sur tes previews. Chaque ancien schéma reste accessible sous sa nouvelle version. Les 16 documents fournis sont dans la <a href="#gallery">galerie</a>.</p><p>Des encadrés ajoutent les conditions d’application de certaines formules. Les manipulations sont des fiches générales d’apprentissage : les consignes, substances, volumes, températures et appels à l’examinateur dépendent du sujet ECE.</p><h3>Ton objectif</h3><p>17,5/20 est ton cap personnel. Les cases de progression sont une auto-évaluation, pas une estimation de ta note au Bac.</p><h3>Repères pédagogiques et techniques</h3><p><a href="https://spcl.ac-montpellier.fr/moodle/" target="_blank" rel="noopener">Ressources STL-SPCL · académie de Montpellier</a><br><a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable" target="_blank" rel="noopener">Installation des applications web · MDN</a><br><a href="https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html" target="_blank" rel="noopener">Configuration iPhone · Apple</a></p>',
  );
}
function updateTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('#theme-toggle').innerHTML = icon(dark ? 'sun' : 'moon');
  $('#theme-toggle').setAttribute(
    'aria-label',
    dark ? 'Activer le mode clair' : 'Activer le mode sombre',
  );
  $('meta[name="theme-color"]').content = dark ? '#17231e' : '#f6f5ef';
}
function strip(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}
const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
function doSearch() {
  const q = norm($('#search-input').value.trim());
  const found = q ? searchIndex.filter((x) => x.text.includes(q)).slice(0, 18) : [];
  $('#search-results').innerHTML = q
    ? found.length
      ? found
          .map(
            (x) =>
              '<a class="search-result" href="' +
              x.href +
              '"><span>' +
              escapeHTML(x.category) +
              '</span>' +
              escapeHTML(x.title) +
              '</a>',
          )
          .join('')
      : '<p>Aucun résultat. Essaie une autre notion ou un nom de montage.</p>'
    : '<p>Recherche dans les cours, les corrections et les protocoles ECE.</p>';
}
async function setupOffline() {
  if (location.hostname === '127.0.0.1' && location.pathname.startsWith('/dev/')) return;
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    updateNetwork();
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const ready = await navigator.serviceWorker.ready;
    offlineReady = true;
    updateNetwork();
    if (registration.waiting) announceUpdate(registration);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller)
          announceUpdate(registration);
      });
    });
  } catch (error) {
    console.warn('Mode hors ligne indisponible', error);
    $('#network-status').textContent = 'Hors ligne non prêt';
  }
}
function announceUpdate(registration) {
  toast('Une nouvelle version sera chargée à la prochaine ouverture.');
}
function updateNetwork() {
  const label = $('#network-status');
  label.textContent = navigator.onLine
    ? offlineReady
      ? 'Prêt hors ligne'
      : ''
    : 'Mode hors ligne';
  label.title = offlineReady ? 'Cours, schémas et formules mis en cache sur cet appareil.' : '';
}
function bindEvents() {
  window.addEventListener('hashchange', route);
  window.addEventListener('online', updateNetwork);
  window.addEventListener('offline', updateNetwork);
  $('#theme-toggle').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('revise-theme', t);
    } catch {}
    updateTheme();
  });
  $('#search-toggle').addEventListener('click', () => {
    $('#search-dialog').showModal();
    $('#search-input').focus();
    doSearch();
  });
  $('#search-input').addEventListener('input', doSearch);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      $('#search-toggle').click();
    }
  });
  $$('dialog').forEach((d) =>
    d.addEventListener('click', (e) => {
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
          d.close();
      }
    }),
  );
  document.addEventListener('click', (e) => {
    if (e.target.closest('.skip-link')) {
      e.preventDefault();
      $('#main').focus();
      $('#main').scrollIntoView();
      return;
    }
    const jump = e.target.closest('[data-scroll]');
    if (jump) {
      document
        .getElementById(jump.dataset.scroll)
        ?.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      return;
    }
    const close = e.target.closest('[data-close]');
    if (close) {
      close.closest('dialog').close();
      return;
    }
    const im = e.target.closest('[data-image]');
    if (im) {
      showImage(im.dataset.image, im.dataset.caption || 'Schéma');
      return;
    }
    const correction = e.target.closest('[data-correction]');
    if (correction) {
      const el = $('#corr-' + correction.dataset.correction),
        open = el.hidden;
      el.hidden = !open;
      correction.setAttribute('aria-expanded', String(open));
      correction.innerHTML =
        (open ? 'Masquer la correction' : 'Voir la correction type Bac') +
        icon(open ? 'check' : 'arrow');
      if (open) math(el);
      return;
    }
    const rating = e.target.closest('[data-rating]');
    if (rating && cardSession?.revealed) {
      const c = cardSession.deck[cardSession.index];
      state.cards[c.id] = rating.dataset.rating;
      persist();
      cardSession.index++;
      cardSession.revealed = false;
      renderCardStage();
      return;
    }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'install') installInfo();
    if (action === 'about') about();
    if (action === 'zoom-in' || action === 'zoom-out') {
      imageZoom = Math.max(1, Math.min(4, imageZoom + (action === 'zoom-in' ? 0.5 : -0.5)));
      $('#zoom-image').style.width = imageZoom * 100 + '%';
      $('#zoom-value').textContent = imageZoom * 100 + ' %';
    }
    if (action === 'reveal') {
      cardSession.revealed = true;
      renderCardStage();
    }
    if (action === 'next-card' || action === 'previous-card') {
      cardSession.index += action === 'next-card' ? 1 : -1;
      cardSession.revealed = false;
      renderCardStage();
    }
    if (action === 'restart-cards') renderCards(cardSession.group);
    if (action === 'shuffle') {
      for (let i = cardSession.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardSession.deck[i], cardSession.deck[j]] = [cardSession.deck[j], cardSession.deck[i]];
      }
      cardSession.index = 0;
      cardSession.revealed = false;
      renderCardStage();
      toast('Les cartes ont été mélangées.');
    }
    if (action === 'export') {
      const blob = new Blob(
        [JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url;
      a.download = 'revise-progression-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast('Copie de progression préparée.');
    }
    if (action === 'import') $('#import-input').click();
    if (action === 'retry') location.reload();
    if (e.target.closest('a[href^="#"]') && e.target.closest('dialog'))
      e.target.closest('dialog').close();
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-status]')) {
      state.chapters[e.target.dataset.status] = e.target.value;
      persist();
      if (location.hash.startsWith('#progress')) renderProgress();
      toast('Niveau enregistré.');
    }
    if (e.target.matches('[data-exercise]')) {
      state.exercises[e.target.dataset.exercise] = e.target.checked;
      persist();
    }
    if (e.target.matches('[data-check]')) {
      state.checks[e.target.dataset.check] = e.target.checked;
      persist();
      const l = labMap.get(location.hash.split('/')[1]);
      if (l && $('#check-count'))
        $('#check-count').textContent = labChecked(l) + ' / ' + l.check.length + ' repères acquis';
    }
  });
  $('#import-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error('Fichier trop volumineux.');
      const imported = validateState(JSON.parse(await file.text()));
      for (const field of ['chapters', 'exercises', 'checks', 'cards'])
        state[field] = { ...state[field], ...imported[field] };
      if (imported.lastChapter) state.lastChapter = imported.lastChapter;
      persist();
      renderProgress();
      if (!location.hash.startsWith('#progress')) location.hash = 'progress';
      toast('Progression restaurée.');
    } catch (err) {
      toast(
        'Import impossible : ' +
          (err instanceof SyntaxError ? 'fichier JSON invalide.' : err.message),
      );
    } finally {
      e.target.value = '';
    }
  });
}
async function init() {
  hydrateIcons();
  updateTheme();
  bindEvents();
  updateStorageLabel();
  updateNetwork();
  try {
    const names = [
      'data.json',
      'manipulations.json',
      'diagrams.json',
      'flashcards.json',
      'supplements.json',
    ];
    const loaded = await Promise.all(
      names.map(async (f) => {
        const r = await fetch(f);
        if (!r.ok) throw Error('Impossible de charger ' + f);
        return r.json();
      }),
    );
    [appData, labData, diagramData, cardData, supplements] = loaded;
    chapters = Object.entries(appData).flatMap(([spe, list]) => list.map((c) => ({ ...c, spe })));
    chapterMap = new Map(chapters.map((c) => [c.id, c]));
    labMap = new Map(labData.map((l) => [l.id, l]));
    searchIndex = [
      ...chapters.map((c) => ({
        title: shortTitle(c),
        category: subjects[c.spe].name,
        href: courseHref(c),
        text: norm(
          c.titre +
            ' ' +
            c.description +
            ' ' +
            strip(c.cours) +
            ' ' +
            strip(supplements[c.id] || '') +
            ' ' +
            c.exercices.map((e) => strip(e.enonce + ' ' + e.correction)).join(' '),
        ),
      })),
      ...labData.map((l) => ({
        title: l.title,
        category: 'Manipulations ECE',
        href: '#lab/' + l.id,
        text: norm(
          l.title +
            ' ' +
            l.objective +
            ' ' +
            l.principle +
            ' ' +
            JSON.stringify(l.equipment) +
            ' ' +
            JSON.stringify(l.steps),
        ),
      })),
    ];
    route();
    setupOffline();
  } catch (error) {
    console.error(error);
    $('#main').innerHTML =
      '<section class="app-error"><h1>Le carnet n’a pas pu se charger.</h1><p>Vérifie ta connexion et recharge la page. Lors de la première visite, les fichiers doivent être téléchargés avant de pouvoir les consulter hors ligne.</p><p>Si tu ouvres le dossier sur ton ordinateur, passe par un serveur local ou GitHub Pages : le double-clic sur index.html ne suffit pas.</p><button class="button" data-action="retry">Réessayer</button></section>';
  }
}
init();
