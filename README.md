# CampusGuard.AI — Autonomous Student Protection Radar
### **Team ThinkStack | Kritical Hacks 2026**
> *“Smarter Research. Brighter Futures.”*

---

## 👥 Team ThinkStack
- **Ridhima** — *Team Leader & Product Architect*
- **Naksh Maan** — *Full-Stack Engineer & API Integrations*
- **Bhumi Khemani** — *UI/UX & Product Design*
- **Divyanshi Garg** — *Research & Evidence Engineering*
- **Sanghavi Singh** — *Safety & Verification Systems*

---

## ✦ Overview
**CampusGuard.AI** is a student-focused, evidence-first AI research assistant designed to protect university students from predatory practices in student housing, fraudulent recruitment offers, missed examination circulars, and local transit disruptions.

Unlike standard chatbots that hallucinate outdated estimates or unverified claims, CampusGuard is built on **TinyFish-powered autonomous live-web research** paired with **Groq AI evidence grounding**. Every result cites official regulatory and institutional sources (.gov.in, .ac.in, state electricity regulatory orders) with retrieval timestamps.

---

## 🛡️ Core Protections & Features

### 1. PG Electricity Tariff Checker
- **Location & DISCOM Identification**: Autocomplete via Google Places with seamless manual fallback, followed by TinyFish Search discovering regional distribution companies (BRPL, BYPL, TPDDL, NDMC, DHBVN, UHBVN, NPCL, MSEDCL, BESCOM, etc.).
- **Live Tariff Orders**: Fetches official State Electricity Regulatory Commission (SERC/DERC) tariff schedules.
- **Slab Calculation Engine**: Breaks down energy charges per residential domestic slab (e.g. 0-200 kWh, 201-400 kWh), approved fixed charges, regulatory surcharges, and electricity taxes.
- **Submeter Overcharge Detection**: Objectively compares quoted charges against official residential tariffs without baseless defamation, distinguishing private submeter markups from direct utility bills.

### 2. College Notice Radar & Exam Board
- **11 Curated Categories**:
  1. Exam notifications
  2. Examination schedules and date sheets
  3. Admit cards
  4. Results
  5. Registration and examination forms
  6. Academic calendar and semester dates
  7. Admissions
  8. Scholarships and financial aid
  9. Internships and placements
  10. College events
  11. General university notices
- **Live University Crawl**: Searches and fetches official circulars from your college's `.ac.in` portal.
- **Change Detection**: Automatically contrasts newly fetched notices against your stored baseline, highlighting newly detected circulars and deadlines.
- **Exam Notice AI Assistant**: Dedicated question box to query specific circular details (*"When is the last date for registration?", "Has the date sheet been published?"*).

### 3. Scholarship & Financial Aid Finder
- **National & State Portals**: Discovers active government and institutional scholarships via the National Scholarship Portal (NSP) and state portals.
- **Eligibility Matching**: Matches user degree level (Undergraduate, Postgraduate, Diploma, PhD), discipline, and state.
- **Transparent Requirements**: Extracts deadlines, required documentation (bonafide certificates, income proofs), and official `.gov.in` application links.

### 4. Student Travel & Service Disruption Alerts
- **Transit Authority Feeds**: Real-time service alerts from metro and bus systems (Delhi Metro DMRC, DTC, Mumbai Metro, Western Railway, Namma Metro).
- **Service Notices**: Highlights route diversions, line maintenance, and station closures with official source citations.

### 5. Internship Scam Shield
- **Recruitment Fraud Detection**: Audits job offers for common scam markers: upfront registration or training fee demands, laptop deposits, free webmail domains (@gmail.com instead of corporate domain), and Telegram/WhatsApp-only interview processes.
- **Corporate Presence Corroboration**: Queries company careers pages to verify legitimate openings.

### 6. PG Housing & Tenant Practical Guide
- **Interactive Checklist**: 5 essential rental checkpoints covering submeter inspections, deposit refund timelines, inventory logs, and notice period clauses.
- **Model Tenancy Guidance**: Live TinyFish research into state rent control provisions and legal deposit ceilings.

### 7. Guardian AI Assistant
- **Contextual Copilot**: Available as both a dedicated workspace view and a floating persistent widget across the app.
- **Grounded Chat**: Leverages Groq (`openai/gpt-oss-120b`) with TinyFish live-web research lookups for up-to-date answers.

---

## 🏗️ Architecture & Technology Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │             CampusGuard.AI Modern Frontend                   │
   │  (Vanilla JS + CSS Design System, Responsive Glassmorphism)  │
   └──────────────────────────────┬───────────────────────────────┘
                                  │ JSON / SSE Stream
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │               Node.js Express API Server                     │
   │   (Endpoints: /api/tariff, /api/tinyfish/:tool, /api/places) │
   └───────┬──────────────────────┬──────────────────────┬────────┘
           │                      │                      │
           ▼                      ▼                      ▼
┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐
│  TinyFish Search &  ││      Groq AI        ││    Google Places    │
│      Deep Fetch     ││ Evidence Grounding  ││  Location Autocomplete
│ (Official Web Data) ││ (gpt-oss-120b / LLM)││  (Server-Side Proxy)│
└─────────────────────┘└─────────────────────┘└─────────────────────┘
```

1. **Frontend**: Pure Vanilla JavaScript (ES2022) and high-performance CSS. Zero heavy frontend build dependencies, instantaneous load time, animated blue/cyan/violet gradients, and full mobile responsiveness.
2. **Backend**: Node.js Express server with IPv4 DNS ordering, resilient SSE streaming, and server-side secret protection.
3. **Research Engine**: TinyFish Search (`api.search.tinyfish.ai`) and TinyFish Fetch (`api.fetch.tinyfish.ai`).
4. **LLM Engine**: Groq Cloud running `openai/gpt-oss-120b` with deterministic algorithmic fallbacks.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 18+ (tested on Node.js v24.19)
- npm

### 1. Install Dependencies
```bash
cd campusguard_edit
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
# Required for live web research:
TINYFISH_API_KEY=sk-tinyfish-xxxx

