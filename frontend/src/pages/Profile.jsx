import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import {
  FaFilm,
  FaBookmark,
  FaRobot,
  FaClock,
} from "react-icons/fa";

function Profile() {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef();

  const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [userData, setUserData] = useState(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target)
    ) {
      setShowMenu(false);
    }
  };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      try {
        const docRef = doc(
          db,
          "users",
          currentUser.uid
        );

        const docSnap =
          await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    }
  );

  return () => unsubscribe();
}, [navigate]);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };
  if (loading) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      Loading Profile...
    </div>
  );
}

  const userName =
    user?.displayName || "Movie Lover";

  const userPhoto =
  user?.photoURL ||
  "https://ui-avatars.com/api/?name=User";

  const userEmail =
    user?.email || "No Email";
const watchlistCount =
  userData?.watchlistCount || 0;

const watchedCount =
  userData?.watchedCount || 0;

const watchHours =
  userData?.watchHours || 0;

const aiMatch =
  userData?.aiMatch || 70;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* Background */}

      <div className="absolute inset-0">
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

      {/* Navbar */}

      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              MovieMind AI
            </h1>

            <p className="text-gray-400 mt-2 text-sm md:text-base">
              AI Powered Movie Discovery Platform
            </p>
          </div>

          {/* Dropdown */}

          <div
            className="relative"
            ref={menuRef}
          >
            <button
              onClick={() =>
                setShowMenu(!showMenu)
              }
              className="
                flex items-center gap-3
                px-4 py-2
                rounded-2xl
                bg-gradient-to-r
                from-red-500
                to-pink-500
              "
            >
              <img
                src={userPhoto}
                alt=""
                className="w-8 h-8 rounded-full"
              />

              <span className="font-semibold">
                {userName}
              </span>
            </button>

            {showMenu && (
              <div
                className="
                  absolute right-0 mt-3
                  w-64
                  bg-black/95
                  border border-white/10
                  rounded-2xl
                  overflow-hidden
                  backdrop-blur-xl
                "
              >
                <button
                  onClick={() => navigate("/")}
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  🏠 Home
                </button>

                <button
                  onClick={() => navigate("/movies")}
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  🎬 Movies
                </button>

                <button
                  onClick={() => navigate("/chatbot")}
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  🤖 AI Chatbot
                </button>

                <button
                  onClick={() =>
                    alert("Settings Coming Soon")
                  }
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-4 text-red-400 hover:bg-red-500/10"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-44 pb-24">

        {/* Profile Header */}

        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          <img
            src={userPhoto}
            alt=""
            className="
              w-40 h-40
              rounded-full
              object-cover
              border-4 border-pink-500
            "
          />

          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white to-pink-500 bg-clip-text text-transparent">
              {userName}
            </h1>

            <p className="text-lg md:text-2xl text-gray-400 mt-4">
              {userEmail}
            </p>

            <div className="mt-10">
              <div className="flex justify-between mb-3">
                <span className="font-semibold text-lg">
                  AI Taste Match
                </span>

                <span className="text-pink-400 font-bold">
                  {aiMatch}%
                </span>
              </div>

              <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"
                  style={{
                    width: `${aiMatch}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <FaFilm className="text-3xl" />
            <h2 className="text-4xl font-black mt-6">
              {watchedCount}
            </h2>
            <p className="text-gray-400 mt-2">
              Movies Watched
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <FaBookmark className="text-3xl" />
            <h2 className="text-4xl font-black mt-6">
              {watchlistCount}
            </h2>
            <p className="text-gray-400 mt-2">
              Watchlist
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <FaRobot className="text-3xl" />
            <h2 className="text-4xl font-black mt-6">
              {aiMatch}%
            </h2>
            <p className="text-gray-400 mt-2">
              AI Match
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <FaClock className="text-3xl" />
            <h2 className="text-4xl font-black mt-6">
              {watchHours}h
            </h2>
            <p className="text-gray-400 mt-2">
              Watch Hours
            </p>
          </div>

        </div>
<div className="mt-20 max-w-3xl mx-auto">

  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
    <h2 className="text-2xl font-bold mb-6">
      👤 Personal Information
    </h2>

    <p className="mb-3">
      <strong>Name:</strong> {userName}
    </p>

    <p className="mb-6">
      <strong>Email:</strong> {userEmail}
    </p>

    <button
      className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500"
    >
      Edit Profile
    </button>
  </div>

 

</div>
         

      </div>
    </div>
  );
}

export default Profile;