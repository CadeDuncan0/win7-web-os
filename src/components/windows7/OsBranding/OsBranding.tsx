import Image from 'next/image'
import styles from './OsBranding.module.css'
import { assetPaths } from '@/lib/assetPaths'

interface OsBrandingProps {
  subtitle?: string
  className?: string
}

export function OsBranding({ subtitle = 'Web OS', className }: OsBrandingProps) {
  const merged = [styles.brand, className].filter(Boolean).join(' ')
  return (
    <div className={merged}>
      <Image
        src={assetPaths.branding.windowsLogoWebp}
        alt=""
        width={32}
        height={32}
        unoptimized
        className={styles.icon}
        priority
      />
      <span className={styles.text}>
        Windows<sup className={styles.sup}>®</sup> 7
      </span>
      <span className={styles.subtitle}>{subtitle}</span>
    </div>
  )
}
