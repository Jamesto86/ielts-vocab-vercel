// pages/api/tts.ts  —— 极简版：生成 Google TTS 地址后 307 重定向过去
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAudioUrl } from 'google-tts-api'

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const text =
    (req.method === 'GET'
      ? (req.query.text as string) || ''
      : typeof req.body === 'string'
      ? (JSON.parse(req.body).text as string) || ''
      : (req.body?.text as string) || '').trim()

  if (!text) return res.status(400).json({ error: 'text required' })

  const url = getAudioUrl(text, {
    lang: 'en',
    slow: false,
    host: 'https://translate.google.com',
  })

  // 直接重定向到 MP3（浏览器 <audio src="/api/tts?..."> 会自动跟随）
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.redirect(307, url)
}
