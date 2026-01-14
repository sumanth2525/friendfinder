// Component Test Cases

import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import ImageUpload from '../components/ImageUpload'

describe('ImageUpload Component', () => {
  test('should render upload zone', () => {
    const { container } = render(React.createElement(ImageUpload, { maxImages: 6 }))
    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).toBeTruthy()
  })

  test('should show existing images', () => {
    const existingImages = ['url1', 'url2']
    const { container } = render(
      React.createElement(ImageUpload, { maxImages: 6, existingImages })
    )
    const images = container.querySelectorAll('img')
    expect(images.length).toBe(2)
  })

  test('should handle max images limit', () => {
    const existingImages = Array(6).fill('url')
    const { container } = render(
      React.createElement(ImageUpload, { maxImages: 6, existingImages })
    )
    const images = container.querySelectorAll('img')
    expect(images.length).toBe(6)
  })
})
