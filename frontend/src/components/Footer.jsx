// src/components/Footer.jsx
import { Link } from "react-router-dom";
import {
  FaGithub,
  FaTwitter,
  FaDiscord,
  FaYoutube,
  FaHeart,
  FaArrowUp,
} from "react-icons/fa";

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

  const socials = [
    {
      label: "GitHub",
      icon: <FaGithub />,
      href: "https://github.com",
    },
    {
      label: "Twitter",
      icon: <FaTwitter />,
      href: "https://twitter.com",
    },
    {
      label: "Discord",
      icon: <FaDiscord />,
      href: "https://discord.com",
    },
    {
      label: "YouTube",
      icon: <FaYoutube />,
      href: "https://youtube.com",
    },
  ];

  return (
    <footer className="relative z-10 mt-20 overflow-hidden border-t border-line surface transition-colors duration-300">
      {/* Cinematic ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-red-500/10 via-pink-500/10 to-purple-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-14">
        {/* Brand section */}
        <div className="flex flex-col gap-8 border-b border-line pb-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <Link
              to="/"
              aria-label="MovieMind AI home"
              className="group inline-flex items-center gap-3"
            >
              <img
                src="/logo.png"
                alt="MovieMind AI"
                className="h-11 w-11 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
              />

              <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
                MovieMind AI
              </span>
            </Link>

            <p className="mt-3 max-w-md text-sm leading-6 t-muted">
              Discover your next favorite movie with intelligent
              recommendations and a passion for cinema.
            </p>
          </div>

          {/* Social links */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] t-muted">
              Follow the journey
            </p>

            <div className="flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-line t-muted transition-all duration-200 hover:-translate-y-1 hover:border-pink-500/40 hover:text-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                >
                  <span className="text-lg">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="grid grid-cols-2 gap-10 border-b border-line py-10 md:grid-cols-3">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] t-main">
                {section.title}
              </h3>

              <ul className="space-y-3">
                {section.links.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="inline-flex text-sm t-muted transition-colors duration-200 hover:text-pink-500 focus-visible:outline-none focus-visible:text-pink-500"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Tagline */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] t-main">
              Made for movie lovers
            </h3>

            <p className="max-w-xs text-sm leading-6 t-muted">
              Less scrolling. Better discoveries. More unforgettable stories.
            </p>

            <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 pt-6 text-xs t-muted sm:flex-row sm:items-center sm:justify-between">
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
            className="inline-flex items-center gap-2 self-start rounded-lg py-2 transition-colors hover:text-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 sm:self-auto"
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