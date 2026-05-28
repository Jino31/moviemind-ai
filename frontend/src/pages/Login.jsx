import { useState } from "react";

import {
  signInWithPopup,
} from "firebase/auth";

import {
  auth,
  provider,
} from "../firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // GOOGLE LOGIN
  // =========================

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(
        auth,
        provider
      );

      console.log(result.user);

      alert(
        `Welcome ${result.user.displayName}`
      );

    } catch (error) {
      console.log(error);
      alert("Google Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">

      <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[40px] p-10 shadow-2xl">

        {/* TITLE */}

        <h1 className="text-5xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-6">
          Welcome Back
        </h1>

        <p className="text-gray-400 text-xl mb-10">
          Login to MovieMind AI
        </p>

        {/* EMAIL */}

        <input
          type="email"
          placeholder="Email"
          className="w-full bg-black rounded-3xl px-6 py-5 text-white outline-none border border-white/5 mb-6"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          className="w-full bg-black rounded-3xl px-6 py-5 text-white outline-none border border-white/5 mb-8"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        {/* LOGIN BUTTON */}

        <button
          className="w-full py-5 rounded-3xl font-bold text-xl text-white bg-gradient-to-r from-red-500 to-pink-500 hover:scale-[1.02] transition duration-300 shadow-lg shadow-pink-500/30"
        >
          Login
        </button>

        {/* DIVIDER */}

        <div className="flex items-center gap-4 my-8">

          <div className="flex-1 h-[1px] bg-white/10"></div>

          <span className="text-gray-500">
            OR
          </span>

          <div className="flex-1 h-[1px] bg-white/10"></div>

        </div>

        {/* GOOGLE BUTTON */}

        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 rounded-3xl bg-white text-black font-bold text-lg hover:scale-[1.02] transition duration-300 flex items-center justify-center gap-3"
        >

          <img
            src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
            alt="google"
            className="w-6 h-6"
          />

          Continue with Google

        </button>

      </div>

    </div>
  );
}

export default Login;