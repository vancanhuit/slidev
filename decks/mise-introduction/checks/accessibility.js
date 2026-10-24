// Run against the production build with playwright-cli run-code --filename=<this file>.
async (page) => {
  const base = page.url().split('#')[0]
  const assert = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const report = []
  const browserErrors = []
  const onPageError = error => browserErrors.push(error.message)
  const onConsole = message => {
    if (message.type() === 'error') browserErrors.push(message.text())
  }
  page.on('pageerror', onPageError)
  page.on('console', onConsole)

  // Checks solid/alpha color pairs; gradients also need a visual check.
  const contrastFailures = () => {
    const rgba = color => color.match(/[\d.]+/g).map(Number)
    const over = (front, back) => {
      const alpha = front[3] ?? 1
      return front.slice(0, 3).map((channel, i) => channel * alpha + back[i] * (1 - alpha))
    }
    const luminance = rgb => rgb.map(channel => {
      const value = channel / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0)
    const failures = []
    for (const element of document.querySelectorAll('.slidev-layout *, .reading-nav a')) {
      const text = [...element.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent).join('').trim()
      if (!text || !element.getBoundingClientRect().width || element.closest('.slidev-code-dishonored')) continue
      const style = getComputedStyle(element)
      const backgrounds = []
      let opacity = 1
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const computed = getComputedStyle(ancestor)
        backgrounds.unshift(rgba(computed.backgroundColor))
        opacity *= Number(computed.opacity)
      }
      if (!opacity || style.visibility === 'hidden') continue
      const background = backgrounds.reduce((back, front) => over(front, back), [255, 255, 255])
      const foreground = rgba(style.color)
      foreground[3] = (foreground[3] ?? 1) * opacity
      const light = luminance(over(foreground, background))
      const dark = luminance(background)
      const ratio = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05)
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700)
      if (ratio < (large ? 3 : 4.5)) failures.push({ text, ratio: ratio.toFixed(2), color: style.color })
    }
    return failures
  }

  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.evaluate(() => localStorage.setItem('slidev-color-schema', 'auto'))
    await page.goto(`${base}#/read`)
    await page.reload()
    await page.waitForFunction(() => document.querySelectorAll('.slidev-layout').length === 31)
    await page.evaluate(() => document.fonts.ready)

    const contrast = await page.evaluate(contrastFailures)
    assert(!contrast.length, `${theme} contrast failures: ${JSON.stringify(contrast)}`)

    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      const reader = await page.evaluate(() => ({
        slides: document.querySelectorAll('.print-slide-container').length,
        width: document.querySelector('#print-container').getBoundingClientRect().width,
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...document.querySelectorAll('.slidev-layout, .feature, .trust-zone, .comparison-scroll, .reading-nav a')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).map(element => element.className),
        bodySize: parseFloat(getComputedStyle(document.querySelector('.feature p')).fontSize),
        codeSize: parseFloat(getComputedStyle(document.querySelector('pre code span')).fontSize),
        smallSize: Math.min(...[...document.querySelectorAll('.tree-flow span, .adoption-steps small, .takeaway-grid span')].map(element => parseFloat(getComputedStyle(element).fontSize))),
        linkHeight: document.querySelector('.link-card').getBoundingClientRect().height,
        backticks: [...document.querySelectorAll('.slidev-layout h2, .callout-value')].some(element => element.textContent.includes('`')),
        dimmedCode: document.querySelectorAll('.slidev-code-dishonored').length,
        collapsed: [...document.querySelectorAll('.print-slide-container')].some(element => element.getBoundingClientRect().height < element.querySelector('.slidev-layout').getBoundingClientRect().height),
        smallHeading: [...document.querySelectorAll('h1 .accent-text')].some(element => getComputedStyle(element).fontSize !== getComputedStyle(element.closest('h1')).fontSize),
        comparisons: document.querySelectorAll('.comparison-table').length,
        tableBodySize: parseFloat(getComputedStyle(document.querySelector('.comparison-table td')).fontSize),
        tableHeadingSize: parseFloat(getComputedStyle(document.querySelector('.comparison-table thead th')).fontSize),
        boxedFeatures: [...document.querySelectorAll('.feature')].some(element => getComputedStyle(element).boxShadow !== 'none' || getComputedStyle(element).backgroundColor !== 'rgba(0, 0, 0, 0)'),
        texturedSlides: [...document.querySelectorAll('.slidev-layout')].some(element => getComputedStyle(element).backgroundImage !== 'none'),
      }))
      assert(reader.slides === 31 && reader.width <= viewport.width, `Reader width/count: ${JSON.stringify(reader)}`)
      assert(!reader.overflow && !reader.clipped.length, `${theme} reader clipping at ${viewport.width}: ${JSON.stringify(reader)}`)
      assert(reader.bodySize >= 16 && reader.codeSize >= 16 && reader.smallSize >= 14, `Reader type too small: ${JSON.stringify(reader)}`)
      assert(reader.linkHeight >= 44 && !reader.backticks && !reader.dimmedCode, `Reader content/target regression: ${JSON.stringify(reader)}`)
      assert(!reader.collapsed, 'Reading content escaped its container')
      assert(!reader.smallHeading, 'Heading accents lost their type scale')
      assert(reader.comparisons === 2 && !reader.boxedFeatures, 'Content-led layouts regressed to generic cards')
      assert(reader.tableBodySize >= 16 && reader.tableHeadingSize >= 14, 'Comparison text is too small')
      assert(!reader.texturedSlides, 'Decorative backgrounds returned')
    }

    await page.getByRole('link', { name: 'Back to slides' }).click()
    await page.waitForSelector('#slide-container')
    for (let slide = 1; slide <= 31; slide++) {
      await page.goto(`${base}#/${slide}?clicks=99`)
      await page.waitForFunction(no => {
        const element = document.querySelector(`#slideshow > [data-slidev-no="${no}"]`)
        return element && getComputedStyle(element).display !== 'none'
      }, slide)
      const overflow = await page.locator(`#slideshow > [data-slidev-no="${slide}"] .slidev-layout`).evaluate(element => ({
        x: element.scrollWidth > element.clientWidth + 1,
        y: element.scrollHeight > element.clientHeight + 1,
      }))
      assert(!overflow.x && !overflow.y, `${theme} slide ${slide} overflows: ${JSON.stringify(overflow)}`)
      const typography = await page.locator(`#slideshow > [data-slidev-no="${slide}"] .slidev-layout`).evaluate(element => ({
        code: [...element.querySelectorAll('.slidev-code')].map(code => ({
          size: parseFloat(getComputedStyle(code).fontSize),
          clipped: code.scrollWidth > code.clientWidth + 1 || code.scrollHeight > code.clientHeight + 1,
        })),
        labels: [...element.querySelectorAll('small, .tree-flow strong, .tree-flow span, .backend-list span, .compat-grid span, .contract-row span, .freshness-grid span, .terminal-flow span, .security-flow span, .comparison-table thead th')].map(label => parseFloat(getComputedStyle(label).fontSize)),
        gutter: element.matches('.two-cols, .two-cols-header') ? parseFloat(getComputedStyle(element).columnGap) : null,
        font: getComputedStyle(element).fontFamily,
      }))
      assert(typography.code.every(code => code.size >= 14 && !code.clipped), `${theme} slide ${slide} code is too small or clipped: ${JSON.stringify(typography.code)}`)
      assert(typography.labels.every(size => size >= 14), `${theme} slide ${slide} teaching labels are too small`)
      assert(typography.gutter === null || typography.gutter >= 24, `${theme} slide ${slide} is missing its column gutter`)
      assert(typography.font.includes('Inter'), `Slide ${slide} lost the shared font`)
      const contrast = await page.evaluate(contrastFailures)
      assert(!contrast.length, `${theme} slide ${slide} contrast: ${JSON.stringify(contrast)}`)
    }

    for (let clicks = 0; clicks <= 3; clicks++) {
      await page.goto(`${base}#/14?clicks=${clicks}`)
      await page.waitForSelector('#slideshow > [data-slidev-no="14"] .slidev-code-highlighted')
      const activeContrast = await page.evaluate(contrastFailures)
      assert(!activeContrast.length, `${theme} syntax step ${clicks} contrast: ${JSON.stringify(activeContrast)}`)
    }

    await page.goto(`${base}#/3`)
    await page.keyboard.press('ArrowRight')
    await page.waitForSelector('#slideshow > [data-slidev-no="4"] .feature')
    const motion = await page.locator('#slideshow > .slidev-page').evaluateAll(elements => elements.some(element => {
      const style = getComputedStyle(element)
      return style.transitionDuration !== '0s' || style.translate !== 'none'
    }))
    assert(!motion, 'Reduced motion still allows slide travel')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('link', { name: 'Reading view' }).click()
    await page.waitForFunction(() => document.querySelectorAll('.slidev-layout').length === 31)
    const collapsed = await page.locator('.print-slide-container').evaluateAll(elements => elements.some(element => element.getBoundingClientRect().height < element.querySelector('.slidev-layout').getBoundingClientRect().height))
    assert(!collapsed, 'Entering the reader from slides collapses the content')
    const link = page.locator('.link-card')
    await page.keyboard.press('Tab')
    await link.focus()
    assert(await link.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle === 'solid'), 'Closing link has no keyboard focus indicator')
    const comparison = page.locator('.comparison-scroll').first()
    await comparison.focus()
    await page.keyboard.press('ArrowRight')
    await page.waitForFunction(() => document.querySelector('.comparison-scroll').scrollLeft > 0)
    assert(page.url().endsWith('#/read'), 'Comparison scrolling navigated away from the reader')
    report.push(`${theme}: 31 slides, four reader sizes, contrast, code/label size, gutters, stepped code, reduced motion passed`)
  }

  await page.goto(new URL('/', base).href)
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme })
    await page.waitForFunction(dark => document.documentElement.classList.contains('dark') === dark, theme === 'dark')
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const catalog = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        background: getComputedStyle(document.body).backgroundColor,
        accent: getComputedStyle(document.querySelector('a')).color,
        font: getComputedStyle(document.body).fontFamily,
        linkHeight: document.querySelector('a').getBoundingClientRect().height,
        deck: document.querySelector('a').getAttribute('href'),
      }))
      assert(!catalog.overflow && catalog.linkHeight >= 44, `Catalog layout/target: ${JSON.stringify(catalog)}`)
      assert(catalog.background === (theme === 'dark' ? 'rgb(24, 26, 25)' : 'rgb(250, 249, 246)'), `Catalog lost shared ${theme} surface`)
      assert(catalog.accent === (theme === 'dark' ? 'rgb(80, 227, 164)' : 'rgb(8, 122, 78)') && catalog.font.includes('Inter'), 'Catalog lost shared accent or font')
      assert(catalog.deck === '/mise-introduction/', 'Theme directories leaked into the public deck index')
    }
    await page.getByRole('link', { name: 'Mise Introduction' }).focus()
    assert(await page.locator('a').evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle === 'solid'), 'Catalog link lost keyboard focus')
  }
  report.push('Catalog: shared light/dark theme, narrow/wide layouts, keyboard focus passed')
  page.off('pageerror', onPageError)
  page.off('console', onConsole)
  assert(!browserErrors.length, `Browser errors: ${JSON.stringify(browserErrors)}`)
  return report
}
