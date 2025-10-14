'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/actions/auth';

export default function SignupPage() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Validate password match
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      overflow: 'hidden'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '700',
            letterSpacing: '-1px',
            color: '#1A1A1A',
            marginBottom: '0.5rem'
          }}>
            Get Started
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#4A4A4A',
            lineHeight: '1.7'
          }}>
            Transform your leadership with strengths
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '1rem',
                borderRadius: '12px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '0.5rem'
              }}>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#003566'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#003566'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#003566'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
              <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '0.5rem' }}>
                At least 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '0.5rem'
              }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  fontSize: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#003566'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button"
              style={{
                width: '100%',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            <span style={{ color: '#4A4A4A' }}>Already have an account? </span>
            <Link href="/login" style={{
              color: '#003566',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Sign in
            </Link>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/" style={{
            color: '#4A4A4A',
            fontSize: '14px',
            textDecoration: 'none'
          }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}