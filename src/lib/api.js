import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export const startInterview = (payload) =>
  api.post("/interview/start", payload).then((r) => r.data);

export const transcribeAudio = (sessionId, questionIndex, blob) => {
  const form = new FormData();
  const filename = `q${questionIndex}.webm`;
  form.append("audio", blob, filename);
  return axios
    .post(
      `${API}/interview/transcribe?session_id=${sessionId}&question_index=${questionIndex}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    .then((r) => r.data);
};

export const submitAnswer = (sessionId, questionIndex, transcript) =>
  api
    .post("/interview/answer", {
      session_id: sessionId,
      question_index: questionIndex,
      transcript,
    })
    .then((r) => r.data);

export const getFeedback = (sessionId) =>
  api.post(`/interview/${sessionId}/feedback`).then((r) => r.data);

export const getSession = (sessionId) =>
  api.get(`/interview/${sessionId}`).then((r) => r.data);

export const listSessions = () => api.get("/interview").then((r) => r.data);
