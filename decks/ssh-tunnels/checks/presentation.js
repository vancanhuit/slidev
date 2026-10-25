// Serve dist/, open /ssh-tunnels/ with playwright-cli, then run this file.
async (page) => {
  const base = page.url().split('#')[0]
  const errors = []
  const assert = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const onError = error => errors.push(error.message)
  const onConsole = message => {
    if (message.type() === 'error') errors.push(message.text())
  }
  page.on('pageerror', onError)
  page.on('console', onConsole)
  const diagrams = new Set()

  try {
    await page.setViewportSize({ width: 1440, height: 900 })
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.evaluate(() => localStorage.setItem('slidev-color-schema', 'auto'))
      await page.reload()
      for (let slide = 1; slide <= 40; slide++) {
        await page.goto(`${base}#/${slide}`)
        const layout = page.locator(`#slideshow > [data-slidev-no="${slide}"] .slidev-layout`)
        await layout.waitFor({ state: 'visible' })
        await page.evaluate(() => document.fonts.ready)
        await layout.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())))
        const check = await layout.evaluate(element => ({
          overflow: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1
            || [...element.querySelectorAll('p,li,pre,table,img,h1,h2')].some(child => child.getBoundingClientRect().bottom > element.getBoundingClientRect().bottom - 8),
          clippedCode: [...element.querySelectorAll('pre')].some(code => code.scrollWidth > code.clientWidth + 1),
          images: [...element.querySelectorAll('img')].map(image => ({ src: image.getAttribute('src'), ok: image.naturalWidth > 0 && Boolean(image.alt) })),
          codeSize: [...element.querySelectorAll('.slidev-code')].every(code => parseFloat(getComputedStyle(code).fontSize) >= 14),
        }))
        assert(!check.overflow && !check.clippedCode && check.codeSize, `${theme} slide ${slide}: clipping or small code`)
        for (const image of check.images) {
          assert(image.ok && image.src.startsWith('/ssh-tunnels/diagrams/'), `Missing, unlabelled, or incorrectly based image: ${image.src}`)
          diagrams.add(image.src)
        }
      }
    }
    assert(diagrams.size === 8, `Expected eight locally bundled diagrams, found ${diagrams.size}`)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${base}#/18`)
    await page.locator('#slideshow > [data-slidev-no="18"] .slidev-layout').waitFor({ state: 'visible' })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile viewport overflows horizontally')
    await page.goto(new URL('/', base).href)
    assert(await page.getByRole('link', { name: 'Ssh Tunnels' }).count() === 1, 'Catalog is missing the new deck')
    assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`)
    return '40 slides checked in light/dark, eight diagrams loaded, code fits, mobile canvas and catalog passed'
  } finally {
    page.off('pageerror', onError)
    page.off('console', onConsole)
  }
}
