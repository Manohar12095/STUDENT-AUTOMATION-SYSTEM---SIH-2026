'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    faceapi: any;
  }
}

export default function MonitorWidget() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [state, setState] = useState<'normal' | 'active' | 'idle' | 'sleeping' | 'talking' | 'moving' | 'no-response' | 'blackscreen'>('normal');
  const [testMode, setTestMode] = useState<string>('auto');
  const [minimized, setMinimized] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera for dashboard monitoring
  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;

    async function initCamera() {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        let attempts = 0;
        while (!window.faceapi && attempts < 30) { await new Promise((r) => setTimeout(r, 200)); attempts++; }
        if (window.faceapi && window.faceapi.nets) {
           await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
           await window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        }

        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Dashboard monitor camera access note:', err);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Periodic Face & Eye Aspect Ratio state evaluation
  useEffect(() => {
    if (isPaused) return;

    let noFaceCount = 0;
    let sleepingCount = 0;

    const interval = setInterval(async () => {
      if (testMode !== 'auto') {
        updateState(testMode as any);
        return;
      }

      if (!videoRef.current || !window.faceapi || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      // 1. Blackscreen Detection
      if (canvasRef.current && videoRef.current) {
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 32, 24);
          const frameData = ctx.getImageData(0, 0, 32, 24).data;
          let brightness = 0;
          for (let i = 0; i < frameData.length; i += 4) {
            brightness += (frameData[i] + frameData[i+1] + frameData[i+2]) / 3;
          }
          brightness = brightness / (32 * 24);
          if (brightness < 12) {
            updateState('blackscreen');
            return;
          }
        }
      }

      try {
        const detection = await window.faceapi
          ?.detectSingleFace(
            videoRef.current,
            new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
          )
          ?.withFaceLandmarks(true);

        if (!detection) {
          noFaceCount++;
          if (noFaceCount >= 3) {
            updateState('no-response');
          } else if (noFaceCount === 2) {
            updateState('idle');
          }
          lastPosRef.current = null;
          return;
        }

        noFaceCount = 0;
        const landmarks = detection.landmarks;
        if (landmarks) {
          const positions = landmarks.positions;
          
          // 2. Moving Detection (Nose tip delta)
          const noseTip = positions[30];
          if (lastPosRef.current) {
            const dx = noseTip.x - lastPosRef.current.x;
            const dy = noseTip.y - lastPosRef.current.y;
            const displacement = Math.sqrt(dx * dx + dy * dy);
            if (displacement > 25) {
              updateState('moving');
              lastPosRef.current = { x: noseTip.x, y: noseTip.y };
              sleepingCount = 0;
              return;
            }
          }
          lastPosRef.current = { x: noseTip.x, y: noseTip.y };

          // 3. Talking Detection (Mouth Aspect Ratio - MAR)
          const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
          const innerMouthWidth = dist(positions[60], positions[64]);
          const innerMouthHeight = dist(positions[62], positions[66]);
          const mar = innerMouthHeight / (innerMouthWidth || 1);
          if (mar > 0.35) {
            updateState('talking');
            sleepingCount = 0;
            return;
          }

          // 4. Sleeping / Drowsy Detection (Eye Aspect Ratio - EAR)
          const leftEye = positions.slice(36, 42);
          const rightEye = positions.slice(42, 48);
          const ear = (eye: any[]) => {
            if (!eye || eye.length < 6) return 1;
            return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]));
          };
          const avgEar = (ear(leftEye) + ear(rightEye)) / 2;
          
          if (avgEar < 0.22) {
            sleepingCount++;
            if (sleepingCount >= 2) {
              updateState('sleeping');
              return;
            }
          } else {
            sleepingCount = 0;
          }

          // 5. Active vs Normal
          if (avgEar > 0.32 || mar > 0.15) {
            updateState('active');
          } else {
            updateState('normal');
          }
        } else {
          updateState('normal');
        }
      } catch (e) {
        // detection tick skipped
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused, testMode]);

  function updateState(newState: 'normal' | 'active' | 'idle' | 'sleeping' | 'talking' | 'moving' | 'no-response' | 'blackscreen') {
    setState((prev) => {
      if (prev !== newState) {
        fetch('/api/monitor/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: newState }),
        }).catch(() => {});
      }
      return newState;
    });
  }

  function togglePause() {
    if (stream) {
      const tracks = stream.getVideoTracks();
      tracks.forEach((t) => (t.enabled = !t.enabled));
      setIsPaused(!isPaused);
      if (!isPaused) {
        updateState('idle');
      }
    }
  }

  return (
    <>
      <aside
        id="monitor-widget"
        className={minimized ? 'minimized' : ''}
        style={{ transition: 'all 0.3s ease' }}
        aria-label="Student Activity Live Monitor"
      >
        <div className="monitor-video-wrap">
          <video ref={videoRef} autoPlay playsInline muted className="monitor-video" />
          <div className="monitor-indicator">
            <span className="dot" style={{ backgroundColor: isPaused ? '#f59e0b' : '#ef4444' }} />
            <span>{isPaused ? 'Paused' : 'Monitoring Active'}</span>
          </div>
        </div>

        <canvas ref={canvasRef} width="32" height="24" style={{ display: 'none' }} />
        <div className="monitor-status-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
            <span className={`monitor-state-dot ${state}`} />
            <span style={{ textTransform: 'capitalize', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isPaused ? 'Paused' : state.replace('-', ' ')}
            </span>
          </div>

          <div className="monitor-controls" style={{ display: 'flex', gap: '4px' }}>
            <select
              value={testMode}
              onChange={(e) => { setTestMode(e.target.value); if(e.target.value !== 'auto') updateState(e.target.value as any); }}
              className="monitor-mode-select"
              title="Test Mode Switcher"
              style={{ background: 'hsla(225, 25%, 15%, 0.8)', color: '#94a3b8', border: '1px solid hsla(245, 40%, 60%, 0.2)', borderRadius: '6px', fontSize: '0.7rem', padding: '2px 4px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="auto">Auto (AI)</option>
              <option value="normal">Normal</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="sleeping">Sleeping</option>
              <option value="talking">Talking</option>
              <option value="moving">Moving</option>
              <option value="no-response">No Response</option>
              <option value="blackscreen">Blackscreen</option>
            </select>
            <button
              onClick={() => setShowConsentModal(true)}
              className="monitor-ctrl-btn"
              title="Privacy & Monitoring Info"
            >
              ℹ️
            </button>
            <button
              onClick={togglePause}
              className="monitor-ctrl-btn"
              title={isPaused ? 'Resume Monitoring' : 'Pause Camera'}
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
            <button
              onClick={() => setMinimized(!minimized)}
              className="monitor-ctrl-btn"
              title={minimized ? 'Expand View' : 'Minimize'}
            >
              {minimized ? '🗖' : '🗕'}
            </button>
          </div>
        </div>
      </aside>

      {/* Privacy Explanation Modal */}
      {showConsentModal && (
        <div className="modal-overlay" onClick={() => setShowConsentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Live Attendance & Presence Monitor</h3>
              <button className="modal-close" onClick={() => setShowConsentModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>Why is this monitor running?</strong><br />
                The Student Automation System passively validates student presence and attention during active portal sessions.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Is video recorded or uploaded?</strong><br />
                No! The video is evaluated strictly <em>on-device</em> in your web browser. Only high-level state changes (Active, Away, Drowsy) are logged to your attendance record.
              </p>
              <p>
                <strong>Control & Privacy:</strong><br />
                You can pause this camera anytime using the pause button. All activity logs can be reviewed in your Dashboard security tab.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setShowConsentModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
