import type { OGMeta } from "@/types/social";
import { PreviewFrame } from "./PreviewFrame";
import { truncate } from "@/lib/utils";

interface Props {
  meta: OGMeta;
}

export function FacebookPreview({ meta }: Props) {
  return (
    <PreviewFrame platform="facebook" label="Facebook">
      <div className="w-full max-w-[504px] bg-[#242526] rounded-lg overflow-hidden">
        {/* Post header */}
        <div className="flex items-start gap-2.5 p-3 pb-2">
          <div className="w-10 h-10 rounded-full bg-gray-600 shrink-0" />
          <div>
            <p className="text-[15px] font-semibold text-[#e4e6eb]">
              {meta.author || "Newsletter Author"}
            </p>
            <p className="text-[13px] text-[#b0b3b8]">2h · 🌐</p>
          </div>
        </div>

        {/* Post text */}
        <div className="px-3 pb-2">
          <p className="text-[15px] text-[#e4e6eb] leading-5">
            {meta.description
              ? truncate(meta.description, 300)
              : "Check out our latest newsletter!"}
          </p>
        </div>

        {/* Link preview */}
        <div className="bg-[#3a3b3c]">
          {/* OG Image */}
          {meta.image ? (
            <div className="aspect-[1.91/1] bg-[#3a3b3c] overflow-hidden">
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
            <div className="aspect-[1.91/1] bg-[#3a3b3c] flex items-center justify-center">
              <span className="text-[#b0b3b8] text-sm">No image set</span>
            </div>
          )}
          <div className="px-3 py-2.5">
            <p className="text-[13px] text-[#b0b3b8] uppercase tracking-wide mb-0.5">
              {meta.url
                ? new URL(meta.url).hostname.replace("www.", "")
                : "NEWSLETTER.COM"}
            </p>
            <p className="text-[17px] font-semibold text-[#e4e6eb] leading-5">
              {truncate(meta.title || "Newsletter Title", 80)}
            </p>
            {meta.description && (
              <p className="text-[14px] text-[#b0b3b8] leading-4 mt-1">
                {truncate(meta.description, 120)}
              </p>
            )}
          </div>
        </div>

        {/* Reactions bar */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[15px] text-[#b0b3b8]">👍 Like</span>
          <span className="text-[15px] text-[#b0b3b8]">💬 Comment</span>
          <span className="text-[15px] text-[#b0b3b8]">↗️ Share</span>
        </div>
      </div>
    </PreviewFrame>
  );
}
