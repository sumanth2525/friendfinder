// Image Upload Service
// Handles image uploads to Supabase Storage with fallback to localStorage

import { supabase } from '../config/supabase'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const STORAGE_BUCKET = 'profile-photos'

/**
 * Upload image to Supabase Storage
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @param {number} photoIndex - Photo index (0 for primary, 1+ for additional)
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export const uploadImage = async (file, userId, photoIndex = 0) => {
  // Validate file
  if (!file) {
    return { url: null, error: new Error('No file provided') }
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: new Error('Invalid file type. Please use JPEG, PNG, or WebP') }
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    return { url: null, error: new Error(`File size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`) }
  }

  // If Supabase is not available, use base64 fallback
  if (!supabase) {
    return uploadImageToLocalStorage(file)
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${photoIndex}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      // Fallback to localStorage
      return uploadImageToLocalStorage(file)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading image:', error)
    // Fallback to localStorage
    return uploadImageToLocalStorage(file)
  }
}

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files
 * @param {string} userId - User ID
 * @returns {Promise<{urls: string[], errors: Error[]}>}
 */
export const uploadMultipleImages = async (files, userId) => {
  const urls = []
  const errors = []

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], userId, i)
    if (result.url) {
      urls.push(result.url)
    } else {
      errors.push(result.error)
    }
  }

  return { urls, errors }
}

/**
 * Delete image from Supabase Storage
 * @param {string} imageUrl - Image URL to delete
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const deleteImage = async (imageUrl, userId) => {
  if (!supabase || !imageUrl) {
    return { success: false, error: new Error('Supabase not configured or no URL provided') }
  }

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])

    if (error) {
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Fallback: Upload image to localStorage as base64
 * @param {File} file - Image file
 * @returns {Promise<{url: string, error: null}>}
 */
const uploadImageToLocalStorage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve({ url: reader.result, error: null })
    }
    reader.onerror = () => {
      resolve({ url: null, error: new Error('Failed to read file') })
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image before upload
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<File>}
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * @param {File} file - Image file
 * @returns {Object} {valid: boolean, error: string|null}
 */
export const validateImage = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, or WebP' }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit` }
  }

  return { valid: true, error: null }
}
