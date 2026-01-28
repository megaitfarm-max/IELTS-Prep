import styles from './ProgressBar.module.css'

function ProgressBar({ value = 0, color = 'primary', showLabel = false, size = 'md' }) {
  const clampedValue = Math.min(Math.max(value, 0), 100)
  
  return (
    <div className={styles.container}>
      <div className={`${styles.track} ${styles[size]}`}>
        <div 
          className={`${styles.fill} ${styles[color]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(clampedValue)}%</span>
      )}
    </div>
  )
}

export default ProgressBar
