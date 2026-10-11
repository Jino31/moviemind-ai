// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { FaGithub, FaTwitter, FaDiscord, FaYoutube } from "react-icons/fa";

function Footer() {
  return (
    <footer className="relative z-15 border-t border-line surface backdrop-blur-2xl mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="MovieMind AI"
                className="h-10 w-10 object-contain rounded-xl"
              />
              <h2 className="text-xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                MovieMind AI
              </h2>
            </Link>
            <p className="t-muted text-xs md:text-sm leading-relaxed">
              An interactive, next-generation personalized film discovery engine powered by intelligence matrix matching pipelines.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold t-main uppercase tracking-wider mb-4">Navigation</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="t-muted hover:text-red-500 transition">Home</Link>
              </li>
              <li>
                <Link to="/movies" className="t-muted hover:text-pink-500 transition">Movies</Link>
              </li>
              <li>
                <Link to="/chatbot" className="t-muted hover:text-purple-500 transition">AI Recommendation</Link>
              </li>
              <li>
                <Link to="/find-your-movie" className="t-muted hover:text-red-400 transition">Find Your Movie</Link>
              </li>
            </ul>
          </div>

          {/* Platform Resources */}
          <div>
            <h3 className="text-sm font-bold t-main uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/profile" className="t-muted hover:text-red-500 transition">My Profile</Link>
              </li>
              <li>
                <Link to="/performance" className="t-muted hover:text-pink-500 transition">Performance Dashboard</Link>
              </li>
              <li>
                <Link to="/settings" className="t-muted hover:text-purple-500 transition">Settings</Link>
              </li>
              <li>
                <Link to="/support-console" className="t-muted hover:text-red-400 transition">Support Console</Link>
              </li>
            </ul>
          </div>

          {/* Socials / Connect */}
          <div>
            <h3 className="text-sm font-bold t-main uppercase tracking-wider mb-4">Connect</h3>
            <p className="t-muted text-xs md:text-sm mb-4">
              Join our community and explore the future of cinematic discovery.
            </p>
            <div className="flex items-center gap-4 text-xl t-muted">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-red-500 transition">
                <FaGithub />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-pink-500 transition">
                <FaTwitter />
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-purple-500 transition">
                <FaDiscord />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-red-500 transition">
                <FaYoutube />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-line pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs t-muted">
          <p>© {new Date().getFullYear()} MovieMind AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:t-main cursor-pointer transition">Privacy Policy</span>
            <span className="hover:t-main cursor-pointer transition">Terms of Service</span>
            <span className="hover:t-main cursor-pointer transition">Security Matrix</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;