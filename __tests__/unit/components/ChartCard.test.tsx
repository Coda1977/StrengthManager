import React from 'react'
import { render, screen } from '../../mocks/test-utils'
import ChartCard from '@/app/(dashboard)/admin/components/ChartCard'
import '@testing-library/jest-dom'

describe('ChartCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render title', () => {
      render(
        <ChartCard title="User Growth">
          <div>Chart Content</div>
        </ChartCard>
      )
      
      expect(screen.getByText('User Growth')).toBeInTheDocument()
    })

    it('should render children when not loading', () => {
      render(
        <ChartCard title="Analytics">
          <div data-testid="chart-content">Chart Data</div>
        </ChartCard>
      )
      
      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
      expect(screen.getByText('Chart Data')).toBeInTheDocument()
    })

    it('should render complex children', () => {
      render(
        <ChartCard title="Dashboard">
          <div>
            <h4>Metrics</h4>
            <p>Data visualization</p>
          </div>
        </ChartCard>
      )
      
      expect(screen.getByText('Metrics')).toBeInTheDocument()
      expect(screen.getByText('Data visualization')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      const { container } = render(
        <ChartCard title="Loading Chart" loading={true}>
          <div>Chart Content</div>
        </ChartCard>
      )
      
      // Should show spinner
      const spinner = container.querySelector('div[style*="animation"]')
      expect(spinner).toBeInTheDocument()
    })

    it('should not show children when loading', () => {
      render(
        <ChartCard title="Loading" loading={true}>
          <div data-testid="chart-content">Chart Data</div>
        </ChartCard>
      )
      
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()
    })

    it('should show children when loading is false', () => {
      render(
        <ChartCard title="Loaded" loading={false}>
          <div data-testid="chart-content">Chart Data</div>
        </ChartCard>
      )
      
      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
    })

    it('should default to not loading', () => {
      render(
        <ChartCard title="Default">
          <div data-testid="chart-content">Chart Data</div>
        </ChartCard>
      )
      
      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
    })

    it('should have correct loading container styles', () => {
      const { container } = render(
        <ChartCard title="Loading" loading={true}>
          <div>Content</div>
        </ChartCard>
      )
      
      // Check for spinner which indicates loading state
      const spinner = container.querySelector('div[style*="animation"]')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveStyle({
        width: '40px',
        height: '40px',
        borderRadius: '50%',
      })
    })
  })

  describe('Styling', () => {
    it('should have correct container styles', () => {
      const { container } = render(
        <ChartCard title="Test">
          <div>Content</div>
        </ChartCard>
      )
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveStyle({
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #E5E7EB',
      })
    })

    it('should have correct title styles', () => {
      render(
        <ChartCard title="Styled Title">
          <div>Content</div>
        </ChartCard>
      )
      
      const title = screen.getByText('Styled Title')
      expect(title).toHaveStyle({
        margin: '0 0 1.5rem 0',
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#1A1A1A',
      })
    })

    it('should have correct spinner styles', () => {
      const { container } = render(
        <ChartCard title="Loading" loading={true}>
          <div>Content</div>
        </ChartCard>
      )
      
      const spinner = container.querySelector('div[style*="animation"]')
      expect(spinner).toHaveStyle({
        width: '40px',
        height: '40px',
        borderRadius: '50%',
      })
    })
  })

  describe('Title Variations', () => {
    it('should handle long titles', () => {
      const longTitle = 'This is a very long chart title that might wrap to multiple lines'
      render(
        <ChartCard title={longTitle}>
          <div>Content</div>
        </ChartCard>
      )
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle short titles', () => {
      render(
        <ChartCard title="A">
          <div>Content</div>
        </ChartCard>
      )
      
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('should handle titles with special characters', () => {
      render(
        <ChartCard title="Revenue ($) - 2024">
          <div>Content</div>
        </ChartCard>
      )
      
      expect(screen.getByText('Revenue ($) - 2024')).toBeInTheDocument()
    })
  })

  describe('Children Variations', () => {
    it('should render text children', () => {
      render(
        <ChartCard title="Text">
          Simple text content
        </ChartCard>
      )
      
      expect(screen.getByText('Simple text content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <ChartCard title="Multiple">
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </ChartCard>
      )
      
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
    })

    it('should render nested components', () => {
      render(
        <ChartCard title="Nested">
          <div>
            <div>
              <span>Deeply nested</span>
            </div>
          </div>
        </ChartCard>
      )
      
      expect(screen.getByText('Deeply nested')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic heading for title', () => {
      render(
        <ChartCard title="Accessible Title">
          <div>Content</div>
        </ChartCard>
      )
      
      const title = screen.getByText('Accessible Title')
      expect(title.tagName).toBe('H3')
    })

    it('should be keyboard accessible', () => {
      const { container } = render(
        <ChartCard title="Interactive">
          <button>Click me</button>
        </ChartCard>
      )
      
      const button = screen.getByText('Click me')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(
        <ChartCard title="Empty">
          <div></div>
        </ChartCard>
      )
      
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })

    it('should handle null children gracefully', () => {
      render(
        <ChartCard title="Null">
          {null}
        </ChartCard>
      )
      
      expect(screen.getByText('Null')).toBeInTheDocument()
    })

    it('should toggle between loading and loaded states', () => {
      const { rerender } = render(
        <ChartCard title="Toggle" loading={true}>
          <div data-testid="content">Content</div>
        </ChartCard>
      )
      
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
      
      rerender(
        <ChartCard title="Toggle" loading={false}>
          <div data-testid="content">Content</div>
        </ChartCard>
      )
      
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })
})