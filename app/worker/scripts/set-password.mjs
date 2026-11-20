// Usage: npm run set-password
// Prompts for the admin password, writes ADMIN_PASSWORD_HASH (+ AUTH_SECRET if missing) to .dev.vars
// for local dev, and prints the hash so you can run `wrangler secret put ADMIN_PASSWORD_HASH` for production.
// The password itself is never stored.
import { createInterface } from 'node:readline/promises'
import { randomBytes, webcrypto } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const ITERATIONS = 100000 // Workers' WebCrypto PBKDF2 maximum
const hex = (b) => Buffer.from(b).toString('hex')

// Reads one line. In a real terminal the typed characters are NOT echoed.
async function ask(prompt) {
  if (!process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(prompt)
    rl.close()
    return answer
  }
  process.stdout.write(prompt)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  return new Promise((resolve) => {
    let typed = ''
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.off('data', onData)
          process.stdout.write('\n')
          return resolve(typed)
        }
        if (ch === '\u0003') process.exit(1) // Ctrl+C
        typed = ch === '\u007f' || ch === '\b' ? typed.slice(0, -1) : typed + ch
      }
    }
    process.stdin.on('data', onData)
  })
}

const password = await ask('New admin password (min 12 chars, typing is hidden): ')
if (password.length < 12) {
  console.error('Password must be at least 12 characters.')
  process.exit(1)
}

const salt = randomBytes(16)
const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
const hash = `pbkdf2:${ITERATIONS}:${hex(salt)}:${hex(new Uint8Array(bits))}`

const file = '.dev.vars'
const lines = existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean) : []
const kept = lines.filter((l) => !l.startsWith('ADMIN_PASSWORD_HASH='))
if (!kept.some((l) => l.startsWith('AUTH_SECRET='))) kept.push(`AUTH_SECRET=${hex(randomBytes(48))}`)
kept.push(`ADMIN_PASSWORD_HASH=${hash}`)
writeFileSync(file, kept.join('\n') + '\n')

console.log(`\nWrote ${file} (git-ignored).`)
console.log('For production, run these and paste when prompted:')
console.log('  npx wrangler secret put ADMIN_PASSWORD_HASH   # paste this hash:')
console.log(`  ${hash}`)
console.log('  npx wrangler secret put AUTH_SECRET           # paste any long random string')