# Required for AI summaries & Guardian AI assistant:
GROQ_API_KEY=gsk_xxxx
GROQ_MODEL=openai/gpt-oss-120b

# Optional for Google Places autocomplete:
GOOGLE_PLACES_API_KEY=AIzaSy...

# Optional for cloud Supabase authentication:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key

PORT=8787
```

### 3. Run the Application
```bash
npm start
```
Open **[http://localhost:8787](http://localhost:8787)** in your browser.

---

## ⚡ Autonomous Radar Automation Run
CampusGuard.AI includes a one-click autonomous pipeline that executes all 4 research radars in sequence without requiring manual input for each tool:
1. **PG Electricity Tariff Audit**: Queries TinyFish to identify regional DISCOMs, fetches regulatory slab schedules, and calculates fair domestic rates.
2. **College Notice Radar**: Crawls the student's college portal (`.ac.in`) for latest examination date sheets and notices.
3. **Scholarship Matching**: Matches degree level and state against NSP and state portals.
4. **Transit & Metro Disruption Alerts**: Fetches real-time service advisories and route disruptions.

> **How to Run**: Click **"▶ Run Autonomous Radar Demo"** on the landing page terminal, or click **"▶ Execute Automation Run"** directly on the Student Dashboard.

---

## 🌐 Cloud Hosting & Public Deployment Guide

You can host CampusGuard.AI publicly using any of the following 3 options:

### Option A: Instant Public HTTPS Link (Zero Setup — Run Right Now)
If your local server is running on `http://localhost:8787`, you can expose it to the internet immediately using Localtunnel or Cloudflare:
```bash
# Using Localtunnel (Free, instant public HTTPS URL)
npx localtunnel --port 8787

# Or using Cloudflare Tunnel
npx cloudflared tunnel --url http://localhost:8787

# Or using Ngrok
ngrok http 8787
```
This generates a live public URL (e.g. `https://campusguard-demo.loca.lt`) that anyone (evaluators, judges, team members) can open immediately from anywhere.

### Option B: Free 24/7 Cloud Hosting on Render.com (Recommended)
This repository includes a pre-configured `render.yaml` file:
1. Push this repository to **GitHub**.
2. Log in to [Render.com](https://render.com) and click **New +** → **Blueprint**.
3. Select your repository. Render will automatically read `render.yaml`, install dependencies, and launch `npm start`.
4. Add your `GROQ_API_KEY` in Render Environment Variables.
5. Your app is live with a free `https://campusguard-ai.onrender.com` URL with automatic SSL.

### Option C: 1-Click Deploy on Railway.app
1. Go to [Railway.app](https://railway.app) and click **New Project** → **Deploy from GitHub repo**.
2. Select this repository.
3. In Railway **Variables**, add:
   - `TINYFISH_API_KEY=sk-tinyfish-nlKqVMU5RnA86icg-em99B0yYBHIPE85`
   - `GROQ_API_KEY=your_groq_key`
   - `GROQ_MODEL=openai/gpt-oss-120b`
4. Railway will automatically build and assign a public domain.

---

## 🗄️ Database & Supabase Schema (Optional Migration)

CampusGuard.AI includes built-in persistent browser storage for instant, zero-friction usage in Demo Mode. To configure cloud synchronization with Supabase, run the following SQL schema in your Supabase SQL Editor:

```sql
-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  college text,
  course text,
  semester text,
  state text,
  locality text,
  notice_category text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Research history table
create table public.research_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tool text not null,
  label text not null,
  sources text[],
  analysis jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.research_history enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own research history" on public.research_history
  for select using (auth.uid() = user_id);

create policy "Users can insert own research history" on public.research_history
  for insert with check (auth.uid() = user_id);
```

---

## 🧪 Tested Integrations & Verification

| Component | Status | Notes |
| :--- | :--- | :--- |
| **TinyFish Search API** | ✅ **Verified 200 OK** | Live queries return ranked official regulator and university domains. |
| **TinyFish Fetch API** | ✅ **Verified 200 OK** | Markdown conversion cleanly strips layout noise. |
| **Groq AI Engine** | ✅ **Verified 200 OK** | Tested with `openai/gpt-oss-120b` for structured analysis. |
| **PG Tariff Calculator** | ✅ **Verified** | Domestic slab calculations, fixed charges, and tax math fully validated. |
| **Notice Radar** | ✅ **Verified** | Multi-category filtering and baseline comparison active. |
| **Google Places Proxy** | ⚠️ **Graceful Fallback** | Key in `.env` handled gracefully with manual text entry. |
| **Demo Auth & Profile Sync**| ✅ **Verified** | Profile auto-populates across all 6 tools. |

---

## ⚖️ Ethical Disclaimers
1. **Research Evidence, Not Legal Advice**: CampusGuard.AI surfaces official regulatory orders and evidence. A public electricity tariff alone does not legally constitute proof of criminal overcharging due to potential commercial meter classifications or private shared amenities.
2. **Recruitment Verification**: The absence of negative scam markers does not guarantee an opportunity is legitimate. Students are encouraged to corroborate offers directly with corporate HR.

---
© 2026 CampusGuard.AI • Built by **Team ThinkStack** for Kritical Hacks 2026.
