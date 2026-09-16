/**
 * STUDENT AUTOMATION SYSTEM — Face Detection & Recognition Utilities
 * Uses face-api.js (CDN) for client-side face detection and embedding extraction.
 * Embeddings are 128-dimensional vectors (FaceNet-style via face-api.js).
 */

// ── Model Loading ─────────────────────────────────────────────
const FACE_API_CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';

let modelsLoaded = false;
let modelsLoading = false;

async function loadFaceModels(statusCb) {
  if (modelsLoaded) return true;
  if (modelsLoading) {
    // Wait for existing load
    while (modelsLoading) await sleep(100);
    return modelsLoaded;
  }

  modelsLoading = true;
  try {
    if (statusCb) statusCb('Loading face detection models…', 20);

    await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_CDN);
    if (statusCb) statusCb('Loading face landmark model…', 50);

    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_API_CDN);
    if (statusCb) statusCb('Loading face recognition model…', 80);

    await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_CDN);
    if (statusCb) statusCb('Models ready!', 100);

    modelsLoaded = true;
    modelsLoading = false;
    return true;
  } catch (err) {
    modelsLoading = false;
    console.error('Failed to load face models:', err);
    throw new Error('Could not load face recognition models. Check your internet connection.');
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Detection Options ─────────────────────────────────────────
function getDetectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
}

// ── Detect Single Face ────────────────────────────────────────
async function detectFace(videoOrCanvas) {
  const options = getDetectorOptions();
  const detection = await faceapi
    .detectSingleFace(videoOrCanvas, options)
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return detection || null;
}

// ── Detect All Faces ──────────────────────────────────────────
async function detectAllFaces(videoOrCanvas) {
  const options = getDetectorOptions();
  return faceapi
    .detectAllFaces(videoOrCanvas, options)
    .withFaceLandmarks(true)
    .withFaceDescriptors();
}

// ── Quality Check ─────────────────────────────────────────────
function checkFaceQuality(detection, videoWidth, videoHeight) {
  if (!detection) return { pass: false, reason: 'No face detected. Position your face in the oval.' };

  const box = detection.detection.box;
  const score = detection.detection.score;

  // Face confidence
  if (score < 0.7) return { pass: false, reason: 'Face not clearly visible. Improve lighting.' };

  // Face size (should be at least 20% of frame width)
  const faceRatio = box.width / videoWidth;
  if (faceRatio < 0.18) return { pass: false, reason: 'Move closer to the camera.' };
  if (faceRatio > 0.85) return { pass: false, reason: 'Move farther from the camera.' };

  // Face centering
  const faceCenterX = (box.x + box.width / 2) / videoWidth;
  const faceCenterY = (box.y + box.height / 2) / videoHeight;
  if (faceCenterX < 0.2 || faceCenterX > 0.8) return { pass: false, reason: 'Center your face horizontally.' };
  if (faceCenterY < 0.15 || faceCenterY > 0.85) return { pass: false, reason: 'Center your face vertically.' };

  // Multiple faces check
  // (done separately with detectAllFaces)

  return { pass: true, reason: 'Good. Hold still…', score };
}

// ── Draw Detection Overlay ────────────────────────────────────
function drawFaceOverlay(canvas, detection, videoWidth, videoHeight) {
  const ctx = canvas.getContext('2d');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!detection) return;

  const box = detection.detection.box;
  const landmarks = detection.landmarks;

  // Draw bounding box
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.width, box.height, 8);
  ctx.stroke();

  // Draw corner accents
  const cs = 16; // corner size
  ctx.strokeStyle = 'rgba(99, 102, 241, 1)';
  ctx.lineWidth = 3;
  const corners = [
    [box.x, box.y, box.x + cs, box.y, box.x, box.y + cs],
    [box.x + box.width, box.y, box.x + box.width - cs, box.y, box.x + box.width, box.y + cs],
    [box.x, box.y + box.height, box.x + cs, box.y + box.height, box.x, box.y + box.height - cs],
    [box.x + box.width, box.y + box.height, box.x + box.width - cs, box.y + box.height, box.x + box.width, box.y + box.height - cs],
  ];
  corners.forEach(([mx, my, lx1, ly1, lx2, ly2]) => {
    ctx.beginPath();
    ctx.moveTo(lx1, ly1);
    ctx.lineTo(mx, my);
    ctx.lineTo(lx2, ly2);
    ctx.stroke();
  });

  // Draw landmarks (eyes, nose, mouth)
  if (landmarks) {
    ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
    const points = landmarks.positions;
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// ── Capture Frame as DataURL ──────────────────────────────────
function captureFrame(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}

// ── Extract Embedding from Video ──────────────────────────────
async function extractEmbedding(video) {
  const detection = await detectFace(video);
  if (!detection) return null;
  return Array.from(detection.descriptor); // Float32Array → plain array for JSON serialization
}

// ── Extract Embedding from DataURL ────────────────────────────
async function extractEmbeddingFromDataURL(dataURL) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const detection = await detectFace(canvas);
      if (!detection) { resolve(null); return; }
      resolve(Array.from(detection.descriptor));
    };
    img.src = dataURL;
  });
}

