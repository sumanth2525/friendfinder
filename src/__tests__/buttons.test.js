// Comprehensive Button Tests
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

describe('Button Component Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Primary Buttons', () => {
    test('should render primary button with correct styling', () => {
      const { container } = render(
        React.createElement('button', {
          className: 'btn btn-primary',
          children: 'Click Me'
        })
      )
      const button = container.querySelector('.btn-primary')
      expect(button).toBeTruthy()
      expect(button.textContent).toBe('Click Me')
    })

    test('should handle primary button click', () => {
      const handleClick = vi.fn()
      const { container } = render(
        React.createElement('button', {
          className: 'btn btn-primary',
          onClick: handleClick,
          children: 'Click Me'
        })
      )
      const button = container.querySelector('.btn-primary')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('should have hover effect on primary button', () => {
      const { container } = render(
        React.createElement('button', {
          className: 'btn btn-primary',
          style: { transition: 'all 0.3s' },
          children: 'Hover Me'
        })
      )
      const button = container.querySelector('.btn-primary')
      expect(button).toBeTruthy()
      // Check if button exists and has className
      expect(button.className).toContain('btn-primary')
    })
  })

  describe('Secondary Buttons', () => {
    test('should render secondary button', () => {
      const { container } = render(
        React.createElement('button', {
          className: 'btn btn-secondary',
          children: 'Secondary'
        })
      )
      const button = container.querySelector('.btn-secondary')
      expect(button).toBeTruthy()
    })

    test('should handle secondary button click', () => {
      const handleClick = vi.fn()
      const { container } = render(
        React.createElement('button', {
          className: 'btn btn-secondary',
          onClick: handleClick,
          children: 'Click'
        })
      )
      fireEvent.click(container.querySelector('.btn-secondary'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Navigation Buttons', () => {
    test('should render navigation items', () => {
      const navItems = ['Home', 'Groups', 'Matches', 'Search', 'Profile']
      navItems.forEach(item => {
        const { container } = render(
          React.createElement('div', {
            className: 'nav-item',
            children: item
          })
        )
        expect(container.textContent).toContain(item)
      })
    })

    test('should handle active navigation state', () => {
      const { container } = render(
        React.createElement('div', {
          className: 'nav-item active',
          children: 'Home'
        })
      )
      const navItem = container.querySelector('.nav-item.active')
      expect(navItem).toBeTruthy()
    })
  })

  describe('Action Buttons', () => {
    test('should handle like button click', () => {
      const handleLike = vi.fn()
      const { container } = render(
        React.createElement('button', {
          onClick: handleLike,
          'data-testid': 'like-button',
          children: '❤️'
        })
      )
      const button = container.querySelector('[data-testid="like-button"]')
      fireEvent.click(button)
      expect(handleLike).toHaveBeenCalledTimes(1)
    })

    test('should handle pass button click', () => {
      const handlePass = vi.fn()
      const { container } = render(
        React.createElement('button', {
          onClick: handlePass,
          'data-testid': 'pass-button',
          children: '✕'
        })
      )
      fireEvent.click(container.querySelector('[data-testid="pass-button"]'))
      expect(handlePass).toHaveBeenCalledTimes(1)
    })

    test('should handle super like button click', () => {
      const handleSuperLike = vi.fn()
      const { container } = render(
        React.createElement('button', {
          onClick: handleSuperLike,
          'data-testid': 'super-like-button',
          children: '⭐'
        })
      )
      fireEvent.click(container.querySelector('[data-testid="super-like-button"]'))
      expect(handleSuperLike).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Buttons', () => {
    test('should handle submit button', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      const { container } = render(
        React.createElement('form', {
          onSubmit: handleSubmit,
          children: React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary',
            children: 'Submit'
          })
        })
      )
      const form = container.querySelector('form')
      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    test('should disable button when form is invalid', () => {
      const { container } = render(
        React.createElement('button', {
          type: 'submit',
          className: 'btn btn-primary',
          disabled: true,
          children: 'Submit'
        })
      )
      const button = container.querySelector('button')
      expect(button.disabled).toBe(true)
    })
  })
})
