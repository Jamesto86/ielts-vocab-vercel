
import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { VOCAB, type Vocab } from '../data/vocab'
import { motion, AnimatePresence } from 'framer-motion'

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5) }
function pickOptions(words: Vocab[], current: Vocab, n = 3) {
  const others = words.filter(w => w.text !== current.text).map(w => w.meaning)
  const out: string[] = []
  while (out.length < n && others.length) {
    const k = Math.floor(Math.random() * others.length)
    out.push(others.splice(k, 1)[0])
  }
  return shuffle([current.meaning, ...out])
}

type SRS = { ease: number, interval: number, due: string }
type Progress = {
  xp: number
  streak: number
  learned: Record<string, SRS>
  history: Array<{ date: string, correct: number, total: number }>
}

const today = () => new Date().toISOString().slice(0,10)
const load = (): Progress => {
  if (typeof window === 'undefined') return { xp:0, streak:0, learned:{}, history:[] }
  try { return JSON.parse(localStorage.getItem('progress') || '') as Progress } catch { return { xp:0, streak:0, learned:{}, history:[] } }
}
const save = (p: Progress) => { if (typeof window !== 'undefined') localStorage.setItem('progress', JSON.stringify(p)) }

function updateSRS(srs: SRS | undefined, correct: boolean): SRS {
  let ease = srs?.ease ?? 2.3
  let interval = srs?.interval ?? 0
  if (!correct) {
    ease = Math.max(1.3, ease - 0.2)
    interval = 0
    return { ease, interval, due: today() }
  }
  ease = Math.min(2.6, ease + 0.05)
  if (interval === 0) interval = 1
  else if (interval === 1) interval = 3
  else interval = Math.round(interval * ease)
  const d = new Date(); d.setDate(d.getDate() + interval)
  return { ease, interval, due: d.toISOString().slice(0,10) }
}

export default function Home() {
  const [words] = useState<Vocab[]>(VOCAB)
  const [idx, setIdx] = useState(0)
  const current = words[idx]
  const options = useMemo(() => pickOptions(words, current, 3), [idx])

  const [progress, setProgress] = useState<Progress>(load())
  useEffect(() => save(progress), [progress])

  const startedAt = useRef<number>(Date.now())

  async function play() {
    const url = `/api/tts?text=${encodeURIComponent(current.text)}`
    const audio = new Audio(url)
    try { await audio.play() } catch { /* autoplay blocked */ }
  }

  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)

  function choose(m: string) {
    const ok = m === current.meaning
    const ms = Date.now() - startedAt.current
    startedAt.current = Date.now()

    setProgress(prev => {
      const speedBonus = ms < 3000 ? 5 : 0
      const combo = ok ? prev.streak + 1 : 0
      const xp = prev.xp + (ok ? (10 + combo + speedBonus) : 0)

      const key = current.text
      const nextSRS = updateSRS(prev.learned[key], ok)
      const learned = { ...prev.learned, [key]: nextSRS }

      const d = today()
      const last = prev.history[prev.history.length - 1]
      let history = prev.history
      if (last?.date === d) {
        last.total += 1
        if (ok) last.correct += 1
      } else {
        history = [...prev.history, { date: d, total: 1, correct: ok ? 1 : 0 }]
      }

      return { xp, streak: combo, learned, history }
    })

    setFeedback({ ok })
    setTimeout(() => {
      setFeedback(null)
      setIdx((idx + 1) % words.length)
    }, 300)
  }

  return (
    <div style={{maxWidth: 980, margin:'0 auto', padding: 24}}>
      <Head><title>IELTS Vocab Game</title></Head>

      <div style={{display:'flex', gap:16, alignItems:'center', marginBottom:16}}>
        <Badge label={`XP ${progress.xp}`} />
        <Badge label={`Combo ${progress.streak}`} />
        <button onClick={play}>▶ 听读音</button>
        <a href="/dashboard" style={{marginLeft:'auto'}}>查看学习统计 →</a>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.text}
          initial={{opacity:0, y:10, scale:0.98}}
          animate={{opacity:1, y:0, scale:1}}
          exit={{opacity:0, y:-10, scale:0.98}}
          transition={{duration:0.2}}
          style={{border:'1px solid #e5e7eb', borderRadius:12, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,0.06)'}}
        >
          <h2 style={{fontSize:36, margin:'8px 0'}}>{current.text}</h2>
          <ul style={{listStyle:'none', padding:0}}>
            {options.map((m, i) => (
              <li key={i} style={{margin:'8px 0'}}>
                <motion.button
                  whileTap={{scale:0.98}}
                  onClick={() => choose(m)}
                  style={{padding:'10px 12px', borderRadius:10, border:'1px solid #e5e7eb', width:'100%', textAlign:'left'}}
                >
                  {m}
                </motion.button>
              </li>
            ))}
          </ul>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{opacity:0}}
                animate={{opacity:1}}
                exit={{opacity:0}}
                style={{marginTop:10, color: feedback.ok ? '#16a34a' : '#dc2626'}}
              >
                {feedback.ok ? '✅ 正确！+XP' : '❌ 再想想'}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Badge({label}:{label:string}) {
  return <span style={{background:'#111', color:'#fff', padding:'4px 10px', borderRadius:999}}>{label}</span>
}
