# Student Automation System (Smart India Hackathon Initiative)

## Overview

The **Student Automation System** is a next-generation identity verification and presence monitoring platform built specifically for the **Smart India Hackathon (SIH)**. 

Our core objective is to eliminate proxy attendance and ensure absolute integrity during online examinations. We achieve this by moving biometric verification directly into the browser, ensuring real-time, privacy-first continuous monitoring without server-side video uploads.

This project is **powered by In Net Creations** and envisioned by **S. Manohar**.

## Key Features

- **On-Device Biometric Verification:** Face detection and identity verification are performed entirely in the browser using `face-api.js` with Tiny Face models. Your video never leaves your device.
- **8-Mode Live Activity Monitoring:** The system continuously evaluates student state and can detect:
  - **Normal**
  - **Active** (Engaged presence)
  - **Idle** (Face missing momentarily)
  - **Sleeping** (Prolonged eye closure via EAR tracking)
  - **Talking** (Speech detection via MAR tracking)
  - **Moving** (Excessive head movement)
  - **No Response** (Face absent for extended period)
  - **Blackscreen** (Camera covered or unlit)
- **Zero-Knowledge Biometric Vault:** Generated facial descriptors are AES-256 encrypted before being transmitted and stored in the database.
- **Serverless Architecture:** Built on Next.js 14 App Router and Supabase, ensuring seamless horizontal scalability.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI/ML:** `face-api.js` (MobileNetV1, Tiny Face Detector)
- **Styling:** Custom CSS (No external CSS libraries required)

## Getting Started

### Prerequisites

- Node.js >= 18.x
- Supabase Project URL and Anon Key

### Installation

1. Clone the repository and navigate to the project root:
   ```bash
   cd student-auth-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

This application is optimized for Vercel deployment. 

- Local filesystem writes (used only for development fallback) are automatically suppressed when `process.env.VERCEL` is active.
- Ensure all Supabase environment variables are properly configured in your Vercel project settings.
- Ensure you have run migrations in Supabase to create the `users`, `face_credentials`, `otp_codes`, `login_sessions`, and `activity_monitor_logs` tables.

## Authors & Acknowledgments

- **S. Manohar** - Creator & Lead Visionary for the SIH Initiative
- **In Net Creations** - Powered by and Technology Partner
- For further details or inquiries, please contact: [innetcreations@gmail.com](mailto:innetcreations@gmail.com)
