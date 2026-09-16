'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'hsl(225, 25%, 7%)' }}>
      <Navbar />

      <main style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            About the Platform
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Redefining student identity and presence verification with on-device AI and biometric infrastructure.
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, hsla(225, 25%, 12%, 0.8), hsla(225, 25%, 9%, 0.9))',
          border: '1px solid hsla(245, 40%, 60%, 0.15)',
          borderRadius: '24px',
          padding: '48px',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
        }}>
          {/* Creator Profile */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ padding: '6px 12px', background: 'hsla(245, 85%, 60%, 0.15)', color: '#a5b4fc', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  SIH 2024 INITIATIVE
                </span>
              </div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>
                Created by S. Manohar
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 24px 0' }}>
                The Student Automation System was engineered from the ground up for the <strong>Smart India Hackathon (SIH)</strong>. 
                The core mission is to solve the pervasive issue of proxy attendance and insecure online examinations through seamless, real-time, privacy-first biometric verification.
              </p>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <Link href="/register" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px hsla(245, 85%, 60%, 0.3)' }}>
                  View Project Demo
                </Link>
              </div>
            </div>

            {/* In Net Creations Card */}
            <div style={{ flex: '1 1 250px', background: 'hsla(225, 25%, 7%, 0.6)', border: '1px solid hsla(245, 40%, 60%, 0.1)', borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
              <div style={{ width: '90px', height: '90px', margin: '0 auto 20px', borderRadius: '20px', overflow: 'hidden', border: '2px solid hsla(245, 85%, 60%, 0.3)', boxShadow: '0 8px 24px hsla(245, 85%, 60%, 0.2)' }}>
                <img src="/logo.png" alt="In Net Creations" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0' }}>In Net Creations</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Empowering the future of education with robust AI integrations.
              </p>
              <div style={{ padding: '12px', background: 'hsla(245, 85%, 60%, 0.1)', borderRadius: '12px' }}>
                <div style={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', margin: '0 0 4px 0' }}>CONTACT US</div>
                <a href="mailto:innetcreations@gmail.com" style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', wordBreak: 'break-all' }}>
                  innetcreations@gmail.com
                </a>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid hsla(245, 40%, 60%, 0.15)', margin: 0 }} />

          {/* Mission & Tech Specs */}
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 20px 0' }}>
              Core Technologies
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Biometric AI', desc: 'On-device face-api.js embeddings ensuring absolute privacy.' },
                { title: 'Presence Monitor', desc: 'Real-time 8-mode activity detection with EAR/MAR tracking.' },
                { title: 'Serverless Infrastructure', desc: 'Powered by Next.js App Router and Supabase cloud DB.' },
                { title: 'AES-256 Vault', desc: 'All biometric descriptors encrypted at rest.' }
              ].map((tech) => (
                <div key={tech.title} style={{ background: 'hsla(225, 25%, 15%, 0.4)', padding: '20px', borderRadius: '16px', border: '1px solid hsla(245, 40%, 60%, 0.08)' }}>
                  <div style={{ color: '#a5b4fc', fontWeight: 700, margin: '0 0 8px 0' }}>{tech.title}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{tech.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: 'hsla(225, 25%, 5%, 1)', borderTop: '1px solid hsla(245, 40%, 60%, 0.1)', padding: '40px 24px', textAlign: 'center', marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>StudentAuth</span>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 8px 0' }}>
          Created by <strong>S. Manohar</strong> • For <strong>SIH Purpose</strong>
        </p>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 24px 0' }}>
          Powered by <strong>In Net Creations</strong>
        </p>
      </footer>
    </div>
  );
}
