import { useState } from 'react'
import { 
  mockUsers, 
  generateOTP, 
  verifyOTP, 
  getUserByPhone, 
  getUserByEmail 
} from '../data/mockData'
import { PhoneIcon, MailIcon } from '../components/Icons'

const Login = ({ onLogin, onSwitchToSignUp }) => {
  const [loginMethod, setLoginMethod] = useState('phone') // 'phone' or 'email'
  const [step, setStep] = useState('input') // 'input', 'otp', 'verify'
  
  // Phone/OTP states
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sentOTP, setSentOTP] = useState(null)
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  // Email/Password states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)

  // Handle OTP send
  const handleSendOTP = () => {
    if (!phone) {
      setOtpError('Please enter a phone number')
      return
    }
    
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      const generatedOTP = generateOTP(phone)
      setSentOTP(generatedOTP)
      setStep('otp')
      setCountdown(300) // 5 minutes in seconds
      setIsLoading(false)
      
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 1000)
  }

  // Handle OTP verification
  const handleVerifyOTP = (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      const isValid = verifyOTP(phone, otp)
      if (isValid) {
        const user = getUserByPhone(phone) || {
          name: phone,
          phone,
          email: `${phone.replace(/\D/g, '')}@friendfinder.com`,
        }
        setIsLoading(false)
        onLogin(user)
      } else {
        setOtpError('Invalid OTP. Please try again.')
        setIsLoading(false)
      }
    }, 1000)
  }

  // Handle email/password login
  const handleEmailLogin = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    setTimeout(() => {
      const user = getUserByEmail(email) || {
        name: email.split('@')[0] || 'User',
        email,
        phone: '+1 000-000-0000',
      }
      setIsLoading(false)
      onLogin(user)
    }, 1000)
  }

  // Resend OTP
  const handleResendOTP = () => {
    if (countdown > 0) return
    handleSendOTP()
  }

  // Format phone number
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      if (numbers.length <= 3) return numbers
      if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`
    }
    return value
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      minHeight: 'calc(100vh - 80px)',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <span style={{ fontSize: '40px' }}>👋</span>
        </div>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          marginBottom: '8px',
          color: 'var(--text-primary)'
        }}>
          {step === 'otp' ? 'Enter OTP' : 'Welcome Back'}
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '16px' 
        }}>
          {step === 'otp' 
            ? `We sent a code to ${phone}` 
            : 'Sign in to continue to FriendFinder'}
        </p>
      </div>

      {/* Login Method Toggle */}
      {step === 'input' && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          background: 'rgba(99, 102, 241, 0.1)',
          padding: '4px',
          borderRadius: '12px'
        }}>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className="btn"
            style={{
              flex: 1,
              background: loginMethod === 'phone' 
                ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' 
                : 'transparent',
              color: loginMethod === 'phone' ? 'white' : 'var(--text-primary)',
              border: 'none',
              padding: '12px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PhoneIcon size={16} />
              Phone
            </span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className="btn"
            style={{
              flex: 1,
              background: loginMethod === 'email' 
                ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' 
                : 'transparent',
              color: loginMethod === 'email' ? 'white' : 'var(--text-primary)',
              border: 'none',
              padding: '12px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MailIcon size={16} />
              Email
            </span>
          </button>
        </div>
      )}

      {/* Phone/OTP Login */}
      {loginMethod === 'phone' && step === 'input' && (
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="phone"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className="input"
              placeholder="(234) 567-8901"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={handleSendOTP}
            className="btn btn-primary"
            style={{ 
              width: '100%',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            disabled={isLoading || !phone}
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      )}

      {/* OTP Verification */}
      {loginMethod === 'phone' && step === 'otp' && (
        <form onSubmit={handleVerifyOTP} style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="otp"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Enter 6-digit OTP
            </label>
            <input
              id="otp"
              type="text"
              className="input"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setOtp(value)
                setOtpError('')
              }}
              style={{ 
                width: '100%',
                textAlign: 'center',
                fontSize: '24px',
                letterSpacing: '8px',
                fontFamily: 'monospace'
              }}
              maxLength={6}
              required
            />
            {otpError && (
              <p style={{ 
                color: '#ef4444', 
                fontSize: '12px', 
                marginTop: '8px' 
              }}>
                {otpError}
              </p>
            )}
          </div>

          {sentOTP && (
            <div style={{ 
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Demo OTP (for testing):
              </p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary-color)', fontFamily: 'monospace' }}>
                {sentOTP}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ 
              width: '100%',
              marginBottom: '12px',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setStep('input')
                setOtp('')
                setOtpError('')
                setSentOTP(null)
              }}
              className="btn btn-secondary"
              style={{ flex: 1, marginRight: '8px', padding: '10px' }}
            >
              Change Number
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              className="btn btn-secondary"
              style={{ 
                flex: 1, 
                padding: '10px',
                opacity: countdown > 0 ? 0.5 : 1,
                cursor: countdown > 0 ? 'not-allowed' : 'pointer'
              }}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}

      {/* Email/Password Login */}
      {loginMethod === 'email' && step === 'input' && (
        <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ 
              width: '100%',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Switch to Sign Up */}
      {step === 'input' && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline',
              }}
            >
              Sign Up
            </button>
          </p>
        </div>
      )}

      {/* Demo Info */}
      <div style={{ 
        marginTop: '24px', 
        textAlign: 'center',
        padding: '20px',
        background: 'rgba(99, 102, 241, 0.05)',
        borderRadius: '12px'
      }}>
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Demo Mode
        </p>
        <p style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          opacity: 0.7,
          marginBottom: '4px'
        }}>
          {loginMethod === 'phone' 
            ? 'Use any phone number. OTP will be shown after sending.'
            : 'Use any email and password to login'}
        </p>
        {loginMethod === 'email' && (
          <button
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              marginTop: '12px',
              padding: '10px',
              fontSize: '14px'
            }}
            onClick={() => {
              setEmail('alex@friendfinder.com')
              setPassword('demo123')
            }}
          >
            Fill Demo Credentials
          </button>
        )}
        {loginMethod === 'phone' && step === 'input' && (
          <button
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              marginTop: '12px',
              padding: '10px',
              fontSize: '14px'
            }}
            onClick={() => setPhone('(234) 567-8901')}
          >
            Use Demo Phone Number
          </button>
        )}
      </div>

      {/* Mock Users List */}
      {step === 'input' && (
        <div style={{ 
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '12px'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            fontWeight: '600'
          }}>
            Mock Users (for testing):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mockUsers.slice(0, 3).map((user) => (
              <button
                key={user.id}
                className="btn btn-secondary"
                style={{ 
                  padding: '8px 12px',
                  fontSize: '12px',
                  textAlign: 'left'
                }}
                onClick={() => {
                  if (loginMethod === 'phone') {
                    setPhone(user.phone)
                  } else {
                    setEmail(user.email)
                    setPassword(user.password)
                  }
                }}
              >
                {loginMethod === 'phone' 
                  ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PhoneIcon size={12} />
                        {user.phone} - {user.name}
                      </span>
                    )
                  : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MailIcon size={12} />
                        {user.email} - {user.name}
                      </span>
                    )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
