// pages/api/tts.ts —— 代理版：Vercel Serverless 拉取 Google TTS，再把音频流式回传
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAudioUrl } from 'google-tts-api'
import { Readable } from 'stream'

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }

function getText(req: NextApiRequest): string {
  if (req.method === 'GET') return ((req.query.text as string) || '').trim()
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as any)
    return ((body?.text as string) || '').trim()
  } catch { return '' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const text = getText(req)
  if (!text) return res.status(400).json({ error: 'text required' })

  try {
    // 生成 Google TTS 的 MP3 地址
    const url = getAudioUrl(text, { lang: 'en', slow: false, host: 'https://translate.google.com' })

    // 在服务端抓取 MP3（返回的是 Web ReadableStream）
    const upstream = await fetch(url)
    const webStream = upstream.body
    if (!upstream.ok || !webStream) return res.status(502).json({ error: 'upstream tts failed' })

    // Web Stream -> Node Stream，然后逐块写回客户端
    const nodeStream = Readable.fromWeb(webStream as any)
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    for await (const chunk of nodeStream) res.write(chunk)
    res.end()
  } catch (err: any) {
    res.status(500).json({ error: 'tts proxy failed', detail: String(err?.message || err) })
  }
}
