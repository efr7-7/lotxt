import type { OGMeta } from "@/types/social";
import { PreviewFrame } from "./PreviewFrame";
import { truncate } from "@/lib/utils";

interface Props {
  meta: OGMeta;
}

export function LinkedInPreview({ meta }: Props) {
  return (
    <PreviewFrame platform="linkedin" label="LinkedIn">
      <div className="w-full max-w-[504px] bg-white rounded-lg overflow-hidden shadow-sm">
        {/* Post header */}
        <div className="flex items-start gap-2.5 p-3 pb-2">
          <div className="w-12 h-12 rounded-full bg-gray-300 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {meta.author || "Newsletter Author"}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              Newsletter Creator · 2nd
            </p>
            <p className="text-xs text-gray-500">2h · 🌐</p>
          </div>
        </div>

        {/* Post text */}
        <div className="px-3 pb-2">
          <p className="text-sm text-gray-900 leading-5">
            {meta.description
              ? truncate(meta.description, 300)
              : "Excited to share our latest newsletter! Check it out 👇"}
          </p>
        </div>

        {/* Link preview card */}
        <div className="border border-gray-200 bg-gray-50">
          {/* OG Image */}
          {meta.image ? (
            <div className="aspect-[1.91/1] bg-gray-200 overflow-hidden">
              <img
                src={meta.image}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="aspect-[1.91/1] bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image set</span>
            </div>
          )}
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-0.5">
              {meta.url
                ? new URL(meta.url).hostname.replace("www.", "")
                : "newsletter.com"}
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-5">
              {truncate(meta.title || "Newsletter Title", 100)}
            </p>
          </div>
        </div>

        {/* Engagement bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">👍 Like</span>
          <span className="text-xs text-gray-500">💬 Comment</span>
          <span className="text-xs text-gray-500">🔁 Repost</span>
          <span className="text-xs text-gray-500">📤 Send</span>
        </div>
      </div>
    </PreviewFrame>
  );
}
