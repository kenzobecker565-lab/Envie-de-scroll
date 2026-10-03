/**
 * `npm run dev` : lance le serveur (API + bot) et la Mini App ensemble,
 * avec des logs préfixés. Ctrl+C arrête les deux.
 */

import { spawn } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const tasks = [
  { name: 'serveur', color: '\x1b[35m', args: ['run', 'dev', '-w', 'server'] },
  { name: 'app', color: '\x1b[36m', args: ['run', 'dev', '-w', 'app'] },
]

const children = tasks.map(({ name, color, args }) => {
  const child = spawn(npm, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' })
  const prefix = `${color}[${name}]\x1b[0m `
  const forward = (stream, output) => {
    let buffer = ''
    stream.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) output.write(prefix + line + '\n')
    })
  }
  forward(child.stdout, process.stdout)
  forward(child.stderr, process.stderr)
  child.on('exit', (code) => {
    process.stdout.write(`${prefix}arrêté (code ${code ?? 0})\n`)
    shutdown(code ?? 0)
  })
  return child
})

let stopping = false
function shutdown(code) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  setTimeout(() => process.exit(code), 500)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
