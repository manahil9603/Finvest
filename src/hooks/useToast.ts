'use client'

import { useCallback } from 'react'
import { useToastContext, ToastType } from '@/components/ui/Toast'

/**
 * Hook-based toast API.
 *
 * @example
 * const { success, error } = useToast()
 * success('Saved!', 'Your listing has been published.')
 */
export function useToast() {
  const { addToast } = useToastContext()

  const show = useCallback(
    (type: ToastType, title: string, message?: string, duration?: number) =>
      addToast({ type, title, message, duration }),
    [addToast]
  )

  return {
    success: (title: string, message?: string, duration?: number) => show('success', title, message, duration),
    error:   (title: string, message?: string, duration?: number) => show('error',   title, message, duration),
    warning: (title: string, message?: string, duration?: number) => show('warning', title, message, duration),
    info:    (title: string, message?: string, duration?: number) => show('info',    title, message, duration),
  }
}
