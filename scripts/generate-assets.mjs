import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ringTuples=JSON.parse(fs.readFileSync(path.join(root,'src/data/ring/rings.v1.json'),'utf8'));
const keys=['metal','shape','size','width','finish','setting','halo','profile'];
const rings=ringTuples.map((tuple,index)=>{const id=`R${String(index+1).padStart(3,'0')}`;const attributes=Object.fromEntries(keys.map((key,i)=>[key,tuple[i]]));return{id,attributes,assets:{packshot:`/images/rings/candidates/${id}-pack-v1.svg`,worn:`/images/rings/candidates/${id}-worn-v1.svg`}};});
const diag=JSON.parse(fs.readFileSync(path.join(root,'src/data/ring/diagnostic-assets.v1.json'),'utf8'));
const candidateDir=path.join(root,'public/images/rings/candidates');
const diagnosticDir=path.join(root,'public/images/rings/diagnostic');
fs.mkdirSync(candidateDir,{recursive:true}); fs.mkdirSync(diagnosticDir,{recursive:true});
const metalColor={white:'#d7d3ce',yellow:'#c89f46',rose:'#c98f85'};
function stoneShape(shape,cx,cy,s){
  if(shape==='round')return `<circle cx="${cx}" cy="${cy}" r="${s}" />`;
  if(shape==='oval')return `<ellipse cx="${cx}" cy="${cy}" rx="${(s*.78).toFixed(1)}" ry="${s}" />`;
  if(shape==='emerald')return `<rect x="${(cx-s*.72).toFixed(1)}" y="${(cy-s).toFixed(1)}" width="${(s*1.44).toFixed(1)}" height="${(s*2).toFixed(1)}" rx="${(s*.16).toFixed(1)}" />`;
  if(shape==='cushion')return `<rect x="${(cx-s).toFixed(1)}" y="${(cy-s).toFixed(1)}" width="${s*2}" height="${s*2}" rx="${(s*.35).toFixed(1)}" />`;
  return `<path d="M ${cx} ${(cy-s*1.15).toFixed(1)} C ${(cx+s*1.1).toFixed(1)} ${(cy-s*.25).toFixed(1)}, ${(cx+s*.8).toFixed(1)} ${(cy+s).toFixed(1)}, ${cx} ${(cy+s*1.05).toFixed(1)} C ${(cx-s*.8).toFixed(1)} ${(cy+s).toFixed(1)}, ${(cx-s*1.1).toFixed(1)} ${(cy-s*.25).toFixed(1)}, ${cx} ${(cy-s*1.15).toFixed(1)} Z" />`;
}
function svg(attrs,worn=false,label='ring'){
  const metal=metalColor[attrs.metal], width={thin:10,medium:17,thick:25}[attrs.width], size={small:30,medium:43,large:58}[attrs.size];
  const pave=attrs.finish==='pave', halo=attrs.halo==='halo', bezel=attrs.setting==='bezel', high=attrs.profile==='high'; const id=label.replace(/[^a-zA-Z0-9]/g,'')||'ring';
  const defs=`<defs><radialGradient id="bg${id}" cx="50%" cy="42%" r="68%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#f3efeb"/></radialGradient><linearGradient id="metal${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset=".18" stop-color="${metal}"/><stop offset=".46" stop-color="#fffaf0"/><stop offset=".7" stop-color="${metal}"/><stop offset="1" stop-color="#8f8882"/></linearGradient><radialGradient id="stone${id}" cx="35%" cy="28%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".34" stop-color="#eef8fb"/><stop offset=".72" stop-color="#dce9ee"/><stop offset="1" stop-color="#c4d1d6"/></radialGradient><linearGradient id="skin${id}" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#f2cfba"/><stop offset=".48" stop-color="#e7bba3"/><stop offset="1" stop-color="#d99f83"/></linearGradient><filter id="shadow${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10"/></filter><filter id="soft${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`;
  let inner='';
  if(!worn){
    const cy=high?240:258; const shape=stoneShape(attrs.shape,320,cy,size); const haloEl=halo?stoneShape(attrs.shape,320,cy,size+13).replace('/>',` fill="none" stroke="#f7fdff" stroke-width="9" stroke-dasharray="2 5" />`):'';
    const paveEl=pave?[[207,342],[225,326],[246,315],[269,307],[294,303],[346,303],[371,307],[394,315],[415,326],[433,342]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="#fbffff" stroke="#bcc9ce"/>`).join(''):'';
    const prongs=bezel?'':[[320-size*.62,cy],[320+size*.62,cy],[320,cy-size*.82],[320,cy+size*.82]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.2" fill="url(#metal${id})"/>`).join('');
    inner=`<ellipse cx="320" cy="497" rx="142" ry="28" fill="#7e746d" opacity=".12" filter="url(#shadow${id})"/><ellipse cx="320" cy="374" rx="145" ry="129" fill="none" stroke="url(#metal${id})" stroke-width="${width}"/><ellipse cx="320" cy="374" rx="139" ry="123" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>${paveEl}<ellipse cx="320" cy="${cy+size*.8}" rx="${size*.7}" ry="10" fill="#665d57" opacity=".10" filter="url(#soft${id})"/><g fill="url(#stone${id})" stroke="url(#metal${id})" stroke-width="${bezel?9:3.5}">${haloEl}${shape}</g><path d="M ${320-size*.55} ${cy} L 320 ${cy-size*.72} L ${320+size*.55} ${cy} L 320 ${cy+size*.72} Z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>${prongs}`;
  } else {
    const cy=high?315:323, bandY=325; const haloEl=halo?stoneShape(attrs.shape,320,cy,size+10).replace('/>',` fill="none" stroke="#f8ffff" stroke-width="8" stroke-dasharray="2 5" />`):'';
    let band=`<path d="M 258 ${bandY} C 286 ${bandY-7} 352 ${bandY-7} 382 ${bandY} L 380 ${bandY+width} C 349 ${bandY+width-7} 287 ${bandY+width-7} 260 ${bandY+width} Z" fill="url(#metal${id})"/>`;
    if(pave)band+=Array.from({length:6},(_,i)=>`<circle cx="${276+i*18}" cy="${bandY+width*.45}" r="4.6" fill="#fbffff" stroke="#bdc8cb"/>`).join('');
    inner=`<ellipse cx="322" cy="550" rx="160" ry="45" fill="#7e5c4b" opacity=".13" filter="url(#shadow${id})"/><path d="M158 560 C142 473 151 224 184 116 C196 76 225 60 254 71 C281 82 288 112 280 151 L254 302 L270 89 C274 49 300 26 332 31 C366 36 377 68 371 108 L350 301 L373 111 C378 73 404 54 433 61 C463 68 472 99 465 136 L426 345 L447 176 C452 142 476 124 502 131 C530 139 538 167 531 199 L486 449 C476 508 448 560 399 590 C340 626 221 620 178 584 C167 575 161 568 158 560 Z" fill="url(#skin${id})"/><ellipse cx="323" cy="70" rx="28" ry="35" fill="#f7e9e2" opacity=".78"/>${band}<ellipse cx="320" cy="${cy+size*.75}" rx="${size*.7}" ry="9" fill="#6d5346" opacity=".12" filter="url(#soft${id})"/><g fill="url(#stone${id})" stroke="url(#metal${id})" stroke-width="${bezel?8:3.5}">${haloEl}${stoneShape(attrs.shape,320,cy,size)}</g><path d="M ${320-size*.5} ${cy} L 320 ${cy-size*.68} L ${320+size*.5} ${cy} L 320 ${cy+size*.68} Z" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-label="${label}">${defs}<rect width="640" height="640" fill="url(#bg${id})"/><g>${inner}</g></svg>`;
}
for(const r of rings){fs.writeFileSync(path.join(candidateDir,`${r.id}-pack-v1.svg`),svg(r.attributes,false,`${r.id} packshot`));fs.writeFileSync(path.join(candidateDir,`${r.id}-worn-v1.svg`),svg(r.attributes,true,`${r.id} worn`));}
for(const d of diag)fs.writeFileSync(path.join(diagnosticDir,`${d.id}.svg`),svg(d.attributes,false,d.id));
console.log(`generated ${rings.length*2+diag.length} ring assets`);
