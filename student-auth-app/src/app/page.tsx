'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

const cardData = [
  {
    icon: '📸',
    gradient: 'linear-gradient(135deg, hsla(245, 85%, 60%, 0.15), hsla(245, 85%, 60%, 0.03))',
    border: 'hsla(245, 85%, 60%, 0.25)',
    iconBg: 'hsla(245, 85%, 60%, 0.15)',
    title: '4-Angle Live Face Capture',
    description: 'A guided biometric wizard captures your face from Front, Bottom, Left, and Right angles. Embeddings are extracted on-device with face-api.js and secured in the ML training database.',
  },
  {
    icon: '✉️',
    gradient: 'linear-gradient(135deg, hsla(185, 100%, 50%, 0.12), hsla(185, 100%, 50%, 0.02))',
    border: 'hsla(185, 100%, 50%, 0.2)',
    iconBg: 'hsla(185, 100%, 50%, 0.15)',
    title: 'Real OTP Email Dispatch',
    description: 'Live Gmail SMTP integration with Nodemailer delivers styled, 6-digit one-time password emails in real time for secure registration and 2FA login verification.',
  },
  {
    icon: '👁️',
    gradient: 'linear-gradient(135deg, hsla(142, 76%, 46%, 0.12), hsla(142, 76%, 46%, 0.02))',
    border: 'hsla(142, 76%, 46%, 0.2)',
    iconBg: 'hsla(142, 76%, 46%, 0.15)',
    title: 'Live Presence Monitor',
    description: 'A persistent corner widget uses Eye Aspect Ratio (EAR) and 68 facial landmarks for continuous on-device Active / Idle / Drowsy state classification.',
  },
  {
    icon: '🔒',
    gradient: 'linear-gradient(135deg, hsla(270, 70%, 55%, 0.12), hsla(270, 70%, 55%, 0.02))',
    border: 'hsla(270, 70%, 55%, 0.2)',
    iconBg: 'hsla(270, 70%, 55%, 0.15)',
    title: 'AES-256 Biometric Vault',
    description: 'Face embeddings are encrypted at rest with military-grade AES-256-CBC encryption, stored to Supabase cloud with row-level security policies enforced.',
  },
  {
    icon: '☁️',
    gradient: 'linear-gradient(135deg, hsla(38, 95%, 55%, 0.12), hsla(38, 95%, 55%, 0.02))',
    border: 'hsla(38, 95%, 55%, 0.2)',
    iconBg: 'hsla(38, 95%, 55%, 0.15)',
    title: 'Supabase Cloud Backend',
    description: 'Full PostgreSQL schema with users, face_credentials, otp_codes, login_sessions, and activity logs. Automatic local fallback ensures zero downtime.',
  },
  {
    icon: '🛡️',
    gradient: 'linear-gradient(135deg, hsla(0, 84%, 60%, 0.12), hsla(0, 84%, 60%, 0.02))',
    border: 'hsla(0, 84%, 60%, 0.2)',
    iconBg: 'hsla(0, 84%, 60%, 0.15)',
    title: 'Multi-Layer 2FA Security',
    description: 'Layered authentication: bcrypt password hashing → live face biometric match → time-limited OTP email code. Spoofing and brute-force resistant by design.',
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'hsl(225, 25%, 7%)' }}>
      <Navbar />

      <main>
        {/* ── Hero Section ── */}
        <section style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px 60px',
        }}>

          <div className="hero-pill">
            <span className="hero-dot" />
            SIH 2024 • Biometric Identity Platform
          </div>

          <h1 className="hero-heading">
            Student Automation System
          </h1>

          <p className="hero-sub">
            A production-grade biometric identity gateway combining{' '}
            <strong style={{ color: '#c4b5fd' }}>4-angle facial enrollment</strong>,{' '}
            <strong style={{ color: '#67e8f9' }}>real-time OTP email delivery</strong>, and a{' '}
            <strong style={{ color: '#86efac' }}>persistent live activity monitor</strong>.
          </p>

          <div className="hero-btns">
            <Link href="/register" className="btn-hero-primary">📸 Enroll Your Face</Link>
            <Link href="/login" className="btn-hero-secondary">🔐 Sign In to Portal</Link>
            <Link href="/dashboard" className="btn-hero-ghost">Dashboard →</Link>
          </div>

          <div className="status-banner">
            {[
              { dot: '#22c55e', label: 'Gmail SMTP Online', sub: 'innetcreations@gmail.com' },
              { dot: '#38bdf8', label: 'Supabase Connected', sub: 'jflmrgyaldtioamrdyvx' },
              { dot: '#a78bfa', label: 'AES-256 Encryption', sub: 'Biometric vault ready' },
            ].map((item, i) => (
              <div key={i} className="status-item">
                <span className="status-dot" style={{ backgroundColor: item.dot, boxShadow: `0 0 8px ${item.dot}` }} />
                <div>
                  <div className="status-label">{item.label}</div>
                  <div className="status-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Cards ── */}
        <section style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>
              Enterprise-Grade Features
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              Every layer designed for production security and real-world deployment.
            </p>
          </div>

          <div className="card-grid">
            {cardData.map((card, i) => (
              <div key={i} className="feature-card" style={{ background: card.gradient, border: `1px solid ${card.border}` }}>
                <div className="feature-icon" style={{ background: card.iconBg }}>{card.icon}</div>
                <h3 className="feature-title">{card.title}</h3>
                <p className="feature-desc">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── About Us Section ── */}
        <section id="about" style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>
              About the Platform
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              Built for the Smart India Hackathon to solve next-generation identity challenges.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, hsla(245, 25%, 12%, 0.8), hsla(245, 25%, 8%, 0.9))',
            border: '1px solid hsla(245, 40%, 60%, 0.15)',
            borderRadius: '24px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ padding: '6px 12px', background: 'hsla(245, 85%, 60%, 0.15)', color: '#a5b4fc', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  SIH INITIATIVE
                </span>
                <span style={{ padding: '6px 12px', background: 'hsla(142, 76%, 46%, 0.15)', color: '#86efac', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  AI VERIFIED
                </span>
              </div>
              
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }}>
                Created by S. Manohar
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7, marginBottom: '24px' }}>
                This application was envisioned and created specifically for the <strong>Smart India Hackathon (SIH)</strong>. 
                Our goal is to provide a robust, privacy-first biometric gateway that eliminates proxy attendance and secures student authentication entirely within the browser.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px', borderLeft: '2px solid hsla(245, 85%, 60%, 0.3)' }}>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#a5b4fc' }}>Powered by:</strong> In Net Creations
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#a5b4fc' }}>Contact:</strong> <a href="mailto:innetcreations@gmail.com" style={{ color: '#67e8f9', textDecoration: 'none' }}>innetcreations@gmail.com</a>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '340px', background: 'hsla(225, 25%, 7%, 0.6)', border: '1px solid hsla(245, 40%, 60%, 0.1)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', borderRadius: '20px', overflow: 'hidden', border: '2px solid hsla(245, 85%, 60%, 0.3)' }}>
                  <img src="/logo.png" alt="In Net Creations Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h4 style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 600, marginBottom: '4px' }}>In Net Creations</h4>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Pioneering Digital Innovation</p>
                <a href="mailto:innetcreations@gmail.com" style={{ display: 'inline-block', padding: '10px 20px', background: 'hsla(245, 85%, 60%, 0.15)', color: '#a5b4fc', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s ease' }}>
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Strip ── */}
        <section style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="cta-strip">
            <h2 className="cta-title">Ready to enroll your biometrics?</h2>
            <p className="cta-sub">Takes under 2 minutes to complete the 4-angle face capture and email verification.</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn-hero-primary">Start Enrollment →</Link>
              <Link href="/dashboard" className="btn-hero-secondary">View Dashboard</Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: 'hsla(225, 25%, 5%, 1)', borderTop: '1px solid hsla(245, 40%, 60%, 0.1)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>StudentAuth</span>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>
          Created by <strong>S. Manohar</strong> • For <strong>SIH Purpose</strong>
        </p>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
          Powered by <strong>In Net Creations</strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <a href="/about" style={{ color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none' }}>About Us</a>
          <a href="mailto:innetcreations@gmail.com" style={{ color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none' }}>Contact</a>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .hero-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 18px; border-radius: 999px;
          background: hsla(245,85%,60%,0.12); border: 1px solid hsla(245,85%,60%,0.3);
          color: #a5b4fc; font-size: 0.8rem; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 28px; animation: fadeInDown 0.6s ease both;
        }
        .hero-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e; display: inline-block;
        }
        .hero-heading {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.8rem, 6vw, 5rem); font-weight: 800;
          line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 28px;
          background: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 45%, #38bdf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: fadeInUp 0.7s ease 0.1s both; max-width: 900px;
        }
        .hero-sub {
          font-size: clamp(1rem, 2.5vw, 1.25rem); color: hsl(220,15%,60%);
          line-height: 1.8; max-width: 640px; margin-bottom: 44px;
          animation: fadeInUp 0.7s ease 0.2s both;
        }
        .hero-btns {
          display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
          animation: fadeInUp 0.7s ease 0.3s both;
        }
        .btn-hero-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff; font-weight: 700; font-size: 0.95rem;
          text-decoration: none; box-shadow: 0 8px 32px hsla(245,85%,60%,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-hero-primary:hover {
          transform: translateY(-2px); box-shadow: 0 12px 40px hsla(245,85%,60%,0.55);
        }
        .btn-hero-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 12px;
          background: hsla(225,25%,14%,0.9); color: #e2e8f0;
          font-weight: 600; font-size: 0.95rem; text-decoration: none;
          border: 1px solid hsla(245,40%,60%,0.25);
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-hero-secondary:hover { background: hsla(225,25%,18%,0.95); border-color: hsla(245,40%,60%,0.4); }
        .btn-hero-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 12px; background: transparent;
          color: #94a3b8; font-weight: 600; font-size: 0.95rem; text-decoration: none;
          border: 1px solid hsla(245,40%,60%,0.15);
          transition: color 0.2s, border-color 0.2s;
        }
        .btn-hero-ghost:hover { color: #e2e8f0; border-color: hsla(245,40%,60%,0.35); }
        .status-banner {
          margin-top: 56px; padding: 14px 28px; border-radius: 12px;
          background: hsla(225,25%,12%,0.7); border: 1px solid hsla(142,76%,46%,0.2);
          backdrop-filter: blur(20px); display: flex; align-items: center;
          gap: 24px; flex-wrap: wrap; justify-content: center;
          animation: fadeInUp 0.7s ease 0.4s both;
        }
        .status-item { display: flex; align-items: center; gap: 10px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
        .status-label { font-size: 0.8rem; font-weight: 600; color: #e2e8f0; }
        .status-sub { font-size: 0.7rem; color: #64748b; }
        .card-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;
        }
        .feature-card {
          border-radius: 20px; padding: 28px 24px; backdrop-filter: blur(16px);
          transition: transform 0.25s ease, box-shadow 0.25s ease; cursor: default;
        }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px hsla(225,50%,4%,0.5); }
        .feature-icon {
          width: 50px; height: 50px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; margin-bottom: 18px;
        }
        .feature-title { font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin-bottom: 10px; }
        .feature-desc { color: #94a3b8; font-size: 0.875rem; line-height: 1.7; }
        .cta-strip {
          border-radius: 24px;
          background: linear-gradient(135deg, hsla(245,85%,30%,0.4), hsla(185,100%,30%,0.25));
          border: 1px solid hsla(245,60%,60%,0.25);
          padding: 52px 40px; text-align: center; backdrop-filter: blur(20px);
        }
        .cta-title { font-family: 'Outfit', sans-serif; font-size: clamp(1.5rem,3vw,2.2rem); font-weight: 800; color: #f1f5f9; margin-bottom: 12px; }
        .cta-sub { color: #94a3b8; font-size: 1rem; margin-bottom: 32px; }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }
        }
      `
      }} />
    </div>
  );
}
