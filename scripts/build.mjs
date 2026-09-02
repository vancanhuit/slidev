import { execFileSync } from 'node:child_process'
import { readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const decks = readdirSync('decks', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

if (!decks.length) throw new Error('No slide decks found')

const output = resolve('dist')

rmSync(output, { recursive: true, force: true })

for (const slug of decks) {
  execFileSync(resolve('node_modules/.bin/slidev'), [
    'build',
    `decks/${slug}/slides.md`,
    '--base', `/${slug}/`,
    '--out', `${output}/${slug}`,
    '--router-mode', 'hash',
    '--without-notes',
  ], { stdio: 'inherit' })
}

const links = decks.map((slug) => {
  return `<li><a href="/${slug}/">${slug.replaceAll('-', ' ')}</a></li>`
}).join('')

writeFileSync(`${output}/index.html`, `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Canh Dinh's slides</title>
<style>body{max-width:48rem;margin:10vh auto;padding:2rem;background:#f7f5f0;color:#172033;font:1rem/1.6 system-ui}h1{font-size:2.5rem}a{color:#d83b18;text-transform:capitalize}</style>
<h1>Canh Dinh's slides</h1>
<ul>${links}</ul>
</html>
`)
