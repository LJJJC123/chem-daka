/**
 * 本地静态服务器：模拟"部署到子目录"的情况，用来检查 base './' 是否正确。
 * 用法：node scripts/serve.mjs   → http://127.0.0.1:5199/chem/
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('dist')
const PREFIX = '/chem/'
const PORT = Number(process.env.PORT || 5199)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

http
  .createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0])
    if (!url.startsWith(PREFIX)) {
      res.writeHead(302, { Location: PREFIX })
      return res.end()
    }
    let rel = url.slice(PREFIX.length)
    if (!rel || rel.endsWith('/')) rel += 'index.html'
    const file = path.join(ROOT, rel)
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const index = path.join(ROOT, 'index.html')
      if (fs.existsSync(index)) {
        res.writeHead(200, { 'Content-Type': MIME['.html'] })
        return res.end(fs.readFileSync(index))
      }
      res.writeHead(404)
      return res.end('not found')
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  .listen(PORT, '127.0.0.1', () => console.log(`静态预览：http://127.0.0.1:${PORT}${PREFIX}`))
