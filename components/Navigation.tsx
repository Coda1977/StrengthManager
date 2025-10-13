'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation({ simplified = false }: { simplified?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single() as { data: { role: string } | null };
        setIsAdmin(data?.role === 'admin');
      }
    };
    checkAdmin();
  }, []);
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };
  
  if (simplified) {
    return (
      <nav className="app-nav">
        <div className="nav-container">
          <Link href="/" className="logo">Strengths Manager</Link>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="app-nav">
      <div className="nav-container">
        <Link href="/" className="logo">Strengths Manager</Link>
        
        {/* Desktop Navigation */}
        <div className="nav-links">
          <Link
            href="/dashboard"
            style={{
              background: pathname === '/dashboard' ? '#FFD600' : 'transparent',
              color: '#1A1A1A',
              padding: '0.5rem 1.25rem',
              borderRadius: '24px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Dashboard
          </Link>
          
          <Link
            href="/encyclopedia"
            style={{
              background: pathname === '/encyclopedia' ? '#FFD600' : 'transparent',
              color: '#1A1A1A',
              padding: '0.5rem 1.25rem',
              borderRadius: '24px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Encyclopedia
          </Link>
          
          <Link
            href="/ai-coach"
            style={{
              background: pathname === '/ai-coach' ? '#FFD600' : 'transparent',
              color: '#1A1A1A',
              padding: '0.5rem 1.25rem',
              borderRadius: '24px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            AI Coach
          </Link>
          
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                background: pathname === '/admin' ? '#FFD600' : 'transparent',
                color: '#1A1A1A',
                padding: '0.5rem 1.25rem',
                borderRadius: '24px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              Admin
            </Link>
          )}
          
          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              color: '#1A1A1A',
              padding: '0.5rem 1.25rem',
              borderRadius: '24px',
              border: 'none',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="mobile-menu-btn"
          aria-label="Toggle mobile menu"
          aria-expanded={showMobileMenu}
          style={{
            background: showMobileMenu ? '#FFD600' : '#F5EFE7',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            transition: 'all 0.2s ease'
          }}
        >
          {showMobileMenu ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
        
        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <>
            <div
              onClick={() => setShowMobileMenu(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999
              }}
              aria-hidden="true"
            />
            <div
              style={{
                position: 'fixed',
                top: '64px',
                left: 0,
                right: 0,
                background: '#FFFFFF',
                borderTop: '1px solid #E5E7EB',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxHeight: 'calc(100vh - 64px)',
                overflowY: 'auto'
              }}
            >
              <Link
                href="/dashboard"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '1rem',
                  background: pathname === '/dashboard' ? '#FFD600' : '#F5EFE7',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontSize: '16px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/encyclopedia"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '1rem',
                  background: pathname === '/encyclopedia' ? '#FFD600' : '#F5EFE7',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontSize: '16px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                Encyclopedia
              </Link>
              <Link
                href="/ai-coach"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '1rem',
                  background: pathname === '/ai-coach' ? '#FFD600' : '#F5EFE7',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontSize: '16px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                AI Coach
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setShowMobileMenu(false)}
                  style={{
                    padding: '1rem',
                    background: pathname === '/admin' ? '#FFD600' : '#F5EFE7',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: '#1A1A1A',
                    fontWeight: 600,
                    fontSize: '16px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSignOut();
                }}
                style={{
                  padding: '1rem',
                  background: '#F5EFE7',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}