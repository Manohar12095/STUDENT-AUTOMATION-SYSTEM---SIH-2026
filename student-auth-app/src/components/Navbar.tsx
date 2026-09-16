'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/register', label: 'Enroll' },
  { href: '/login', label: 'Sign In' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 90,
      padding: '0 24px',
      minHeight: '68px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'hsla(225, 25%, 7%, 0.9)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid hsla(245, 40%, 60%, 0.1)',
      flexWrap: 'wrap',
      gap: '8px',
    }}>
      {/* Brand */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 0 20px hsla(245, 85%, 60%, 0.35)',
        }}>
          <img src="/logo.png" alt="Student Automation System Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#f1f5f9', lineHeight: 1 }}>
            Student<span style={{ color: '#818cf8' }}>Auth</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 500 }}>Biometric Portal</div>
        </div>
      </Link>

      {/* Hamburger for mobile */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
        style={{
          display: 'none',
          background: 'transparent',
          border: '1px solid hsla(245, 40%, 60%, 0.2)',
          borderRadius: '8px',
          padding: '8px 10px',
          cursor: 'pointer',
          color: '#94a3b8',
          fontSize: '1.1rem',
          lineHeight: 1,
        }}
        className="nav-hamburger"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Nav Links */}
      <nav className={`nav-links-wrapper${mobileOpen ? ' nav-open' : ''}`}>
        <ul style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'inline-block',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    color: isActive ? '#a5b4fc' : '#64748b',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    background: isActive ? 'hsla(245, 85%, 60%, 0.12)' : 'transparent',
                    border: isActive ? '1px solid hsla(245, 85%, 60%, 0.2)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}

          <li style={{ marginLeft: '8px' }}>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.8rem',
                textDecoration: 'none',
                boxShadow: '0 4px 16px hsla(245, 85%, 60%, 0.35)',
              }}
            >
              Get Started
            </Link>
          </li>
        </ul>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .nav-hamburger { display: block !important; }
          .nav-links-wrapper {
            display: none;
            width: 100%;
            padding: 12px 0 16px;
            border-top: 1px solid hsla(245, 40%, 60%, 0.1);
          }
          .nav-links-wrapper.nav-open { display: block; }
          .nav-links-wrapper ul {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .nav-links-wrapper ul li { width: 100%; }
          .nav-links-wrapper ul li a,
          .nav-links-wrapper ul li > a {
            display: block !important;
            width: 100%;
          }
          .nav-links-wrapper ul li:last-child { margin-left: 0 !important; margin-top: 8px; }
        }
      `}} />
    </header>
  );
}
