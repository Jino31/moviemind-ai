// src/components/Footer.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowUp } from "react-icons/fa";

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
    title: "Account",
    links: [
      { label: "My Profile", to: "/profile" },
      { label: "Settings", to: "/settings" },
    ],
  },
];

/* Reveals the footer content once it scrolls into view */
function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

function Footer() {
  const currentYear = new Date().getFullYear();
  const [ref, inView] = useInView();

  const revealClass = `transition-all duration-700 ease-out motion-reduce:transition-none ${
    inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
  }`;

  const delay = (ms) => ({ transitionDelay: `${ms}ms` });

  return (
    <footer
      ref={ref}
      className="site-footer relative z-10 mt-12 overflow-hidden transition-colors duration-300"
    >
      {/* Animated gradient top line */}
      <div
        aria-hidden="true"
        className="footer-flow footer-gradient absolute inset-x-0 top-0 h-px opacity-80"
      />

      {/* Soft floating glows */}
      <div
        aria-hidden="true"
        className="footer-float pointer-events-none absolute -top-24 right-[8%] h-48 w-72 rounded-full bg-purple-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="footer-float pointer-events-none absolute -bottom-24 left-[6%] h-40 w-64 rounded-full bg-pink-500/10 blur-3xl [animation-delay:-4s]"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-10 md:px-8">
        {/* Main row */}
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Brand */}
          <div className={`${revealClass} max-w-sm`} style={delay(0)}>
            <Link
              to="/"
              aria-label="MovieMind AI home"
              className="group inline-flex items-center gap-2.5"
            >
              <img
                src="/logo.png"
                alt=""
                className="h-9 w-9 object-contain transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
              />
              <span className="footer-gradient bg-clip-text text-xl font-black tracking-tight text-transparent">
                MovieMind AI
              </span>
            </Link>

            <p className="footer-text mt-3 text-sm leading-6">
              Discover your next favorite movie with intelligent
              recommendations.
            </p>
          </div>

          {/* Links */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-10 sm:gap-16"
          >
            {navigation.map((section, i) => (
              <div
                key={section.title}
                className={revealClass}
                style={delay(120 + i * 120)}
              >
                <h3 className="footer-title mb-4 text-[11px] font-bold uppercase tracking-[0.16em]">
                  {section.title}
                </h3>

                <ul className="space-y-2.5">
                  {section.links.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="footer-link group relative inline-block text-sm"
                      >
                        {item.label}
                        <span className="footer-underline absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 group-hover:w-full" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div
          className={`${revealClass} footer-divider footer-text mt-10 flex items-center justify-between gap-4 border-t pt-5 text-xs`}
          style={delay(360)}
        >
          <p>© {currentYear} MovieMind AI. All rights reserved.</p>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="footer-btn group inline-flex h-9 w-9 items-center justify-center rounded-full hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/20"
          >
            <FaArrowUp className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;