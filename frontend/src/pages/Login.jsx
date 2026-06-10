import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import {
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [redirectLoading, setRedirectLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const saveUserToFirestore = async (user) => {
    await setDoc(
      doc(db, "users", user.uid),
      {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        watchlistCount: 0,
        watchedCount: 0,
        watchHours: 0,
        aiMatch: 70,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setRedirectLoading(true);
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("❌ Redirect error:", error);
      setError(error.message);
      setRedirectLoading(false);
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log("1️⃣ Checking redirect result...");
        const result = await getRedirectResult(auth);
        console.log("2️⃣ Result:", result);

        if (result?.user) {
          console.log("3️⃣ Success:", result.user.email);
          await saveUserToFirestore(result.user);
          navigate("/profile", { replace: true });
          return;
        }
      } catch (error) {
        console.error("❌ Error:", error.code, error.message);
        setError(error.message);
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("4️⃣ Auth state:", user?.email ?? "no user");
        if (user) {
          navigate("/profile", { replace: true });
        } else {
          setLoading(false);
        }
      });

      return unsubscribe;
    };

    const cleanupPromise = handleRedirect();
    return () => { cleanupPromise.then((unsub) => unsub?.()); };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Checking authentication...</p>
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

        <input
          type="email"
          placeholder="Email"
          className="w-full bg-black rounded-3xl px-6 py-5 text-white outline-none border border-white/5 mb-6 focus:border-pink-500/50 transition-colors"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full bg-black rounded-3xl px-6 py-5 text-white outline-none border border-white/5 mb-8 focus:border-pink-500/50 transition-colors"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full py-5 rounded-3xl font-bold text-xl text-white bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90 transition-opacity">
          Login
        </button>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-gray-500">OR</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={redirectLoading}
          className="w-full py-4 rounded-3xl bg-white text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {redirectLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Redirecting to Google...
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