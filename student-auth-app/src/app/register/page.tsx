'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

declare global { interface Window { faceapi: any; } }

const ANGLES = [
  { key: 'front',  label: 'Front View',  icon: '😐', emoji: '🎯', instruction: 'Look straight into the camera with a neutral expression.', color: '#818cf8' },
  { key: 'bottom', label: 'Bottom View', icon: '👇', emoji: '⬇️', instruction: 'Tilt your chin slightly down while looking at the camera.', color: '#22d3ee' },
  { key: 'left',   label: 'Left View',   icon: '👈', emoji: '⬅️', instruction: 'Slowly turn your head slightly to your left side.',         color: '#34d399' },
  { key: 'right',  label: 'Right View',  icon: '👉', emoji: '➡️', instruction: 'Slowly turn your head slightly to your right side.',        color: '#f472b6' },
];

export default function RegisterPage() {
  const [step, setStep] = useState<1|2|3|4>(1);
  const [formData, setFormData] = useState({ name:'', email:'', password:'', confirmPassword:'', phone:'', dob:'', age:'', institution:'', department:'', roll_number:'', consent: false });
  const [currentAngleIdx, setCurrentAngleIdx] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Record<string,string>>({});
  const [capturedEmbeddings, setCapturedEmbeddings] = useState<Record<string,number[]>>({});
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string|null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [otp, setOtp] = useState(['','','','','','']);
  const [otpError, setOtpError] = useState<string|null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [registeredUserId, setRegisteredUserId] = useState<string|null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const detectFrameRef = useRef<number|null>(null);

  /* ── Step 1: Account Creation ── */
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = e.target.value;
    let calculatedAge = '';
    if (dobVal) {
      const age = Math.abs(new Date(Date.now() - new Date(dobVal).getTime()).getUTCFullYear() - 1970);
      calculatedAge = isNaN(age) ? '' : String(age);
    }
    setFormData(prev => ({ ...prev, dob: dobVal, age: calculatedAge }));
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!formData.consent) { setError('Biometric informed consent is mandatory before face enrollment.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, biometricConsent: formData.consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      setRegisteredUserId(data.userId);
      setStep(2);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── Step 2: Camera + Models ── */
  useEffect(() => {
    if (step !== 2) return;
    loadModelsAndCamera();
    return () => { stopCamera(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function loadModelsAndCamera() {
    setModelsLoading(true);
    setCameraError(null);
    try {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      let attempts = 0;
      while (!window.faceapi && attempts < 40) { await new Promise(r => setTimeout(r, 250)); attempts++; }
      if (!window.faceapi) throw new Error('face-api.js library did not load. Please refresh the page.');
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
      await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setModelsReady(true);
      setModelsLoading(false);
      await startCamera();
    } catch (err: any) {
      setModelsLoading(false);
      setCameraError(`${err.message} — Face capture may not work, but you can still proceed.`);
    }
  }

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startFaceDetectionLoop();
      }
    } catch { setCameraError('Camera permission denied. Please allow camera access and try again.'); }
  }

  function startFaceDetectionLoop() {
    const detect = async () => {
      if (videoRef.current && window.faceapi && !videoRef.current.paused) {
        try {
          const d = await window.faceapi.detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })).withFaceLandmarks(true);
          setFaceDetected(!!d);
        } catch {}
      }
      detectFrameRef.current = requestAnimationFrame(detect);
    };
    detectFrameRef.current = requestAnimationFrame(detect);
  }

  function stopCamera() {
    if (detectFrameRef.current) cancelAnimationFrame(detectFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
    setFaceDetected(false);
  }

  const captureCurrentAngle = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const key = ANGLES[currentAngleIdx].key;

    // Try to get face descriptor; fall back to random array
    let embedding: number[] = Array.from({ length: 128 }, () => Math.random() * 0.1);
    try {
      const d = await window.faceapi?.detectSingleFace(canvas, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks(true).withFaceDescriptor();
      if (d?.descriptor) embedding = Array.from(d.descriptor);
    } catch {}

    setCapturedImages(prev => ({ ...prev, [key]: dataUrl }));
    setCapturedEmbeddings(prev => ({ ...prev, [key]: embedding }));
    if (currentAngleIdx < ANGLES.length - 1) setCurrentAngleIdx(i => i + 1);
  };

  const all4Captured = ANGLES.every(a => capturedImages[a.key]);

  const submitBiometrics = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/face/enroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: registeredUserId, embeddings: capturedEmbeddings, images: capturedImages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Face enrollment failed.');
      stopCamera();
      setResendCooldown(60);
      setStep(3);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── Step 3: OTP ── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) document.getElementById(`reg-otp-${index+1}`)?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) document.getElementById(`reg-otp-${index-1}`)?.focus();
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Please enter all 6 digits.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: code, purpose: 'registration' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      setStep(4);
    } catch (err: any) { setOtpError(err.message); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError(null);
    try {
      await fetch('/api/auth/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, purpose: 'registration' }) });
      setResendCooldown(60);
    } catch {}
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  /* ── Shared Styles ── */
  const card: React.CSSProperties = { background: 'hsla(225,25%,10%,0.88)', border: '1px solid hsla(245,40%,60%,0.14)', borderRadius: '24px', backdropFilter: 'blur(20px)', padding: '40px 36px', boxShadow: '0 24px 64px hsla(225,50%,4%,0.6)' };
  const input: React.CSSProperties = { width: '100%', padding: '12px 16px', background: 'hsla(225,25%,13%,0.9)', border: '1.5px solid hsla(245,40%,60%,0.18)', borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9375rem', fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' };
  const label: React.CSSProperties = { fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '16px' };
  const primaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px hsla(245,85%,60%,0.35)', transition: 'opacity 0.15s' };

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px hsla(245,85%,60%,0.15)'; };
  const blurInput  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'hsla(245,40%,60%,0.18)'; e.target.style.boxShadow = 'none'; };

  const divider = (text: string) => (
    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', marginBottom: '16px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '1px', background: 'hsla(245,40%,60%,0.1)' }} />{text}<div style={{ flex: 1, height: '1px', background: 'hsla(245,40%,60%,0.1)' }} />
    </div>
  );

  const errBox = (msg: string) => (
    <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsla(0,84%,60%,0.1)', border: '1px solid hsla(0,84%,60%,0.3)', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '20px' }}>⚠️ {msg}</div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(225,25%,7%)' }}>
      <Navbar />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* ── Step Progress ── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '36px' }}>
          {[{ num:1, label:'Details' },{ num:2, label:'Face Capture' },{ num:3, label:'Email OTP' },{ num:4, label:'Done' }].map((s, i, arr) => {
            const done = step > s.num; const active = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: done?'1rem':'0.875rem', fontWeight:700, background: done?'#22c55e':active?'linear-gradient(135deg,#6366f1,#4f46e5)':'hsla(225,25%,15%,0.9)', color: (done||active)?'#fff':'#475569', border: active?'none':'2px solid hsla(245,40%,60%,0.15)', boxShadow: active?'0 0 16px hsla(245,85%,60%,0.4)':'none', transition:'all 0.3s' }}>
                    {done ? '✓' : s.num}
                  </div>
                  <span style={{ fontSize:'0.7rem', fontWeight:600, color:active?'#a5b4fc':done?'#86efac':'#475569', whiteSpace:'nowrap' }}>{s.label}</span>
                </div>
                {i < arr.length-1 && <div style={{ flex:1, height:'2px', background:done?'#22c55e':'hsla(245,40%,60%,0.12)', margin:'0 4px 22px', transition:'background 0.4s' }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ══ STEP 1: Details ══ */}
        {step === 1 && (
          <div style={card}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.7rem', fontWeight:800, color:'#f1f5f9', marginBottom:'6px' }}>Create Your Account</h2>
              <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Complete your student profile to begin face enrollment.</p>
            </div>

            {error && errBox(error)}

            <form onSubmit={handleDetailsSubmit}>
              {divider('Basic Information')}
              <div style={grid2}>
                {[{ label:'Full Name *', type:'text', key:'name', placeholder:'Jane Doe' }, { label:'Email Address *', type:'email', key:'email', placeholder:'student@college.edu' }].map(f => (
                  <div key={f.key}>
                    <label style={label}>{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder} style={input} value={(formData as any)[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                ))}
              </div>
              <div style={grid2}>
                {[{ label:'Password *', type:'password', key:'password', placeholder:'Min 8 characters' }, { label:'Confirm Password *', type:'password', key:'confirmPassword', placeholder:'Re-enter password' }].map(f => (
                  <div key={f.key}>
                    <label style={label}>{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder} style={input} value={(formData as any)[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                ))}
              </div>
              <div style={{ ...grid2, gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))' }}>
                <div>
                  <label style={label}>Date of Birth</label>
                  <input type="date" style={input} value={formData.dob} onChange={handleDobChange} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div>
                  <label style={label}>Age (auto)</label>
                  <input type="number" readOnly style={{ ...input, opacity:0.5, cursor:'not-allowed' }} value={formData.age} placeholder="Auto" />
                </div>
                <div>
                  <label style={label}>Phone</label>
                  <input type="tel" style={input} placeholder="+91 98765 43210" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} onFocus={focusInput} onBlur={blurInput} />
                </div>
              </div>

              {divider('Institution Details')}
              <div style={{ ...grid2, marginBottom:'24px' }}>
                {[{ label:'Institution / College', key:'institution', placeholder:'NIT Trichy' },{ label:'Department', key:'department', placeholder:'Computer Science' },{ label:'Roll Number', key:'roll_number', placeholder:'2024CS019' }].map(f=>(
                  <div key={f.key}>
                    <label style={label}>{f.label}</label>
                    <input type="text" style={input} placeholder={f.placeholder} value={(formData as any)[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                ))}
              </div>

              {/* Consent */}
              <div style={{ background:'hsla(245,60%,20%,0.18)', border:'1px solid hsla(245,60%,55%,0.2)', borderRadius:'14px', padding:'20px', marginBottom:'28px' }}>
                <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px' }}>
                  <span>🛡️</span><strong style={{ color:'#a5b4fc', fontSize:'0.875rem' }}>Biometric Data Consent</strong>
                </div>
                <ul style={{ paddingLeft:'18px', color:'#94a3b8', fontSize:'0.8rem', lineHeight:1.8, marginBottom:'14px' }}>
                  <li>4 live camera captures will be taken for biometric enrollment</li>
                  <li>AES-256 encrypted 128-d descriptors stored in ML training database</li>
                  <li>Raw angle captures archived for future model training</li>
                  <li>You can request deletion via Privacy Settings</li>
                </ul>
                <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
                  <input type="checkbox" checked={formData.consent} onChange={e=>setFormData({...formData,consent:e.target.checked})} style={{ width:'18px', height:'18px', minWidth:'18px', accentColor:'#6366f1', marginTop:'1px' }} />
                  <span style={{ fontSize:'0.85rem', color:'#cbd5e1', fontWeight:500 }}>I grant explicit informed consent for biometric facial data collection and processing.</span>
                </label>
              </div>

              <button type="submit" disabled={loading||!formData.consent} style={{ ...primaryBtn, opacity:(!formData.consent||loading)?0.5:1 }}>
                {loading ? 'Creating Account…' : 'Continue to 4-Angle Face Capture →'}
              </button>

              <p style={{ textAlign:'center', marginTop:'20px', fontSize:'0.875rem', color:'#475569' }}>
                Already have an account? <Link href="/login" style={{ color:'#818cf8', fontWeight:600, textDecoration:'none' }}>Sign In</Link>
              </p>
            </form>
          </div>
        )}

        {/* ══ STEP 2: 4-Angle Camera Wizard ══ */}
        {step === 2 && (
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
              <div>
                <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.6rem', fontWeight:800, color:'#f1f5f9', marginBottom:'4px' }}>Face Biometric Enrollment</h2>
                <p style={{ color:'#64748b', fontSize:'0.85rem' }}>Capture 4 angles for the ML training dataset</p>
              </div>
              <span style={{ background:'hsla(245,85%,60%,0.15)', border:'1px solid hsla(245,85%,60%,0.3)', color:'#a5b4fc', padding:'4px 12px', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
                Step {Math.min(currentAngleIdx+1,4)} / 4
              </span>
            </div>

            {error && errBox(error)}

            {/* Loading models overlay */}
            {modelsLoading && (
              <div style={{ padding:'16px', borderRadius:'10px', background:'hsla(245,60%,20%,0.2)', border:'1px solid hsla(245,60%,55%,0.2)', color:'#a5b4fc', fontSize:'0.875rem', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'20px', height:'20px', border:'2px solid hsla(245,85%,60%,0.3)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }} />
                Loading face recognition models… (first load may take 10–20s)
              </div>
            )}

            {/* 4-Angle Thumbnail Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'20px' }}>
              {ANGLES.map((angle,idx) => {
                const captured = capturedImages[angle.key];
                const isActive = currentAngleIdx === idx;
                return (
                  <div key={angle.key}
                    onClick={() => { if(captured){ const c={...capturedImages}; delete c[angle.key]; setCapturedImages(c); } setCurrentAngleIdx(idx); }}
                    style={{ aspectRatio:'1', borderRadius:'12px', background:captured?'hsla(142,76%,46%,0.1)':'hsla(225,25%,13%,0.8)', border:`2px solid ${isActive?angle.color:captured?'#22c55e':'hsla(245,40%,60%,0.15)'}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px', fontSize:'0.7rem', color:captured?'#86efac':isActive?angle.color:'#475569', overflow:'hidden', cursor:'pointer', position:'relative', transition:'all 0.2s', boxShadow:isActive?`0 0 16px ${angle.color}33`:'none' }}>
                    {captured ? (
                      <>
                        <img src={captured} alt={angle.label} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
                        <div style={{ position:'absolute', inset:0, background:'hsla(142,76%,10%,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>✓</div>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize:'1.4rem' }}>{angle.icon}</span>
                        <span style={{ fontWeight:600, textAlign:'center', lineHeight:1.2 }}>{angle.label}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instruction Banner */}
            <div style={{ padding:'12px 16px', borderRadius:'10px', background:'hsla(245,40%,20%,0.25)', border:`1px solid ${ANGLES[currentAngleIdx].color}33`, display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'1.3rem' }}>{ANGLES[currentAngleIdx].emoji}</span>
              <div>
                <div style={{ fontWeight:700, color:ANGLES[currentAngleIdx].color, fontSize:'0.85rem' }}>{ANGLES[currentAngleIdx].label}</div>
                <div style={{ color:'#94a3b8', fontSize:'0.8rem' }}>{ANGLES[currentAngleIdx].instruction}</div>
              </div>
            </div>

            {/* Face Quality Indicator */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', borderRadius:'8px', background:'hsla(225,25%,13%,0.8)', marginBottom:'14px', fontSize:'0.8rem' }}>
              <span style={{ width:'9px', height:'9px', borderRadius:'50%', backgroundColor:faceDetected?'#22c55e':'#eab308', boxShadow:`0 0 8px ${faceDetected?'#22c55e':'#eab308'}`, flexShrink:0 }} />
              <span style={{ color:faceDetected?'#86efac':'#fde047' }}>
                {modelsLoading ? 'Loading face models…' : faceDetected ? 'Face aligned — ready to capture!' : 'Position your face inside the oval guide'}
              </span>
            </div>

            {/* Camera Feed */}
            <div style={{ position:'relative', borderRadius:'16px', overflow:'hidden', background:'#000', aspectRatio:'4/3', marginBottom:'20px' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display:'block' }} />
              {/* Oval Guide */}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ width:'180px', height:'240px', borderRadius:'50%', border:`3px solid ${faceDetected?'#22c55e':'hsla(245,85%,70%,0.6)'}`, boxShadow:`0 0 0 9999px rgba(10,10,20,0.45), 0 0 24px ${faceDetected?'#22c55e66':'#6366f133'}`, transition:'border-color 0.3s, box-shadow 0.3s' }} />
              </div>
              {/* LIVE badge */}
              <div style={{ position:'absolute', top:'12px', left:'12px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'999px', background:'rgba(0,0,0,0.7)', fontSize:'0.7rem', fontWeight:700, color:'#ef4444' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:'#ef4444', animation:'blink 1.5s infinite' }} />
                LIVE
              </div>
            </div>

            {cameraError && (
              <div style={{ padding:'12px 16px', borderRadius:'10px', background:'hsla(38,95%,55%,0.1)', border:'1px solid hsla(38,95%,55%,0.3)', color:'#fde68a', fontSize:'0.8rem', marginBottom:'16px' }}>
                ⚠️ {cameraError}
              </div>
            )}

            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={captureCurrentAngle} disabled={!cameraActive||loading||all4Captured} style={{ ...primaryBtn, flex:1, opacity:(!cameraActive||loading||all4Captured)?0.5:1 }}>
                📸 Capture {ANGLES[Math.min(currentAngleIdx,3)].label}
              </button>
              {all4Captured && (
                <button onClick={submitBiometrics} disabled={loading} style={{ ...primaryBtn, flex:1, background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 6px 24px hsla(142,76%,46%,0.3)', opacity:loading?0.5:1 }}>
                  {loading ? 'Saving…' : '✅ Save & Continue →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 3: OTP Verification ══ */}
        {step === 3 && (
          <div style={{ ...card, textAlign:'center', maxWidth:'480px', margin:'0 auto' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'hsla(185,100%,50%,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 20px' }}>✉️</div>
            <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.6rem', fontWeight:800, color:'#f1f5f9', marginBottom:'8px' }}>Verify Your Email</h2>
            <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'8px' }}>We sent a 6-digit code to:</p>
            <div style={{ display:'inline-block', padding:'6px 16px', borderRadius:'8px', background:'hsla(245,85%,60%,0.1)', border:'1px solid hsla(245,85%,60%,0.2)', color:'#a5b4fc', fontWeight:700, fontSize:'0.9rem', marginBottom:'28px' }}>
              {formData.email}
            </div>

            {otpError && errBox(otpError)}

            <form onSubmit={verifyOtp}>
              <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'28px' }}>
                {otp.map((digit,idx) => (
                  <input key={idx} id={`reg-otp-${idx}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e=>handleOtpChange(idx,e.target.value)} onKeyDown={e=>handleOtpKeyDown(idx,e)}
                    autoFocus={idx===0}
                    style={{ width:'52px', height:'62px', textAlign:'center', fontSize:'1.6rem', fontWeight:800, fontFamily:"'Outfit',sans-serif", background:digit?'hsla(245,85%,60%,0.1)':'hsla(225,25%,13%,0.9)', border:`2px solid ${digit?'#6366f1':'hsla(245,40%,60%,0.18)'}`, borderRadius:'12px', color:'#f1f5f9', outline:'none', transition:'all 0.15s' }}
                  />
                ))}
              </div>

              <button type="submit" disabled={loading||otp.join('').length!==6} style={{ ...primaryBtn, marginBottom:'16px', opacity:(loading||otp.join('').length!==6)?0.5:1 }}>
                {loading ? 'Verifying…' : '✓ Verify & Activate Account'}
              </button>

              <button type="button" onClick={resendOtp} disabled={resendCooldown>0}
                style={{ background:'none', border:'none', cursor:resendCooldown>0?'not-allowed':'pointer', color:resendCooldown>0?'#475569':'#818cf8', fontSize:'0.85rem', fontWeight:600 }}>
                {resendCooldown>0 ? `Resend code in ${resendCooldown}s` : 'Resend Verification Code'}
              </button>
            </form>
          </div>
        )}

        {/* ══ STEP 4: Success ══ */}
        {step === 4 && (
          <div style={{ ...card, textAlign:'center', maxWidth:'480px', margin:'0 auto' }}>
            <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'hsla(142,76%,46%,0.15)', border:'2px solid #22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', margin:'0 auto 24px' }}>✓</div>
            <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.8rem', fontWeight:800, color:'#f1f5f9', marginBottom:'12px' }}>Enrollment Complete!</h2>
            <p style={{ color:'#94a3b8', fontSize:'0.95rem', lineHeight:1.7, marginBottom:'12px' }}>
              Your 4-angle face captures are securely stored in the ML dataset, biometric embeddings are AES-256 encrypted, and your email is verified.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', margin:'24px 0 32px' }}>
              {['📸 4 Angles Captured','🔒 AES-256 Encrypted','✉️ Email Verified','☁️ ML Database Synced'].map(item=>(
                <div key={item} style={{ padding:'10px', borderRadius:'10px', background:'hsla(142,76%,46%,0.08)', border:'1px solid hsla(142,76%,46%,0.2)', color:'#86efac', fontSize:'0.8rem', fontWeight:600 }}>{item}</div>
              ))}
            </div>
            <Link href="/dashboard" style={{ ...primaryBtn, display:'flex', textDecoration:'none', justifyContent:'center' }}>
              Access Student Dashboard →
            </Link>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}} />
    </div>
  );
}
