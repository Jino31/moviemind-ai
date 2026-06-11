import { useState } from "react";

export default function ChatActions({
  message,
  onEdit,
}) {
  const [copied, setCopied] =
    useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(
        message.content
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex gap-2 mt-2">

      <button
        onClick={() => onEdit(message)}
        className="
        px-3 py-1
        rounded-xl
        bg-white/5
        border border-white/10
        hover:bg-white/10
        text-xs
        "
      >
        ✏️ Edit
      </button>

      <button
        onClick={copyMessage}
        className="
        px-3 py-1
        rounded-xl
        bg-white/5
        border border-white/10
        hover:bg-white/10
        text-xs
        "
      >
        {copied ? "✅ Copied" : "📋 Copy"}
      </button>

    </div>
  );
}