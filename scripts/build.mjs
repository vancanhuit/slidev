import { execFileSync } from 'node:child_process'
import { readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const decks = readdirSync('.').filter((file) => file.endsWith('.md') && file !== 'README.md').sort()

if (!decks.length) throw new Error('No slide decks found')

rmSync('dist', { recursive: true, force: true })

for (const deck of decks) {
  const slug = basename(deck, '.md')
  execFileSync(resolve('node_modules/.bin/slidev'), [
    'build',
    deck,
    '--base', `/${slug}/`,
    '--out', `dist/${slug}`,
    '--router-mode', 'hash',
    '--without-notes',
  ], { stdio: 'inherit' })
}

const links = decks.map((deck) => {
  const slug = basename(deck, '.md')
  return `<li><a href="/${slug}/">${slug.replaceAll('-', ' ')}</a></li>`
}).join('')

writeFileSync('dist/index.html', `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Canh Dinh's slides</title>
<style>body{max-width:48rem;margin:10vh auto;padding:2rem;background:#f7f5f0;color:#172033;font:1rem/1.6 system-ui}h1{font-size:2.5rem}a{color:#d83b18;text-transform:capitalize}</style>
<h1>Canh Dinh's slides</h1>
<ul>${links}</ul>
</html>
`)
