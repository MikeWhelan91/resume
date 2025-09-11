import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Account() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page - account page is disabled for now
    router.push('/')
  }, [router])

  return null
}