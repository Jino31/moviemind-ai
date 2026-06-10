import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

 return (
  <div className="min-h-screen bg-black text-white relative overflow-hidden">

    {/* Background */}

    <div className="fixed inset-0 -z-10">

      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-red-600/20 blur-[180px]" />

      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-purple-600/20 blur-[180px]" />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

    </div>

    <div className="max-w-7xl mx-auto px-6 py-12">

      {/* Header */}

      <div className="flex items-center justify-between mb-12">

        <div>

          <h1 className="text-6xl font-black bg-gradient-to-r from-white via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Settings
          </h1>

          <p className="text-gray-400 mt-3 text-lg">
            Manage your MovieMind AI experience
          </p>

        </div>

        <button
          onClick={() => navigate("/")}
          className="
            px-6 py-3
            rounded-2xl
            bg-white/10
            border border-white/10
            hover:bg-white/20
            transition-all
          "
        >
          ← Back
        </button>

      </div>

      {/* Quick Settings */}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Security */}

        <div className="
          bg-white/5
          border border-white/10
          rounded-3xl
          p-8
          hover:border-pink-500/30
          hover:scale-[1.02]
          transition-all
        ">

          <div className="flex items-center gap-4">

            <div className="text-5xl">
              🛡️
            </div>

            <div>

              <h2 className="text-3xl font-bold">
                Security
              </h2>

              <p className="text-gray-400 mt-2">
                Password, login methods and account protection.
              </p>

            </div>

          </div>

          <button className="
            mt-6
            px-5 py-3
            rounded-xl
            bg-white/10
            hover:bg-white/20
          ">
            Manage Security
          </button>

        </div>

        {/* Notifications */}

        <div className="
          bg-white/5
          border border-white/10
          rounded-3xl
          p-8
          hover:border-pink-500/30
          hover:scale-[1.02]
          transition-all
        ">

          <div className="flex items-center gap-4">

            <div className="text-5xl">
              🔔
            </div>

            <div>

              <h2 className="text-3xl font-bold">
                Notifications
              </h2>

              <p className="text-gray-400 mt-2">
                Alerts, updates and recommendation notifications.
              </p>

            </div>

          </div>

          <button className="
            mt-6
            px-5 py-3
            rounded-xl
            bg-white/10
            hover:bg-white/20
          ">
            Configure
          </button>

        </div>

      </div>

      {/* Preferences */}

      <div className="mt-8">

        <div className="
          bg-white/5
          border border-white/10
          rounded-3xl
          p-8
        ">

          <h2 className="text-4xl font-bold mb-8">
            Preferences
          </h2>

          <div className="space-y-6">

            <div className="flex justify-between items-center">

              <div>

                <h3 className="text-xl font-semibold">
                  Language
                </h3>

                <p className="text-gray-400">
                  English
                </p>

              </div>

              <button className="px-5 py-2 rounded-xl bg-white/10">
                Change
              </button>

            </div>

            <div className="border-t border-white/10"></div>

            <div className="flex justify-between items-center">

              <div>

                <h3 className="text-xl font-semibold">
                  Appearance
                </h3>

                <p className="text-gray-400">
                  Dark Mode
                </p>

              </div>

              <button className="px-5 py-2 rounded-xl bg-white/10">
                Enabled
              </button>

            </div>

            <div className="border-t border-white/10"></div>

            <div className="flex justify-between items-center">

              <div>

                <h3 className="text-xl font-semibold">
                  Recommendation Quality
                </h3>

                <p className="text-gray-400">
                  Personalized AI Suggestions
                </p>

              </div>

              <button className="px-5 py-2 rounded-xl bg-pink-500">
                Active
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* Danger Zone */}

      <div className="
        mt-8
        border border-red-500/30
        bg-red-500/5
        rounded-3xl
        p-8
      ">

        <h2 className="text-3xl font-bold text-red-400 mb-4">
          Danger Zone
        </h2>

        <p className="text-gray-400 mb-6">
          Permanently remove your MovieMind account and all associated data.
        </p>

        <button className="
          px-8 py-4
          rounded-2xl
          bg-red-500
          hover:bg-red-600
          transition-all
          font-semibold
        ">
          Delete Account
        </button>

      </div>

    </div>

  </div>
);
}