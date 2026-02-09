import type { OGMeta } from "@/types/social";
import { PreviewFrame } from "./PreviewFrame";
import { truncate } from "@/lib/utils";

interface Props {
  meta: OGMeta;
}

export function TwitterPreview({ meta }: Props) {
  return (
    <PreviewFrame platform="twitter" label="Twitter / X">
      <div className="w-full max-w-[504px]">
        {/* Tweet chrome */}
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-600 shrink-0" />
          <div className="flex-1 min-w-0">
            {/* Author line */}
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[15px] font-bold text-white">
                {meta.author || "Newsletter Author"}
              </span>
              <svg className="w-[18px] h-[18px] text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.27 4.8-5.23 1.47 1.36-6.2 6.76z" />
              </svg>
              <span className="text-[15px] text-gray-500">@{meta.siteName || "newsletter"} · 2h</span>
            </div>

            {/* Tweet text */}
            <p className="text-[15px] text-white mb-3 leading-5">
              {meta.description
                ? truncate(meta.description, 280)
                : "Check out our latest newsletter!"}
            </p>

            {/* Link card */}
            <div className="rounded-2xl border border-gray-700 overflow-hidden bg-black">
              {/* OG Image */}
              {meta.image ? (
                <div className="aspect-[1.91/1] bg-gray-800 overflow-hidden">
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
                <div className="aspect-[1.91/1] bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">No image set</span>
                </div>
              )}
              {/* Card footer */}
              <div className="px-3 py-2.5">
                <p className="text-[13px] text-gray-500 mb-0.5">
                  {meta.url
                    ? new URL(meta.url).hostname.replace("www.", "")
                    : "newsletter.com"}
                </p>
                <p className="text-[15px] text-white font-normal leading-5">
                  {truncate(meta.title || "Newsletter Title", 70)}
                </p>
                <p className="text-[13px] text-gray-500 leading-4 mt-0.5">
                  {truncate(meta.description || "", 100)}
                </p>
              </div>
            </div>

            {/* Engagement bar */}
            <div className="flex items-center justify-between mt-3 max-w-[400px] text-gray-500">
              <span className="text-[13px]">💬</span>
              <span className="text-[13px]">🔁</span>
              <span className="text-[13px]">❤️</span>
              <span className="text-[13px]">📊</span>
              <span className="text-[13px]">↗️</span>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
