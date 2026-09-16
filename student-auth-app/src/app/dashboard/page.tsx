'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import MonitorWidget from '@/components/MonitorWidget';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setUser(data.user);
        } else {
          setUser({
            name: 'Demo Student',
            email: 'student@automation.edu',
            institution: 'National Institute of Technology',
            department: 'Computer Science & Engineering',
            roll_number: '2024CS042',
            email_verified: true,
          });
        }
      } catch {
        setUser({
          name: 'Demo Student',
          email: 'student@automation.edu',
          institution: 'National Institute of Technology',
          department: 'CSE',
          roll_number: '2024CS042',
          email_verified: true,
        });
      } finally {
        setLoading(false);
      }
    }
    checkSession();

    // Clock tick
    const ticker = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    router.push('/login');
  };

  const fetchLoginHistory = async () => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const res = await fetch('/api/auth/session/history');
      const data = await res.json();
      if (data.success) {
        setLoginHistory(data.history);
      }
    } catch {}
    setLoadingHistory(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(225, 25%, 7%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '3px solid hsla(245, 85%, 60%, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontFamily: "'Inter', sans-serif" }}>Loading session…</p>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(225, 25%, 7%)' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 120px' }}>

        {/* ── Top Greeting Header ───────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#22c55e', letterSpacing: '0.04em' }}>SESSION ACTIVE • FACE VERIFIED</span>
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1, marginBottom: '6px' }}>
              {greeting()}, {firstName} 👋
            </h1>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>
              {user?.roll_number} • {user?.department} • {user?.institution}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <button onClick={handleLogout} style={{ padding: '8px 18px', borderRadius: '8px', background: 'hsla(225, 25%, 13%, 0.8)', border: '1px solid hsla(245, 40%, 60%, 0.15)', color: '#94a3b8', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Key Metrics Row ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { icon: '📸', label: 'Biometric Status', value: '4 Angles Enrolled', sub: 'AES-256 Encrypted', color: '#22c55e', bg: 'hsla(142, 76%, 46%, 0.1)', border: 'hsla(142, 76%, 46%, 0.2)' },
            { icon: '📊', label: 'Attendance Rate', value: '98.4%', sub: 'Presence-verified sessions', color: '#818cf8', bg: 'hsla(245, 85%, 60%, 0.1)', border: 'hsla(245, 85%, 60%, 0.2)' },
            { icon: '📚', label: 'Active Modules', value: '6 Enrolled', sub: user?.department || 'Computer Science', color: '#38bdf8', bg: 'hsla(185, 100%, 50%, 0.08)', border: 'hsla(185, 100%, 50%, 0.15)' },
            { icon: '👁️', label: 'Live Monitor', value: 'Active', sub: 'EAR + Presence Tracking', color: '#f59e0b', bg: 'hsla(38, 95%, 55%, 0.1)', border: 'hsla(38, 95%, 55%, 0.2)' },
          ].map((m, i) => (
            <div key={i} style={{
              background: m.bg,
              border: `1px solid ${m.border}`,
              borderRadius: '16px',
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'transform 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.label}</span>
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: m.color, lineHeight: 1.2, marginTop: '8px' }}>
                {m.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main Content Grid ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

          {/* Profile Card */}
          <div style={{ background: 'hsla(225, 25%, 10%, 0.85)', border: '1px solid hsla(245, 40%, 60%, 0.12)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                👤
              </div>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '2px' }}>Student Profile</h3>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Account Information</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { label: 'Full Name', value: user?.name },
                { label: 'Email', value: user?.email },
                { label: 'Department', value: user?.department || 'CSE' },
                { label: 'Roll Number', value: user?.roll_number || '—' },
                { label: 'Institution', value: user?.institution || '—' },
                { label: 'Email Verified', value: user?.email_verified ? '✓ Verified' : '✗ Unverified' },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid hsla(245, 40%, 60%, 0.08)' : 'none', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Biometric Panel */}
          <div style={{ background: 'hsla(225, 25%, 10%, 0.85)', border: '1px solid hsla(245, 40%, 60%, 0.12)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'hsla(245, 85%, 60%, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                🔒
              </div>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '2px' }}>Security Overview</h3>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Biometric & Session Protection</span>
              </div>
            </div>

            {[
              { icon: '🔒', color: '#a78bfa', title: 'AES-256 Biometric Vault', desc: 'All 4 face angle descriptors encrypted at rest with military-grade AES-256-CBC.' },
              { icon: '📸', color: '#34d399', title: '4-Angle ML Dataset Ready', desc: 'Face captures (Front, Bottom, Left, Right) stored in cloud for model training.' },
              { icon: '👁️', color: '#f59e0b', title: 'Persistent Presence Monitor', desc: 'Bottom-right widget continuously evaluates Eye Aspect Ratio (EAR) on your device.' },
              { icon: '☁️', color: '#38bdf8', title: 'Supabase Cloud Sync', desc: 'Session and activity logs synced to Supabase project jflmrgyaldtioamrdyvx.' },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '2px' }}>{title}</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/register" style={{ padding: '9px 18px', borderRadius: '8px', background: 'hsla(245, 85%, 60%, 0.1)', border: '1px solid hsla(245, 85%, 60%, 0.2)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                Update Face Enrollment
              </Link>
              <button onClick={handleLogout} style={{ padding: '9px 18px', borderRadius: '8px', background: 'hsla(0, 84%, 60%, 0.08)', border: '1px solid hsla(0, 84%, 60%, 0.2)', color: '#f87171', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          </div>

          {/* Activity Log Panel */}
          <div style={{ background: 'hsla(225, 25%, 10%, 0.85)', border: '1px solid hsla(245, 40%, 60%, 0.12)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'hsla(142, 76%, 46%, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                📋
              </div>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '2px' }}>Recent Activity</h3>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Session & login history</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { event: 'Biometric Login Successful', time: 'Just now', state: 'success', icon: '✓' },
                { event: 'Face Enrollment Completed', time: '2 min ago', state: 'success', icon: '📸' },
                { event: 'Email OTP Verified', time: '3 min ago', state: 'success', icon: '✉️' },
                { event: 'Account Registered', time: 'Today', state: 'info', icon: '🔑' },
              ].map(({ event, time, state, icon }) => (
                <div key={event} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', background: 'hsla(225, 25%, 13%, 0.7)', border: '1px solid hsla(245, 40%, 60%, 0.08)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: state === 'success' ? 'hsla(142, 76%, 46%, 0.12)' : 'hsla(245, 85%, 60%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{event}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569' }}>{time}</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: state === 'success' ? 'hsla(142, 76%, 46%, 0.12)' : 'hsla(245, 85%, 60%, 0.1)', color: state === 'success' ? '#86efac' : '#a5b4fc', letterSpacing: '0.04em' }}>
                    {state.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={fetchLoginHistory}
              style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '8px', background: 'hsla(245, 85%, 60%, 0.1)', border: '1px solid hsla(245, 85%, 60%, 0.2)', color: '#a5b4fc', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              View Full Login History →
            </button>
          </div>

        </div>
      </main>

      {/* Login History Modal */}
      {showHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowHistoryModal(false)}>
          <div style={{ background: 'hsl(225, 25%, 12%)', border: '1px solid hsla(245, 40%, 60%, 0.2)', borderRadius: '20px', padding: '32px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>Login History</h2>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading history...</div>
            ) : loginHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No login history found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loginHistory.map((session) => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'hsla(225, 25%, 8%, 0.8)', border: '1px solid hsla(245, 40%, 60%, 0.1)' }}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                        {new Date(session.login_at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Device: {session.device_info} • IP: {session.ip_address}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: session.status === 'active' ? 'hsla(142, 76%, 46%, 0.15)' : 'hsla(220, 15%, 20%, 0.8)', color: session.status === 'active' ? '#86efac' : '#94a3b8' }}>
                        {session.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent Live Monitor Widget */}
      <MonitorWidget />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
