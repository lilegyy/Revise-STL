(function(root){
  'use strict';
  const number = value => {
    if(typeof value === 'number')return Number.isFinite(value)?value:null;
    if(typeof value !== 'string'||!/^[-+]?\d+(?:[.,]\d+)?$/.test(value.trim()))return null;
    return Number(value.trim().replace(',','.'));
  };
  const weighted = rows => {
    let sum=0,weights=0;
    for(const {value,weight}of rows)if(Number.isFinite(value)&&Number.isFinite(weight)&&weight>0){sum+=value*weight;weights+=weight;}
    return weights?sum/weights:null;
  };
  function calculate(data,periodCode,overrides={}) {
    const period=(data.periodes||[]).find(p=>p.codePeriode===periodCode);
    if(!period)throw Error('Période absente.');
    const rows=period.ensembleMatieres?.disciplines||[], subjects=new Map(),groups=new Map();
    function coefficient(row,key){const custom=number(overrides[key]),source=number(row.coef);return custom!==null&&custom>=0?custom:source!==null&&source>=0?source:1;}
    for(const row of rows){
      if(row.groupeMatiere){groups.set(String(row.id),{key:'group:'+row.id,title:row.discipline||'Groupe',coefficient:coefficient(row,'group:'+row.id),members:[],explicit:number(row.coef)!==null});continue;}
      const code=String(row.codeMatiere||row.id),sub=String(row.codeSousMatiere||''),key=code+(sub?':'+sub:'');
      subjects.set(key,{key,title:row.discipline||code,code,sub,group:row.idGroupeMatiere?String(row.idGroupeMatiere):null,coefficient:coefficient(row,key),explicit:number(row.coef)!==null,marks:[]});
    }
    let excluded=0;
    for(const note of data.notes||[]){
      if(note.codePeriode!==periodCode)continue;
      const value=number(note.valeur),on=number(note.noteSur),weight=number(note.coef);
      if(note.enLettre||note.nonSignificatif||value===null||on===null||on<=0||value<0||weight===0){excluded++;continue;}
      const code=String(note.codeMatiere||''),sub=String(note.codeSousMatiere||''),key=code+(sub?':'+sub:'');
      if(!subjects.has(key))subjects.set(key,{key,title:note.libelleMatiere||code,code,sub,group:null,coefficient:coefficient(note,key),explicit:false,marks:[]});
      subjects.get(key).marks.push({value:20*value/on,weight:weight!==null&&weight>0?weight:1,classValue:number(note.moyenneClasse)===null?null:20*number(note.moyenneClasse)/on,label:note.devoir||'Évaluation',date:note.date||'',id:note.id});
    }
    for(const s of subjects.values()){
      s.average=weighted(s.marks);s.classAverage=weighted(s.marks.map(m=>({value:m.classValue,weight:m.weight})));s.classCount=s.marks.filter(m=>m.classValue!==null).length;
    }
    const top=[]; const codes=new Set([...subjects.values()].map(s=>s.code));
    for(const code of codes){
      const all=[...subjects.values()].filter(s=>s.code===code),children=all.filter(s=>s.sub),parent=all.find(s=>!s.sub);
      if(children.length){
        // Une discipline avec sous-matières est comptée une seule fois.
        const base=parent||{key:code,title:code,code,group:null,coefficient:number(overrides[code])??1,explicit:false};
        top.push({...base,children,average:weighted(children.map(s=>({value:s.average,weight:s.coefficient}))),classAverage:weighted(children.map(s=>({value:s.classAverage,weight:s.coefficient}))),marks:children.flatMap(s=>s.marks)});
      }else if(parent)top.push(parent);
    }
    const general=[]; const results=[];
    for(const s of top){if(s.group&&groups.has(s.group))groups.get(s.group).members.push(s);else general.push(s);results.push(s);}
    for(const group of groups.values()){
      if(!group.members.length)continue;
      const weight=group.explicit||number(overrides[group.key])!==null?group.coefficient:group.members.reduce((n,s)=>n+(s.average===null?0:s.coefficient),0);
      general.push({...group,coefficient:weight,average:weighted(group.members.map(s=>({value:s.average,weight:s.coefficient}))),classAverage:weighted(group.members.map(s=>({value:s.classAverage,weight:s.coefficient})))});
    }
    return {subjects:results,groups:[...groups.values()],average:weighted(general.map(s=>({value:s.average,weight:s.coefficient}))),classAverage:weighted(general.map(s=>({value:s.classAverage,weight:s.coefficient}))),excluded,partialClass:results.some(s=>s.marks.some(m=>m.classValue===null)),defaultCoefficients:results.some(s=>!s.explicit)||data.parametrage?.coefficientNote===false||(data.parametrage?.moyenneCoefMatiere===false&&data.parametrage?.colonneCoefficientMatiere===false)};
  }
  const engine={number,weighted,calculate};if(typeof module!=='undefined')module.exports=engine;else root.GradeEngine=engine;
})(globalThis);
