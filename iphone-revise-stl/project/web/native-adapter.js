(() => {
  'use strict';
  if (!window.Capacitor?.isNativePlatform()) return;
  const native = window.ReviseNativeClient.client;
  const files = new Set(['data.json','flashcards.json','manipulations.json','diagrams.json','supplements.json']);
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, options) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, location.href);
    const name = decodeURIComponent(url.pathname).replace(/^\//,'');
    if (url.origin === location.origin && files.has(name) && (!options?.method || options.method === 'GET')) {
      try { const {text} = await native.content({name}); return new Response(text,{headers:{'Content-Type':'application/json'}}); }
      catch { return originalFetch(input, options); }
    }
    return originalFetch(input, options);
  };
  const assets = new Map();
  function pathFrom(value) {
    if (!value) return '';
    const url = new URL(value,location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/assets/')) return '';
    return decodeURIComponent(url.pathname.slice(1));
  }
  function resource(path) {
    if (!assets.has(path)) assets.set(path,native.asset({path}).then(({path}) => Capacitor.convertFileSrc(path)).catch(e => { assets.delete(path); throw e; }));
    return assets.get(path);
  }
  function adapt(root) {
    const nodes = root.querySelectorAll ? [root,...root.querySelectorAll('img, [data-image]')] : [root];
    for (const node of nodes) {
      if (!(node instanceof Element)) continue;
      for (const attr of node.matches('img') ? ['src'] : node.hasAttribute('data-image') ? ['data-image'] : []) {
        const path = pathFrom(node.getAttribute(attr));
        if (!path || path.startsWith('assets/fonts/')) continue;
        resource(path).then(url => { if (node.isConnected && pathFrom(node.getAttribute(attr)) === path) node.setAttribute(attr,url); }).catch(() => {
          if (node.matches('img')) node.alt = node.alt || 'Schéma à télécharger lors de la prochaine connexion';
        });
      }
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const controls = document.createElement('div'); controls.className='native-controls';
    controls.innerHTML='<a class="chip" href="notes.html">Mes notes</a><button class="chip" id="refresh-courses">Actualiser mes cours</button><button class="chip" id="download-offline">Tout télécharger hors ligne</button><span role="status" id="native-status"></span>';
    document.querySelector('#main').before(controls);
    const style=document.createElement('style'); style.textContent='.native-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 24px}.native-controls span{font-size:13px;color:var(--muted)}[data-action="install"]{display:none}';document.head.append(style);
    const status=document.querySelector('#native-status'),button=document.querySelector('#refresh-courses');
    async function sync(manual=false) {
      button.disabled=true;if(manual)status.textContent='Actualisation des cours…';
      try { const result=await native.syncContent();if(result.changed){status.textContent='Nouveaux cours disponibles.';location.reload();}else if(manual)status.textContent='Tes cours sont à jour.'; }
      catch { if(manual)status.textContent='Connexion indisponible. Tes cours enregistrés sont conservés.'; }
      finally {button.disabled=false;}
    }
    button.addEventListener('click',()=>sync(true));
    const download=document.querySelector('#download-offline');
    native.addListener('offlineProgress',p=>{status.textContent='Téléchargement : '+p.completed+' / '+p.total+' fichiers';});
    download.addEventListener('click',async()=>{download.disabled=true;button.disabled=true;status.textContent='Téléchargement des schémas et documents…';try{await native.downloadOffline();status.textContent='Schémas et documents prêts hors ligne.';}catch(e){status.textContent=e.message||'Téléchargement interrompu ; les fichiers reçus sont conservés.';}finally{download.disabled=false;button.disabled=false;}});
    new MutationObserver(changes => {for(const change of changes){if(change.type==='attributes')adapt(change.target);else for(const node of change.addedNodes)adapt(node);}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-image']});
    adapt(document.body);
    document.addEventListener('click', event => {
      const anchor=event.target.closest('a[href]'); const path=anchor && pathFrom(anchor.getAttribute('href'));
      if(path && /\.(pdf|pptx|docx)$/i.test(path)){event.preventDefault();event.stopImmediatePropagation();native.previewAsset({path}).catch(()=>{status.textContent='Document indisponible hors ligne : ouvre-le une fois avec une connexion.';});}
    },true);
    if(navigator.onLine)sync();
  });
})();
