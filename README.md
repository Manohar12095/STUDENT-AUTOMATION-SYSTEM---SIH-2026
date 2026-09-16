visit at : https://student-automation-system-sih-2026.vercel.app
<div align="center">
  <img src="logo/logo.png" alt="Student Automation System Logo" width="150"/>
  <h1>Student Automation System</h1>
  <p><strong>Smart India Hackathon (SIH) 2026 Initiative</strong></p>
  <p><i>Powered by <b>In Net Creations</b> | Envisioned by <b>S. Manohar</b></i></p>
</div>

---

## 📌 Overview

The **Student Automation System** is a next-generation identity verification and presence monitoring platform built specifically for the **Smart India Hackathon (SIH)**. 

Our core objective is to eliminate proxy attendance and ensure absolute integrity during online examinations. We achieve this by moving biometric verification directly into the browser, ensuring real-time, privacy-first continuous monitoring without server-side video uploads.

## ✨ Key Features

- **On-Device Biometric Verification:** Face detection and identity verification are performed entirely in the browser using `face-api.js` with Tiny Face models. Your video never leaves your device.
- **8-Mode Live Activity Monitoring:** The system continuously evaluates student state and can detect:
  - 🟢 **Normal**
  - ⚡ **Active** (Engaged presence)
  - 💤 **Idle** (Face missing momentarily)
  - 😴 **Sleeping** (Prolonged eye closure via EAR tracking)
  - 🗣️ **Talking** (Speech detection via MAR tracking)
  - 🏃‍♂️ **Moving** (Excessive head movement)
  - ❌ **No Response** (Face absent for extended period)
  - ⬛ **Blackscreen** (Camera covered or unlit)
- **Zero-Knowledge Biometric Vault:** Generated facial descriptors are AES-256 encrypted before being transmitted and stored in the database.
- **Serverless Architecture:** Built on Next.js 14 App Router and Supabase, ensuring seamless horizontal scalability on platforms like Vercel.
- **OTP Verification:** Fully integrated 2-Factor Email OTP verification using Nodemailer.

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI/ML:** `face-api.js` (MobileNetV1, Tiny Face Detector)
- **Styling:** Custom Vanilla CSS (Glassmorphism, fully responsive)

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- Supabase Project URL and Anon Key
- Gmail App Password for SMTP Email Service

### Local Installation

1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/Manohar12095/STUDENT-AUTOMATION-SYSTEM---SIH-2026.git
   cd STUDENT-AUTOMATION-SYSTEM---SIH-2026
   ```

2. Run the automated setup script (Windows):
   ```cmd
   run.bat
   ```
   > You can select **Development Mode** (for editing code) or **Production Mode** (for testing compiled speed).

3. Or manually start it:
   ```bash
   cd student-auth-app
   npm install
   npm run dev
   ```

### 🌍 Deployment on Vercel

This application is fully optimized for Vercel serverless deployment.

1. Import this repository into Vercel.
2. Under **Project Settings > General**, set the **Root Directory** to `student-auth-app`.
3. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SMTP_HOST` (e.g., smtp.gmail.com)
   - `SMTP_PORT` (e.g., 587)
   - `SMTP_USER` (your email)
   - `SMTP_PASS` (your app password)
   - `SMTP_FROM` (e.g., Student_Automation_System <innetcreations@gmail.com>)
   - `EMBEDDING_ENCRYPTION_KEY` (32-character secure string)
   - `EMBEDDING_ENCRYPTION_IV` (16-character secure string)
4. Execute the SQL Schema located in `student-auth-app/supabase/schema.sql` on your Supabase SQL Editor.
5. Hit **Deploy**!

## 📞 Authors & Acknowledgments

- **S. Manohar** - Creator & Lead Visionary for the SIH Initiative
- **In Net Creations** - Powered by and Technology Partner
- For further details or inquiries, please contact: [innetcreations@gmail.com](mailto:innetcreations@gmail.com)
