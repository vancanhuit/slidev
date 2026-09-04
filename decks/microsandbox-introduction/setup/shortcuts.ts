import { defineShortcutsSetup } from '@slidev/types'

export default defineShortcutsSetup((nav, shortcuts) =>
  shortcuts.map(shortcut => {
    if (shortcut.name === 'next_down')
      return { ...shortcut, fn: nav.next }
    if (shortcut.name === 'prev_up')
      return { ...shortcut, fn: nav.prev }
    return shortcut
  }),
)
