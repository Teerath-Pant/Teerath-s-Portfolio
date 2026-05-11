const { spawn } = require('child_process')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const useShell = process.platform === 'win32'

const servers = [
  { name: 'portfolio', command: 'npm --prefix app/web run dev', args: ['--prefix', 'app/web', 'run', 'dev'] },
  { name: 'admin', command: 'npm --prefix app/admin run dev', args: ['--prefix', 'app/admin', 'run', 'dev'] },
  { name: 'server', command: 'npm --prefix app/server run dev', args: ['--prefix', 'app/server', 'run', 'dev'] },
]

let shuttingDown = false

const children = servers.map(({ name, command, args }) => {
  const child = spawn(useShell ? command : 'npm', useShell ? [] : args, {
    cwd: rootDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: useShell,
  })

  child.stdout.on('data', data => process.stdout.write(`[${name}] ${data}`))
  child.stderr.on('data', data => process.stderr.write(`[${name}] ${data}`))
  child.on('exit', code => {
    if (code && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`)
      shutdown(code)
    }
  })

  return child
})

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 200)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
