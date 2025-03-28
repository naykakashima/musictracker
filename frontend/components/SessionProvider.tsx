'use client'

import { useSession } from '@/lib/auth/useSession'
import { ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'
export function SessionProvider({ 
  children,
  required = true 
}: {
  children: ReactNode
  required?: boolean
}) {
  const { session, loading } = useSession(required)
  
  if (loading) return <Spinner />
  if (!session && required) return null // Handled by hook redirect
  
  return <>{children}</>
}