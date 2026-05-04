from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ========== Models ==========

class StartInterviewRequest(BaseModel):
    interview_type: str  # technical | behavioral | system_design | product_management
    role: Optional[str] = "Software Engineer"
    candidate_name: Optional[str] = "Candidate"
    num_questions: int = 5
    avatar_id: Optional[str] = "aria"

class AnswerSubmitRequest(BaseModel):
    session_id: str
    question_index: int
    transcript: str

class Question(BaseModel):
    index: int
    text: str

class QAPair(BaseModel):
    question: str
    answer: str

class InterviewSession(BaseModel):
    id: str
    interview_type: str
    role: str
    candidate_name: str
    num_questions: int
    questions: List[str]
    answers: List[str] = []
    status: str = "in_progress"  # in_progress | completed
    feedback: Optional[dict] = None
    created_at: str
    updated_at: str

# ========== Helpers ==========

INTERVIEW_TYPE_LABELS = {
    "technical": "Technical (Coding / CS Fundamentals)",
    "behavioral": "Behavioral / HR (STAR Method)",
    "system_design": "System Design",
    "product_management": "Product Management",
}

def now_iso():
    return datetime.now(timezone.utc).isoformat()

async def generate_questions(interview_type: str, role: str, n: int) -> List[str]:
    """Use Claude to generate N interview questions."""
    label = INTERVIEW_TYPE_LABELS.get(interview_type, interview_type)
    system_msg = (
        "You are a senior interview coach who designs realistic mock interview questions. "
        "Respond ONLY with a JSON array of strings (no markdown, no extra prose)."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"questions-{uuid.uuid4()}",
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    prompt = (
        f"Generate exactly {n} concise, realistic interview questions for a {role} candidate "
        f"for a {label} interview. The questions should progress from warm-up to challenging. "
        f"Return ONLY a JSON array of {n} strings, no explanations, no markdown fences."
    )
    reply = await chat.send_message(UserMessage(text=prompt))
    text = reply.strip()
    # Strip markdown fences if any
    if text.startswith("```"):
        text = text.strip("`")
        # remove possible "json\n" prefix
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        arr = json.loads(text)
        if isinstance(arr, list) and all(isinstance(q, str) for q in arr):
            return arr[:n]
    except Exception:
        pass
    # Fallback: split by newlines
    lines = [ln.strip("-• ").strip() for ln in text.splitlines() if ln.strip()]
    return lines[:n] if lines else [f"Tell me about yourself as a {role}."]


async def generate_feedback(session: dict) -> dict:
    """Use Claude to generate structured feedback."""
    qa_list = []
    for i, q in enumerate(session["questions"]):
        a = session["answers"][i] if i < len(session["answers"]) else "(no answer)"
        qa_list.append(f"Q{i+1}: {q}\nA{i+1}: {a}")
    qa_block = "\n\n".join(qa_list)

    system_msg = (
        "You are an expert interview coach. Analyse the mock interview transcript and return "
        "a rigorous structured feedback. Respond ONLY with valid JSON matching the exact schema."
    )
    schema_hint = (
        '{"overall_score": <0-100 integer>, '
        '"communication_score": <0-100>, '
        '"content_score": <0-100>, '
        '"confidence_score": <0-100>, '
        '"summary": "<2-3 sentence executive summary>", '
        '"strengths": ["...", "..."], '
        '"weaknesses": ["...", "..."], '
        '"improvement_suggestions": ["...", "..."], '
        '"per_question_feedback": [{"question": "...", "answer": "...", "feedback": "...", "score": <0-10>}]}'
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"feedback-{session['id']}",
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    prompt = (
        f"Interview type: {INTERVIEW_TYPE_LABELS.get(session['interview_type'], session['interview_type'])}\n"
        f"Role: {session['role']}\n"
        f"Candidate: {session['candidate_name']}\n\n"
        f"Transcript:\n{qa_block}\n\n"
        f"Return ONLY this JSON schema (no markdown): {schema_hint}"
    )
    reply = await chat.send_message(UserMessage(text=prompt))
    text = reply.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        return json.loads(text)
    except Exception as e:
        logger.error(f"Failed to parse feedback JSON: {e}; raw={text[:300]}")
        return {
            "overall_score": 60,
            "communication_score": 60,
            "content_score": 60,
            "confidence_score": 60,
            "summary": "Feedback generation encountered an issue. Basic review saved.",
            "strengths": ["Completed the interview"],
            "weaknesses": ["Could not parse detailed feedback"],
            "improvement_suggestions": ["Retry the session"],
            "per_question_feedback": [
                {"question": q, "answer": session["answers"][i] if i < len(session["answers"]) else "",
                 "feedback": "N/A", "score": 6}
                for i, q in enumerate(session["questions"])
            ],
        }

# ========== Routes ==========

@api_router.get("/")
async def root():
    return {"message": "MOCKIFY API", "status": "ok"}


@api_router.post("/interview/start")
async def start_interview(payload: StartInterviewRequest):
    if payload.interview_type not in INTERVIEW_TYPE_LABELS:
        raise HTTPException(status_code=400, detail="Invalid interview type")
    n = max(3, min(payload.num_questions, 8))
    try:
        questions = await generate_questions(payload.interview_type, payload.role, n)
    except Exception as e:
        logger.exception("Question generation failed")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {e}")

    sid = str(uuid.uuid4())
    doc = {
        "id": sid,
        "interview_type": payload.interview_type,
        "role": payload.role,
        "candidate_name": payload.candidate_name,
        "num_questions": n,
        "questions": questions,
        "answers": [],
        "status": "in_progress",
        "feedback": None,
        "avatar_id": payload.avatar_id or "aria",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.interview_sessions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/interview/transcribe")
async def transcribe_audio(session_id: str, question_index: int, audio: UploadFile = File(...)):
    """Transcribe an audio clip via Whisper."""
    try:
        data = await audio.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty audio upload")
        # OpenAISpeechToText expects a file-like object; we give it a BytesIO with a name attribute
        buf = io.BytesIO(data)
        # Determine extension
        filename = audio.filename or "audio.webm"
        buf.name = filename

        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        resp = await stt.transcribe(file=buf, model="whisper-1", response_format="json")
        transcript = getattr(resp, "text", "") or ""
        return {"transcript": transcript}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Transcription failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")


@api_router.post("/interview/answer")
async def submit_answer(payload: AnswerSubmitRequest):
    sess = await db.interview_sessions.find_one({"id": payload.session_id}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    answers = sess.get("answers", [])
    # Pad list if needed
    while len(answers) <= payload.question_index:
        answers.append("")
    answers[payload.question_index] = payload.transcript
    await db.interview_sessions.update_one(
        {"id": payload.session_id},
        {"$set": {"answers": answers, "updated_at": now_iso()}},
    )
    next_index = payload.question_index + 1
    done = next_index >= len(sess["questions"])
    return {"ok": True, "next_index": next_index, "done": done}


@api_router.post("/interview/{session_id}/feedback")
async def compute_feedback(session_id: str):
    sess = await db.interview_sessions.find_one({"id": session_id}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        fb = await generate_feedback(sess)
    except Exception as e:
        logger.exception("Feedback generation failed")
        raise HTTPException(status_code=500, detail=f"Feedback failed: {e}")
    await db.interview_sessions.update_one(
        {"id": session_id},
        {"$set": {"feedback": fb, "status": "completed", "updated_at": now_iso()}},
    )
    sess["feedback"] = fb
    sess["status"] = "completed"
    sess["updated_at"] = now_iso()
    return sess


@api_router.get("/interview/{session_id}")
async def get_session(session_id: str):
    sess = await db.interview_sessions.find_one({"id": session_id}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess


@api_router.get("/interview")
async def list_sessions():
    cursor = db.interview_sessions.find({}, {"_id": 0}).sort("created_at", -1).limit(50)
    items = await cursor.to_list(50)
    # Minimal fields for list view
    out = []
    for s in items:
        out.append({
            "id": s["id"],
            "interview_type": s["interview_type"],
            "role": s.get("role", ""),
            "candidate_name": s.get("candidate_name", ""),
            "status": s.get("status", "in_progress"),
            "num_questions": s.get("num_questions", 0),
            "overall_score": (s.get("feedback") or {}).get("overall_score"),
            "created_at": s.get("created_at"),
        })
    return out


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
