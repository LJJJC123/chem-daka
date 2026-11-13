/**
 * 极简本地代理：让浏览器不用直连厂商接口，Key 只存在这台电脑上。
 * 用法：
 *   1) 在 chem-daka 目录建 .env.local，写：
 *        CHEMQ_API_KEY=sk-xxx
 *        CHEMQ_BASE_URL=https://api.deepseek.com/v1
 *        CHEMQ_MODEL=deepseek-chat
 *   2) node server/proxy.mjs   (或 pnpm api)
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  const out = {}
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return { ...out, ...process.env }
}

const env = loadEnv()
const PORT = Number(env.CHEMQ_PROXY_PORT || 5181)
const BASE = (env.CHEMQ_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
const KEY = env.CHEMQ_API_KEY || ''
const MODEL = env.CHEMQ_MODEL || 'deepseek-chat'

function json(res, code, body) {
  const s = JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(s),
    'Access-Control-Allow-Origin': '*',
  })
  res.end(s)
}

http
  .createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      })
      return res.end()
    }

    if (req.url === '/health' || req.url === '/api/health') {
      return json(res, 200, { ok: Boolean(KEY), model: MODEL, base: BASE })
    }

    if (req.method === 'POST' && (req.url === '/api/chat' || req.url === '/chat')) {
      if (!KEY) return json(res, 500, { error: '没有配置 CHEMQ_API_KEY（写进 .env.local）' })
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}')
          payload.model = payload.model || MODEL
          const r = await fetch(`${BASE}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
            body: JSON.stringify(payload),
          })
          const text = await r.text()
          res.writeHead(r.status, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(text)
        } catch (e) {
          json(res, 502, { error: String(e.message || e) })
        }
      })
      return
    }

    json(res, 404, { error: 'not found' })
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`[chem-daka] proxy 已启动 http://127.0.0.1:${PORT}`)
    console.log(`[chem-daka] 上游 ${BASE}  模型 ${MODEL}  Key ${KEY ? '已配置' : '未配置'}`)
  })
