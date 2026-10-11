'use strict';
let resourceScope = { year: 'all', track: 'all' };
const countMastered = (list) => list.filter((c) => state.chapters[c.id] === 'mastered').length;
const chapterList = (keys) => chapters.filter((c) => keys.includes(c.spe));
const crumb = (links) => '<nav class="course-path" aria-label="Parcours de révision">' +
  links.map(([label, href]) => href ? '<a href="' + href + '">' + escapeHTML(label) + '</a>' :
    '<span aria-current="page">' + escapeHTML(label) + '</span>').join('<i aria-hidden="true">/</i>') + '</nav>';
const emptyCourses = (maths = false) => '<section class="empty-state curriculum-empty">' + icon(maths ? 'chart' : 'book') +
  '<h2>' + (maths ? 'Les notions de maths arrivent ici.' : 'Aucun chapitre pour le moment.') + '</h2><p>' +
  (maths ? 'Cet espace commun à la Première et à la Terminale accueillera les outils utiles en PCM et en SPCL. Tu pourras y revenir directement depuis un cours.' :
    'Ce carnet est prêt. Tes prochains cours, exercices et flashcards le compléteront au fil de l’année.') + '</p></section>';
function curriculumCard(title, desc, href, list, symbol = 'book', tag = '') {
  return '<a class="subject-card curriculum-card" href="' + href + '"><div class="subject-top"><span class="subject-icon">' + icon(symbol) +
    '</span><span>' + (tag || list.length + ' chapitre' + (list.length === 1 ? '' : 's')) + '</span></div><h3>' + title + '</h3><p>' + desc +
    '</p><div class="card-end"><span>' + (list.length ? countMastered(list) + ' / ' + list.length + ' maîtrisés' : 'À compléter') +
    '</span><div class="progress-track"><i style="width:' + ratio(countMastered(list), list.length) + '%"></i></div><span class="card-arrow">' + icon('arrow') + '</span></div></a>';
}
function yearCards() {
  return '<div class="subjects-grid curriculum-grid two-columns">' + Object.entries(years).map(([year, title]) =>
    curriculumCard(title, year === 'premiere' ? 'Retrouver les bases et préparer la suite.' : 'Approfondir et se préparer au Bac.',
      '#courses/' + year, chapters.filter((c) => c.year === year), 'book', 'STL · PCM & SPCL')).join('') + '</div>';
}
function mathsBanner() {
  return '<a class="maths-banner" href="#maths"><span class="subject-icon">' + icon('chart') +
    '</span><div><span class="eyebrow">UN OUTIL POUR LES DEUX ANNÉES</span><h2>Maths pour les sciences</h2><p>Retrouver une notion, puis revenir à son cours.</p></div><span class="card-arrow">' + icon('arrow') + '</span></a>';
}
function renderHome() {
  const last = chapterMap.get(state.lastChapter);
  $('#main').innerHTML = '<div class="page-intro"><div><h1>Ton carnet pour tout le cycle STL.</h1><p>Première et Terminale, les savoirs se construisent ensemble.</p></div></div>' +
    '<section class="hero"><div class="hero-text"><span class="eyebrow">' + icon('spark') + ' OBJECTIF 17,5 / 20</span>' +
    '<h2>Les bases d’hier.<br><em>Les réussites de demain.</em></h2><p>PCM, SPCL et maths : retrouve tes cours, entraîne-toi et prépare tes gestes de laboratoire.</p>' +
    '<a class="button" href="#courses">Choisir mon année ' + icon('arrow') + '</a>' +
    (last ? '<a class="resume-link" href="' + courseHref(last) + '">Reprendre : ' + escapeHTML(shortTitle(last)) + '</a>' : '') +
    '</div>' + heroArt() + '</section><div class="stat-strip">' + [
      [icon('book'), chapters.length, 'chapitres disponibles'],
      [icon('check'), chapters.reduce((n, c) => n + c.exercices.length, 0), 'exercices type Bac'],
      [icon('flask'), labData.length, 'manipulations ECE'],
      [icon('chart'), mastered() + ' / ' + chapters.length, 'chapitres maîtrisés'],
    ].map(([i, n, label]) => '<div class="stat"><span class="stat-icon">' + i + '</span><div><strong>' + n + '</strong><span>' + label + '</span></div></div>').join('') +
    '</div><div class="section-head"><div><h2>Par quelle année commencer ?</h2><p>Choisis ton année, puis PCM ou SPCL.</p></div></div>' + yearCards() + mathsBanner() +
    '<div class="lower-grid"><section class="lab-feature"><div class="feature-copy"><span class="label-pill">LE LABO · ECE</span><h3>Les bons gestes.<br>Les bons réflexes.</h3><p>Des montages à comprendre,<br>des protocoles à maîtriser.</p><a class="inline-link" href="#labs">Entrer au laboratoire ' + icon('arrow') +
    '</a></div><img src="assets/diagrams/reflux.svg" alt="" loading="lazy"></section><section class="daily-card"><span class="eyebrow">LE PETIT DÉCLIC</span><h3>Et si tu testais<br>ce que tu sais déjà ?</h3><p>' + cardData.length +
    ' flashcards pour réviser activement.</p><a href="#cards">Je me lance ' + icon('arrow') + '</a></section></div>';
}
function tabs(active) {
  const s = subjects[active];
  if (!s || s.track !== 'spcl') return '';
  return '<nav class="subject-tabs" aria-label="Domaines SPCL de ' + years[s.year] + '">' + categoryKeys(s.year, 'spcl').map((key) =>
    '<a class="chip ' + (key === active ? 'active' : '') + '" href="' + categoryHref(key) + '" ' +
    (key === active ? 'aria-current="page"' : '') + '>' + escapeHTML(subjects[key].short) + '</a>').join('') + '</nav>';
}
function renderCourses(year, track, spe) {
  // Conserver les anciennes adresses #courses/cdd, #courses/ondes, #courses/sp.
  if (subjects[year]) {
    spe = year;
    ({ year, track } = subjects[spe]);
  }
  if (track === 'maths' || year === 'maths') return renderMaths();
  if (!year) {
    $('#main').innerHTML = '<div class="page-intro"><div><span class="eyebrow muted">01 · TON ANNÉE</span><h1>Mes cours</h1><p>Choisis l’année que tu souhaites réviser.</p></div></div>' + yearCards() + mathsBanner();
    return;
  }
  if (!years[year]) return renderMissing();
  if (!track) {
    $('#main').innerHTML = crumb([['Mes cours', '#courses'], [years[year]]]) +
      '<div class="page-intro"><div><span class="eyebrow muted">02 · TA SPÉCIALITÉ</span><h1>' + years[year] + ' STL</h1><p>Quel carnet veux-tu ouvrir ?</p></div></div>' +
      '<div class="subjects-grid curriculum-grid two-columns">' +
      curriculumCard('PCM', 'Physique-chimie et mathématiques', '#courses/' + year + '/pcm', chapterList(categoryKeys(year, 'pcm')), 'spark') +
      curriculumCard('SPCL', 'Sciences physiques et chimiques en laboratoire', '#courses/' + year + '/spcl', chapterList(categoryKeys(year, 'spcl')), 'flask') +
      '</div>' + mathsBanner();
    return;
  }
  if (!['pcm', 'spcl'].includes(track)) return renderMissing();
  const keys = categoryKeys(year, track);
  const baseCrumbs = [['Mes cours', '#courses'], [years[year], '#courses/' + year]];
  if (track === 'spcl' && !spe) {
    $('#main').innerHTML = crumb([...baseCrumbs, ['SPCL']]) +
      '<div class="page-intro"><div><span class="eyebrow muted">03 · TON DOMAINE</span><h1>SPCL · ' + years[year] + '</h1><p>Ouvre le domaine que tu souhaites travailler.</p></div></div>' +
      '<div class="subjects-grid curriculum-grid">' + keys.map((key) => curriculumCard(subjects[key].name, subjects[key].desc, categoryHref(key), chapterList([key]), subjects[key].icon)).join('') + '</div>' +
      '<p class="curriculum-note">De la Première à la Terminale : Image → Ondes · Mesure & instrumentation → Systèmes & procédés · CDD → CDD.</p>' + mathsBanner();
    return;
  }
  if (track === 'pcm') spe = keys[0];
  if (!keys.includes(spe)) return renderMissing();
  const list = chapterList([spe]);
  $('#main').innerHTML = crumb([...baseCrumbs, ...(track === 'spcl' ? [['SPCL', '#courses/' + year + '/spcl'], [subjects[spe].short]] : [['PCM']])]) +
    '<div class="page-intro"><div><h1>' + escapeHTML(subjects[spe].name) + '</h1><p>' + years[year] + ' · ' + tracks[track] + ' — Comprendre, puis s’entraîner.</p></div><span class="label-pill">' + list.length + ' CHAPITRE' + (list.length === 1 ? '' : 'S') + '</span></div>' +
    tabs(spe) + renderChapterCards(list) + relatedResources(year, track, spe);
}
function renderChapterCards(list, maths = false) {
  if (!list.length) return emptyCourses(maths);
  return '<div class="chapter-grid">' + list.map((c) => '<a class="chapter-card" href="' + courseHref(c) + '"><span class="chapter-n">' + escapeHTML(subjectLabel(c.spe)) +
    '</span><h2>' + escapeHTML(shortTitle(c)) + '</h2><p>' + escapeHTML(c.description) + '</p><div class="card-end"><span>' + c.exercices.length + ' exercice' +
    (c.exercices.length === 1 ? '' : 's') + ' · ' + statusNames[state.chapters[c.id] || 'todo'] + '</span><span class="card-arrow">' + icon('arrow') + '</span></div></a>').join('') + '</div>';
}
function relatedResources(year, track, spe) {
  const query = '?year=' + year + '&track=' + track;
  return '<nav class="related-resources" aria-label="Continuer à réviser"><a class="chip" href="#cards/' + spe + query + '">' + icon('cards') +
    ' Flashcards</a><a class="chip" href="#labs' + query + '">' + icon('flask') + ' Laboratoire</a><a class="chip" href="#maths">' + icon('chart') + ' Revoir les maths</a></nav>';
}
function renderMaths() {
  $('#main').innerHTML = crumb([['Mes cours', '#courses'], ['Maths']]) +
    '<div class="page-intro"><div><span class="eyebrow muted">PREMIÈRE & TERMINALE · PCM & SPCL</span><h1>Maths pour les sciences</h1><p>Une notion à revoir ? Retrouve ici les outils utiles à tes spécialités.</p></div></div>' +
    renderChapterCards(chapterList(['maths']), true) + '<nav class="related-resources"><a class="chip" href="#cards/maths?track=maths">' + icon('cards') + ' Flashcards de maths</a></nav>';
}
function mathReferences(c, mode) {
  if (c.track === 'maths') {
    const users = chapters.filter((chapter) => (chapter.mathRefs || []).some((ref) => ref.id === c.id));
    let origin;
    try { origin = new URLSearchParams(location.hash.split('?')[1] || '').get('from'); } catch {}
    const source = chapterMap.get(origin);
    return (source ? '<a class="detail-back maths-return" href="' + courseHref(source, new URLSearchParams(location.hash.split('?')[1] || '').get('mode')) + '">' + icon('back') + ' Revenir à ' + escapeHTML(shortTitle(source)) + '</a>' : '') +
      (users.length ? '<aside class="maths-links"><h2>Cette notion dans tes spécialités</h2><div class="related-resources">' + users.map((chapter) =>
        '<a class="chip" href="' + courseHref(chapter) + '">' + escapeHTML(shortTitle(chapter)) + '</a>').join('') + '</div></aside>' : '');
  }
  const refs = c.mathRefs || [];
  if (!refs.length) return '';
  return '<aside class="maths-links"><h2>' + icon('chart') + ' Un coup de pouce en maths</h2><p>Revois la notion, puis reprends ce chapitre.</p><div class="related-resources">' + refs.map((ref) => {
    const target = chapterMap.get(ref.id);
    return target?.track === 'maths' ? '<a class="chip" href="' + courseHref(target) + '?from=' + encodeURIComponent(c.id) + '&mode=' + mode + '">Revoir : ' + escapeHTML(shortTitle(target)) + ' ' + icon('arrow') + '</a>' :
      '<span class="pending-notion">' + escapeHTML(ref.title || ref.id) + ' <small>Fiche à venir</small></span>';
  }).join('') + '</div></aside>';
}
function scopeMatches(year, track) {
  return (resourceScope.year === 'all' || year === resourceScope.year || year === 'commun') &&
    (resourceScope.track === 'all' || track === resourceScope.track);
}
const scopedChapters = () => chapters.filter((c) => scopeMatches(c.year, c.track));
const scopedLabs = () => labData.filter((l) => (l.contexts || [{ year: 'terminale', track: 'spcl' }]).some((c) => scopeMatches(c.year, c.track)));
function scopedCards() {
  const labIds = new Set(scopedLabs().map((l) => l.id));
  const chapterIds = new Set(scopedChapters().map((c) => c.id));
  return cardData.filter((c) => c.category === 'ece' ? labIds.has(c.chapter) : chapterIds.has(c.chapter));
}
function scopeQuery() {
  const q = new URLSearchParams();
  if (resourceScope.year !== 'all') q.set('year', resourceScope.year);
  if (resourceScope.track !== 'all') q.set('track', resourceScope.track);
  return q.size ? '?' + q.toString() : '';
}
function scopeControls() {
  return '<div class="scope-controls"><label>Année<select data-scope="year">' + Object.entries({ all: 'Les deux années', ...years }).map(([key, title]) =>
    '<option value="' + key + '" ' + (resourceScope.year === key ? 'selected' : '') + '>' + title + '</option>').join('') +
    '</select></label><label>Matière<select data-scope="track">' + Object.entries({ all: 'Toutes les matières', ...tracks }).map(([key, title]) =>
    '<option value="' + key + '" ' + (resourceScope.track === key ? 'selected' : '') + '>' + title + '</option>').join('') + '</select></label></div>';
}
