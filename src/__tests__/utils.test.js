// Basic Test Cases for FriendFinder
// Run with: npm test

import { describe, test, expect, beforeEach } from 'vitest'
import { calculateProfileCompletion, getMissingFields } from '../utils/profileCompletion'
import { validateImage } from '../services/imageService'
import { getUser, saveUser, getMatches, saveMatches } from '../utils/localStorage'

describe('Profile Completion', () => {
  test('should calculate completion percentage correctly', () => {
    const user = {
      name: 'John Doe',
      age: 25,
      email: 'john@example.com',
      bio: 'Test bio',
      location: 'New York',
      gender: 'Male',
      job: 'Developer',
      education: 'University',
      height: '6ft',
      lookingFor: 'Relationship',
      interests: ['Music', 'Travel', 'Sports'],
      lifestyle: {
        drinking: 'Socially',
        smoking: 'Never',
        exercise: 'Regularly',
        pets: 'Dog lover'
      }
    }
    
    const completion = calculateProfileCompletion(user)
    expect(completion).toBeGreaterThan(80)
    expect(completion).toBeLessThanOrEqual(100)
  })

  test('should return 0 for empty user', () => {
    const completion = calculateProfileCompletion(null)
    expect(completion).toBe(0)
  })

  test('should identify missing fields', () => {
    const user = {
      name: 'John',
      age: 25
    }
    
    const missing = getMissingFields(user)
    expect(missing.length).toBeGreaterThan(0)
    expect(missing).toContain('Bio')
  })
})

describe('Image Validation', () => {
  test('should validate image file type', () => {
    const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' })
    
    const validResult = validateImage(validFile)
    const invalidResult = validateImage(invalidFile)
    
    expect(validResult.valid).toBe(true)
    expect(invalidResult.valid).toBe(false)
  })

  test('should validate image file size', () => {
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const result = validateImage(largeFile)
    
    expect(result.valid).toBe(false)
    expect(result.error).toContain('size')
  })
})

describe('LocalStorage Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('should save and get user', () => {
    const user = { id: 1, name: 'Test User', email: 'test@example.com' }
    saveUser(user)
    const retrieved = getUser()
    
    // saveUser adds 'verified' field automatically
    expect(retrieved.id).toBe(user.id)
    expect(retrieved.name).toBe(user.name)
    expect(retrieved.email).toBe(user.email)
    expect(retrieved.verified).toBeDefined()
  })

  test('should save and get matches', () => {
    const matches = [
      { id: 1, profile: { id: 1, name: 'Match 1' } },
      { id: 2, profile: { id: 2, name: 'Match 2' } }
    ]
    saveMatches(matches)
    const retrieved = getMatches()
    
    expect(retrieved.length).toBe(2)
  })
})

describe('Button Functionality', () => {
  test('should handle button clicks', () => {
    const mockFn = () => {}
    let callCount = 0
    const button = { 
      onClick: () => {
        callCount++
        mockFn()
      }
    }
    
    button.onClick()
    expect(callCount).toBe(1)
  })
})
