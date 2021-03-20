import React from 'react'
import { usePrompt } from './hooks'

export interface PromptProps {
  message: string
  when?: boolean
}
/**
 * A declarative interface for showing a window.confirm dialog with the given
 * message when the user tries to navigate away from the current page.
 *
 * This also serves as a reference implementation for anyone who wants to
 * create their own custom prompt component.
 */
export default function Prompt({ message, when }: PromptProps) {
  usePrompt(message, when)
  return null
}
