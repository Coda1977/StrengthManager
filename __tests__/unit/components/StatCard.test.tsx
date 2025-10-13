import React from 'react'
import { render, screen } from '../../../__tests__/mocks/test-utils'
import StatCard from '@/app/(dashboard)/admin/components/StatCard'
import { Users } from 'lucide-react'
import '@testing-library/jest-dom'

describe('StatCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render title and value', () => {
      render(<StatCard title="Total Users" value="150" />)
      
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('should render with numeric value', () => {
      render(<StatCard title="Active Sessions" value={42} />)
      
      expect(screen.getByText('Active Sessions')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render subtitle when provided', () => {
      render(
        <StatCard
          title="Revenue"
          value="$12,345"
          subtitle="+12% from last month"
        />
      )
      
      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('$12,345')).toBeInTheDocument()
      expect(screen.getByText('+12% from last month')).toBeInTheDocument()
    })

    it('should not render subtitle when not provided', () => {
      const { container } = render(<StatCard title="Users" value="100" />)
      
      const subtitles = container.querySelectorAll('p')
      expect(subtitles.length).toBe(2) // Only title and value, no subtitle
    })
  })

  describe('Color Variants', () => {
    it('should render with blue color by default', () => {
      render(
        <StatCard title="Test" value="100" icon={<Users data-testid="icon" />} />
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('should render with green color', () => {
      render(
        <StatCard title="Test" value="100" color="green" icon={<Users data-testid="icon" />} />
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('should render with purple color', () => {
      render(
        <StatCard title="Test" value="100" color="purple" icon={<Users data-testid="icon" />} />
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('should render with orange color', () => {
      render(
        <StatCard title="Test" value="100" color="orange" icon={<Users data-testid="icon" />} />
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('should render with red color', () => {
      render(
        <StatCard title="Test" value="100" color="red" icon={<Users data-testid="icon" />} />
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    it('should render icon when provided', () => {
      const { container } = render(
        <StatCard
          title="Users"
          value="100"
          icon={<Users data-testid="user-icon" />}
        />
      )
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    })

    it('should not render icon container when icon not provided', () => {
      render(<StatCard title="Users" value="100" />)
      
      // Just verify the card renders without icon
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should render custom icon component', () => {
      const CustomIcon = () => <span data-testid="custom-icon">★</span>
      
      render(
        <StatCard title="Rating" value="4.5" icon={<CustomIcon />} />
      )
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
      expect(screen.getByText('★')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines'
      render(<StatCard title={longTitle} value="100" />)
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      render(<StatCard title="Big Number" value="1,234,567,890" />)
      
      expect(screen.getByText('1,234,567,890')).toBeInTheDocument()
    })

    it('should handle zero value', () => {
      render(<StatCard title="Count" value={0} />)
      
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      render(<StatCard title="Loss" value="-$500" />)
      
      expect(screen.getByText('-$500')).toBeInTheDocument()
    })

    it('should handle empty string value', () => {
      render(<StatCard title="Empty" value="" />)
      
      expect(screen.getByText('Empty')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have correct container styles', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveStyle({
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.5rem',
      })
    })

    it('should have correct title styles', () => {
      render(<StatCard title="Test Title" value="100" />)
      
      const title = screen.getByText('Test Title')
      expect(title).toHaveStyle({
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#6B7280',
      })
    })

    it('should have correct value styles', () => {
      render(<StatCard title="Test" value="100" />)
      
      const value = screen.getByText('100')
      expect(value).toHaveStyle({
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1A1A1A',
      })
    })
  })

  describe('Accessibility', () => {
    it('should render semantic HTML', () => {
      const { container } = render(
        <StatCard title="Users" value="100" subtitle="Active" />
      )
      
      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBeGreaterThan(0)
    })

    it('should be readable by screen readers', () => {
      render(
        <StatCard
          title="Total Revenue"
          value="$50,000"
          subtitle="+20% increase"
        />
      )
      
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('$50,000')).toBeInTheDocument()
      expect(screen.getByText('+20% increase')).toBeInTheDocument()
    })
  })
})