import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  },
}))

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to create mock fetch responses
export const createMockFetchResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: function() { return this },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response)
}

// Helper to mock API routes
export const mockApiRoute = (path: string, response: any, method = 'GET') => {
  global.fetch = jest.fn((url) => {
    if (typeof url === 'string' && url.includes(path)) {
      return createMockFetchResponse(response)
    }
    return createMockFetchResponse({ error: 'Not found' }, false, 404)
  }) as jest.Mock
}

// Helper to reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks()
  jest.resetAllMocks()
}

// Helper to create mock router
export const createMockRouter = (overrides = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  ...overrides,
})

// Helper to create mock session
export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})

// Helper to test error boundaries
export const throwError = (error: Error) => {
  throw error
}

// Helper to suppress console errors in tests
export const suppressConsoleError = () => {
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })
}

// Helper to create mock file
export const createMockFile = (
  name: string,
  size: number,
  type: string,
  content: string = ''
) => {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

// Helper to simulate file upload
export const simulateFileUpload = (input: HTMLInputElement, file: File) => {
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  input.files = dataTransfer.files
  
  const event = new Event('change', { bubbles: true })
  input.dispatchEvent(event)
}