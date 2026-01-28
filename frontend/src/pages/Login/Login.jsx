import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@components/common/Button'
import styles from './Login.module.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setSuccess(false)
    setLoading(true)
    
    try {
      const result = await login({ email, password })
      
      if (result.success) {
        setSuccess(true)
        setLoading(false)
        // Navigation is handled by AuthContext after 1 second
      } else {
        // Better error messages
        const errorMsg = result.error || 'Login failed'
        
        if (errorMsg.toLowerCase().includes('incorrect') || errorMsg.toLowerCase().includes('invalid') || errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          setError('❌ Invalid email or password. Please check your credentials and try again.')
        } else if (errorMsg.toLowerCase().includes('not found')) {
          setError('❌ No account found with this email address. Please register first.')
        } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch') || errorMsg.toLowerCase().includes('failed to fetch')) {
          setError('❌ Unable to connect to server. Please check your internet connection.')
        } else if (errorMsg.toLowerCase().includes('disabled') || errorMsg.toLowerCase().includes('deactivated') || errorMsg.toLowerCase().includes('inactive')) {
          setError('❌ This account has been deactivated. Please contact support.')
        } else {
          setError(`❌ ${errorMsg}`)
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('❌ An unexpected error occurred. Please try again.')
      setLoading(false)
    }
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
          <h1>Welcome Back</h1>
          <p>Continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {success && (
            <div className={styles.successBox}>
              <span className={styles.successIcon}>✅</span>
              <span>Login successful! Redirecting to dashboard...</span>
            </div>
          )}
          
          {error && (
            <div className={styles.errorBox}>
              <span>{error}</span>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
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

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordInput}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
          >
            Login
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Don't have an account?{' '}
            <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
