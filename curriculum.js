'use strict';
// Les clés historiques cdd / ondes / sp désignent la Terminale SPCL.
// Les identifiants des chapitres restent stables pour préserver la progression.
const years = { premiere: 'Première', terminale: 'Terminale' };
const tracks = { pcm: 'PCM', spcl: 'SPCL', maths: 'Maths' };
const subjects = {
  'premiere-image': { year: 'premiere', track: 'spcl', name: 'Image', short: 'Image', icon: 'zoom', desc: 'Les cours d’image de Première.' },
  'premiere-mesure': { year: 'premiere', track: 'spcl', name: 'Mesure & instrumentation', short: 'Mesure & instrumentation', icon: 'system', desc: 'Mesurer, comprendre les instruments et exploiter les résultats.' },
  'premiere-cdd': { year: 'premiere', track: 'spcl', name: 'Chimie & développement durable', short: 'CDD', icon: 'flask', desc: 'Les bases de chimie à retrouver avant la Terminale.' },
  ondes: { year: 'terminale', track: 'spcl', name: 'Ondes', short: 'Ondes', icon: 'wave', desc: 'Des phénomènes oscillants à la propagation des ondes.' },
  sp: { year: 'terminale', track: 'spcl', name: 'Systèmes & procédés', short: 'Systèmes & procédés', icon: 'system', desc: 'Distillation, évaporation et cristallisation, pas à pas.' },
  cdd: { year: 'terminale', track: 'spcl', name: 'Chimie & développement durable', short: 'CDD', icon: 'flask', desc: 'Solubilité, acides et bases. Les bons réflexes en chimie.' },
  'premiere-pcm': { year: 'premiere', track: 'pcm', name: 'Physique-chimie et mathématiques', short: 'PCM', icon: 'spark', desc: 'Les cours de PCM de Première.' },
  'terminale-pcm': { year: 'terminale', track: 'pcm', name: 'Physique-chimie et mathématiques', short: 'PCM', icon: 'spark', desc: 'Les cours de PCM de Terminale.' },
  maths: { year: 'commun', track: 'maths', name: 'Maths pour les sciences', short: 'Maths', icon: 'chart', desc: 'Les outils mathématiques à retrouver depuis tes cours de spécialité.' },
};
const categoryKeys = (year, track) => Object.keys(subjects).filter((key) =>
  (!year || subjects[key].year === year) && (!track || subjects[key].track === track));
const subjectLabel = (key) => {
  const s = subjects[key];
  return s ? (years[s.year] ? years[s.year] + ' · ' + tracks[s.track] + ' · ' : '') + s.short : key;
};
const categoryHref = (key) => {
  const s = subjects[key];
  return s.track === 'maths' ? '#maths' : '#courses/' + s.year + '/' + s.track + (s.track === 'spcl' ? '/' + key : '');
};
const ratio = (count, total) => total > 0 ? (count / total) * 100 : 0;
function flattenCurriculum(data) {
  const ids = new Set();
  return Object.entries(data).flatMap(([spe, list]) => {
    if (!subjects[spe] || !Array.isArray(list)) throw Error('Catégorie de cours invalide : ' + spe);
    return list.map((c) => {
      if (!/^[a-zA-Z0-9_-]{1,90}$/.test(c.id) || ['__proto__', 'constructor', 'prototype'].includes(c.id) || ids.has(c.id))
        throw Error('Identifiant de chapitre invalide ou dupliqué : ' + c.id);
      if (typeof c.titre !== 'string' || typeof c.description !== 'string' || typeof c.cours !== 'string' || !Array.isArray(c.exercices))
        throw Error('Chapitre incomplet : ' + c.id);
      ids.add(c.id);
      return { ...c, spe, year: subjects[spe].year, track: subjects[spe].track };
    });
  });
}
