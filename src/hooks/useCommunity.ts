'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CommunityProfile, UnlinkLevel } from '@/types/community.types'

export function useCommunity(initialProfile?: CommunityProfile | null) {
  const [profile, setProfile] = useState<CommunityProfile | null>(initialProfile || null)
  const [loading, setLoading] = useState(!initialProfile)
  const [isPaused, setIsPaused] = useState(initialProfile ? !initialProfile.is_active : false)

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile)
      setIsPaused(!initialProfile.is_active)
      setLoading(false)
      return
    }

    // Cargar perfil guardado localmente o fallback
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('community_profile_active')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CommunityProfile
          setProfile(parsed)
          setIsPaused(!parsed.is_active)
        } catch (e) {
          // ignore
        }
      }
      setLoading(false)
    }
  }, [initialProfile])

  const updateProfileLocal = useCallback((updated: CommunityProfile) => {
    setProfile(updated)
    setIsPaused(!updated.is_active)
    if (typeof window !== 'undefined') {
      localStorage.setItem('community_profile_active', JSON.stringify(updated))
    }
  }, [])

  const handleUnlink = useCallback((level: UnlinkLevel) => {
    if (level === 'pause_profile') {
      setIsPaused(true)
      if (profile) {
        const updated = { ...profile, is_active: false }
        updateProfileLocal(updated)
      }
    } else if (level === 'resume_profile') {
      setIsPaused(false)
      if (profile) {
        const updated = { ...profile, is_active: true }
        updateProfileLocal(updated)
      }
    } else if (level === 'delete_community_presence') {
      setProfile(null)
      setIsPaused(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('community_profile_active')
      }
    }
  }, [profile, updateProfileLocal])

  return {
    profile,
    loading,
    isPaused,
    hasProfile: !!profile,
    updateProfileLocal,
    handleUnlink
  }
}
