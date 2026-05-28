export default function CinematicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* MAIN BASE */}
      <div className="absolute inset-0 bg-black"></div>

      {/* RED GLOW */}
      <div className="absolute top-[-200px] left-[-100px] w-[700px] h-[700px] bg-red-600/20 blur-[180px] rounded-full"></div>

      {/* PURPLE GLOW */}
      <div className="absolute bottom-[-300px] right-[-100px] w-[800px] h-[800px] bg-purple-700/20 blur-[200px] rounded-full"></div>

      {/* CENTER GLOW */}
      <div className="absolute top-[30%] left-[40%] w-[500px] h-[500px] bg-pink-500/10 blur-[160px] rounded-full"></div>

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:80px_80px]"></div>

      {/* DARK VIGNETTE */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black"></div>

    </div>
  );
}