// ── Cosine Similarity ─────────────────────────────────────────
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Euclidean Distance ────────────────────────────────────────
function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

// ── Face Match: compare live embedding vs stored embeddings ──
function matchFaceEmbedding(liveEmbedding, storedCredentials) {
  if (!liveEmbedding || !storedCredentials) return { match: false, score: 0, angle: null };

  const angles = ['embeddingFront', 'embeddingLeft', 'embeddingRight', 'embeddingBottom'];
  let bestScore = 0;
  let bestAngle = null;

  angles.forEach(angle => {
    const stored = storedCredentials[angle];
    if (!stored) return;
    const sim = cosineSimilarity(liveEmbedding, stored);
    if (sim > bestScore) { bestScore = sim; bestAngle = angle; }
  });

  return {
    match: bestScore >= FACE_MATCH_THRESHOLD,
    score: bestScore,
    angle: bestAngle,
    percentage: Math.round(bestScore * 100),
  };
}

// ── Eye Aspect Ratio (for drowsiness detection) ───────────────
function eyeAspectRatio(eyePoints) {
  if (!eyePoints || eyePoints.length < 6) return 1;
  // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  const A = dist(eyePoints[1], eyePoints[5]);
  const B = dist(eyePoints[2], eyePoints[4]);
  const C = dist(eyePoints[0], eyePoints[3]);
  return (A + B) / (2.0 * C);
}

// ── Get Eye Points from Landmarks ─────────────────────────────
function getEyePoints(landmarks) {
  if (!landmarks) return { left: null, right: null };
  const positions = landmarks.positions;
  // Left eye: landmarks 36-41, Right eye: 42-47
  return {
    left: positions.slice(36, 42),
    right: positions.slice(42, 48),
  };
}

// ── Activity State Classification ─────────────────────────────
const EAR_THRESHOLD_DROWSY = 0.22;
const EAR_CONSECUTIVE_FRAMES = 3;

class ActivityClassifier {
  constructor() {
    this.consecutiveLowEAR = 0;
    this.lastState = 'active';
    this.noFaceFrames = 0;
    this.NO_FACE_THRESHOLD = 30; // ~5 seconds at 6fps
  }

  classify(detection) {
    if (!detection) {
      this.noFaceFrames++;
      this.consecutiveLowEAR = 0;
      if (this.noFaceFrames >= this.NO_FACE_THRESHOLD) {
        this.lastState = 'idle';
      }
      return this.lastState;
    }

    this.noFaceFrames = 0;
    const { left, right } = getEyePoints(detection.landmarks);
    const earLeft = eyeAspectRatio(left);
    const earRight = eyeAspectRatio(right);
    const ear = (earLeft + earRight) / 2;

    if (ear < EAR_THRESHOLD_DROWSY) {
      this.consecutiveLowEAR++;
      if (this.consecutiveLowEAR >= EAR_CONSECUTIVE_FRAMES) {
        this.lastState = 'drowsy';
      }
    } else {
      this.consecutiveLowEAR = 0;
      this.lastState = 'active';
    }

    return this.lastState;
  }

  reset() {
    this.consecutiveLowEAR = 0;
    this.lastState = 'active';
    this.noFaceFrames = 0;
  }
}

// ── Camera Access ─────────────────────────────────────────────
async function requestCamera(videoEl, constraints = {}) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', ...constraints },
      audio: false,
    });
    videoEl.srcObject = stream;
    await new Promise(resolve => { videoEl.onloadedmetadata = resolve; });
    await videoEl.play();
    return { success: true, stream };
  } catch (err) {
    let message = 'Camera access failed.';
    if (err.name === 'NotAllowedError') message = 'Camera permission denied. Please allow camera access in your browser settings.';
    else if (err.name === 'NotFoundError') message = 'No camera found on this device.';
    else if (err.name === 'NotReadableError') message = 'Camera is in use by another application.';
    return { success: false, error: message };
  }
}

function stopCamera(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}
