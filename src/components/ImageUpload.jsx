import { useState, useRef, useCallback } from 'react'
import { uploadImage, uploadMultipleImages, compressImage, validateImage } from '../services/imageService'
import { getUser } from '../utils/localStorage'

const ImageUpload = ({ 
  maxImages = 6, 
  existingImages = [], 
  onUploadComplete, 
  onError,
  userId = null,
  compress = true,
  showPreview = true,
  singleImage = false
}) => {
  const [images, setImages] = useState(existingImages || [])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const currentUser = getUser()
  const uploadUserId = userId || currentUser?.id || 'temp'

  const handleFileSelect = useCallback(async (files) => {
    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    if (fileArray.length > remainingSlots) {
      setErrors([`You can only upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}`])
      return
    }

    setUploading(true)
    setErrors([])

    try {
      const validFiles = []
      const validationErrors = []

      // Validate all files first
      for (const file of fileArray) {
        const validation = validateImage(file)
        if (validation.valid) {
          validFiles.push(file)
        } else {
          validationErrors.push(`${file.name}: ${validation.error}`)
        }
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
      }

      if (validFiles.length === 0) {
        setUploading(false)
        return
      }

      // Compress images if enabled
      const filesToUpload = compress
        ? await Promise.all(validFiles.map(file => compressImage(file)))
        : validFiles

      // Upload images
      const uploadPromises = filesToUpload.map((file, index) => 
        uploadImage(file, uploadUserId, images.length + index)
      )

      const results = await Promise.all(uploadPromises)
      const uploadedUrls = results
        .filter(result => result.url)
        .map(result => result.url)

      const uploadErrors = results
        .filter(result => result.error)
        .map(result => result.error.message)

      if (uploadErrors.length > 0) {
        setErrors(prev => [...prev, ...uploadErrors])
      }

      if (uploadedUrls.length > 0) {
        const newImages = singleImage 
          ? [uploadedUrls[0]] 
          : [...images, ...uploadedUrls]
        
        setImages(newImages)
        
        if (onUploadComplete) {
          onUploadComplete(newImages)
        }
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to upload images'
      setErrors([errorMsg])
      if (onError) {
        onError(error)
      }
    } finally {
      setUploading(false)
    }
  }, [images, maxImages, uploadUserId, compress, singleImage, onUploadComplete, onError])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (images.length >= maxImages) {
      setErrors([`Maximum ${maxImages} images allowed`])
      return
    }

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }, [images.length, maxImages, handleFileSelect])

  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const handleRemoveImage = useCallback((index) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    if (onUploadComplete) {
      onUploadComplete(newImages)
    }
  }, [images, onUploadComplete])

  const handleReplaceImage = useCallback(async (index, file) => {
    const validation = validateImage(file)
    if (!validation.valid) {
      setErrors([validation.error])
      return
    }

    setUploading(true)
    try {
      const fileToUpload = compress ? await compressImage(file) : file
      const result = await uploadImage(fileToUpload, uploadUserId, index)

      if (result.url) {
        const newImages = [...images]
        newImages[index] = result.url
        setImages(newImages)
        if (onUploadComplete) {
          onUploadComplete(newImages)
        }
      } else {
        setErrors([result.error?.message || 'Failed to upload image'])
      }
    } catch (error) {
      setErrors([error.message || 'Failed to upload image'])
    } finally {
      setUploading(false)
    }
  }, [images, uploadUserId, compress, onUploadComplete])

  const canAddMore = images.length < maxImages

  return (
    <div style={{ width: '100%' }}>
      {/* Image Preview Grid */}
      {showPreview && images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {images.map((imageUrl, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--surface)',
                border: '2px solid var(--border-light)'
              }}
            >
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <button
                onClick={() => handleRemoveImage(index)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700'
                }}
              >
                ×
              </button>
              {index === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}
                >
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {canAddMore && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--primary-color)' : 'var(--border-color)'}`,
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragActive ? 'var(--primary-50)' : 'var(--surface)',
            transition: 'all 0.2s',
            opacity: uploading ? 0.6 : 1
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple={!singleImage}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          
          {uploading ? (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Uploading...
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
              <p style={{ 
                color: 'var(--text-primary)', 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                {dragActive ? 'Drop images here' : 'Click or drag to upload'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {singleImage 
                  ? 'JPEG, PNG, or WebP (max 5MB)'
                  : `Up to ${maxImages - images.length} more image${maxImages - images.length === 1 ? '' : 's'} (max 5MB each)`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'var(--error-light)',
          borderRadius: '8px',
          border: '1px solid var(--error)'
        }}>
          {errors.map((error, index) => (
            <p key={index} style={{ 
              color: 'var(--error)', 
              fontSize: '13px', 
              margin: '4px 0' 
            }}>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image Count */}
      {!singleImage && (
        <p style={{ 
          marginTop: '12px', 
          color: 'var(--text-secondary)', 
          fontSize: '12px',
          textAlign: 'center'
        }}>
          {images.length} / {maxImages} images
        </p>
      )}
    </div>
  )
}

export default ImageUpload
