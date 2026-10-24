// Run against the production build with playwright-cli run-code --filename=<this file>.
async (page) => {
  const base = page.url().split('#')[0]
  const assert = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const report = []

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
        clipped: [...document.querySelectorAll('.slidev-layout, .feature-card, .reading-nav a')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).map(element => element.className),
        bodySize: parseFloat(getComputedStyle(document.querySelector('.feature-card p')).fontSize),
        codeSize: parseFloat(getComputedStyle(document.querySelector('pre code span')).fontSize),
        smallSize: Math.min(...[...document.querySelectorAll('.tree-flow span, .adoption-grid small, .takeaway-grid span')].map(element => parseFloat(getComputedStyle(element).fontSize))),
        linkHeight: document.querySelector('.link-card').getBoundingClientRect().height,
        backticks: [...document.querySelectorAll('.slidev-layout h2, .callout-value')].some(element => element.textContent.includes('`')),
        dimmedCode: document.querySelectorAll('.slidev-code-dishonored').length,
        collapsed: [...document.querySelectorAll('.print-slide-container')].some(element => element.getBoundingClientRect().height < element.querySelector('.slidev-layout').getBoundingClientRect().height),
        smallHeading: [...document.querySelectorAll('h1 .accent-text')].some(element => getComputedStyle(element).fontSize !== getComputedStyle(element.closest('h1')).fontSize),
      }))
      assert(reader.slides === 31 && reader.width <= viewport.width, `Reader width/count: ${JSON.stringify(reader)}`)
      assert(!reader.overflow && !reader.clipped.length, `${theme} reader clipping at ${viewport.width}: ${JSON.stringify(reader)}`)
      assert(reader.bodySize >= 16 && reader.codeSize >= 16 && reader.smallSize >= 14, `Reader type too small: ${JSON.stringify(reader)}`)
      assert(reader.linkHeight >= 44 && !reader.backticks && !reader.dimmedCode, `Reader content/target regression: ${JSON.stringify(reader)}`)
      assert(!reader.collapsed, 'Reading content escaped its container')
      assert(!reader.smallHeading, 'Heading accents lost their type scale')
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
    await page.waitForSelector('#slideshow > [data-slidev-no="4"] .feature-card')
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
    report.push(`${theme}: 31 slides, four reader sizes, contrast, stepped code, reduced motion passed`)
  }
  return report
}
