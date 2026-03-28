'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WorkoutProgramsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/programs') }, [router])
  return null
}
