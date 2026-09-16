'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'credentials'|'face'|'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string|null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [matchScore, setMatchScore] = useState<number|null>(null);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [otp, setOtp] = useState(['','','','','','']);
  const [otpError, setOtpError] = useState<string|null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);

  /* ── Phase 1: Credentials ── */
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid email or password.');
      setUserId(data.userId);
      if (data.requiresFace && data.hasEnrolledFace) {
        setPhase('face');
        loadModelsAndStartCamera();
      } else {
        // OTP already sent by login route when no face enrolled
        setResendCooldown(60);
        setPhase('otp');
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  async function loadModelsAndStartCamera() {
    try {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      let attempts = 0;
      while (!(window as any).faceapi && attempts < 40) { await new Promise(r=>setTimeout(r,250)); attempts++; }
      if ((window as any).faceapi) {
        await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await (window as any).faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        await (window as any).faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      }
      await startCamera();
    } catch (err: any) {
      setError('Face models failed to load. Using OTP-only verification.');
      // Fall back to OTP
      await fetch('/api/auth/otp/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, purpose:'login' }) }).catch(()=>{});
      setResendCooldown(60);
      setPhase('otp');
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:{ideal:640}, height:{ideal:480}, facingMode:'user' }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setCameraActive(true); }
    } catch {
      setError('Camera access denied. Switching to email OTP verification.');
      await fetch('/api/auth/otp/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, purpose:'login' }) }).catch(()=>{});
      setResendCooldown(60);
      setPhase('otp');
    }
  }

  function stopCamera() {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }

  useEffect(() => () => stopCamera(), []);

  /* ── Phase 2: Face Verify ── */
  const handleFaceVerify = async () => {
    if (!videoRef.current || !userId) return;
    setVerifyingFace(true);
    setError(null);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

      let descriptor: number[] = Array.from({ length:128 }, ()=>0.05);
      try {
        const d = await (window as any).faceapi?.detectSingleFace(canvas, new (window as any).faceapi.TinyFaceDetectorOptions({ inputSize:320, scoreThreshold:0.5 })).withFaceLandmarks(true).withFaceDescriptor();
        if (d?.descriptor) descriptor = Array.from(d.descriptor);
      } catch {}

      const res = await fetch('/api/auth/face/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId, liveEmbedding: descriptor }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Face match failed. Ensure good lighting.');
      setMatchScore(data.matchPercentage);
      stopCamera();
      setResendCooldown(60);
      setPhase('otp');
    } catch (err: any) { setError(err.message); }
    finally { setVerifyingFace(false); }
  };

  const skipToOtp = async () => {
    stopCamera();
    await fetch('/api/auth/otp/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, purpose:'login' }) }).catch(()=>{});
    setResendCooldown(60);
    setPhase('otp');
  };

  /* ── Phase 3: OTP ── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) document.getElementById(`login-otp-${index+1}`)?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key==='Backspace' && !otp[index] && index>0) document.getElementById(`login-otp-${index-1}`)?.focus();
  };

  const verifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Please enter all 6 digits.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, otp:code, purpose:'login' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP. Please try again.');
      router.push('/dashboard');
    } catch (err: any) { setOtpError(err.message); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (resendCooldown>0) return;
    setOtpError(null);
    try { await fetch('/api/auth/otp/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, purpose:'login' }) }); setResendCooldown(60); }
    catch {}
  };

  useEffect(() => {
    if (resendCooldown<=0) return;
    const t = setInterval(()=>setResendCooldown(c=>c-1),1000);
    return ()=>clearInterval(t);
  }, [resendCooldown]);

  /* ── Shared Styles ── */
  const card: React.CSSProperties = { background:'hsla(225,25%,10%,0.88)', border:'1px solid hsla(245,40%,60%,0.14)', borderRadius:'24px', backdropFilter:'blur(20px)', padding:'40px 36px', boxShadow:'0 24px 64px hsla(225,50%,4%,0.6)' };
  const inp: React.CSSProperties = { width:'100%', padding:'13px 16px', background:'hsla(225,25%,11%,0.9)', border:'1.5px solid hsla(245,40%,60%,0.18)', borderRadius:'10px', color:'#f1f5f9', fontSize:'0.9375rem', fontFamily:"'Inter',sans-serif", outline:'none', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { fontSize:'0.78rem', fontWeight:700, color:'#64748b', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'6px', display:'block' };
  const primaryBtn: React.CSSProperties = { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'14px 24px', borderRadius:'12px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', fontWeight:700, fontSize:'0.95rem', border:'none', cursor:'pointer', boxShadow:'0 6px 24px hsla(245,85%,60%,0.35)', transition:'opacity 0.15s' };
  const focusInp = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='#6366f1'; e.target.style.boxShadow='0 0 0 3px hsla(245,85%,60%,0.15)'; };
  const blurInp  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='hsla(245,40%,60%,0.18)'; e.target.style.boxShadow='none'; };
  const errBox = (msg: string) => (
    <div style={{ padding:'12px 16px', borderRadius:'10px', background:'hsla(0,84%,60%,0.1)', border:'1px solid hsla(0,84%,60%,0.3)', color:'#fca5a5', fontSize:'0.875rem', marginBottom:'20px' }}>⚠️ {msg}</div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'hsl(225,25%,7%)' }}>
      <Navbar />

      <main style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 20px', minHeight:'calc(100vh - 68px)' }}>
        <div style={{ width:'100%', maxWidth:'440px' }}>

          {/* ══ PHASE 1: Credentials ══ */}
          {phase === 'credentials' && (
            <div style={card}>
              <div style={{ textAlign:'center', marginBottom:'32px' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 16px', boxShadow:'0 8px 24px hsla(245,85%,60%,0.4)' }}>🔐</div>
                <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.8rem', fontWeight:800, color:'#f1f5f9', marginBottom:'6px' }}>Welcome back</h1>
                <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Sign in to continue to the biometric portal</p>
              </div>

              {error && errBox(error)}

              <form onSubmit={handleCredentialsSubmit}>
                <div style={{ marginBottom:'16px' }}>
                  <label style={lbl}>Email Address</label>
                  <input type="email" required placeholder="student@college.edu" value={email} onChange={e=>setEmail(e.target.value)} style={inp} onFocus={focusInp} onBlur={blurInp} />
                </div>
                <div style={{ marginBottom:'28px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                    <label style={{ ...lbl, marginBottom:0 }}>Password</label>
                    <a href="#" style={{ fontSize:'0.78rem', color:'#818cf8', textDecoration:'none', fontWeight:600 }}>Forgot?</a>
                  </div>
                  <input type="password" required placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={inp} onFocus={focusInp} onBlur={blurInp} />
                </div>

                <button type="submit" disabled={loading} style={{ ...primaryBtn, marginBottom:'20px', opacity:loading?0.6:1 }}>
                  {loading ? 'Authenticating…' : 'Sign In →'}
                </button>

                {/* Auth steps */}
                <div style={{ display:'flex', gap:'6px', justifyContent:'center', alignItems:'center', marginBottom:'20px' }}>
                  {[{i:'🔑',l:'Password'},{i:'→',l:''},{i:'📸',l:'Face Match'},{i:'→',l:''},{i:'✉️',l:'OTP Code'}].map((it,idx)=>(
                    <div key={idx}>
                      {it.l ? <div style={{ textAlign:'center' }}><div style={{ fontSize:'1rem' }}>{it.i}</div><div style={{ fontSize:'0.6rem', color:'#475569', fontWeight:600 }}>{it.l}</div></div>
                             : <span style={{ color:'#334155', fontWeight:700 }}>{it.i}</span>}
                    </div>
                  ))}
                </div>

                <p style={{ textAlign:'center', fontSize:'0.875rem', color:'#475569' }}>
                  Don&apos;t have an account? <Link href="/register" style={{ color:'#818cf8', fontWeight:600, textDecoration:'none' }}>Enroll Here</Link>
                </p>
              </form>
            </div>
          )}

          {/* ══ PHASE 2: Live Face ══ */}
          {phase === 'face' && (
            <div style={card}>
              <div style={{ textAlign:'center', marginBottom:'20px' }}>
                <span style={{ display:'inline-block', padding:'4px 14px', borderRadius:'999px', background:'hsla(245,85%,60%,0.12)', border:'1px solid hsla(245,85%,60%,0.25)', color:'#a5b4fc', fontSize:'0.75rem', fontWeight:700, marginBottom:'12px' }}>
                  Step 2: Biometric Verification
                </span>
                <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.5rem', fontWeight:800, color:'#f1f5f9', marginBottom:'4px' }}>Align Your Face</h2>
                <p style={{ color:'#64748b', fontSize:'0.85rem' }}>Look directly at the camera to match against your enrolled facial data</p>
              </div>

              {error && errBox(error)}

              <div style={{ position:'relative', borderRadius:'16px', overflow:'hidden', background:'#000', aspectRatio:'4/3', marginBottom:'20px' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display:'block' }} />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                  <div style={{ width:'175px', height:'235px', borderRadius:'50%', border:'3px solid hsla(245,85%,70%,0.7)', boxShadow:'0 0 0 9999px rgba(10,10,20,0.45)' }} />
                </div>
                <div style={{ position:'absolute', top:'12px', left:'12px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'999px', background:'rgba(0,0,0,0.7)', fontSize:'0.7rem', fontWeight:700, color:'#ef4444' }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:'#ef4444', animation:'blink 1.5s infinite' }} />
                  BIOMETRIC SCAN
                </div>
              </div>

              <button onClick={handleFaceVerify} disabled={verifyingFace||!cameraActive} style={{ ...primaryBtn, marginBottom:'12px', opacity:(verifyingFace||!cameraActive)?0.6:1 }}>
                {verifyingFace ? 'Comparing Biometrics…' : '📸 Verify Face Identity'}
              </button>

              <button onClick={skipToOtp} style={{ width:'100%', padding:'11px', borderRadius:'10px', background:'none', border:'1px solid hsla(245,40%,60%,0.15)', color:'#64748b', fontSize:'0.85rem', fontWeight:500, cursor:'pointer' }}>
                Camera issue? Use email OTP instead →
              </button>
            </div>
          )}

          {/* ══ PHASE 3: OTP ══ */}
          {phase === 'otp' && (
            <div style={{ ...card, textAlign:'center' }}>
              {matchScore !== null && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 14px', borderRadius:'999px', background:'hsla(142,76%,46%,0.12)', border:'1px solid hsla(142,76%,46%,0.3)', color:'#86efac', fontSize:'0.78rem', fontWeight:700, marginBottom:'20px' }}>
                  ✓ Biometric Match: {matchScore}% confidence
                </div>
              )}

              <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'hsla(185,100%,50%,0.12)', border:'1px solid hsla(185,100%,50%,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 16px' }}>✉️</div>
              <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.6rem', fontWeight:800, color:'#f1f5f9', marginBottom:'6px' }}>Enter Security Code</h2>
              <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'8px' }}>6-digit code dispatched to</p>
              <div style={{ display:'inline-block', padding:'5px 14px', borderRadius:'8px', background:'hsla(245,85%,60%,0.1)', border:'1px solid hsla(245,85%,60%,0.2)', color:'#a5b4fc', fontWeight:700, fontSize:'0.875rem', marginBottom:'28px' }}>
                {email}
              </div>

              {otpError && <div style={{ padding:'12px 16px', borderRadius:'10px', background:'hsla(0,84%,60%,0.1)', border:'1px solid hsla(0,84%,60%,0.3)', color:'#fca5a5', fontSize:'0.875rem', marginBottom:'20px', textAlign:'left' }}>⚠️ {otpError}</div>}

              <form onSubmit={verifyLoginOtp}>
                <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'28px' }}>
                  {otp.map((digit,idx)=>(
                    <input key={idx} id={`login-otp-${idx}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e=>handleOtpChange(idx,e.target.value)} onKeyDown={e=>handleOtpKeyDown(idx,e)}
                      autoFocus={idx===0}
                      style={{ width:'52px', height:'62px', textAlign:'center', fontSize:'1.6rem', fontWeight:800, fontFamily:"'Outfit',sans-serif", background:digit?'hsla(245,85%,60%,0.1)':'hsla(225,25%,11%,0.9)', border:`2px solid ${digit?'#6366f1':'hsla(245,40%,60%,0.18)'}`, borderRadius:'12px', color:'#f1f5f9', outline:'none', transition:'all 0.15s' }}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading||otp.join('').length!==6} style={{ ...primaryBtn, marginBottom:'16px', opacity:(loading||otp.join('').length!==6)?0.5:1 }}>
                  {loading ? 'Verifying…' : 'Complete Sign In →'}
                </button>

                <button type="button" onClick={resendOtp} disabled={resendCooldown>0}
                  style={{ background:'none', border:'none', cursor:resendCooldown>0?'not-allowed':'pointer', color:resendCooldown>0?'#475569':'#818cf8', fontSize:'0.85rem', fontWeight:600 }}>
                  {resendCooldown>0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}} />
    </div>
  );
}
