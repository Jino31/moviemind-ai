function Login() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-10">

        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
          Welcome Back
        </h1>

        <p className="text-white/60 mb-8">
          Login to MovieMind AI
        </p>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 font-semibold">
            Login
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;