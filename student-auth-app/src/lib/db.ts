import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';
import { encryptEmbedding, decryptEmbedding } from './encryption';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureLocalDB() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify({
          users: [],
          face_credentials: [],
          otp_codes: [],
          login_sessions: [],
          activity_monitor_logs: [],
        }, null, 2)
      );
    }
  } catch (err) {
    console.warn('Could not initialize local DB (expected on Vercel):', err);
  }
}

function readLocalDB() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return { users: [], face_credentials: [], otp_codes: [], login_sessions: [], activity_monitor_logs: [] };
  }
  ensureLocalDB();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { users: [], face_credentials: [], otp_codes: [], login_sessions: [], activity_monitor_logs: [] };
  }
}

function writeLocalDB(data: any) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') return;
  ensureLocalDB();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Could not write to local DB (expected on Vercel):', err);
  }
}

// ── Database Layer ───────────────────────────────────────────
export const db = {
  // Users
  async findUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (!error && data) return data;
    } catch {}
    
    // Fallback
    const local = readLocalDB();
    return local.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async findUserById(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    } catch {}

    const local = readLocalDB();
    return local.users.find((u: any) => u.id === id) || null;
  },

  async createUser(userData: any) {
    const id = userData.id || crypto.randomUUID();
    const newUser = {
      id,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password_hash: userData.password_hash,
      phone: userData.phone || '',
      dob: userData.dob || null,
      age: userData.age || null,
      gender: userData.gender || 'prefer_not_to_say',
      languages: userData.languages || ['English'],
      institution: userData.institution || '',
      department: userData.department || '',
      roll_number: userData.roll_number || '',
      email_verified: !!userData.email_verified,
      account_status: userData.account_status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('users').insert([newUser]).select().single();
      if (!error && data) return data;
    } catch {}

    const local = readLocalDB();
    const existingIndex = local.users.findIndex((u: any) => u.email === newUser.email);
    if (existingIndex >= 0) {
      local.users[existingIndex] = newUser;
    } else {
      local.users.push(newUser);
    }
    writeLocalDB(local);
    return newUser;
  },

  async updateUser(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch {}

    const local = readLocalDB();
    const idx = local.users.findIndex((u: any) => u.id === id);
    if (idx >= 0) {
      local.users[idx] = { ...local.users[idx], ...updates, updated_at: new Date().toISOString() };
      writeLocalDB(local);
      return local.users[idx];
    }
    return null;
  },

  // Face Credentials & ML Database Images
  async storeFaceCredentials(userId: string, data: {
    embeddings: { front: number[]; bottom: number[]; left: number[]; right: number[] };
    images: { front: string; bottom: string; left: string; right: string };
  }) {
    const record = {
      id: crypto.randomUUID(),
      user_id: userId,
      embedding_front: encryptEmbedding(data.embeddings.front),
      embedding_bottom: encryptEmbedding(data.embeddings.bottom),
      embedding_left: encryptEmbedding(data.embeddings.left),
      embedding_right: encryptEmbedding(data.embeddings.right),
      // Raw ML database angle captures:
      image_front_url: data.images.front,
      image_bottom_url: data.images.bottom,
      image_left_url: data.images.left,
      image_right_url: data.images.right,
      model_version: 'face-api-tiny-v1',
      created_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
    };

    try {
      const { data: res, error } = await supabase.from('face_credentials').insert([record]).select().single();
      if (!error && res) return res;
    } catch {}

    const local = readLocalDB();
    const existingIdx = local.face_credentials.findIndex((f: any) => f.user_id === userId);
    if (existingIdx >= 0) {
      local.face_credentials[existingIdx] = record;
    } else {
      local.face_credentials.push(record);
    }
    writeLocalDB(local);
    return record;
  },

  async getFaceCredentials(userId: string) {
    let raw = null;
    try {
      const { data, error } = await supabase
        .from('face_credentials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) raw = data;
    } catch {}

    if (!raw) {
      const local = readLocalDB();
      raw = local.face_credentials.find((f: any) => f.user_id === userId) || null;
    }

    if (!raw) return null;

    return {
      ...raw,
      embeddings: {
        front: decryptEmbedding(raw.embedding_front),
        bottom: decryptEmbedding(raw.embedding_bottom),
        left: decryptEmbedding(raw.embedding_left),
        right: decryptEmbedding(raw.embedding_right),
      },
    };
  },

  // OTP Codes
  async saveOTP(email: string, otp: string, purpose: string, userId?: string) {
    const record = {
      id: crypto.randomUUID(),
      user_id: userId || null,
      email: email.toLowerCase().trim(),
      otp_code: otp,
      purpose,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
      consumed: false,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('otp_codes').insert([record]);
    } catch {}

    const local = readLocalDB();
    // remove previous unconsumed OTPs for same email & purpose
    local.otp_codes = local.otp_codes.filter(
      (o: any) => !(o.email === record.email && o.purpose === purpose && !o.consumed)
    );
    local.otp_codes.push(record);
    writeLocalDB(local);
    return record;
  },

  async verifyOTP(email: string, otp: string, purpose: string) {
    const normEmail = email.toLowerCase().trim();
    let record: any = null;

    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', normEmail)
        .eq('purpose', purpose)
        .eq('consumed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) record = data;
    } catch {}

    const local = readLocalDB();
    if (!record) {
      record = local.otp_codes.find(
        (o: any) => o.email === normEmail && o.purpose === purpose && !o.consumed
      );
    }

    if (!record) {
      return { success: false, message: 'No verification code found. Please request a new one.' };
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { success: false, message: 'Verification code has expired. Please request a new one.' };
    }

    if (record.otp_code !== otp.trim()) {
      record.attempts = (record.attempts || 0) + 1;
      writeLocalDB(local);
      return { success: false, message: 'Invalid verification code. Please try again.' };
    }

    // Mark consumed
    record.consumed = true;
    try {
      await supabase.from('otp_codes').update({ consumed: true }).eq('id', record.id);
    } catch {}
    writeLocalDB(local);

    return { success: true, record };
  },

  // Sessions
  async createSession(userId: string, deviceInfo?: string) {
    const token = crypto.randomUUID();
    const session = {
      id: crypto.randomUUID(),
      user_id: userId,
      token,
      device_info: deviceInfo || 'Web Browser',
      ip_address: '127.0.0.1',
      login_at: new Date().toISOString(),
      status: 'active',
    };

    try {
      await supabase.from('login_sessions').insert([session]);
    } catch {}

    const local = readLocalDB();
    local.login_sessions.push(session);
    writeLocalDB(local);
    return session;
  },

  async getSession(token: string) {
    let session = null;
    try {
      const { data, error } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('token', token)
        .eq('status', 'active')
        .maybeSingle();
      if (!error && data) session = data;
    } catch {}

    if (!session) {
      const local = readLocalDB();
      session = local.login_sessions.find((s: any) => s.token === token && s.status === 'active') || null;
    }

    if (!session) return null;
    const user = await this.findUserById(session.user_id);
    return { ...session, user };
  },

  async getUserSessions(userId: string) {
    let sessions = null;
    try {
      const { data, error } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false });
      if (!error && data) sessions = data;
    } catch {}

    if (!sessions) {
      const local = readLocalDB();
      sessions = local.login_sessions
        .filter((s: any) => s.user_id === userId)
        .sort((a: any, b: any) => new Date(b.login_at).getTime() - new Date(a.login_at).getTime());
    }

    return sessions || [];
  },

  async endSession(token: string) {
    try {
      await supabase.from('login_sessions').update({ status: 'logged_out', logout_at: new Date().toISOString() }).eq('token', token);
    } catch {}

    const local = readLocalDB();
    const s = local.login_sessions.find((x: any) => x.token === token);
    if (s) {
      s.status = 'logged_out';
      s.logout_at = new Date().toISOString();
      writeLocalDB(local);
    }
  },

  // Activity Monitor Logging
  async logMonitorState(userId: string, state: string, sessionId?: string) {
    const log = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: sessionId || null,
      state,
      timestamp: new Date().toISOString(),
    };

    try {
      await supabase.from('activity_monitor_logs').insert([log]);
    } catch {}

    const local = readLocalDB();
    local.activity_monitor_logs.push(log);
    // Keep last 500 logs locally
    if (local.activity_monitor_logs.length > 500) {
      local.activity_monitor_logs = local.activity_monitor_logs.slice(-500);
    }
    writeLocalDB(local);
    return log;
  }
};
