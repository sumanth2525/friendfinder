import { useState } from 'react'
import { 
  generateOTP, 
  verifyOTP, 
  emailExists,
  createUser,
  getAllMockUsers
} from '../data/mockData'
import { 
  validatePhone, 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateAge, 
  validateLocation,
  formatPhone 
} from '../utils/validation'
import { savePreferences } from '../utils/localStorage'
import { PhoneIcon, MailIcon } from '../components/Icons'

const SignUp = ({ onSignUp, onSwitchToLogin }) => {
  const [loginMethod, setLoginMethod] = useState('phone') // 'phone' or 'email'
  const [step, setStep] = useState('verify') // 'verify' | 'basic' | 'bio' | 'interests' | 'lookingFor' | 'details' | 'complete'
  
  // Phone/OTP states
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sentOTP, setSentOTP] = useState(null)
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  // Email/Password states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  
  // User info states - Basic
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [location, setLocation] = useState('')
  const [nameError, setNameError] = useState('')
  const [ageError, setAgeError] = useState('')
  const [locationError, setLocationError] = useState('')
  
  // Bio & Photo states
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  
  // Interests states
  const [selectedInterests, setSelectedInterests] = useState([])
  const availableInterests = ['Travel', 'Photography', 'Music', 'Sports', 'Reading', 'Cooking', 'Yoga', 'Gaming', 'Art', 'Movies', 'Coffee', 'Fitness', 'Dancing', 'Hiking', 'Writing', 'Anime', 'Books', 'English', 'Physical Touch']
  
  // Looking For states
  const [lookingFor, setLookingFor] = useState('')
  const lookingForOptions = ['Relationship', 'Friends & Dating', 'Casual', 'Not Sure Yet']
  
  // Additional Details states
  const [job, setJob] = useState('')
  const [education, setEducation] = useState('')
  const [height, setHeight] = useState('')
  const [drinking, setDrinking] = useState('')
  const [smoking, setSmoking] = useState('')
  const [exercise, setExercise] = useState('')
  const [pets, setPets] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Progress calculation
  const getProgress = () => {
    const steps = ['verify', 'basic', 'bio', 'interests', 'lookingFor', 'details']
    const currentStepIndex = steps.indexOf(step)
    if (currentStepIndex === -1) return 0 // Handle invalid step
    return ((currentStepIndex + 1) / steps.length) * 100
  }
  
  // Get current step number (1-5) for display
  const getCurrentStepNumber = () => {
    if (step === 'basic') return 1
    if (step === 'bio') return 2
    if (step === 'interests') return 3
    if (step === 'lookingFor') return 4
    if (step === 'details') return 5
    return 1 // Default for verify step
  }
  
  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      setPhoto(file)
      setError('')
      const reader = new FileReader()
      reader.onerror = () => {
        setError('Failed to read image file')
      }
      reader.onloadend = () => {
        if (reader.result) {
          setPhotoPreview(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Toggle interest selection
  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  // Handle OTP send for sign-up
  const handleSendOTP = () => {
    setError('')
    setOtpError('')
    
    if (!phone) {
      setOtpError('Please enter a phone number')
      return
    }
    
    if (!validatePhone(phone)) {
      setOtpError('Please enter a valid 10-digit phone number')
      return
    }
    
    // Check if phone already exists (normalize phone for comparison)
    const normalizedPhone = phone.replace(/\D/g, '')
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      setOtpError('Please enter a valid 10-digit phone number')
      return
    }
    const mockUsers = getAllMockUsers()
    const existingUser = mockUsers.find(user => {
      if (!user.phone) return false
      const userPhone = user.phone.replace(/\D/g, '')
      return userPhone === normalizedPhone
    })
    if (existingUser) {
      setOtpError('This phone number is already registered. Please sign in instead.')
      return
    }
    
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      const generatedOTP = generateOTP(phone)
      setSentOTP(generatedOTP)
      setStep('verify')
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
    setOtpError('')
    
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      const isValid = verifyOTP(phone, otp)
      if (isValid) {
        setIsLoading(false)
        setStep('basic') // Move to basic info collection step
      } else {
        setOtpError('Invalid OTP. Please try again.')
        setIsLoading(false)
      }
    }, 1000)
  }

  // Handle email/password sign-up
  const handleEmailSignUp = (e) => {
    e.preventDefault()
    setError('')
    setPasswordError('')
    setConfirmPasswordError('')
    
    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    // Check if email exists
    if (emailExists(email)) {
      setError('This email is already registered. Please sign in instead.')
      return
    }
    
    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message)
      return
    }
    
    // Check password confirmation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep('basic') // Move to basic info collection step
    }, 1000)
  }

  // Handle basic info submission
  const handleSubmitBasic = (e) => {
    e.preventDefault()
    setError('')
    setNameError('')
    setAgeError('')
    setLocationError('')
    
    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      setNameError(nameValidation.message)
      return
    }
    
    // Validate age
    const ageValidation = validateAge(age)
    if (!ageValidation.valid) {
      setAgeError(ageValidation.message)
      return
    }
    
    // Validate location
    const locationValidation = validateLocation(location)
    if (!locationValidation.valid) {
      setLocationError(locationValidation.message)
      return
    }
    
    // Move to next step
    setStep('bio')
  }
  
  // Handle bio step
  const handleSubmitBio = (e) => {
    e.preventDefault()
    if (bio.trim().length < 10) {
      setError('Please write a bio of at least 10 characters')
      return
    }
    setStep('interests')
  }
  
  // Handle interests step
  const handleSubmitInterests = () => {
    if (selectedInterests.length < 3) {
      setError('Please select at least 3 interests')
      return
    }
    setError('')
    setStep('lookingFor')
  }
  
  // Handle looking for step
  const handleSubmitLookingFor = () => {
    if (!lookingFor) {
      setError('Please select what you are looking for')
      return
    }
    setError('')
    setStep('details')
  }
  
  // Handle final submission
  const handleSubmitDetails = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Create user with all collected data
    setTimeout(() => {
      const userData = {
        name: name.trim(),
        age: parseInt(age) || 18, // Default to 18 if parsing fails
        location: location.trim(),
        phone: loginMethod === 'phone' ? phone : null,
        email: loginMethod === 'email' ? email.toLowerCase() : null,
        password: loginMethod === 'email' ? password : null,
        bio: bio.trim(),
        interests: selectedInterests,
        lookingFor: lookingFor,
        job: job.trim() || null,
        education: education.trim() || null,
        height: height.trim() || null,
        lifestyle: {
          drinking: drinking || 'Prefer not to say',
          smoking: smoking || 'Prefer not to say',
          exercise: exercise || 'Prefer not to say',
          pets: pets || 'Prefer not to say',
        },
        photo: photoPreview, // Store photo as base64 for demo
        photos: photoPreview ? [photoPreview] : [], // Add to photos array for consistency
        verified: true, // Profile is verified after completing all steps
      }
      
      const newUser = createUser(userData)
      
      // Save preferences to localStorage
      savePreferences({
        age: newUser.age,
        location: newUser.location,
        bio: newUser.bio,
        interests: newUser.interests,
        job: newUser.job,
        education: newUser.education,
        height: newUser.height,
        lookingFor: newUser.lookingFor,
        lifestyle: newUser.lifestyle,
      })
      
      setIsLoading(false)
      onSignUp(newUser)
    }, 1000)
  }

  // Resend OTP
  const handleResendOTP = () => {
    if (countdown > 0) return
    handleSendOTP()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Render verification step (OTP or Email/Password)
  if (step === 'verify') {
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
            <span style={{ fontSize: '40px' }}>🎉</span>
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            {sentOTP ? 'Verify Your Account' : 'Create Account'}
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '16px' 
          }}>
            {sentOTP 
              ? `We sent a code to ${phone}` 
              : 'Sign up to start finding friends!'}
          </p>
        </div>

        {/* Login Method Toggle */}
        {!sentOTP && (
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

        {/* Phone/OTP Sign Up */}
        {loginMethod === 'phone' && !sentOTP && (
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="phone-signup"
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
                id="phone-signup"
                type="tel"
                className="input"
                placeholder="(234) 567-8901"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhone(e.target.value))
                  setOtpError('')
                }}
                style={{ width: '100%' }}
              />
              {otpError && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                  {otpError}
                </p>
              )}
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
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        {/* OTP Verification */}
        {loginMethod === 'phone' && sentOTP && (
          <form onSubmit={handleVerifyOTP} style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="otp-signup"
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
                id="otp-signup"
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
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
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
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('verify')
                  setOtp('')
                  setOtpError('')
                  setSentOTP(null)
                  setPhone('')
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

        {/* Email/Password Sign Up */}
        {loginMethod === 'email' && !sentOTP && (
          <form onSubmit={handleEmailSignUp} style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="email-signup"
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
                id="email-signup"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="password-signup"
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
                id="password-signup"
                type="password"
                className="input"
                placeholder="At least 8 characters with letters and numbers"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError('')
                }}
                required
                style={{ width: '100%' }}
              />
              {passwordError && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                  {passwordError}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="confirm-password-signup"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirm-password-signup"
                type="password"
                className="input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setConfirmPasswordError('')
                }}
                required
                style={{ width: '100%' }}
              />
              {confirmPasswordError && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>
                {error}
              </p>
            )}

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
              {isLoading ? 'Creating Account...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Switch to Login */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline',
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    )
  }

  // Render basic info collection step
  if (step === 'basic') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 80px)',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* Step Number Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const currentStep = getCurrentStepNumber()
              const isActive = num === currentStep
              const isCompleted = num < currentStep
              return (
                <div
                  key={num}
                  style={{
                    width: isActive ? '40px' : '32px',
                    height: isActive ? '40px' : '32px',
                    borderRadius: '50%',
                    background: isActive || isCompleted
                      ? 'var(--gradient-primary)' 
                      : '#e2e8f0',
                    color: isActive || isCompleted ? 'white' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isActive ? '18px' : '14px',
                    fontWeight: '700',
                    border: isActive ? '3px solid var(--primary-color)' : '2px solid #e2e8f0',
                    boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {num}
                </div>
              )
            })}
          </div>
          
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
            <span style={{ fontSize: '40px' }}>👤</span>
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Complete Your Profile
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '16px' 
          }}>
            Tell us a bit about yourself
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#e2e8f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgress()}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Step 1 of 5
          </p>
        </div>

        <form onSubmit={handleSubmitBasic} style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Full Name (First & Last)
            </label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError('')
              }}
              required
              style={{ width: '100%' }}
            />
            {nameError && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                {nameError}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="age"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Age
            </label>
            <input
              id="age"
              type="number"
              className="input"
              placeholder="25"
              min="18"
              max="100"
              value={age}
              onChange={(e) => {
                setAge(e.target.value)
                setAgeError('')
              }}
              required
              style={{ width: '100%' }}
            />
            {ageError && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                {ageError}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="location"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              className="input"
              placeholder="New York, NY"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setLocationError('')
              }}
              required
              style={{ width: '100%' }}
            />
            {locationError && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                {locationError}
              </p>
            )}
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
            Continue
          </button>
        </form>
      </div>
    )
  }

  // Render bio step
  if (step === 'bio') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 80px)',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Step Number Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const currentStep = getCurrentStepNumber()
              const isActive = num === currentStep
              const isCompleted = num < currentStep
              return (
                <div
                  key={num}
                  style={{
                    width: isActive ? '40px' : '32px',
                    height: isActive ? '40px' : '32px',
                    borderRadius: '50%',
                    background: isActive || isCompleted
                      ? 'var(--gradient-primary)' 
                      : '#e2e8f0',
                    color: isActive || isCompleted ? 'white' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isActive ? '18px' : '14px',
                    fontWeight: '700',
                    border: isActive ? '3px solid var(--primary-color)' : '2px solid #e2e8f0',
                    boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {num}
                </div>
              )
            })}
          </div>
          
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Add Your Bio & Photo
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '14px' 
          }}>
            Help others get to know you better
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#e2e8f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgress()}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Step 2 of 5
          </p>
        </div>

        <form onSubmit={handleSubmitBio} style={{ width: '100%' }}>
          {/* Photo Upload */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <label
              htmlFor="photo-upload"
              style={{
                display: 'inline-block',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: photoPreview 
                  ? `url(${photoPreview}) center/cover`
                  : 'var(--gradient-primary)',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: 'white',
                border: '4px solid white',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative'
              }}>
                {!photoPreview && '📷'}
                {photoPreview && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    border: '3px solid white'
                  }}>
                    ✏️
                  </div>
                )}
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <p style={{ 
                marginTop: '12px', 
                fontSize: '14px', 
                color: 'var(--text-secondary)' 
              }}>
                {photoPreview ? 'Change Photo' : 'Add Profile Photo'}
              </p>
            </label>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="bio"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              Bio (at least 10 characters)
            </label>
            <textarea
              id="bio"
              className="input"
              placeholder="Tell us about yourself... What do you love? What are you passionate about?"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value)
                setError('')
              }}
              required
              rows={5}
              style={{ 
                width: '100%',
                resize: 'vertical',
                minHeight: '100px'
              }}
            />
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-secondary)', 
              marginTop: '4px' 
            }}>
              {bio.trim().length}/500 characters
            </p>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setStep('basic')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Render interests step
  if (step === 'interests') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 'calc(100vh - 80px)',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* Step Number Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const currentStep = getCurrentStepNumber()
              const isActive = num === currentStep
              const isCompleted = num < currentStep
              return (
                <div
                  key={num}
                  style={{
                    width: isActive ? '40px' : '32px',
                    height: isActive ? '40px' : '32px',
                    borderRadius: '50%',
                    background: isActive || isCompleted
                      ? 'var(--gradient-primary)' 
                      : '#e2e8f0',
                    color: isActive || isCompleted ? 'white' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isActive ? '18px' : '14px',
                    fontWeight: '700',
                    border: isActive ? '3px solid var(--primary-color)' : '2px solid #e2e8f0',
                    boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {num}
                </div>
              )
            })}
          </div>
          
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Select Your Interests
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '14px' 
          }}>
            Choose at least 3 interests that describe you
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#e2e8f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgress()}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Step 3 of 5 • {selectedInterests.length} selected
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px',
          marginBottom: '24px',
          flex: 1
        }}>
          {availableInterests.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              style={{
                padding: '10px 16px',
                borderRadius: '20px',
                border: selectedInterests.includes(interest)
                  ? '2px solid var(--primary-color)'
                  : '2px solid #e2e8f0',
                background: selectedInterests.includes(interest)
                  ? 'var(--primary-100)'
                  : 'white',
                color: selectedInterests.includes(interest)
                  ? 'var(--primary-color)'
                  : 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {interest}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => setStep('bio')}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmitInterests}
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={selectedInterests.length < 3}
          >
            Continue ({selectedInterests.length}/3)
          </button>
        </div>
      </div>
    )
  }

  // Render looking for step
  if (step === 'lookingFor') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 80px)',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* Step Number Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const currentStep = getCurrentStepNumber()
              const isActive = num === currentStep
              const isCompleted = num < currentStep
              return (
                <div
                  key={num}
                  style={{
                    width: isActive ? '40px' : '32px',
                    height: isActive ? '40px' : '32px',
                    borderRadius: '50%',
                    background: isActive || isCompleted
                      ? 'var(--gradient-primary)' 
                      : '#e2e8f0',
                    color: isActive || isCompleted ? 'white' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isActive ? '18px' : '14px',
                    fontWeight: '700',
                    border: isActive ? '3px solid var(--primary-color)' : '2px solid #e2e8f0',
                    boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {num}
                </div>
              )
            })}
          </div>
          
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            I'm looking for...
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '14px' 
          }}>
            Enhance your potential by exchanging yours!
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#e2e8f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgress()}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Step 4 of 5
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          {lookingForOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setLookingFor(option)
                setError('')
              }}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: lookingFor === option
                  ? '2px solid var(--primary-color)'
                  : '2px solid #e2e8f0',
                background: lookingFor === option
                  ? 'var(--primary-100)'
                  : 'white',
                color: lookingFor === option
                  ? 'var(--primary-color)'
                  : 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '24px' }}>
                {option === 'Relationship' && '❤️'}
                {option === 'Friends & Dating' && '👥'}
                {option === 'Casual' && '💫'}
                {option === 'Not Sure Yet' && '🤔'}
              </span>
              {option}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setStep('interests')}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmitLookingFor}
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={!lookingFor}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Render additional details step
  if (step === 'details') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 'calc(100vh - 80px)',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* Step Number Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                style={{
                  width: num === 5 ? '40px' : '32px',
                  height: num === 5 ? '40px' : '32px',
                  borderRadius: '50%',
                  background: num <= 5 
                    ? 'var(--gradient-primary)' 
                    : '#e2e8f0',
                  color: num <= 5 ? 'white' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: num === 5 ? '18px' : '14px',
                  fontWeight: '700',
                  border: num === 5 ? '3px solid var(--primary-color)' : '2px solid #e2e8f0',
                  boxShadow: num === 5 ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {num}
              </div>
            ))}
          </div>
          
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            Additional Details
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '14px' 
          }}>
            These are optional but help others find you
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#e2e8f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${getProgress()}%`,
              height: '100%',
              background: 'var(--gradient-primary)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Step 5 of 5
          </p>
        </div>

        <form onSubmit={handleSubmitDetails} style={{ width: '100%', flex: 1 }}>
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Job/Profession
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Software Developer"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Education
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., University, College"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Height
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., 5'10&quot;"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Drinking
              </label>
              <select
                className="input"
                value={drinking}
                onChange={(e) => setDrinking(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select...</option>
                <option value="Never">Never</option>
                <option value="Socially">Socially</option>
                <option value="Regularly">Regularly</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Smoking
              </label>
              <select
                className="input"
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select...</option>
                <option value="Never">Never</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Regularly">Regularly</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Exercise
              </label>
              <select
                className="input"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select...</option>
                <option value="Never">Never</option>
                <option value="Sometimes">Sometimes</option>
                <option value="Regularly">Regularly</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Pets
              </label>
              <select
                className="input"
                value={pets}
                onChange={(e) => setPets(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select...</option>
                <option value="Dog lover">Dog lover</option>
                <option value="Cat person">Cat person</option>
                <option value="No pets">No pets</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            <button
              type="button"
              onClick={() => setStep('lookingFor')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ 
                flex: 2,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Complete Sign Up'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return null
}

export default SignUp
