import Image from 'next/image'

/* OsBranding — .login__brand lockup from
   public/copycats/accountselection/Win7 Simu _ A simulator of Windows 7.htm
   Renders the bottom-center group: small flag icon, "Windows® 7"
   wordmark, and an italic thin-weight subtitle. All chrome (positioning,
   text-shadow, icon drop-shadow) lives in globals.css under
   .login__brand* so the look stays in lock-step across login screens. */
interface OsBrandingProps {
  subtitle?: string
  className?: string
}

export function OsBranding({ subtitle = 'Portfolio', className }: OsBrandingProps) {
  const merged = ['login__brand', className].filter(Boolean).join(' ')
  return (
    <div className={merged}>
      <Image
        src="/imgs/login/windows-logo.webp"
        alt=""
        width={32}
        height={32}
        unoptimized
        className="login__brand-icon"
        priority
      />
      <span className="login__brand-text">
        Windows<sup className="login__brand-sup">®</sup> 7
      </span>
      <span className="login__brand-subtitle">{subtitle}</span>
    </div>
  )
}
