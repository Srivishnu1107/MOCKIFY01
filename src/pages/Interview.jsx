import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Mic,
  Square,
  SkipForward,
  Loader2,
  AlertCircle,
  FileText,
  Volume2,
  VolumeX,
  RotateCw,
} from "lucide-react";
import {
  getSession,
  transcribeAudio,
  submitAnswer,
  getFeedback,
} from "../lib/api";
import { getAvatar, speak, stopSpeaking } from "../lib/avatars";
import Tilt3DCard from "../components/Tilt3DCard";
import AnimatedPersona from "../components/AnimatedPersona";

export default function Interview() {
  const { sessionId } = useParams();
  const nav = useNavigate();

  const [session, setSession] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const utteranceRef = useRef(null);

  const avatar = session ? getAvatar(session.avatar_id) : getAvatar();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession(sessionId);
        if (cancelled) return;
        setSession(s);
      } catch (e) {
        toast.error("Session not found");
        nav("/");
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch (e) {
        console.error(e);
        setMicError(
          "We couldn't access your microphone. Please grant permission and reload."
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoicesReady(true);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (!session || !voicesReady) return;
    if (muted) return;
    askCurrentQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, session, voicesReady, muted]);

  const askCurrentQuestion = () => {
    if (!session) return;
    const q = session.questions[qIdx];
    if (!q) return;
    stopSpeaking();
    setAiSpeaking(true);
    utteranceRef.current = speak(q, avatar.voice, {
      onstart: () => setAiSpeaking(true),
      onend: () => setAiSpeaking(false),
      onerror: () => setAiSpeaking(false),
    });
    const estimated = Math.min(20000, 2500 + q.length * 55);
    setTimeout(() => setAiSpeaking(false), estimated);
  };

  const toggleMute = () => {
    if (muted) {
      setMuted(false);
    } else {
      setMuted(true);
      stopSpeaking();
      setAiSpeaking(false);
    }
  };

  useEffect(() => {
    if (recording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [recording]);

  const startRecording = () => {
    if (!streamRef.current) {
      toast.error("No microphone available");
      return;
    }
    stopSpeaking();
    setAiSpeaking(false);
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const mr = new MediaRecorder(streamRef.current, { mimeType: mime });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      await processRecording(blob);
    };
    recorderRef.current = mr;
    mr.start();
    setTranscript("");
    setRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  const processRecording = async (blob) => {
    setProcessing(true);
    try {
      const { transcript: t } = await transcribeAudio(sessionId, qIdx, blob);
      setTranscript(t || "(no speech detected)");
      await submitAnswer(sessionId, qIdx, t || "");
      toast.success("Answer captured");
    } catch (e) {
      console.error(e);
      toast.error("Transcription failed. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  const nextQuestion = async () => {
    if (!session) return;
    stopSpeaking();
    if (qIdx + 1 < session.questions.length) {
      setQIdx(qIdx + 1);
      setTranscript("");
    } else {
      setFinalizing(true);
      try {
        await getFeedback(sessionId);
        nav(`/feedback/${sessionId}`);
      } catch (e) {
        toast.error("Could not generate feedback");
        setFinalizing(false);
      }
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#121212]" />
      </div>
    );
  }

  const totalQ = session.questions.length;
  const currentQ = session.questions[qIdx] || "";
  const progressPct = ((qIdx + 1) / totalQ) * 100;
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <main
      data-testid="interview-page"
      className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto pb-20"
    >
      <div className="pt-6 pb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs tracking-widest uppercase text-[#6B6B6B]">
            Question {qIdx + 1} / {totalQ}
          </span>
          <span
            data-testid="interview-timer"
            className="font-mono text-xs tracking-widest uppercase text-[#6B6B6B]"
          >
            {recording ? "REC " : "IDLE "}
            {mins}:{secs}
          </span>
        </div>
        <div className="h-1 w-full bg-[#E2E0D8] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF4500] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div
            data-testid="ai-interviewer"
            className="relative rounded-2xl overflow-hidden border border-[#E2E0D8] aspect-video"
            style={{
              background: `linear-gradient(135deg, ${avatar.accent} 0%, #050505 85%)`,
            }}
          >
            {/* Orbiting rings backdrop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square rounded-full border border-white/10 orbit-slow" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] aspect-square rounded-full border border-white/5 orbit-fast" />
            </div>
            {/* Dynamic spotlight */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
              style={{
                background: `radial-gradient(ellipse at 50% 35%, ${
                  aiSpeaking ? "rgba(255,69,0,0.32)" : "rgba(255,69,0,0.08)"
                } 0%, transparent 62%)`,
              }}
            />

            {/* 3D avatar stage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Tilt3DCard intensity={20} speaking={aiSpeaking}>
                <div className="tilt-inner relative">
                  {/* Outer pulse glow */}
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-700 ${
                      aiSpeaking ? "scale-[1.8] opacity-100" : "scale-100 opacity-0"
                    }`}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,69,0,0.42) 0%, transparent 70%)",
                      filter: "blur(36px)",
                    }}
                  />
                  <div
                    className={`tilt-layer-front relative w-44 h-56 md:w-60 md:h-72 rounded-2xl overflow-hidden border transition-all duration-500 flex items-end justify-center ${
                      aiSpeaking
                        ? "border-[#FF4500] shadow-[0_0_80px_rgba(255,69,0,0.65)]"
                        : "border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                    }`}
                    style={{
                      background: `linear-gradient(180deg, ${avatar.accent}55 0%, ${avatar.accent}22 45%, #0f0f0f 100%)`,
                    }}
                  >
                    {/* Orbital ring backdrop */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square rounded-full border border-white/10 orbit-slow pointer-events-none" />
                    {/* Spotlight */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse at 50% 15%, rgba(255,255,255,0.22) 0%, transparent 55%)",
                      }}
                    />
                    {/* Animated 3D interviewer — reacts to speaking state */}
                    <div className="relative w-[92%] h-[92%]">
                      <AnimatedPersona
                        avatar={avatar}
                        speaking={aiSpeaking}
                        imgClassName="drop-shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                    <div className="tilt-shine" />
                  </div>
                  {/* Floor reflection */}
                  <div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-6 rounded-full blur-xl"
                    style={{
                      background: aiSpeaking
                        ? "rgba(255,69,0,0.6)"
                        : "rgba(255,69,0,0.25)",
                    }}
                  />
                  {/* Waveform */}
                  <div
                    className={`absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6 transition-opacity duration-300 ${
                      aiSpeaking ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <span
                        key={i}
                        className="wave-bar w-1 bg-[#FF4500] rounded-full"
                        style={{ height: "100%", animationDelay: `${i * 0.09}s` }}
                      />
                    ))}
                  </div>
                </div>
              </Tilt3DCard>

              <div className="mt-20 text-center">
                <div className="font-heading text-white text-2xl font-medium">
                  {avatar.name}
                </div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/55 mt-1">
                  {avatar.title}
                </div>
              </div>
            </div>

            {/* Top-right controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                data-testid="mute-button"
                onClick={toggleMute}
                className="w-9 h-9 rounded-full backdrop-blur-md bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                title={muted ? "Unmute interviewer" : "Mute interviewer"}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button
                data-testid="replay-question-button"
                onClick={askCurrentQuestion}
                disabled={muted || recording}
                className="w-9 h-9 rounded-full backdrop-blur-md bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors disabled:opacity-40"
                title="Replay question"
              >
                <RotateCw size={13} />
              </button>
              <div className="flex items-center gap-2 backdrop-blur-md bg-black/40 border border-white/20 rounded-full px-3 py-1.5">
                {aiSpeaking ? (
                  <>
                    <Volume2 size={12} className="text-[#FF4500]" />
                    <span className="font-mono text-[10px] tracking-widest uppercase text-white">
                      Asking
                    </span>
                  </>
                ) : recording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
                    <span className="font-mono text-[10px] tracking-widest uppercase text-white">
                      Listening
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white/50" />
                    <span className="font-mono text-[10px] tracking-widest uppercase text-white/80">
                      Standby
                    </span>
                  </>
                )}
              </div>
            </div>

            {micError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center z-30">
                <div>
                  <AlertCircle className="mx-auto mb-3" />
                  <p className="text-sm max-w-sm">{micError}</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 backdrop-blur-xl bg-black/50 border border-white/20 rounded-full p-2 shadow-2xl z-20">
              {!recording ? (
                <button
                  data-testid="record-button"
                  onClick={startRecording}
                  disabled={processing || finalizing}
                  className="w-14 h-14 rounded-full bg-[#FF4500] hover:bg-[#E03C00] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 pulse-ring"
                >
                  <Mic size={22} className="text-white" />
                </button>
              ) : (
                <button
                  data-testid="stop-button"
                  onClick={stopRecording}
                  className="w-14 h-14 rounded-full bg-white text-[#121212] hover:bg-[#F0EFEA] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              )}
              <div className="px-4 text-white font-mono text-xs tracking-widest uppercase">
                {recording
                  ? "Recording…"
                  : processing
                  ? "Transcribing…"
                  : aiSpeaking
                  ? "Interviewer speaking…"
                  : "Press to answer"}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div
            data-testid="question-card"
            className="bg-white border border-[#E2E0D8] rounded-2xl p-8 shadow-sm fade-up"
            key={qIdx}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1]">
                {avatar.name.split(" ")[0]} asks
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-medium leading-snug text-[#121212]">
              {currentQ}
            </h2>
          </div>

          <div
            data-testid="transcript-card"
            className="bg-white border border-[#E2E0D8] rounded-2xl p-6 flex-1 min-h-[180px]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1]">
                Your transcript
              </span>
              <FileText size={14} className="text-[#A1A1A1]" />
            </div>
            {processing ? (
              <div className="flex items-center gap-2 text-[#6B6B6B] text-sm">
                <Loader2 size={14} className="animate-spin" />
                Transcribing your answer…
              </div>
            ) : transcript ? (
              <p className="text-[#121212] leading-relaxed text-sm">{transcript}</p>
            ) : (
              <p className="text-[#A1A1A1] italic text-sm">
                Your spoken answer will appear here after you stop recording.
              </p>
            )}
          </div>

          <button
            data-testid="next-question-button"
            onClick={nextQuestion}
            disabled={!transcript || processing || recording || finalizing}
            className="flex items-center justify-between gap-3 bg-[#121212] hover:bg-[#FF4500] disabled:opacity-40 disabled:hover:bg-[#121212] text-white rounded-full px-6 py-4 font-medium transition-all hover:scale-[1.01] active:scale-95 group"
          >
            <span>
              {finalizing
                ? "Generating feedback…"
                : qIdx + 1 === totalQ
                ? "Finish & view feedback"
                : "Next question"}
            </span>
            {finalizing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SkipForward
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
