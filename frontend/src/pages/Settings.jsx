import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_35%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_35%)] opacity-50"></div>

      <div className="relative z-10 max-w-6xl mx-auto p-8">

        <button
          onClick={() => navigate("/")}
          className="mb-8 px-6 py-3 rounded-2xl bg-white/10"
        >
          ← Back
        </button>

        <h1 className="text-6xl font-black mb-12">
          ⚙️ Settings
        </h1>

        <div className="space-y-6">

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold">
              🛡️ Security
            </h2>

            <p className="text-white/60 mt-3">
              Manage account security and privacy.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold">
              🌐 Language
            </h2>

            <p className="text-white/60 mt-3">
              English
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold">
              🔔 Notifications
            </h2>

            <p className="text-white/60 mt-3">
              Coming Soon
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold">
              🎨 Appearance
            </h2>

            <p className="text-white/60 mt-3">
              Dark Mode
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}