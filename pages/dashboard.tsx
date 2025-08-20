
import { useMemo } from 'react'
import Head from 'next/head'

type Day = { date: string, correct: number, total: number }
type Progress = { xp: number, streak: number, learned: Record<string, { interval: number, due: string }>, history: Day[] }

function load(): Progress {
  try { return JSON.parse(localStorage.getItem('progress') || '') } catch { return { xp:0, streak:0, learned:{}, history:[] } }
}

export default function Dashboard() {
  const p = load()

  const last7 = useMemo(() => {
    const map: Record<string, Day> = {}
    for (const d of p.history) map[d.date] = d
    const out: Day[] = []
    for (let i=6; i>=0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate()-i)
      const key = dt.toISOString().slice(0,10)
      out.push(map[key] || { date:key, correct:0, total:0 })
    }
    return out
  }, [p.history])

  const mastered = Object.values(p.learned).filter(x => x.interval >= 7).length

  return (
    <div style={{maxWidth: 980, margin:'0 auto', padding:24}}>
      <Head><title>学习统计</title></Head>
      <h1>学习统计</h1>

      <div style={{display:'flex', gap:16, margin:'16px 0'}}>
        <Stat label="总经验" value={p.xp} />
        <Stat label="已掌握词数" value={mastered} />
        <Stat label="历史天数" value={p.history.length} />
      </div>

      <h3>最近 7 天正确率</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8}}>
        {last7.map((d,i) => {
          const rate = d.total ? Math.round(d.correct/d.total*100) : 0
          return (
            <div key={i} style={{border:'1px solid #e5e7eb', borderRadius:8, padding:8}}>
              <div style={{fontSize:12, color:'#666'}}>{d.date.slice(5)}</div>
              <div style={{fontSize:20, fontWeight:700}}>{rate}%</div>
              <div style={{fontSize:12, color:'#666'}}>({d.correct}/{d.total})</div>
            </div>
          )
        })}
      </div>

      <div style={{marginTop:16}}>
        <a href="/">← 返回练习</a>
      </div>
    </div>
  )
}

function Stat({label, value}:{label:string, value:number}) {
  return (
    <div style={{flex:1, border:'1px solid #e5e7eb', borderRadius:12, padding:16}}>
      <div style={{color:'#666', fontSize:12}}>{label}</div>
      <div style={{fontSize:28, fontWeight:800}}>{value}</div>
    </div>
  )
}
