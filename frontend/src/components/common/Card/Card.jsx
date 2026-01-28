import styles from './Card.module.css'

export const Card = ({ 
  children, 
  hover = false,
  padding = 'md',
  className = '',
  onClick 
}) => {
  const cardClassName = [
    styles.card,
    styles[`padding-${padding}`],
    hover && styles.hover,
    onClick && styles.clickable,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClassName} onClick={onClick}>
      {children}
    </div>
  )
}

Card.Header = ({ children, className = '' }) => (
  <div className={`${styles.header} ${className}`}>{children}</div>
)

Card.Title = ({ children, className = '' }) => (
  <h3 className={`${styles.title} ${className}`}>{children}</h3>
)

Card.Body = ({ children, className = '' }) => (
  <div className={`${styles.body} ${className}`}>{children}</div>
)

Card.Footer = ({ children, className = '' }) => (
  <div className={`${styles.footer} ${className}`}>{children}</div>
)
