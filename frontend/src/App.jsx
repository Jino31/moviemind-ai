// frontend/src/App.jsx

import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext"; // 🌐 Added Language Translation Context Provider
import FindYourMovie from "./pages/FindYourMovie";
import FeedbackPanel from "./components/FeedbackPanel";
import SupportConsole from "./pages/SupportConsole"; 

import Home from "./pages/Home";
import Login from "./pages/Login";
import Chatbot from "./pages/Chatbot";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";

function App() {
  return (
    // 🌐 GLOBAL DICTIONARY WRAPPER: Provides state translation tracking to all nested component trees
    <LanguageProvider>
      <div className="relative min-h-screen bg-black text-white">
        
        {/* ── CORE ROUTING MATRIX ENGINE ── */}
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* AI Chatbot */}
          <Route path="/chatbot" element={<Chatbot />} />

          {/* Movies */}
          <Route path="/movies" element={<Movies />} />

          {/* Movie Details */}
          <Route path="/movie/:id" element={<MovieDetails />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* Performance Dashboard */}
          <Route path="/performance" element={<Performance />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />

          {/* Vision AI Reverse Frame Finder */}
          <Route path="/find-your-movie" element={<FindYourMovie />} />

          {/* FIXED FULL SCREEN ENTRY: Full standalone page routing point handler */}
          <Route path="/support-console" element={<SupportConsole />} />
        </Routes>
        
        {/* 📥 PLACED SAFELY OUTSIDE ROUTES: Universally overlays all active pages */}
        <FeedbackPanel />
        
      </div>
    </LanguageProvider>
  );
}

export default App;