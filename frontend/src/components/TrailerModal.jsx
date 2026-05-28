import YouTube from "react-youtube";

export default function TrailerModal({
  videoKey,
  onClose,
}) {

  if (!videoKey) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">

      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute top-6 right-8 text-white text-6xl z-50"
      >
        ×
      </button>

      {/* PLAYER */}
      <div className="w-full max-w-6xl rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">

        <YouTube
          videoId={videoKey}
          opts={{
            width: "100%",
            height: "700",
            playerVars: {
              autoplay: 1,
            },
          }}
        />

      </div>

    </div>
  );
}