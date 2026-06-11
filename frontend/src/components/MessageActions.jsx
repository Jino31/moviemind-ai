import { useState } from "react";

export default function MessageActions({
  content,
  onEdit,
}) {
  const [copied, setCopied] =
    useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(
        content
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  return (
    <div className="flex gap-2 mt-3">

      {onEdit && (
        <button
          onClick={onEdit}
          className="
            text-xs
            px-3
            py-1
            rounded-xl
            bg-orange-500/20
            border
            border-orange-500/30
            hover:bg-orange-500/30
            transition
          "
        >
          ✏️ Edit
        </button>
      )}

      <button
        onClick={copyText}
        className="
          text-xs
          px-3
          py-1
          rounded-xl
          bg-white/10
          border
          border-white/10
          hover:bg-white/20
          transition
        "
      >
        {copied
          ? "✅ Copied"
          : "📋 Copy"}
      </button>

    </div>
  );
}