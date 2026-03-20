'use client'
import { useEffect, useState } from 'react'

export function useIsDemo(): boolean {
  const [isDemo, setIsDemo] = useState(false)
  useEffect(() => {
    setIsDemo(document.cookie.includes('demo_mode=true'))
  }, [])
  return isDemo
}

export function exitDemo() {
  document.cookie = 'demo_mode=; path=/; max-age=0'
  window.location.href = '/login'
}
