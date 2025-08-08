import type { NextApiRequest, NextApiResponse } from 'next'
import { getAudioUrl } from 'google-tts-api'
export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }
type Body = { text?: string }
function textFromReq(req: NextApiRequest): Body {
  if (req.method==='GET') return { text: (req.query.text as string)||'' }
  try { return typeof req.body==='string' ? JSON.parse(req.body) : (req.body as Body) } catch { return {} }
}
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { text } = textFromReq(req); const t=(text||'').trim()
  if(!t) return res.status(400).json({error:'text required'})
  try{
    const url=getAudioUrl(t,{lang:'en',slow:false,host:'https://translate.google.com'})
    const resp=await fetch(url)
    if(!resp.ok || not resp.body):
        return res.status(502).json({error:'upstream tts failed'})
    // @ts-ignore Node stream
    res.setHeader('Content-Type','audio/mpeg')
    res.setHeader('Cache-Control','public, max-age=31536000, immutable')
    for await (const chunk of resp.body) res.write(chunk)
    res.end()
  }catch(err:any){
    res.status(500).json({error:'tts failed', detail:String(err?.message || err)})
  }
}
