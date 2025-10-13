import React from 'react'
import { render, screen } from '../../mocks/test-utils'
import StatusBadge from '@/app/(dashboard)/admin/components/StatusBadge'
import '@testing-library/jest-dom'

describe('StatusBadge Component', () => {
  describe('Status Variants', () => {
    it('should render success status', () => {
      const { container } = render(<StatusBadge status="success" label="Active" />)
      
      expect(screen.getByText('Active')).toBeInTheDocument()
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveStyle({ backgroundColor: '#D1FAE5' })
    })

    it('should render warning status', () => {
      const { container } = render(<StatusBadge status="warning" label="Pending" />)
      
      expect(screen.getByText('Pending')).toBeInTheDocument()
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveStyle({ backgroundColor: '#FEF3C7' })
    })

    it('should render error status', () => {
      const { container } = render(<StatusBadge status="error" label="Failed" />)
      
      expect(screen.getByText('Failed')).toBeInTheDocument()
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveStyle({ backgroundColor: '#FEE2E2' })
    })

    it('should render info status', () => {
      const { container } = render(<StatusBadge status="info" label="Processing" />)
      
      expect(screen.getByText('Processing')).toBeInTheDocument()
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveStyle({ backgroundColor: '#DBEAFE' })
    })
  })

  describe('Label Rendering', () => {
    it('should render label text', () => {
      render(<StatusBadge status="success" label="Completed" />)
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should capitalize label', () => {
      const { container } = render(<StatusBadge status="info" label="in progress" />)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveStyle({ textTransform: 'capitalize' })
    })

    it('should handle long labels', () => {
      const longLabel = 'This is a very long status label'
      render(<StatusBadge status="warning" label={longLabel} />)
      expect(screen.getByText(longLabel)).toBeInTheDocument()
    })

    it('should handle empty label', () => {
      const { container } = render(<StatusBadge status="success" label="" />)
      const badge = container.querySelector('span')
      expect(badge).toBeInTheDocument()
      expect(badge?.textContent).toBe('')
    })
  })

  describe('Styling', () => {
    it('should have correct base styles', () => {
      const { container } = render(<StatusBadge status="success" label="Test" />)
      const badge = container.firstChild as HTMLElement
      
      expect(badge).toHaveStyle({
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
      })
    })

    it('should have correct success colors', () => {
      const { container } = render(<StatusBadge status="success" label="Test" />)
      const badge = container.firstChild as HTMLElement
      
      expect(badge).toHaveStyle({
        backgroundColor: '#D1FAE5',
        color: '#065F46',
      })
    })

    it('should have correct warning colors', () => {
      const { container } = render(<StatusBadge status="warning" label="Test" />)
      const badge = container.firstChild as HTMLElement
      
      expect(badge).toHaveStyle({
        backgroundColor: '#FEF3C7',
        color: '#92400E',
      })
    })

    it('should have correct error colors', () => {
      const { container } = render(<StatusBadge status="error" label="Test" />)
      const badge = container.firstChild as HTMLElement
      
      expect(badge).toHaveStyle({
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
      })
    })

    it('should have correct info colors', () => {
      const { container } = render(<StatusBadge status="info" label="Test" />)
      const badge = container.firstChild as HTMLElement
      
      expect(badge).toHaveStyle({
        backgroundColor: '#DBEAFE',
        color: '#1E40AF',
      })
    })
  })

  describe('Accessibility', () => {
    it('should render as span element', () => {
      const { container } = render(<StatusBadge status="success" label="Active" />)
      expect(container.firstChild?.nodeName).toBe('SPAN')
    })

    it('should be readable by screen readers', () => {
      render(<StatusBadge status="success" label="Verified" />)
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in label', () => {
      render(<StatusBadge status="info" label="Status: OK!" />)
      expect(screen.getByText('Status: OK!')).toBeInTheDocument()
    })

    it('should handle numeric labels', () => {
      render(<StatusBadge status="success" label="100%" />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should handle unicode characters', () => {
      render(<StatusBadge status="success" label="✓ Done" />)
      expect(screen.getByText('✓ Done')).toBeInTheDocument()
    })
  })
})