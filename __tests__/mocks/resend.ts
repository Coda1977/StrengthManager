// Mock Resend client and responses

export const mockResendResponse = {
  id: 'email_test123',
  from: 'noreply@strengthmanager.com',
  to: ['test@example.com'],
  created_at: '2024-01-01T00:00:00Z',
}

export const mockResendError = {
  name: 'ResendError',
  message: 'Failed to send email',
  statusCode: 400,
}

export const createMockResendClient = () => {
  return {
    emails: {
      send: jest.fn().mockResolvedValue({ data: mockResendResponse, error: null }),
      get: jest.fn().mockResolvedValue({ data: mockResendResponse, error: null }),
      cancel: jest.fn().mockResolvedValue({ data: { id: 'email_test123' }, error: null }),
      list: jest.fn().mockResolvedValue({
        data: {
          data: [mockResendResponse],
          object: 'list',
        },
        error: null,
      }),
    },
    apiKeys: {
      create: jest.fn(),
      list: jest.fn(),
      remove: jest.fn(),
    },
    domains: {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      verify: jest.fn(),
      remove: jest.fn(),
    },
  }
}

// Mock email templates
export const mockWelcomeEmailHtml = `
<!DOCTYPE html>
<html>
<head><title>Welcome</title></head>
<body>
  <h1>Welcome to Strength Manager!</h1>
  <p>We're excited to have you on board.</p>
</body>
</html>
`

export const mockWeeklyCoachingEmailHtml = `
<!DOCTYPE html>
<html>
<head><title>Weekly Insight</title></head>
<body>
  <h1>Your Weekly Strengths Insight</h1>
  <p>Here's your personalized insight for this week.</p>
</body>
</html>
`

// Mock email data
export const mockEmailData = {
  welcome: {
    to: 'test@example.com',
    subject: 'Welcome to Strength Manager',
    html: mockWelcomeEmailHtml,
    from: 'noreply@strengthmanager.com',
  },
  weeklyCoaching: {
    to: 'test@example.com',
    subject: 'Your Weekly Strengths Insight',
    html: mockWeeklyCoachingEmailHtml,
    from: 'noreply@strengthmanager.com',
  },
}

// Mock email service responses
export const mockEmailServiceResponse = {
  success: true,
  messageId: 'email_test123',
  error: null,
}

export const mockEmailServiceError = {
  success: false,
  messageId: null,
  error: 'Failed to send email',
}

// Mock unsubscribe token
export const mockUnsubscribeToken = 'test-unsubscribe-token-123'

// Mock email preferences
export const mockEmailPreferences = {
  user_id: 'test-user-id',
  weekly_coaching: true,
  product_updates: true,
  marketing: false,
  updated_at: '2024-01-01T00:00:00Z',
}