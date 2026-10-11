(() => {
  'use strict';
  const $=s=>document.querySelector(s),native=window.ReviseNativeClient.client;
  try{document.documentElement.dataset.theme=localStorage.getItem('revise-theme')||'light';}catch{}
  let cache=null,busy=false,settings={};try{settings=JSON.parse(localStorage.getItem('revise-grade-coefficients')||'{}');}catch{}
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>v===null?'—':v.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
  function decoded(text){try{return new TextDecoder().decode(Uint8Array.from(atob(text),c=>c.charCodeAt(0)));}catch{return text;}}
  async function action(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);$('#status').textContent='Un instant…';try{await fn();}catch(e){$('#status').textContent=e.message||'Connexion indisponible.';}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
  if(window.ReviseNativeClient.available())Promise.resolve(native.addListener('loginProgress',event=>{if(busy)$('#status').textContent=event.message;})).catch(()=>{});
  function showResult(result){
    if(result.security){$('#security-panel').hidden=false;$('#login-panel').hidden=true;$('#security-question').textContent=decoded(result.question);$('#security-answer').innerHTML=result.choices.map((choice,i)=>'<option value="'+escape(choice)+'">'+escape(decoded(choice))+'</option>').join('');$('#status').textContent='Confirme ton identité pour continuer.';return;}
    $('#security-panel').hidden=true;$('#accounts-panel').hidden=false;$('#login-panel').hidden=true;$('#account').innerHTML=result.accounts.map(a=>'<option value="'+escape(a.id)+'">'+escape(a.name)+'</option>').join('');$('#status').textContent='Choisis ton compte élève.';
    if(result.accounts.length===1)return refresh();
  }
  function render(){
    if(!cache?.data)return;$('#results').hidden=false;
    const code=$('#period').value,scope=cache.accountID+':'+code,overrides=settings[scope]||{},result=GradeEngine.calculate(cache.data,code,overrides);
    $('#summary').innerHTML=[['Ma moyenne',fmt(result.average)],['Comparaison classe',fmt(result.classAverage)],['Objectif 17,5',result.average===null?'—':fmt(result.average-17.5)]].map(([label,v])=>'<div class="notes-stat"><span>'+label+'</span><strong>'+v+'</strong><small>'+(label==='Objectif 17,5'?'écart en points':'/20')+'</small></div>').join('');
    $('#updated').textContent='Dernière récupération : '+new Date(cache.updated).toLocaleString('fr-FR');
    $('#precision').textContent='Comparaison estimée à partir des moyennes de classe disponibles.'+(result.partialClass?' Certaines moyennes de classe manquent.':'')+(result.defaultCoefficients?' Certains coefficients ne sont pas fournis ou sont masqués : vérifie les valeurs proposées.':'')+(result.excluded?' '+result.excluded+' note(s) non numérique(s), non significative(s) ou de coefficient nul exclue(s).':'');
    function subject(s,child=false){return '<article class="subject-note '+(child?'sub-note':'')+'"><h3>'+escape(s.title)+'</h3><p>Moi : <strong>'+fmt(s.average)+'/20</strong> · Classe : '+fmt(s.classAverage)+'/20</p><label>Coefficient'+(s.explicit?'':' à vérifier')+'<input data-coefficient="'+escape(s.key)+'" type="number" min="0" step="0.1" value="'+s.coefficient+'"></label>'+(s.children?s.children.map(x=>subject(x,true)).join(''):'<details><summary>'+s.marks.length+' évaluation(s) prise(s) en compte</summary><ul class="marks">'+s.marks.map(m=>'<li>'+escape(m.date)+' · '+escape(m.label)+' : '+fmt(m.value)+'/20 · coef. '+m.weight+'</li>').join('')+'</ul></details>')+'</article>';}
    $('#subjects').innerHTML=result.groups.filter(g=>g.members.length).map(g=>'<div class="subject-note"><h3>'+escape(g.title)+'</h3><label>Coefficient du groupe<input data-coefficient="'+escape(g.key)+'" type="number" min="0" step="0.1" value="'+g.coefficient+'"></label></div>').join('')+result.subjects.map(s=>subject(s)).join('');
  }
  function accept(value){cache=value;const old=$('#period').value;$('#period').innerHTML=value.data.periodes.map(p=>'<option value="'+escape(p.codePeriode)+'">'+escape(p.periode||p.codePeriode)+'</option>').join('');if(value.data.periodes.some(p=>p.codePeriode===old))$('#period').value=old;render();}
  async function refresh(){const value=await native.refreshNotes();accept(value);$('#login-panel').hidden=true;$('#accounts-panel').hidden=true;$('#status').textContent='Tes notes sont à jour.';}
  $('#login').addEventListener('submit',e=>{e.preventDefault();action(async()=>{if(!native)throw Error('La connexion ÉcoleDirecte est disponible dans l’application iPhone.');const identifier=$('#identifier').value.trim(),password=$('#password').value;$('#password').value='';await showResult(await native.login({identifier,password}));});});
  $('#security').addEventListener('submit',e=>{e.preventDefault();action(async()=>{await showResult(await native.answerSecurity({choice:$('#security-answer').value}));});});
  $('#choose-account').addEventListener('click',()=>action(async()=>{await native.selectAccount({id:$('#account').value});await refresh();}));
  $('#refresh').addEventListener('click',()=>action(refresh));$('#show-login').addEventListener('click',()=>{$('#login-panel').hidden=false;$('#login-panel').scrollIntoView({behavior:'smooth'});});
  $('#period').addEventListener('change',render);
  $('#subjects').addEventListener('change',event=>{const key=event.target.dataset.coefficient;if(!key)return;const value=GradeEngine.number(event.target.value);if(value===null||value<0){$('#status').textContent='Le coefficient doit être positif ou nul.';render();return;}const scope=cache.accountID+':'+$('#period').value;settings[scope]||={};settings[scope][key]=value;try{localStorage.setItem('revise-grade-coefficients',JSON.stringify(settings));}catch{}render();});
  $('#disconnect').addEventListener('click',()=>action(async()=>{await native.disconnect();settings={};localStorage.removeItem('revise-grade-coefficients');cache=null;$('#results').hidden=true;$('#security-panel').hidden=true;$('#accounts-panel').hidden=true;$('#login-panel').hidden=false;$('#status').textContent='Session fermée et notes effacées de cet appareil.';}));
  if(window.ReviseNativeClient.available())action(async()=>{const value=await native.cachedNotes();if(!value.empty){accept(value);$('#login-panel').hidden=true;$('#status').textContent='Tes notes enregistrées sur cet appareil.';}else $('#status').textContent='Connecte-toi pour récupérer tes notes.';});
  else $('#status').textContent='Module iPhone indisponible · version 1.0.2. Ferme complètement l’application et rouvre-la. La connexion attend le chargement du module natif.';
})();
