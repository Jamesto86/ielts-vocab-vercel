import { useMemo, useState } from 'react'
import Head from 'next/head'
import { VOCAB, type Vocab } from '../data/vocab'

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5) }
function pickOpts(words: Vocab[], cur: Vocab, n=3) {
  const others = words.filter(w=>w.text!==cur.text).map(w=>w.meaning)
  const out:string[]=[]; while(out.length<n && others.length){const k=Math.floor(Math.random()*others.length); out.push(others.splice(k,1)[0])}
  return shuffle([cur.meaning, ...out])
}

export default function Home(){
  const [idx,setIdx]=useState(0)
  const words=VOCAB; const cur=words[idx]
  const options=useMemo(()=>pickOpts(words,cur,3),[idx])

  async function play(){
    const url=`/api/tts?text=${encodeURIComponent(cur.text)}`
    const audio=new Audio(url); try{await audio.play()}catch{}
  }
  function choose(m:string){ if(m===cur.meaning) setTimeout(()=>setIdx((idx+1)%words.length),300); else alert('再想想～') }

  return <div style={{maxWidth:960,margin:'0 auto',padding:16,lineHeight:1.6}}>
    <Head><title>IELTS Vocab Game</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <h1>IELTS Vocab Game</h1>
    <p style={{color:'#666'}}>Next.js + Vercel Serverless TTS</p>
    <section style={{marginTop:24}}>
      <div style={{fontSize:28,fontWeight:700}}>{cur.text}</div>
      <div style={{marginTop:12}}><button onClick={play}>▶ 听读音</button></div>
      <ul>{options.map((m,i)=>(<li key={i} style={{margin:'8px 0'}}><button onClick={()=>choose(m)}>{m}</button></li>))}</ul>
    </section>
  </div>
}
