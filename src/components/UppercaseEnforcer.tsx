'use client'

import { useEffect } from 'react'

export default function UppercaseEnforcer() {
  useEffect(() => {
    const handleInput = (e: Event) => {
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
        // Skip email, password, and elements marked with data-keep-case
        if (
          target.type === 'email' || 
          target.type === 'password' || 
          target.dataset.keepCase === 'true' ||
          target.classList.contains('keep-case')
        ) {
          return
        }

        const start = target.selectionStart
        const end = target.selectionEnd
        const originalValue = target.value
        const uppercased = originalValue.toUpperCase()
        
        if (originalValue !== uppercased) {
          target.value = uppercased
          
          if (start !== null && end !== null) {
            target.setSelectionRange(start, end)
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
