"""Backend API tests for MOCKIFY Interview Simulator."""
import os
import io
import wave
import struct
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mockify-interview.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

INTERVIEW_TYPES = ["technical", "behavioral", "system_design", "product_management"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_sessions():
    return {}


# ----- Health / root -----
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert "MOCKIFY" in data.get("message", "")


# ----- CORS -----
def test_cors_headers(session):
    r = requests.options(
        f"{API}/interview",
        headers={
            "Origin": "https://mockify-interview.preview.emergentagent.com",
            "Access-Control-Request-Method": "GET",
        },
        timeout=30,
    )
    # Should allow CORS
    assert r.status_code in (200, 204)
    allow_origin = r.headers.get("access-control-allow-origin", "")
    assert allow_origin  # must exist


# ----- Start interview (all 4 types) -----
@pytest.mark.parametrize("itype", INTERVIEW_TYPES)
def test_start_interview_all_types(session, itype, created_sessions):
    payload = {
        "interview_type": itype,
        "role": "Software Engineer",
        "candidate_name": f"TEST_{itype}",
        "num_questions": 3,
    }
    r = session.post(f"{API}/interview/start", json=payload, timeout=120)
    assert r.status_code == 200, f"start failed for {itype}: {r.status_code} {r.text[:300]}"
    data = r.json()
    assert "_id" not in data, "MongoDB _id leaked"
    assert data["interview_type"] == itype
    assert data["status"] == "in_progress"
    assert data["num_questions"] == 3
    assert isinstance(data["questions"], list)
    assert 3 <= len(data["questions"]) <= 8
    assert all(isinstance(q, str) and q.strip() for q in data["questions"])
    assert "id" in data and isinstance(data["id"], str)
    assert data["answers"] == []
    assert data["feedback"] is None
    created_sessions[itype] = data


def test_start_num_questions_clamped_to_8(session):
    payload = {
        "interview_type": "technical",
        "role": "SDE",
        "candidate_name": "TEST_clamp",
        "num_questions": 20,
    }
    r = session.post(f"{API}/interview/start", json=payload, timeout=120)
    assert r.status_code == 200
    data = r.json()
    # Should be clamped to 8
    assert data["num_questions"] == 8
    assert len(data["questions"]) <= 8


def test_start_rejects_invalid_type(session):
    r = session.post(
        f"{API}/interview/start",
        json={"interview_type": "random_xyz", "num_questions": 3},
        timeout=30,
    )
    assert r.status_code == 400


# ----- GET session -----
def test_get_session_by_id(session, created_sessions):
    if not created_sessions:
        pytest.skip("no sessions created")
    sid = list(created_sessions.values())[0]["id"]
    r = session.get(f"{API}/interview/{sid}", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "_id" not in data
    assert data["id"] == sid


def test_get_session_unknown_id(session):
    r = session.get(f"{API}/interview/nonexistent-xyz-123", timeout=30)
    assert r.status_code == 404


# ----- Submit answer -----
def test_submit_answer_flow(session, created_sessions):
    if "technical" not in created_sessions:
        pytest.skip("no technical session")
    sess = created_sessions["technical"]
    sid = sess["id"]
    num_q = len(sess["questions"])

    # Submit first answer
    r = session.post(
        f"{API}/interview/answer",
        json={"session_id": sid, "question_index": 0, "transcript": "My answer to q1 about data structures."},
        timeout=30,
    )
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert d["next_index"] == 1
    assert d["done"] is (num_q <= 1)

    # Fill remaining
    for i in range(1, num_q):
        r = session.post(
            f"{API}/interview/answer",
            json={"session_id": sid, "question_index": i, "transcript": f"Answer {i+1} content here."},
            timeout=30,
        )
        assert r.status_code == 200
    # Final should be done
    assert r.json()["done"] is True

    # Verify persistence
    g = session.get(f"{API}/interview/{sid}", timeout=30)
    assert g.status_code == 200
    gd = g.json()
    assert len(gd["answers"]) == num_q
    assert gd["answers"][0].startswith("My answer")


def test_submit_answer_unknown_session(session):
    r = session.post(
        f"{API}/interview/answer",
        json={"session_id": "unknown-sess", "question_index": 0, "transcript": "x"},
        timeout=30,
    )
    assert r.status_code == 404


# ----- Feedback -----
def test_generate_feedback(session, created_sessions):
    if "technical" not in created_sessions:
        pytest.skip("no technical session")
    sid = created_sessions["technical"]["id"]
    r = session.post(f"{API}/interview/{sid}/feedback", timeout=180)
    assert r.status_code == 200, f"feedback failed: {r.status_code} {r.text[:300]}"
    data = r.json()
    assert "_id" not in data
    assert data["status"] == "completed"
    fb = data["feedback"]
    assert fb is not None
    for key in ["overall_score", "communication_score", "content_score", "confidence_score",
                "summary", "strengths", "weaknesses", "improvement_suggestions", "per_question_feedback"]:
        assert key in fb, f"feedback missing {key}"
    assert isinstance(fb["strengths"], list)
    assert isinstance(fb["weaknesses"], list)
    assert isinstance(fb["improvement_suggestions"], list)
    assert isinstance(fb["per_question_feedback"], list)
    assert len(fb["per_question_feedback"]) >= 1
    for pqf in fb["per_question_feedback"]:
        for k in ["question", "answer", "feedback", "score"]:
            assert k in pqf

    # Verify persisted
    g = session.get(f"{API}/interview/{sid}", timeout=30).json()
    assert g["status"] == "completed"
    assert g["feedback"] is not None


def test_feedback_unknown_session(session):
    r = session.post(f"{API}/interview/unknown-xyz/feedback", timeout=30)
    assert r.status_code == 404


# ----- List sessions -----
def test_list_sessions(session, created_sessions):
    r = session.get(f"{API}/interview", timeout=30)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) >= len(created_sessions)
    for it in items:
        assert "_id" not in it
        for k in ["id", "interview_type", "status", "num_questions", "created_at"]:
            assert k in it
    # Most recent first (created_at descending)
    created_ats = [i["created_at"] for i in items if i.get("created_at")]
    assert created_ats == sorted(created_ats, reverse=True)


# ----- Transcribe -----
def _make_silent_wav() -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(struct.pack('<' + 'h' * 16000, *([0] * 16000)))
    return buf.getvalue()


def test_transcribe_audio(created_sessions):
    if "technical" not in created_sessions:
        pytest.skip("no session")
    sid = created_sessions["technical"]["id"]
    wav = _make_silent_wav()
    files = {"audio": ("silent.wav", wav, "audio/wav")}
    r = requests.post(
        f"{API}/interview/transcribe",
        params={"session_id": sid, "question_index": 0},
        files=files,
        timeout=120,
    )
    # Whisper can return 200 with empty transcript for silence
    if r.status_code != 200:
        pytest.fail(f"Transcribe failed: {r.status_code} {r.text[:400]}")
    data = r.json()
    assert "transcript" in data
    assert isinstance(data["transcript"], str)


def test_transcribe_empty_audio(created_sessions):
    if "technical" not in created_sessions:
        pytest.skip("no session")
    sid = created_sessions["technical"]["id"]
    files = {"audio": ("empty.wav", b"", "audio/wav")}
    r = requests.post(
        f"{API}/interview/transcribe",
        params={"session_id": sid, "question_index": 0},
        files=files,
        timeout=30,
    )
    assert r.status_code == 400
