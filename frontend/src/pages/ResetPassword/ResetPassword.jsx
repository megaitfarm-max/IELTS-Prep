import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@components/common/Button'
import { apiRequest } from '@utils/api'
import styles from './ResetPassword.module.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const userId = searchParams.get('user_id')
  
  const [formData, setFormData] = useState({
    code: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [useCode, setUseCode] = useState(!token) // Use code by default unless token is present
  
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  })

  useEffect(() => {
    if (!token && !email) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token, email])

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength({
        minLength: formData.password.length >= 8,
        hasUpper: /[A-Z]/.test(formData.password),
        hasLower: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
      })
    }
  }, [formData.password])

  const validateForm = () => {
    const newErrors = {}

    if (useCode && !formData.code) {
      newErrors.code = 'Verification code is required'
    } else if (useCode && !/^\d{6}$/.test(formData.code)) {
      newErrors.code = 'Please enter a valid 6-digit code'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const unmetRequirements = []
      if (formData.password.length < 8) unmetRequirements.push('at least 8 characters')
      if (!/[A-Z]/.test(formData.password)) unmetRequirements.push('one uppercase letter')
      if (!/[a-z]/.test(formData.password)) unmetRequirements.push('one lowercase letter')
      if (!/[0-9]/.test(formData.password)) unmetRequirements.push('one number')
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) unmetRequirements.push('one special character')
      
      if (unmetRequirements.length > 0) {
        newErrors.password = `Password must contain ${unmetRequirements.join(', ')}`
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    if (useCode && !userId) {
      setError('Invalid reset session. Please request a new password reset.')
      return
    }

    if (!useCode && !token) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        new_password: formData.password
      }
      
      if (useCode) {
        payload.code = formData.code
      } else {
        payload.token = token
      }

      const response = await apiRequest('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        const data = await response.json()
        if (data.detail?.includes('expired') || data.detail?.includes('invalid') || data.detail?.includes('Invalid')) {
          setError('Verification code has expired or is invalid. Please request a new one.')
        } else {
          setError(data.detail || 'Failed to reset password')
        }
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.successIcon}>✅</div>
            <h1>Password Reset Successful!</h1>
            <p>
              Your password has been successfully reset.
            </p>
            <p className={styles.subText}>
              Redirecting you to login page in 3 seconds...
            </p>
          </div>

          <Button onClick={() => navigate('/login')} variant="primary" fullWidth>
            Go to Login
          </Button>
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
          <h1>Set New Password</h1>
          {email && <p className={styles.emailDisplay}>for {email}</p>}
          <p>Enter the verification code sent to your email</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {!token && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  pattern="\d{6}"
                  required={useCode}
                  className={styles.codeInput}
                  autoComplete="off"
                />
                {validationErrors.code && (
                  <span className={styles.errorText}>{validationErrors.code}</span>
                )}
                <p className={styles.helpText}>Check your email for the 6-digit code</p>
              </div>
            </>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="password">New Password</label>
            <div className={styles.passwordInput}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.password && (
              <span className={styles.errorText}>{validationErrors.password}</span>
            )}
            
            {formData.password && (
              <div className={styles.passwordRequirements}>
                <p className={styles.requirementsTitle}>Password must contain:</p>
                <div className={styles.requirement}>
                  <span className={passwordStrength.minLength ? styles.valid : styles.invalid}>
                    {passwordStrength.minLength ? '✓' : '○'}
                  </span>
                  <span>At least 8 characters</span>
                </div>
                <div className={styles.requirement}>
                  <span className={passwordStrength.hasUpper ? styles.valid : styles.invalid}>
                    {passwordStrength.hasUpper ? '✓' : '○'}
                  </span>
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className={styles.requirement}>
                  <span className={passwordStrength.hasLower ? styles.valid : styles.invalid}>
                    {passwordStrength.hasLower ? '✓' : '○'}
                  </span>
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className={styles.requirement}>
                  <span className={passwordStrength.hasNumber ? styles.valid : styles.invalid}>
                    {passwordStrength.hasNumber ? '✓' : '○'}
                  </span>
                  <span>One number (0-9)</span>
                </div>
                <div className={styles.requirement}>
                  <span className={passwordStrength.hasSpecial ? styles.valid : styles.invalid}>
                    {passwordStrength.hasSpecial ? '✓' : '○'}
                  </span>
                  <span>One special character (!@#$%^&*)</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className={styles.passwordInput}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.passwordToggle}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <span className={styles.errorText}>{validationErrors.confirmPassword}</span>
            )}
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
            disabled={(!token && !email)}
          >
            Reset Password
          </Button>

          <div className={styles.backToLogin}>
            <Link to="/login">← Back to Login</Link>
            {' | '}
            <Link to="/forgot-password">Request New Code</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
