// frontend/src/components/FeedbackPanel.jsx

import { useNavigate, useLocation } from "react-router-dom";
import { FaCommentAlt } from "react-icons/fa";

export default function FeedbackPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // Guard clause: Hide the floating trigger completely if the user is already on the support dashboard view path
  if (location.pathname === "/support-console") return null;

  return (
    <div className="fixed bottom-6 right-6 z-[99999]">
      <button
        onClick={() => navigate("/support-console")}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-white/10 group"
        title="Open Support Console"
      >
        <FaCommentAlt className="text-lg group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}