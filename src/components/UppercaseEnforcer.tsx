'use client'

import { useEffect } from 'react'

export default function UppercaseEnforcer() {
  useEffect(() => {
    let isProcessing = false

    const handleInput = (e: Event) => {
      if (isProcessing) return
      const target = e.target as HTMLInputElement | HTMLTextAreaElement
      if (!target) return
      
      const isTextInput = 
        (target.tagName === 'INPUT' && 
        (target.type === 'text' || 
        target.type === 'search' || 
        target.type === 'textarea' || 
        !target.type)) ||
        target.tagName === 'TEXTAREA'

      if (isTextInput) {
        // Skip email, password, identifiers, and elements marked with data-keep-case
        const isEmailOrKeepCase =
          target.type === 'email' || 
          target.type === 'password' || 
          target.name === 'email' ||
          target.id === 'email' ||
          target.id === 'identifier' ||
          target.name === 'identifier' ||
          target.getAttribute('data-keep-case') === 'true' ||
          target.dataset?.keepCase === 'true' ||
          target.classList.contains('keep-case') ||
          target.value.includes('@')

        if (isEmailOrKeepCase) {
          // Si es un correo electrónico o contiene @, normalizar a minúsculas limpias
          if (
            (target.type === 'email' || target.name === 'email' || target.id === 'email' || target.value.includes('@')) &&
            /[A-Z]/.test(target.value)
          ) {
            const lower = target.value.toLowerCase()
            const start = target.selectionStart
            const end = target.selectionEnd
            target.value = lower
            if (start !== null && end !== null) {
              try { target.setSelectionRange(start, end) } catch (_) {}
            }
          }
          return
        }

        const start = target.selectionStart
        const end = target.selectionEnd
        const originalValue = target.value
        const uppercased = originalValue.toUpperCase()
        
        if (originalValue !== uppercased) {
          isProcessing = true
          try {
            const prototype = target.tagName === 'TEXTAREA' 
              ? HTMLTextAreaElement.prototype 
              : HTMLInputElement.prototype
            const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
            
            if (descriptor && descriptor.set) {
              descriptor.set.call(target, uppercased)
              target.dispatchEvent(new Event('input', { bubbles: true }))
            } else {
              target.value = uppercased
            }
            
            if (start !== null && end !== null) {
              target.setSelectionRange(start, end)
            }
          } finally {
            isProcessing = false
          }
        }
      }
    }

    document.addEventListener('input', handleInput, true)
    return () => {
      document.removeEventListener('input', handleInput, true)
    }
  }, [])

 return null
}
