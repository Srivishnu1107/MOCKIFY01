# MOCKIFY — Product Requirements Document

## Problem Statement
Build a light theme but aesthetic AI Interview Simulator where the voice and camera is accessible and get feedbacks and can be downloaded. Named **MOCKIFY**.

## User Choices (v1)
- LLM for questions & feedback: **Claude Sonnet 4.5** (via Emergent Universal Key)
- Transcription: **OpenAI Whisper** (`whisper-1` via Emergent Universal Key)
- Interview types: Technical, Behavioral, System Design, Product Management
- Authentication: None (open access)
- Feedback download format: Markdown (`.md`)

## Architecture
- **Backend**: FastAPI + MongoDB (collection `interview_sessions`)
  - `POST /api/interview/start` — generates questions via Claude
  - `POST /api/interview/transcribe` — Whisper transcription (multipart audio)
  - `POST /api/interview/answer` — saves transcript per question
  - `POST /api/interview/{id}/feedback` — structured feedback JSON via Claude
  - `GET /api/interview/{id}` — single session
  - `GET /api/interview` — list sessions
- **Frontend**: React + react-router + Tailwind + Shadcn UI
  - Routes: `/` (Landing), `/interview/:id`, `/feedback/:id`, `/history`
  - MediaRecorder for audio, getUserMedia for camera preview

## Design System
- Bone white `#F9F8F6` page, pure white surfaces, deep charcoal text `#121212`
- Vermilion accent `#FF4500` for CTAs / recording state
- Cabinet Grotesk (headings) + Figtree (body) + JetBrains Mono (labels)
- Bento grid feedback layout, glassmorphic recording controls

## User Personas
1. **Job Seeker / Student** — practicing behavioral & technical interviews
2. **Experienced Engineer** — rehearsing system design rounds
3. **PM Candidate** — product sense case prep

## Core Requirements (locked)
- Voice recording with live transcription
- Live camera preview during interview
- Structured scoring (overall, communication, content, confidence)
- Per-question feedback with 0-10 score
- Markdown report download
- Session history

## Implemented (2026-02)
- [x] Full backend with Claude + Whisper integration (17/17 tests passing)
- [x] Landing page with interview-type selector, role input, question count
- [x] Interview page: camera, mic recording, live transcript, progress bar
- [x] Feedback page: bento grid with ring charts, strengths/weaknesses/suggestions, per-question breakdown, MD download
- [x] History page listing past sessions with scores

## Prioritized Backlog

### P0 (next)
- Timer limit per question with auto-stop
- Pause/retake answer for current question

### P1
- User accounts + saved role presets (JWT or Google)
- Tone/pacing analysis (word-per-minute, filler word detection)
- Share public feedback link

### P2
- Video review (record full video, not just audio)
- Industry-specific question packs (FAANG, startup, consulting)
- PDF export option

## Technology
- React 19, react-router v7
- FastAPI, Motor, Pydantic
- emergentintegrations (Claude Sonnet 4.5 + Whisper)
- Tailwind + Shadcn/UI + Lucide icons + Sonner toasts
