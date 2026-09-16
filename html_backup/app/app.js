/**
 * STUDENT AUTOMATION SYSTEM — Shared App State & Utilities
 * Mock backend using localStorage for demo purposes
 */

// ── Constants ─────────────────────────────────────────────────
const APP_VERSION = '1.0.0';
const STORAGE_KEYS = {
  USERS: 'sas_users',
  CURRENT_USER: 'sas_current_user',
  SESSION: 'sas_session',
  OTP_STORE: 'sas_otp_store',
  PENDING_REG: 'sas_pending_reg',
  ACTIVITY_LOGS: 'sas_activity_logs',
  LOGIN_HISTORY: 'sas_login_history',
  CONSENT_RECORDS: 'sas_consent_records',
};

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_OTP_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const FACE_MATCH_THRESHOLD = 0.55; // cosine similarity threshold

// ── Storage Helpers ───────────────────────────────────────────
const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) { localStorage.removeItem(key); },
};

// ── ID Generator ──────────────────────────────────────────────
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── Simple password hash (SHA-256 via SubtleCrypto) ───────────
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sas_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ── OTP Generation ─────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(otp) {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + 'sas_otp_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── User Management ───────────────────────────────────────────
const UserStore = {
  getAll() { return Store.get(STORAGE_KEYS.USERS, []); },

  getByEmail(email) {
    return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getById(id) {
    return this.getAll().find(u => u.id === id) || null;
  },

  create(userData) {
    const users = this.getAll();
    const user = { id: generateId(), ...userData, createdAt: Date.now(), updatedAt: Date.now() };
    users.push(user);
    Store.set(STORAGE_KEYS.USERS, users);
    return user;
  },

  update(id, updates) {
    const users = this.getAll();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: Date.now() };
    Store.set(STORAGE_KEYS.USERS, users);
    return users[idx];
  },

  delete(id) {
    const users = this.getAll().filter(u => u.id !== id);
    Store.set(STORAGE_KEYS.USERS, users);
  },

  storeFaceEmbeddings(userId, embeddings) {
    return this.update(userId, { faceCredentials: { ...embeddings, modelVersion: 'face-api.js-v1', enrolledAt: Date.now() } });
  },
};

// ── Session Management ─────────────────────────────────────────
const SessionStore = {
  create(userId) {
    const session = {
      id: generateId(),
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
      deviceInfo: navigator.userAgent.substring(0, 100),
    };
    Store.set(STORAGE_KEYS.SESSION, session);
    Store.set(STORAGE_KEYS.CURRENT_USER, userId);
    return session;
  },

  get() {
    const session = Store.get(STORAGE_KEYS.SESSION);
    if (!session) return null;
    if (Date.now() > session.expiresAt) { this.destroy(); return null; }
    return session;
  },

  destroy() {
    Store.remove(STORAGE_KEYS.SESSION);
    Store.remove(STORAGE_KEYS.CURRENT_USER);
  },

  isValid() { return !!this.get(); },

  getCurrentUser() {
    const session = this.get();
    if (!session) return null;
    return UserStore.getById(session.userId);
  },
};

// ── OTP Store ─────────────────────────────────────────────────
const OTPStore = {
  getAll() { return Store.get(STORAGE_KEYS.OTP_STORE, {}); },

  async create(userId, purpose) {
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const all = this.getAll();
    all[`${userId}_${purpose}`] = {
      otpHash,
      purpose,
      userId,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
      consumed: false,
      createdAt: Date.now(),
      plainOtp: otp, // In demo mode, store plaintext for display
    };
    Store.set(STORAGE_KEYS.OTP_STORE, all);
    return otp;
  },

  getForUser(userId, purpose) {
    const all = this.getAll();
    return all[`${userId}_${purpose}`] || null;
  },

  async verify(userId, purpose, inputOtp) {
    const all = this.getAll();
    const key = `${userId}_${purpose}`;
    const record = all[key];
    if (!record) return { success: false, error: 'No OTP found. Please request a new one.' };
    if (record.consumed) return { success: false, error: 'This OTP has already been used.' };
    if (Date.now() > record.expiresAt) return { success: false, error: 'OTP has expired. Please request a new one.' };
    if (record.attempts >= MAX_OTP_ATTEMPTS) return { success: false, error: 'Too many attempts. Please request a new OTP.' };

    const inputHash = await hashOTP(inputOtp.trim());
    if (inputHash !== record.otpHash) {
      all[key].attempts += 1;
      Store.set(STORAGE_KEYS.OTP_STORE, all);
      const remaining = MAX_OTP_ATTEMPTS - all[key].attempts;
      return { success: false, error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
    }

    all[key].consumed = true;
    Store.set(STORAGE_KEYS.OTP_STORE, all);
    return { success: true };
  },

  consume(userId, purpose) {
    const all = this.getAll();
    const key = `${userId}_${purpose}`;
    if (all[key]) { all[key].consumed = true; Store.set(STORAGE_KEYS.OTP_STORE, all); }
  },
};

// ── Login History ──────────────────────────────────────────────
const LoginHistory = {
  add(userId, eventType, metadata = {}) {
    const history = Store.get(STORAGE_KEYS.LOGIN_HISTORY, []);
    history.push({ id: generateId(), userId, eventType, timestamp: Date.now(), metadata });
    // Keep last 100 events
    if (history.length > 100) history.splice(0, history.length - 100);
    Store.set(STORAGE_KEYS.LOGIN_HISTORY, history);
  },

  getForUser(userId) {
    return Store.get(STORAGE_KEYS.LOGIN_HISTORY, []).filter(h => h.userId === userId);
  },
};

// ── Activity Monitor Logs ──────────────────────────────────────
const ActivityLogs = {
  add(userId, state) {
    const logs = Store.get(STORAGE_KEYS.ACTIVITY_LOGS, []);
    const last = logs[logs.length - 1];
    if (last && last.userId === userId && last.state === state && !last.endedAt) return; // same state, no change
    if (last && !last.endedAt) { last.endedAt = Date.now(); } // close previous
    logs.push({ id: generateId(), userId, state, startedAt: Date.now(), endedAt: null });
    if (logs.length > 200) logs.splice(0, logs.length - 200);
    Store.set(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  },
};

// ── Pending Registration ───────────────────────────────────────
const PendingReg = {
  save(data) { Store.set(STORAGE_KEYS.PENDING_REG, data); },
  get() { return Store.get(STORAGE_KEYS.PENDING_REG); },
  clear() { Store.remove(STORAGE_KEYS.PENDING_REG); },
};

// ── Pending Verification State (login face check) ─────────────
const PendingVerification = {
  save(data) { sessionStorage.setItem('sas_pending_verify', JSON.stringify(data)); },
  get() {
    try { return JSON.parse(sessionStorage.getItem('sas_pending_verify')); }
    catch { return null; }
  },
  clear() { sessionStorage.removeItem('sas_pending_verify'); },
};

// ── Navigation Helpers ─────────────────────────────────────────
function navigate(path) { window.location.href = path; }

function requireAuth() {
  if (!SessionStore.isValid()) { navigate('login.html'); return false; }
  return true;
}

function redirectIfAuthed() {
  if (SessionStore.isValid()) { navigate('dashboard.html'); }
}

// ── Email Simulation (Demo Mode) ───────────────────────────────
function simulateSendOTPEmail(email, otp, purpose) {
  console.log(`[OTP EMAIL SIMULATION]
To: ${email}
Subject: Your ${purpose === 'registration' ? 'Registration' : 'Login'} OTP
OTP: ${otp}
Expires in 10 minutes.`);

  // Show OTP in toast for demo
  showToast('OTP Sent (Demo Mode)', `Your OTP is: <strong>${otp}</strong> — check console too`, 'info', 12000);
}

// ── Toast Notification System ──────────────────────────────────
function showToast(title, message = '', type = 'info', duration = 4500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Form Validation Helpers ────────────────────────────────────
const Validators = {
  email(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  phone(v) { return /^\+?[\d\s\-()]{7,15}$/.test(v); },
  minLength(v, n) { return v.length >= n; },
  passwordStrength(p) {
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score; // 0-6
  },
};

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');
  field.classList.remove('success');
  let errEl = field.closest('.form-group')?.querySelector('.form-error');
  if (!errEl) {
    errEl = document.createElement('span');
    errEl.className = 'form-error';
    field.closest('.form-group')?.appendChild(errEl);
  }
  errEl.textContent = '⚠ ' + message;
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('error');
  field.closest('.form-group')?.querySelector('.form-error')?.remove();
}

function markFieldSuccess(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('success');
  field.classList.remove('error');
  clearFieldError(fieldId);
}

function setButtonLoading(btn, loading, originalText) {
  if (typeof btn === 'string') btn = document.getElementById(btn);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${originalText || 'Loading...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.origText || originalText || 'Submit';
  }
}

// ── Password Strength Meter ────────────────────────────────────
function updateStrengthMeter(password, barId, textId) {
  const score = Validators.passwordStrength(password);
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);
  if (!bar || !text) return;

  const levels = [
    { label: '', color: 'transparent', width: '0%' },
    { label: 'Very Weak', color: 'hsl(0,80%,55%)', width: '16%' },
    { label: 'Weak', color: 'hsl(20,80%,55%)', width: '33%' },
    { label: 'Fair', color: 'hsl(38,90%,55%)', width: '50%' },
    { label: 'Good', color: 'hsl(80,70%,50%)', width: '66%' },
    { label: 'Strong', color: 'hsl(142,70%,46%)', width: '83%' },
    { label: 'Very Strong', color: 'hsl(185,90%,44%)', width: '100%' },
  ];

  const level = levels[Math.min(score, 6)];
  bar.style.width = level.width;
  bar.style.background = level.color;
  text.textContent = level.label;
  text.style.color = level.color;
}

// ── Global Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Inject background elements if not present
  if (!document.querySelector('.bg-mesh')) {
    const mesh = document.createElement('div');
    mesh.className = 'bg-mesh';
    document.body.prepend(mesh);
  }
  if (!document.querySelector('.orb')) {
    ['orb-1', 'orb-2', 'orb-3'].forEach(cls => {
      const orb = document.createElement('div');
      orb.className = `orb ${cls}`;
      document.body.prepend(orb);
    });
  }
});
