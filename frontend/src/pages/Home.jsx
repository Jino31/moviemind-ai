// src/pages/Home.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaFilm,
  FaFire,
  FaMagic,
  FaPlay,
  FaRobot,
  FaSearch,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const features = [
  {
    icon: FaFilm,
    title: "Explore Movies",
    text: "Discover trending, top-rated, upcoming, action, thriller, romance, sci-fi and thousands more movies instantly.",
    tint: "bg-red-500/15 text-red-500",
  },
  {
    icon: FaRobot,
    title: "AI Recommendation",
    text: "Ask MovieMind AI about actors, genres, emotional stories, trailers and personalized recommendations.",
    tint: "bg-pink-500/15 text-pink-500",
  },
  {
    icon: FaFire,
    title: "Premium Experience",
    text: "A cinematic interface inspired by premium streaming platforms, with immersive visuals and smooth animations.",
    tint: "bg-fuchsia-500/15 text-fuchsia-500",
  },
];

/* Fires once when an element scrolls into view */
function useInView(threshold = 0.15) {
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
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/* Scroll-triggered fade + rise */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app-bg relative min-h-screen overflow-hidden font-sans">
      {/* Grid + glow: top of the page only, fades out before the content ends */}
      <div
        aria-hidden="true"
        className="hero-backdrop pointer-events-none absolute inset-x-0 top-0 h-[900px]"
      >
        <div className="backdrop-glow absolute inset-0" />
        <div className="grid-lines absolute inset-0" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* HERO */}
        <section className="mx-auto max-w-7xl px-6 pb-16 pt-36 text-center md:px-10 md:pb-20 md:pt-44">
          <div className="hero-reveal hero-reveal-1 mb-8 inline-flex items-center gap-2.5 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-500 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            AI Powered Movie Discovery
          </div>

          <h1 className="hero-title mb-6 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="hero-title-line block">Discover Movies</span>
            <span className="hero-title-line block">
              <span className="gradient-flow bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                With AI Intelligence
              </span>
            </span>
          </h1>

          <p className="hero-reveal hero-reveal-3 t-muted mx-auto mb-12 max-w-3xl text-base font-medium leading-relaxed md:text-xl">
            Personalized movie discovery powered by AI. Explore trending films,
            emotional stories, dark thrillers, sci-fi adventures and more.
          </p>

          <div className="hero-reveal hero-reveal-4 flex flex-col items-center justify-center gap-4 sm:flex-row md:gap-5">
            <button
              onClick={() => navigate("/movies")}
              className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-8 py-4 text-lg font-bold text-white shadow-[0_10px_40px_-8px_rgba(236,72,153,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_50px_-8px_rgba(236,72,153,0.75)] active:scale-95 sm:w-auto"
            >
              <FaPlay className="text-sm" />
              Explore Movie Trailers
            </button>

            <button
              onClick={() => navigate("/find-your-movie")}
              className="border-line surface surface-hover t-main inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border px-8 py-4 text-lg font-bold backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 sm:w-auto"
            >
              <FaSearch className="text-sm" />
              Find Your Movie
            </button>

            <button
              onClick={() => navigate("/chatbot")}
              className="border-line surface surface-hover t-main inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border px-8 py-4 text-lg font-bold backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 sm:w-auto"
            >
              <FaMagic className="text-sm" />
              AI Recommendation
            </button>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 md:px-10 md:pt-16">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-pink-500">
              Why MovieMind
            </p>
            <h2 className="t-main text-3xl font-black tracking-tight md:text-5xl">
              Everything you need to find your next favorite film
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {features.map(({ icon: Icon, title, text, tint }, i) => (
              <Reveal key={title} delay={i * 130}>
                <div className="border-line surface group relative h-full overflow-hidden rounded-[32px] border p-8 shadow-lg backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:border-pink-500/40 hover:shadow-pink-500/10 md:p-10">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-purple-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />

                  <div className="relative">
                    <div
                      className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${tint}`}
                    >
                      <Icon />
                    </div>

                    <h3 className="t-main mb-4 text-2xl font-bold tracking-tight md:text-3xl">
                      {title}
                    </h3>

                    <p className="t-muted text-sm font-medium leading-relaxed md:text-base">
                      {text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
          <Reveal>
            <div className="border-line surface relative overflow-hidden rounded-[32px] border px-6 py-14 text-center backdrop-blur-2xl md:px-16 md:py-20">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-red-500/15 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl"
              />

              <div className="relative">
                <h2 className="t-main mx-auto mb-4 max-w-2xl text-3xl font-black tracking-tight md:text-5xl">
                  Ready to find your next movie night?
                </h2>
                <p className="t-muted mx-auto mb-8 max-w-xl text-base font-medium md:text-lg">
                  Tell MovieMind AI what you're in the mood for and get
                  recommendations in seconds.
                </p>

                <button
                  onClick={() => navigate("/chatbot")}
                  className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-8 py-4 text-lg font-bold text-white shadow-[0_10px_40px_-8px_rgba(236,72,153,0.6)] transition-all duration-300 hover:-translate-y-1 active:scale-95"
                >
                  Start Exploring
                  <FaArrowRight className="text-sm transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        <Footer />
      </div>
    </div>
  );
}

export default Home;