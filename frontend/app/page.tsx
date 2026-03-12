'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  )
}
