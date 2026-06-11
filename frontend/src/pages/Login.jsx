import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const saveUserToFirestore = async (user) => {
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: user.displayName || email.split("@")[0],
          email: user.email,
          photoURL: user.photoURL || "",
          watchlistCount: 0,
          watchedCount: 0,
          watchHours: 0,
          aiMatch: 70,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("❌ Firestore Sync Error:", err);
    }
  };

  // Modern Popup Auth Flow — cleaner and avoids cookie isolation issues
  const handleGoogleLogin = async () => {
    try {
      setError("");
      setAuthActionLoading(true);
      
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        console.log("🚀 Google Auth Success:", result.user.email);
        await saveUserToFirestore(result.user);
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      console.error("❌ Google Auth Error:", error);
      setError(error.message);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // Connected Email and Password Sign In Form Submission
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      setError("");
      setAuthActionLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result?.user) {
        console.log("🚀 Email Auth Success:", result.user.email);
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      console.error("❌ Email Auth Error:", error);
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password combination.");
      } else {
        setError(error.message);
      }
    } finally {
      setAuthActionLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("👥 Global Auth State Changed:", user?.email ?? "no user available");
      if (user) {
        navigate("/profile", { replace: true });
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[40px] p-10 shadow-2xl">

        <h1 className="text-5xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-6">
          Welcome Back
        </h1>

        <p className="text-gray-400 text-xl mb-10">
          Login to MovieMind AI
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Email"
            disabled={authActionLoading}
            className="w-full bg-black rounded-3xl px-6 py-5 text-white outline-none border border-white/5 mb-6 focus:border-pink-500/50 transition-colors disabled:opacity-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            disabled={authActionLoading}
            className="w-full bg-black rounded-3xl px-6 py-5 text-white outline-none border border-white/5 mb-8 focus:border-pink-500/50 transition-colors disabled:opacity-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button 
            type="submit"
            disabled={authActionLoading}
            className="w-full py-5 rounded-3xl font-bold text-xl text-white bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {authActionLoading && !email.includes('@') ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Login"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-gray-500 text-sm tracking-widest">OR</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={authActionLoading}
          className="w-full py-4 rounded-3xl bg-white text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {authActionLoading && email.includes('@') === false ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Connecting secure window...
            </>
          ) : (
            <>
              <img
                src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
                alt="google"
                className="w-6 h-6"
              />
              Continue with Google
            </>
          )}
        </button>

      </div>
    </div>
  );
}

export default Login;