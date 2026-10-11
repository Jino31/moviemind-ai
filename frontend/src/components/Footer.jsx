// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { FaGithub, FaTwitter, FaDiscord, FaYoutube, FaFilm, FaHeart } from "react-icons/fa";

function Footer() {
  return (
    <footer className="relative z-15 border-t border-line surface backdrop-blur-3xl mt-24 overflow-hidden transition-colors duration-300">
      {/* Cinematic Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-purple-500/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20 relative z-10">
        
        {/* Top Section: Brand & Newsletter Callout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-line items-center">
          
          <div className="lg:col-span-6 space-y-4">
            <Link to="/" className="flex items-center gap-3.5 group">
              <img
                src="/logo.png"
                alt="MovieMind AI"
                className="h-12 w-12 object-contain rounded-2xl border border-white/10 group-hover:scale-105 transition-transform"
              />
              <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                MovieMind AI
              </h2>
            </Link>
            <p className="t-muted text-sm md:text-base leading-relaxed max-w-lg font-medium">
              Next-generation cinematic intelligence engine. Powered by advanced matching pipelines to discover your next favorite masterpiece.
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center gap-3 bg-black/20 dark:bg-white/5 border border-line p-2.5 rounded-3xl backdrop-blur-2xl">
            <div className="flex items-center gap-3 px-4 py-2 w-full">
              <FaFilm className="text-red-500 text-lg flex-shrink-0" />
              <input
                type="email"
                placeholder="Enter your email for AI film drops..."
                className="bg-transparent outline-none t-main placeholder:text-gray-400 text-sm w-full"
              />
            </div>
            <button className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,100,0.3)] whitespace-nowrap cursor-pointer">
              Subscribe
            </button>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-line">
          
          {/* Column 1: Explore */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold t-main uppercase tracking-widest text-red-500">Discovery</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/" className="t-muted hover:text-red-500 transition">Home Hub</Link></li>
              <li><Link to="/movies" className="t-muted hover:text-pink-500 transition">Trending Movies</Link></li>
              <li><Link to="/chatbot" className="t-muted hover:text-purple-500 transition">AI Film Chatbot</Link></li>
              <li><Link to="/find-your-movie" className="t-muted hover:text-red-400 transition">Reverse Frame Finder</Link></li>
            </ul>
          </div>

          {/* Column 2: Dashboard */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold t-main uppercase tracking-widest text-pink-500">Workspace</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/profile" className="t-muted hover:text-red-500 transition">User Profile</Link></li>
              <li><Link to="/performance" className="t-muted hover:text-pink-500 transition">Performance Matrix</Link></li>
              <li><Link to="/settings" className="t-muted hover:text-purple-500 transition">System Settings</Link></li>
              <li><Link to="/support-console" className="t-muted hover:text-red-400 transition">Support Console</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & Security */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold t-main uppercase tracking-widest text-purple-500">Governance</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="t-muted hover:t-main transition cursor-pointer">Privacy Framework</li>
              <li className="t-muted hover:t-main transition cursor-pointer">Terms of Service</li>
              <li className="t-muted hover:t-main transition cursor-pointer">Security Matrix</li>
              <li className="t-muted hover:t-main transition cursor-pointer">API Documentation</li>
            </ul>
          </div>

          {/* Column 4: Community & Socials */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold t-main uppercase tracking-widest text-fuchsia-500">Connect</h3>
            <p className="t-muted text-xs font-medium">
              Join cinephiles and developers building the future of AI media.
            </p>
            <div className="flex items-center gap-3 text-lg">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl surface surface-hover border border-line flex items-center justify-center t-muted hover:text-red-500 transition">
                <FaGithub />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl surface surface-hover border border-line flex items-center justify-center t-muted hover:text-pink-500 transition">
                <FaTwitter />
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl surface surface-hover border border-line flex items-center justify-center t-muted hover:text-purple-500 transition">
                <FaDiscord />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl surface surface-hover border border-line flex items-center justify-center t-muted hover:text-red-500 transition">
                <FaYoutube />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium t-muted">
          <p>© {new Date().getFullYear()} MovieMind AI. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Crafted with <FaHeart className="text-red-500 text-xs animate-pulse" /> for cinematic excellence
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;