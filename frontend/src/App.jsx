// frontend/src/App.jsx

import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import FindYourMovie from "./pages/FindYourMovie";
import FeedbackPanel from "./components/FeedbackPanel";
import SupportConsole from "./pages/SupportConsole";
import AnnouncementBanner from "./components/AnnouncementBanner";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Chatbot from "./pages/Chatbot";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

function App() {
  return (
    <LanguageProvider>
      <div className="app-bg t-main relative min-h-screen">
        <AnnouncementBanner />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/find-your-movie" element={<FindYourMovie />} />
          <Route path="/support-console" element={<SupportConsole />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>

        {/* Floating button that opens the Support Center (hidden there and on /admin) */}
        <FeedbackPanel />
      </div>
    </LanguageProvider>
  );
}

export default App;