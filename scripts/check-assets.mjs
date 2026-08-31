import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const ringTuples=JSON.parse(fs.readFileSync(path.join(root,'src/data/ring/rings.v1.json'),'utf8'));
const keys=['metal','shape','size','width','finish','setting','halo','profile'];
const rings=ringTuples.map((tuple,index)=>{const id=`R${String(index+1).padStart(3,'0')}`;const attributes=Object.fromEntries(keys.map((key,i)=>[key,tuple[i]]));return{id,attributes,assets:{packshot:`/images/rings/candidates/${id}-pack-v1.svg`,worn:`/images/rings/candidates/${id}-worn-v1.svg`}};});
const diag=JSON.parse(fs.readFileSync(path.join(root,'src/data/ring/diagnostic-assets.v1.json'),'utf8'));
const questions=JSON.parse(fs.readFileSync(path.join(root,'src/data/ring/questions.v1.json'),'utf8'));
const missing=[];
for(const r of rings){for(const k of ['packshot','worn']){const p=path.join(root,'public',r.assets[k].replace(/^\//,''));if(!fs.existsSync(p))missing.push(r.assets[k]);}}
for(const a of diag){const p=path.join(root,'public',a.src.replace(/^\//,''));if(!fs.existsSync(p))missing.push(a.src);}
const ids=new Set(rings.map(r=>r.id));
if(rings.length!==64)throw new Error(`Expected 64 rings, got ${rings.length}`);
if(ids.size!==64)throw new Error('Duplicate ring ids');
if(diag.length!==22)throw new Error(`Expected 22 diagnostic assets, got ${diag.length}`);
if(questions.length!==17)throw new Error(`Expected 17 questions, got ${questions.length}`);
for(const q of questions){if(!diag.some(a=>a.id===q.assetA)||!diag.some(a=>a.id===q.assetB))throw new Error(`Missing diagnostic mapping for ${q.id}`);const a=diag.find(x=>x.id===q.assetA),b=diag.find(x=>x.id===q.assetB);const diffs=Object.keys(a.attributes).filter(k=>a.attributes[k]!==b.attributes[k]);if(diffs.length!==1||diffs[0]!==q.attribute)throw new Error(`${q.id} must differ only by ${q.attribute}; differs by ${diffs}`);}
if(missing.length)throw new Error(`Missing ${missing.length} assets:\n${missing.join('\n')}`);
console.log(`assets ok: ${rings.length*2+diag.length} files, ${questions.length} controlled pairs`);
