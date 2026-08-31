function fileName(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `my-ring-style-${y}${m}${day}.png`;}
export async function exportResultCard(element:HTMLElement){
  await document.fonts?.ready;
  const images=[...element.querySelectorAll('img')];
  await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise<void>(r=>{img.onload=()=>r();img.onerror=()=>r();})));
  const { toBlob } = await import('html-to-image');
  const blob=await toBlob(element,{width:1080,height:1350,pixelRatio:1,cacheBust:true,backgroundColor:'#F8F5F1'});
  if(!blob)throw new Error('PNG export failed'); return blob;
}
export function saveBlob(blob:Blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
