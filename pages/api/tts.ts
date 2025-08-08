// pages/api/tts.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAudioUrl } from 'google-tts-api'
import { Readable } from 'stream'

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }

type Body = { text?: string }

function textFromReq(req: NextApiRequest): Body {
  if (req.method === 'GET') return { text: (req.query.text as string) || '' }
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Body)
  } catch {
    return {}
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = textFromReq(req)
  const t = (text || '').trim()
  if (!t) return res.status(400).json({ error: 'text required' })

  try {
    // 生成 TTS 音频地址
    const url = getAudioUrl(t, { lang: 'en', slow: false, host: 'https://translate.google.com' })

    // 拉取远端 MP3
    const resp = await fetch(url)
    const webStream = resp.body
    if (!resp.ok || !webStream) {
      return res.status(502).json({ error: 'upstream tts failed' })
    }

    // Web ReadableStream -> Node Readable
    const nodeStream = Readable.fromWeb(webStream as any)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    for await (const chunk of nodeStream) {
      res.write(chunk)
    }
    res.end()
  } catch (err: any) {
    res.status(500).json({ error: 'tts failed', detail: String(err?.message || err) })
  }
}
