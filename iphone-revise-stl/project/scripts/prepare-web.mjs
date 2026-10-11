import fs from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve(process.argv[2] || '../..');
const destination=path.resolve('www');
const names=['index.html','app.js','navigation.js','curriculum.js','curriculum.css','style.css','data.json','manipulations.json','diagrams.json','flashcards.json','supplements.json','manifest.json','apple-touch-icon.png'];
for(const name of names)await fs.access(path.join(source,name));
await fs.mkdir(destination,{recursive:true});
for(const name of names)await fs.copyFile(path.join(source,name),path.join(destination,name));
for(const name of ['vendor','assets/fonts'])await fs.cp(path.join(source,name),path.join(destination,name),{recursive:true});
await fs.copyFile(path.join(source,'assets/icon.svg'),path.join(destination,'assets/icon.svg'));
await fs.cp('web',destination,{recursive:true});
let index=await fs.readFile(path.join(destination,'index.html'),'utf8');
index=index.replace('<script defer src="app.js"></script>','<script src="native-adapter.js"></script>\n    <script defer src="app.js"></script>');
await fs.writeFile(path.join(destination,'index.html'),index);
let app=await fs.readFile(path.join(destination,'app.js'),'utf8');
app=app.replace('async function setupOffline() {','async function setupOffline() {\n  if (window.Capacitor?.isNativePlatform()) { offlineReady = false; document.querySelector("#network-status").textContent = navigator.onLine ? "Cours enregistrés" : "Mode hors ligne"; return; }');
app=app.replace("if (action === 'export') {",`if (action === 'export') {
      if (window.Capacitor?.isNativePlatform()) {
        Capacitor.Plugins.ReviseNative.shareProgress({text: JSON.stringify({...state, exportedAt: new Date().toISOString()}, null, 2)}).catch(() => toast('Impossible de préparer la sauvegarde.'));
        return;
      }`);
await fs.writeFile(path.join(destination,'app.js'),app);
console.log('Interface copiée ; documents et schémas seront téléchargés depuis le dépôt public.');
