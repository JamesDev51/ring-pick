import './result.css';
export function StoreSentence({ sentence, exclusion, onCopied }: { sentence:string; exclusion?:string; onCopied:()=>void }) {
  const text=[sentence,exclusion].filter(Boolean).join(' ');
  async function copy(){try{await navigator.clipboard.writeText(text);onCopied();}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();onCopied();}}
  return <section className="result-section"><div className="section-heading"><h2>반지샵에서 이렇게 말해보세요</h2><p>직원에게 그대로 보여주거나 복사해서 메모해두세요.</p></div><div className="store-sentence card"><p>{sentence}</p>{exclusion&&<p className="exclusion">{exclusion}</p>}<button type="button" className="secondary-button" onClick={copy}>문장 복사</button></div></section>;
}
