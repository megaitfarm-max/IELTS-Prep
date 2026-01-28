import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@components/common/Button'
import { apiRequest } from '@utils/api'
import styles from './ForgotPassword.module.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiRequest('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(true)
        if (data.user_id) {
          setUserId(data.user_id)
        }
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to send reset code')
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            ← Back to Home
          </button>
          
          <div className={styles.header}>
            <div className={styles.successIcon}>✅</div>
            <h1>Check Your Email</h1>
            <p>
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </p>
            <p className={styles.subText}>
              Enter the code on the next page to reset your password. The code will expire in 1 hour.
            </p>
          </div>

          <div className={styles.actions}>
            <Button 
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}${userId ? `&user_id=${userId}` : ''}`)} 
              variant="primary" 
              fullWidth
            >
              Enter Verification Code
            </Button>
            <button 
              onClick={() => setSuccess(false)} 
              className={styles.resendLink}
            >
              Didn't receive code? Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          ← Back to Home
        </button>
        
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>
            🎓 IELTS Prep
          </Link>
          <h1>Reset Password</h1>
          <p>Enter your email and we'll send you a verification code</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
          >
            Send Verification Code
          </Button>

          <div className={styles.backToLogin}>
            <Link to="/login">← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
