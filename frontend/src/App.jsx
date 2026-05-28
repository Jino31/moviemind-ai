import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Chatbot from "./pages/Chatbot";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";

function App() {
  return (
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
    </Routes>
  );
}

export default App;