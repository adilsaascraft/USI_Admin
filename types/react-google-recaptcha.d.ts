declare module 'react-google-recaptcha' {
  import * as React from 'react'

  interface ReCAPTCHAProps {
    sitekey: string
    onChange?: (token: string | null) => void
    onExpired?: () => void
    theme?: 'light' | 'dark'
    size?: 'compact' | 'normal' | 'invisible'
    tabindex?: number
    badge?: 'bottomright' | 'bottomleft' | 'inline'
    hl?: string
    className?: string
  }

  class ReCAPTCHA extends React.Component<ReCAPTCHAProps> {
    reset(): void
    getValue(): string | null
    execute(): void
  }

  export default ReCAPTCHA
}
