// frontend/src/components/Footer.jsx

import { FaExclamationTriangle } from "react-icons/fa";

export default function Footer() {
  const handleFeedbackRedirect = () => {
    window.open("https://forms.google.com", "_blank");
  };

  return (
    <footer className="w-full bg-black/40 border-t border-white/10 pt-16 pb-10 mt-20 relative z-20 select-none">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Central Identification Content Tracker */}
        <div className="space-y-4 max-w-xl">
          <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Help Us Improve
          </h3>
          <p className="text-white/60 text-sm leading-relaxed font-medium">
            Found an issue or missing content? Join the mission to <br className="hidden sm:inline" />
            make <span className="bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent font-bold">MovieMind AI</span> better for everyone.
          </p>
        </div>

        {/* Premium Action Blue Button Node */}
        <button
          onClick={handleFeedbackRedirect}
          className="mt-8 px-7 py-3.5 rounded-xl bg-[#0086d6] hover:bg-[#0095f0] text-white font-bold text-sm tracking-wide flex items-center gap-2.5 transition-all shadow-[0_0_30px_rgba(0,134,214,0.2)] hover:shadow-[0_0_40px_rgba(0,134,214,0.4)] hover:scale-[1.03] active:scale-95 cursor-pointer"
        >
          <FaExclamationTriangle className="text-xs" />
          <span>Report Issue / Feedback</span>
        </button>

        {/* Base Copyright Meta Row Grid */}
        <div className="w-full mt-16 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono font-bold tracking-widest text-white/40 gap-4">
          <p className="uppercase">
            © {new Date().getFullYear()} MOVIEMIND AI – PRECISE CINEMATIC INTELLIGENCE.
          </p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white/80 transition-colors cursor-pointer uppercase">ADMIN TERMINAL</span>
            <span className="text-white/20">|</span>
            <span className="uppercase text-white/60">CLASS OF 2026</span>
          </div>
        </div>

      </div>
    </footer>
  );
}