import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Interviewers from "./pages/Interviewers";
import Interview from "./pages/Interview";
import Feedback from "./pages/Feedback";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Nav from "./components/Nav";
import IntroScreen from "./components/IntroScreen";

const SPLASH_KEY = "mockify_splash_seen_v1";

export default function App() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem(SPLASH_KEY);
    if (!seen) setShowIntro(true);
  }, []);

  const dismissIntro = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch (e) {
      // sessionStorage might be blocked — non-fatal.
    }
  };

  return (
    <div className="App grain min-h-screen" style={{ backgroundColor: "#F9F8F6" }}>
      {showIntro && <IntroScreen onDone={dismissIntro} />}
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/interviewers" element={<Interviewers />} />
          <Route path="/interview/:sessionId" element={<Interview />} />
          <Route path="/feedback/:sessionId" element={<Feedback />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}
