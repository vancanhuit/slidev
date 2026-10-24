import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
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

mkdirSync(`${output}/assets`, { recursive: true })
for (const stylesheet of ['fonts.css', 'tokens.css', 'catalog.css']) {
  copyFileSync(`themes/forest/styles/${stylesheet}`, `${output}/assets/${stylesheet}`)
}

writeFileSync(`${output}/index.html`, `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Canh Dinh's slides</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="/assets/fonts.css">
<link rel="stylesheet" href="/assets/tokens.css">
<link rel="stylesheet" href="/assets/catalog.css">
<script>
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  const updateTheme = () => document.documentElement.classList.toggle('dark', scheme.matches)
  updateTheme()
  scheme.addEventListener('change', updateTheme)
</script>
<main>
<h1>Canh Dinh's slides</h1>
<ul>${links}</ul>
</main>
</html>
`)
