(() => {
  'use strict';
  const methods=['content','syncContent','asset','previewAsset','downloadOffline','shareProgress','login','answerSecurity','selectAccount','refreshNotes','cachedNotes','disconnect'];
  function available(){return !!(window.Capacitor?.isNativePlatform?.() && (window.Capacitor.Plugins?.ReviseNative || typeof window.Capacitor.nativePromise==='function'));}
  function call(method,options={},timeout=45000){
    const cap=window.Capacitor,plugin=cap?.Plugins?.ReviseNative;
    if(!available())return Promise.reject(Error('Le module iPhone ne s’est pas chargé. Ferme complètement Révise STL puis rouvre-la. Si le message persiste, installe la version 1.0.1.'));
    let timer;
    const result=Promise.resolve().then(()=>typeof plugin?.[method]==='function'?plugin[method](options):cap.nativePromise('ReviseNative',method,options));
    const expiry=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('La demande n’a pas répondu. Vérifie ta connexion puis réessaie.')),timeout);});
    return Promise.race([result,expiry]).finally(()=>clearTimeout(timer));
  }
  const client=Object.fromEntries(methods.map(name=>[name,(options)=>call(name,options,name==='cachedNotes'?5000:name==='downloadOffline'?1200000:45000)]));
  client.addListener=(name,callback)=>window.Capacitor.Plugins?.ReviseNative?.addListener(name,callback) || window.Capacitor.addListener('ReviseNative',name,callback);
  window.ReviseNativeClient={available,client};
})();
