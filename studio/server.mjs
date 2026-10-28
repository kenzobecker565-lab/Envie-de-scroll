/**
 * Serveur du studio : sert les fichiers du dépôt et l'éditeur, plus une petite API.
 *
 *   node server.mjs            → http://localhost:5180/studio/editor/
 *
 * API :
 *   GET /api/episodes              liste des épisodes (studio/episodes/*.js)
 *   GET /api/audio?ep=<id>         bande son de l'épisode (WAV, générée à la demande)
 *   GET /api/mtime?ep=<id>         date de modification (rechargement automatique)
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
}

const epFile = (id) => path.join(here, 'episodes', `${id.replace(/[^\w-]/g, '')}.js`)

async function handleApi(url, res) {
  if (url.pathname === '/api/episodes') {
    const list = fs.readdirSync(path.join(here, 'episodes')).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).sort()
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(list))
    return true
  }
  if (url.pathname === '/api/mtime') {
    const f = epFile(url.searchParams.get('ep') ?? '')
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0))
    return true
  }
  if (url.pathname === '/api/audio') {
    const id = url.searchParams.get('ep') ?? ''
    const { renderEpisodeAudio } = await import(pathToFileURL(path.join(here, 'audio', 'score.mjs')).href + `?v=${Date.now()}`)
    const wav = await renderEpisodeAudio(id, { cache: true })
    res.writeHead(200, { 'content-type': 'audio/wav', 'cache-control': 'no-store' })
    fs.createReadStream(wav).pipe(res)
    return true
  }
  return false
}

export function serve(port = 0) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x')
      if (url.pathname.startsWith('/api/') && (await handleApi(url, res))) return
      let p = decodeURIComponent(url.pathname)
      if (p === '/' || p === '/studio' || p === '/studio/') p = '/studio/editor/index.html'
      if (p.endsWith('/')) p += 'index.html'
      const file = path.join(root, p)
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end('introuvable')
        return
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
      fs.createReadStream(file).pipe(res)
    } catch (e) {
      console.error(e)
      res.writeHead(500).end(String(e.stack ?? e))
    }
  })
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = Number(process.env.PORT ?? 5180)
  await serve(port)
  console.log(`Studio Minuton : http://localhost:${port}/studio/editor/`)
}
