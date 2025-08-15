import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@stores/ui'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const uiStore = useUIStore()

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'd',
      ctrl: true,
      meta: true,
      action: () => router.push('/dashboard'),
      description: 'Go to Dashboard'
    },
    {
      key: 'p',
      ctrl: true,
      meta: true,
      action: () => router.push('/portfolios'),
      description: 'Go to Portfolios'
    },
    {
      key: 'a',
      ctrl: true,
      meta: true,
      action: () => router.push('/analytics'),
      description: 'Go to Analytics'
    },
    {
      key: 't',
      ctrl: true,
      meta: true,
      action: () => router.push('/transactions'),
      description: 'Go to Transactions'
    },
    
    // UI shortcuts
    {
      key: 'k',
      ctrl: true,
      meta: true,
      action: () => uiStore.showInfo('Search', 'Global search coming soon!'),
      description: 'Global Search',
      preventDefault: true
    },
    {
      key: ',',
      ctrl: true,
      meta: true,
      action: () => uiStore.showSettings(),
      description: 'Open Settings',
      preventDefault: true
    },
    {
      key: 'b',
      ctrl: true,
      meta: true,
      action: () => uiStore.toggleSidebar(),
      description: 'Toggle Sidebar'
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('[data-search]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus Search'
    },
    
    // Theme shortcuts
    {
      key: 'l',
      ctrl: true,
      meta: true,
      shift: true,
      action: () => uiStore.setTheme('light'),
      description: 'Switch to Light Theme'
    },
    {
      key: 'd',
      ctrl: true,
      meta: true,
      shift: true,
      action: () => uiStore.setTheme('dark'),
      description: 'Switch to Dark Theme'
    },
    
    // Modal shortcuts
    {
      key: 'Escape',
      action: () => {
        if (uiStore.confirmationModal.show) {
          uiStore.hideConfirmation()
        } else if (uiStore.settingsModal.show) {
          uiStore.hideSettings()
        }
      },
      description: 'Close Modal'
    },
    
    // Quick actions
    {
      key: 'n',
      ctrl: true,
      meta: true,
      action: () => router.push('/portfolios/create'),
      description: 'Create New Portfolio'
    }
  ]

  const handleKeydown = (event: KeyboardEvent): void => {
    // Skip if user is typing in an input field
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Only allow escape key to work in input fields
      if (event.key !== 'Escape') {
        return
      }
    }

    for (const shortcut of shortcuts) {
      if (isShortcutMatch(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        
        shortcut.action()
        break
      }
    }
  }

  const isShortcutMatch = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
    // Check key match (case insensitive)
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
    
    // Check modifiers
    const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
    const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
    const altMatch = shortcut.alt ? event.altKey : !event.altKey
    
    // For cross-platform compatibility, treat ctrl and meta as equivalent
    const modifierMatch = shortcut.ctrl || shortcut.meta
      ? (event.ctrlKey || event.metaKey) && shiftMatch && altMatch
      : ctrlMatch && metaMatch && shiftMatch && altMatch
    
    return keyMatch && modifierMatch
  }

  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = []
    
    // Use platform-appropriate modifier keys
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    
    if (shortcut.ctrl || shortcut.meta) {
      parts.push(isMac ? '⌘' : 'Ctrl')
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift')
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt')
    }
    
    parts.push(shortcut.key.toUpperCase())
    
    return parts.join(isMac ? '' : ' + ')
  }

  const showShortcutsHelp = (): void => {
    const helpContent = shortcuts
      .map(shortcut => `${getShortcutDisplay(shortcut)}: ${shortcut.description}`)
      .join('\n')
    
    uiStore.showInfo(
      'Keyboard Shortcuts',
      `Available shortcuts:\n\n${helpContent}`
    )
  }

  // Add help shortcut
  shortcuts.push({
    key: '?',
    shift: true,
    action: showShortcutsHelp,
    description: 'Show Keyboard Shortcuts Help'
  })

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    shortcuts,
    getShortcutDisplay,
    showShortcutsHelp
  }
}