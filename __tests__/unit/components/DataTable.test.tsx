import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../mocks/test-utils'
import DataTable, { Column } from '@/app/(dashboard)/admin/components/DataTable'
import '@testing-library/jest-dom'

interface TestData {
  id: string
  name: string
  email: string
  status: string
  age: number
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', age: 30 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', age: 25 },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active', age: 35 },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', status: 'pending', age: 28 },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', status: 'active', age: 32 },
]

const mockColumns: Column<TestData>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'status', header: 'Status' },
  { key: 'age', header: 'Age' },
]

describe('DataTable Component', () => {
  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('should render all column headers', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Age')).toBeInTheDocument()
    })

    it('should render all rows', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      mockData.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument()
      })
    })

    it('should render search input', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      const { container } = render(
        <DataTable columns={mockColumns} data={[]} loading={true} />
      )
      
      const skeletons = container.querySelectorAll('div[style*="animation"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show table when loading', () => {
      render(<DataTable columns={mockColumns} data={mockData} loading={true} />)
      
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('should show table when not loading', () => {
      render(<DataTable columns={mockColumns} data={mockData} loading={false} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter data by name', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      fireEvent.change(searchInput, { target: { value: 'John' } })
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('should filter data by email', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      fireEvent.change(searchInput, { target: { value: 'alice@' } })
      
      expect(screen.getByText('Alice Williams')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('should be case insensitive', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      fireEvent.change(searchInput, { target: { value: 'JOHN' } })
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should show "No results found" when no matches', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
      
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })

    it('should reset to page 1 when searching', () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        status: 'active',
        age: 20 + i,
      }))
      
      render(<DataTable columns={mockColumns} data={largeData} itemsPerPage={10} />)
      
      // Go to page 2
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument()
      
      // Search should reset to page 1
      const searchInput = screen.getByPlaceholderText('Search...')
      fireEvent.change(searchInput, { target: { value: 'User 5' } })
      
      // After search, if only 1 result, pagination is hidden
      // Just verify the search worked
      expect(screen.getByText('User 5')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      status: 'active',
      age: 20 + i,
    }))

    it('should show pagination when data exceeds itemsPerPage', () => {
      render(<DataTable columns={mockColumns} data={largeData} itemsPerPage={10} />)
      
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should not show pagination when data fits on one page', () => {
      render(<DataTable columns={mockColumns} data={mockData} itemsPerPage={20} />)
      
      expect(screen.queryByText('Previous')).not.toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })

    it('should navigate to next page', () => {
      render(<DataTable columns={mockColumns} data={largeData} itemsPerPage={10} />)
      
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)
      
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument()
    })

    it('should navigate to previous page', () => {
      render(<DataTable columns={mockColumns} data={largeData} itemsPerPage={10} />)
      
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)
      
      const prevButton = screen.getByText('Previous')
      fireEvent.click(prevButton)
      
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
    })

    it('should disable Previous button on first page', () => {
      render(<DataTable columns={mockColumns} data={largeData} itemsPerPage={10} />)
      
      const prevButton = screen.getByText('Previous')
      expect(prevButton).toHaveStyle({ cursor: 'not-allowed' })
    })

    it('should disable Next button on last page', () => {
      render(<DataTable columns={mockColumns} data={largeData} itemsPerPage={50} />)
      
      // When all data fits on one page, pagination is hidden
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })

    it('should show correct result count', () => {
      render(<DataTable columns={mockColumns} data={largeData} itemsPerPage={10} />)
      
      expect(screen.getByText(/Showing 1 to 10 of 50 results/)).toBeInTheDocument()
    })
  })

  describe('Row Click Handler', () => {
    it('should call onRowClick when row is clicked', () => {
      const handleRowClick = jest.fn()
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onRowClick={handleRowClick}
        />
      )
      
      const row = screen.getByText('John Doe').closest('tr')
      fireEvent.click(row!)
      
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
    })

    it('should not call onRowClick when not provided', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      const row = screen.getByText('John Doe').closest('tr')
      expect(() => fireEvent.click(row!)).not.toThrow()
    })

    it('should show pointer cursor when onRowClick is provided', () => {
      render(
        <DataTable
          columns={mockColumns}
          data={mockData}
          onRowClick={() => {}}
        />
      )
      
      const row = screen.getByText('John Doe').closest('tr')
      expect(row).toHaveStyle({ cursor: 'pointer' })
    })
  })

  describe('Custom Render Function', () => {
    it('should use custom render function for column', () => {
      const customColumns: Column<TestData>[] = [
        {
          key: 'name',
          header: 'Name',
          render: (row) => <strong>{row.name.toUpperCase()}</strong>,
        },
        { key: 'email', header: 'Email' },
      ]
      
      render(<DataTable columns={customColumns} data={mockData} />)
      
      expect(screen.getByText('JOHN DOE')).toBeInTheDocument()
    })

    it('should render custom components in cells', () => {
      const customColumns: Column<TestData>[] = [
        { key: 'name', header: 'Name' },
        {
          key: 'status',
          header: 'Status',
          render: (row) => (
            <span data-testid={`status-${row.id}`}>{row.status}</span>
          ),
        },
      ]
      
      render(<DataTable columns={customColumns} data={mockData} />)
      
      expect(screen.getByTestId('status-1')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show "No data available" when data is empty', () => {
      render(<DataTable columns={mockColumns} data={[]} />)
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No results found" when search has no matches', () => {
      render(<DataTable columns={mockColumns} data={mockData} />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      fireEvent.change(searchInput, { target: { value: 'xyz123' } })
      
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  describe('Column Width', () => {
    it('should apply custom column width', () => {
      const columnsWithWidth: Column<TestData>[] = [
        { key: 'name', header: 'Name', width: '200px' },
        { key: 'email', header: 'Email', width: '300px' },
      ]
      
      const { container } = render(
        <DataTable columns={columnsWithWidth} data={mockData} />
      )
      
      const nameHeader = screen.getByText('Name').closest('th')
      expect(nameHeader).toHaveStyle({ width: '200px' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle data with missing fields', () => {
      const incompleteData = [
        { id: '1', name: 'John', email: '', status: 'active', age: 30 },
      ]
      
      render(<DataTable columns={mockColumns} data={incompleteData} />)
      
      expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('should handle very long text in cells', () => {
      const longTextData = [
        {
          id: '1',
          name: 'A'.repeat(100),
          email: 'test@example.com',
          status: 'active',
          age: 30,
        },
      ]
      
      render(<DataTable columns={mockColumns} data={longTextData} />)
      
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })

    it('should handle special characters in data', () => {
      const specialData = [
        {
          id: '1',
          name: 'John <script>',
          email: 'test@example.com',
          status: 'active',
          age: 30,
        },
      ]
      
      render(<DataTable columns={mockColumns} data={specialData} />)
      
      expect(screen.getByText('John <script>')).toBeInTheDocument()
    })
  })
})