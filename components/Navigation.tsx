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
          .select('is_admin')
          .eq('id', user.id)
          .single() as { data: { is_admin: boolean } | null };
        setIsAdmin(data?.is_admin || false);
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
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        className="nav-links"
        >
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
          
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="mobile-menu-btn"
            style={{
              background: '#F5EFE7',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div
            onClick={() => setShowMobileMenu(false)}
            style={{
              position: 'fixed',
              top: '80px',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              borderTop: '1px solid #E5E7EB',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Link href="/dashboard" style={{
              padding: '0.75rem 1rem',
              background: pathname === '/dashboard' ? '#FFD600' : '#F5EFE7',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#1A1A1A',
              fontWeight: 600
            }}>Dashboard</Link>
            <Link href="/encyclopedia" style={{
              padding: '0.75rem 1rem',
              background: pathname === '/encyclopedia' ? '#FFD600' : '#F5EFE7',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#1A1A1A',
              fontWeight: 600
            }}>Encyclopedia</Link>
            <Link href="/ai-coach" style={{
              padding: '0.75rem 1rem',
              background: pathname === '/ai-coach' ? '#FFD600' : '#F5EFE7',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#1A1A1A',
              fontWeight: 600
            }}>AI Coach</Link>
            {isAdmin && (
              <Link href="/admin" style={{
                padding: '0.75rem 1rem',
                background: pathname === '/admin' ? '#FFD600' : '#F5EFE7',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#1A1A1A',
                fontWeight: 600
              }}>Admin</Link>
            )}
            <button
              onClick={handleSignOut}
              style={{
                padding: '0.75rem 1rem',
                background: '#F5EFE7',
                borderRadius: '8px',
                border: 'none',
                color: '#1A1A1A',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}