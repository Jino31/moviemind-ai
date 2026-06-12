import { Routes, Route } from "react-router-dom";
import FindYourMovie from "./pages/FindYourMovie";
import FeedbackPanel from "./components/FeedbackPanel";

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
    <Routes>

      {/* Home */}
      <Route
        path="/"
        element={<Home />}
      />

      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* AI Chatbot */}
      <Route
        path="/chatbot"
        element={<Chatbot />}
      />

      {/* Movies */}
      <Route
        path="/movies"
        element={<Movies />}
      />

      {/* Movie Details */}
      <Route
        path="/movie/:id"
        element={<MovieDetails />}
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={<Profile />}
      />

      {/* Performance Dashboard */}
      <Route
        path="/performance"
        element={<Performance />}
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={<Settings />}
      />
      <Route path="/find-your-movie" element={<FindYourMovie />} />
      <Routes>
        {/* Your current route trees */}
      </Routes>
      
      {/* 📥 Drop it right here at the base layout layer */}
      <FeedbackPanel />
    

    </Routes>
  );
}

export default App;