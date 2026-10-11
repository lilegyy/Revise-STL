import fs from 'node:fs/promises';
import path from 'node:path';
const destination='ios/App/App';
await fs.mkdir(destination,{recursive:true});
// Enregistrer aussi le module pendant l'initialisation du pont Capacitor.
const configFile=destination+'/capacitor.config.json';
const config=JSON.parse(await fs.readFile(configFile,'utf8'));
config.packageClassList=[...new Set([...(config.packageClassList||[]),'ReviseNativePlugin'])];
await fs.writeFile(configFile,JSON.stringify(config,null,2));
for(const name of ['ViewController.swift','ReviseNativePlugin.swift','PrivacyInfo.xcprivacy'])await fs.copyFile(path.join('native',name),path.join(destination,name));
// Les fichiers Swift ajoutés doivent être des membres de la cible Xcode.
const project='ios/App/App.xcodeproj/project.pbxproj';
let text=await fs.readFile(project,'utf8');
const files=[['ReviseNativePlugin.swift','A11000000000000000000001','A11000000000000000000002'],['PrivacyInfo.xcprivacy','A11000000000000000000003','A11000000000000000000004'],['ViewController.swift','A11000000000000000000005','A11000000000000000000006']];
for(const[name,ref,build]of files){
  if(text.includes(name))continue;
  const type=name.endsWith('.swift')?'sourcecode.swift':'text.xml';
  text=text.replace('/* Begin PBXBuildFile section */','/* Begin PBXBuildFile section */\n'+build+' /* '+name+' */ = {isa = PBXBuildFile; fileRef = '+ref+'; };');
  text=text.replace('/* Begin PBXFileReference section */','/* Begin PBXFileReference section */\n'+ref+' /* '+name+' */ = {isa = PBXFileReference; lastKnownFileType = '+type+'; path = '+name+'; sourceTree = "<group>"; };');
  const group=/(\/\* App \*\/ = \{\s*isa = PBXGroup;\s*children = \()(\s*[\s\S]*?)(\);\s*path = App;)/;
  if(!group.test(text))throw Error('Le groupe App du projet Xcode n’a pas été trouvé.');
  text=text.replace(group,(_,a,b,c)=>a+'\n'+ref+' /* '+name+' */,\n'+b+c);
  const phase=name.endsWith('.swift')?'PBXSourcesBuildPhase':'PBXResourcesBuildPhase';
  const re=new RegExp('(isa = '+phase+';\\s*buildActionMask = \\d+;\\s*files = \\()');
  if(!re.test(text))throw Error('Phase Xcode absente : '+phase);
  text=text.replace(re,'$1\n'+build+' /* '+name+' */,');
}
await fs.writeFile(project,text);
let plist=await fs.readFile(destination+'/Info.plist','utf8');
plist=plist.replace(/\s*<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\s*\/>/g,'');
plist=plist.replace('</dict>\n</plist>','<key>ITSAppUsesNonExemptEncryption</key><false/>\n</dict>\n</plist>');
plist=plist.replace(/(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,(_,a,b)=>a+'1.0.1'+b).replace(/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,(_,a,b)=>a+'2'+b);
await fs.writeFile(destination+'/Info.plist',plist);
const storyboard=destination+'/Base.lproj/Main.storyboard';
let scene=await fs.readFile(storyboard,'utf8');
scene=scene.replace('customClass="CAPBridgeViewController" customModule="Capacitor"','customClass="ViewController" customModule="App" customModuleProvider="target"');
await fs.writeFile(storyboard,scene);
await fs.cp('native/AppIcon.appiconset',destination+'/Assets.xcassets/AppIcon.appiconset',{recursive:true});
console.log('Connexion native, stockage privé et déclaration de confidentialité ajoutés.');
