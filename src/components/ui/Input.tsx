'use client'

import {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
  useId,
} from 'react'
import { cn } from '@/lib/utils'

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:      string
  error?:      string
  hint?:       string
  leftIcon?:   ReactNode
  rightIcon?:  ReactNode
  fullWidth?:  boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, fullWidth = true, className, id: propId, ...props },
  ref
) {
  const autoId = useId()
  const id = propId ?? autoId

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-fg-3 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'input',
            !!leftIcon  && 'pl-10',
            !!rightIcon && 'pr-10',
            error && 'input-error',
            !fullWidth && 'w-auto',
            className
          )}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-fg-3 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400 flex items-center gap-1" role="alert">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-fg-3">
          {hint}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:     string
  error?:     string
  hint?:      string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, fullWidth = true, className, id: propId, ...props },
  ref
) {
  const autoId = useId()
  const id = propId ?? autoId

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'input resize-none min-h-[100px]',
          error && 'input-error',
          className
        )}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-fg-3">{hint}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:     string
  error?:     string
  hint?:      string
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, fullWidth = true, className, id: propId, children, ...props },
  ref
) {
  const autoId = useId()
  const id = propId ?? autoId

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            'input appearance-none pr-9 cursor-pointer',
            error && 'input-error',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {/* Chevron icon */}
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-fg-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </div>
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
      {hint && !error && <p className="text-xs text-fg-3">{hint}</p>}
    </div>
  )
})

Select.displayName = 'Select'
