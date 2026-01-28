import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@components/common/Button'
import toast from 'react-hot-toast'
import styles from './Register.module.css'

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    targetScore: '7',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false
  })
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength({
        minLength: formData.password.length >= 8,
        hasUpper: /[A-Z]/.test(formData.password),
        hasLower: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
      })
    } else {
      setPasswordStrength({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false
      })
    }
  }, [formData.password])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      // Check all password requirements
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
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        target_band_score: parseInt(formData.targetScore),
      })
      
      if (result.success) {
        toast.success('Account created successfully!')
        navigate('/dashboard')
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
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
          <h1>Create Your Account</h1>
          <p>Start your journey to IELTS success</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className={errors.fullName ? styles.inputError : ''}
            />
            {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordInput}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={errors.password ? styles.inputError : ''}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span className={styles.error}>{errors.password}</span>}
            
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
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.confirmPassword ? styles.inputError : ''}
            />
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="targetScore">Target IELTS Band Score</label>
            <select
              id="targetScore"
              name="targetScore"
              value={formData.targetScore}
              onChange={handleChange}
            >
              <option value="5">5.0</option>
              <option value="5.5">5.5</option>
              <option value="6">6.0</option>
              <option value="6.5">6.5</option>
              <option value="7">7.0</option>
              <option value="7.5">7.5</option>
              <option value="8">8.0</option>
              <option value="8.5">8.5</option>
              <option value="9">9.0</option>
            </select>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
          >
            Create Account
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
