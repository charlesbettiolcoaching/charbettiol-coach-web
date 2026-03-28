'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MealPlansRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/nutrition') }, [router])
  return null
}
