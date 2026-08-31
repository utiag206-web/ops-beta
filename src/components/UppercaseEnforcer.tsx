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
