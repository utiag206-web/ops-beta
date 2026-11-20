import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  helpText?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  required = false,
  helpText,
  children,
  className = ''
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 min-w-0 w-full ${className}`}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
        {label} {required && <span className="text-rose-500 font-bold">*</span>}
      </label>
      <div className="relative w-full min-w-0 flex items-center">
        {children}
      </div>
      {helpText && (
        <p className="text-[11px] text-slate-400 font-medium leading-tight mt-1">
          {helpText}
        </p>
      )}
    </div>
  )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber'
}

export function FormInput({
  accentColor = 'indigo',
  className = '',
  ...props
}: FormInputProps) {
  const focusBorderColor = {
    blue: 'focus:border-blue-600',
    indigo: 'focus:border-indigo-600',
    emerald: 'focus:border-emerald-600',
    amber: 'focus:border-amber-500'
  }[accentColor]

  return (
    <input
      {...props}
      className={`h-11 w-full bg-slate-50/80 border-2 border-slate-100 rounded-xl px-3.5 text-sm font-semibold text-slate-800 focus:bg-white ${focusBorderColor} transition-all outline-none leading-none flex items-center min-w-0 ${className}`}
    />
  )
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber'
}

export function FormSelect({
  accentColor = 'indigo',
  className = '',
  children,
  ...props
}: FormSelectProps) {
  const focusBorderColor = {
    blue: 'focus:border-blue-600',
    indigo: 'focus:border-indigo-600',
    emerald: 'focus:border-emerald-600',
    amber: 'focus:border-amber-500'
  }[accentColor]

  return (
    <select
      {...props}
      className={`h-11 w-full max-w-full min-w-0 bg-slate-50/80 border-2 border-slate-100 rounded-xl px-3.5 text-sm font-semibold text-slate-800 focus:bg-white ${focusBorderColor} transition-all outline-none truncate cursor-pointer leading-none flex items-center ${className}`}
    >
      {children}
    </select>
  )
}

interface FormToggleCardProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: React.ReactNode
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber'
  className?: string
}

export function FormToggleCard({
  label,
  description,
  checked,
  onChange,
  icon,
  accentColor = 'indigo',
  className = ''
}: FormToggleCardProps) {
  const accentClass = {
    blue: 'accent-blue-600 hover:border-blue-200',
    indigo: 'accent-indigo-600 hover:border-indigo-200',
    emerald: 'accent-emerald-600 hover:border-emerald-200',
    amber: 'accent-amber-500 hover:border-amber-200'
  }[accentColor]

  return (
    <label
      className={`flex items-start gap-3.5 p-3.5 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-100/80 cursor-pointer transition-all ${accentClass} ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`mt-0.5 w-4 h-4 rounded ${accentClass} shrink-0 cursor-pointer`}
      />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
          {icon && <span className="shrink-0">{icon}</span>}
          {label}
        </span>
        {description && (
          <p className="text-[11px] text-slate-400 font-medium leading-normal mt-0.5">
            {description}
          </p>
        )}
      </div>
    </label>
  )
}

interface FormSectionHeaderProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber'
  className?: string
}

export function FormSectionHeader({
  icon,
  title,
  description,
  action,
  accentColor = 'indigo',
  className = ''
}: FormSectionHeaderProps) {
  const iconColorClass = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-500'
  }[accentColor]

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 ${className}`}>
      <div className="space-y-0.5">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          {icon && <span className={iconColorClass}>{icon}</span>}
          {title}
        </h4>
        {description && (
          <p className="text-xs text-slate-400 font-medium">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
