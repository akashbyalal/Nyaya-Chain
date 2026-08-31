import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatConfidence(value: number): number {
  if (value > 0 && value <= 1) {
    return Math.round(value * 100)
  }
  return Math.round(value)
}