import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const [userData, setUserData] =
    useState(null);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
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
              setUserData(
                docSnap.data()
              );
            }
          } catch (error) {
            console.log(error);
          }

          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-2xl">
        Loading Profile...
      </div>
    );
  }

  const userName =
    userData?.name ||
    user?.displayName ||
    "Movie Lover";

  const userPhoto =
    userData?.photoURL ||
    user?.photoURL ||
    "https://ui-avatars.com/api/?name=User";

  const userEmail =
    userData?.email ||
    user?.email ||
    "No Email";
    const joinedDate = userData?.createdAt
  ? new Date(userData.createdAt).toLocaleDateString()
  : "Recently Joined";

 

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
            backgroundSize:
              "60px 60px",
          }}
        />
      </div>

      {/* Navbar */}

      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">

        <div className="max-w-7xl mx-auto px-6 py-5">

          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            MovieMind AI
          </h1>

          <p className="text-gray-400 mt-2 text-sm md:text-base">
            AI Powered Movie Discovery Platform
          </p>

        </div>

      </div>

      {/* Content */}

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-44 pb-24">

        {/* Profile Header */}

        <div className="flex flex-col items-center text-center">

          <img
            src={userPhoto}
            alt="profile"
            className="
              w-44 h-44
              rounded-full
              object-cover
              border-4 border-pink-500
              shadow-[0_0_40px_rgba(255,0,100,0.3)]
            "
          />

          <h1 className="mt-8 text-5xl md:text-7xl font-black bg-gradient-to-r from-white to-pink-500 bg-clip-text text-transparent">
            {userName}
          </h1>

          <p className="text-lg md:text-2xl text-gray-400 mt-4">
            {userEmail}
          </p>

        </div>

        
<div className="mt-16 space-y-8">

  {/* Personal Information */}

  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">

    <h2 className="text-3xl font-bold mb-8">
      👤 Personal Information
    </h2>

    <div className="space-y-6">

      <div>
        <p className="text-gray-500">
          Full Name
        </p>

        <p className="text-xl font-semibold">
          {userName}
        </p>
      </div>

      <div>
        <p className="text-gray-500">
          Email Address
        </p>

        <p className="text-xl font-semibold">
          {userEmail}
        </p>
      </div>

      <div>
        <p className="text-gray-500">
          Joined Date
        </p>

        <p className="text-xl font-semibold">
          {joinedDate}
        </p>
      </div>

    </div>

  </div>

  {/* Account Settings */}

  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">

    <h2 className="text-3xl font-bold mb-8">
      ⚙️ Account Settings
    </h2>

    <div className="space-y-4">

      <button
        className="
        w-full
        text-left
        p-5
        rounded-2xl
        bg-white/5
        hover:bg-white/10
        transition-all
        "
      >
        🔑 Change Password
      </button>

      <button
        className="
        w-full
        text-left
        p-5
        rounded-2xl
        bg-white/5
        hover:bg-white/10
        transition-all
        "
      >
        🔔 Notification Settings
      </button>

      <button
        className="
        w-full
        text-left
        p-5
        rounded-2xl
        bg-white/5
        hover:bg-white/10
        transition-all
        "
      >
        🛡️ Privacy Settings
      </button>

    </div>

  </div>

  {/* Danger Zone */}

  <div className="border border-red-500/30 bg-red-500/5 rounded-3xl p-8">

    <h2 className="text-3xl font-bold text-red-400 mb-6">
      ⚠️ Danger Zone
    </h2>

    <p className="text-gray-400 mb-6">
      Permanently remove your MovieMind account and all associated data.
    </p>

    <button
      className="
      px-8 py-4
      rounded-2xl
      bg-red-500
      hover:bg-red-600
      transition-all
      font-semibold
      "
    >
      Delete Account
    </button>

  </div>

</div>

      </div>

    </div>
  );
}

export default Profile;