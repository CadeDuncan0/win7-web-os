import styles from './AccountTile.module.css'

interface AccountTileProps {
  label: string
  glyph: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}

export function AccountTile({ label, glyph, selected, disabled, onSelect }: AccountTileProps) {
  const classes =
    styles.tile + ' ' + (selected ? styles.selected : '') + ' ' + (disabled ? styles.disabled : '')
  return (
    <button className={classes} onClick={onSelect} disabled={disabled} aria-pressed={selected}>
      <span className={styles.glyph}>{glyph}</span>
      <span className={styles.label}>{label}</span>
    </button>
  )
}
