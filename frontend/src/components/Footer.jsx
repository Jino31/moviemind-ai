// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { FaHeart, FaArrowUp } from "react-icons/fa";

function Footer() {
  const currentYear = new Date().getFullYear();

  const navigation = [
    {
      title: "Discover",
      links: [
        { label: "Home", to: "/" },
        { label: "Explore Movies", to: "/movies" },
        { label: "AI Movie Assistant", to: "/chatbot" },
        { label: "Find Your Movie", to: "/find-your-movie" },
      ],
    },
    {
      title: "Your Space",
      links: [
        { label: "My Profile", to: "/profile" },
        { label: "Settings", to: "/settings" },
      ],
    },
  ];

  return (
    <footer className="relative z-10 mt-12 overflow-hidden border-t border-line surface transition-colors duration-300">
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-0 h-40 w-72 rounded-full bg-purple-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-7 md:px-8 md:py-8">
        {/* Brand */}
        <div className="border-b border-line pb-5">
          <Link
            to="/"
            aria-label="MovieMind AI home"
            className="group inline-flex items-center gap-2.5"
          >
            <img
              src="/logo.png"
              alt="MovieMind AI"
              className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-105"
            />

            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-xl font-black tracking-tight text-transparent">
              MovieMind AI
            </span>
          </Link>

          <p className="mt-2 max-w-md text-sm leading-5 t-muted">
            Discover your next favorite movie with intelligent
            recommendations and a passion for cinema.
          </p>
        </div>

        {/* Essential links */}
        <div className="grid grid-cols-2 gap-6 border-b border-line py-5 sm:grid-cols-3">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] t-main">
                {section.title}
              </h3>

              <ul className="space-y-2">
                {section.links.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm t-muted transition-colors duration-200 hover:text-pink-500"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Short tagline */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] t-main">
              Made for movie lovers
            </h3>

            <p className="max-w-xs text-sm leading-5 t-muted">
              Less scrolling. Better discoveries. More unforgettable stories.
            </p>

            <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500" />
          </div>
        </div>

        {/* Compact bottom bar */}
        <div className="flex flex-col items-start justify-between gap-3 pt-4 text-xs t-muted sm:flex-row sm:items-center">
          <p>
            © {currentYear} MovieMind AI. All rights reserved.
          </p>

          <p className="flex items-center gap-1.5">
            Made with
            <FaHeart className="text-red-500" />
            for cinema lovers.
          </p>

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            aria-label="Back to top"
            className="inline-flex items-center gap-2 transition-colors hover:text-pink-500"
          >
            Back to top
            <FaArrowUp />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;