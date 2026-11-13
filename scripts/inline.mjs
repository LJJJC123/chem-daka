/**
 * 把 dist-single 里的外链 JS/CSS 内联进 index.html，产出单文件版本。
 * 用法：node scripts/inline.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('dist-single')
const indexPath = path.join(dir, 'index.html')
if (!fs.existsSync(indexPath)) {
  console.error('找不到 dist-single/index.html，先跑 vite build --config vite.single.config.js')
  process.exit(1)
}

let html = fs.readFileSync(indexPath, 'utf8')

html = html.replace(/<script([^>]*?)src="([^"]+)"([^>]*)><\/script>/g, (m, pre, src, post) => {
  const file = path.join(dir, src.replace(/^\.\//, ''))
  if (!fs.existsSync(file)) return m
  const code = fs.readFileSync(file, 'utf8').replace(/<\/script>/g, '<\\/script>')
  const type = /type="module"/.test(m) ? ' type="module"' : ''
  return `<script${type}>${code}</script>`
})

html = html.replace(/<link([^>]*?)rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*?)>/g, (m, pre, mid, href, post) => {
  const file = path.join(dir, href.replace(/^\.\//, ''))
  if (!fs.existsSync(file)) return m
  return `<style>${fs.readFileSync(file, 'utf8')}</style>`
})

html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '')

fs.writeFileSync(indexPath, html)
const kb = (fs.statSync(indexPath).size / 1024).toFixed(0)
console.log(`单文件已生成：dist-single/index.html（${kb} KB）`)
