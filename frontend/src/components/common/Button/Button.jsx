import styles from './Button.module.css'

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner}></span>
      ) : (
        children
      )}
    </button>
  )
}
