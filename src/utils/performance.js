// Performance Utilities
// Helper functions for performance optimization

/**
 * Debounce function - delays execution until after wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - limits execution to once per wait time
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Lazy load images
 * @param {string} src - Image source URL
 * @returns {Promise} Promise that resolves when image loads
 */
export const lazyLoadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Batch localStorage operations
 * @param {Array} operations - Array of {key, value} objects
 */
export const batchLocalStorage = (operations) => {
  try {
    operations.forEach(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value))
    })
  } catch (error) {
    console.error('Error batching localStorage:', error)
  }
}

/**
 * Check if page is visible (for pausing updates when tab is hidden)
 * @returns {boolean} True if page is visible
 */
export const isPageVisible = () => {
  return !document.hidden
}

/**
 * Intersection Observer for lazy loading
 * @param {Element} element - Element to observe
 * @param {Function} callback - Callback when element is visible
 * @returns {IntersectionObserver} Observer instance
 */
export const createIntersectionObserver = (element, callback) => {
  const options = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry)
        observer.unobserve(entry.target)
      }
    })
  }, options)

  if (element) {
    observer.observe(element)
  }

  return observer
}

/**
 * Measure performance of a function
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for console log
 * @returns {*} Function result
 */
export const measurePerformance = (fn, label = 'Function') => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${label} took ${(end - start).toFixed(2)}ms`)
  return result
}

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Array} Paginated array
 */
export const paginate = (array, page, pageSize) => {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return array.slice(start, end)
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export const chunk = (array, size) => {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
