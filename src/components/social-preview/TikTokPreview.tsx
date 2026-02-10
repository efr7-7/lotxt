import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Bookmark, Share2, Music } from "lucide-react";
import type { OGMeta } from "@/types/social";

interface Props {
  meta: OGMeta;
}

export function TikTokPreview({ meta }: Props) {
  const title = meta.title || "Your caption here...";
  const description = meta.description || "";
  const author = meta.author || meta.siteName || "creator";
  const caption = description || title;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Platform label */}
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-black text-white text-[9px] font-bold">
          ♪
        </div>
        <span className="text-[12px] font-medium text-foreground/70">TikTok</span>
        <span className="text-[10px] text-muted-foreground/40 ml-auto">Preview</span>
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto" style={{ maxWidth: 320 }}>
        <div
          className="relative bg-black overflow-hidden"
          style={{ aspectRatio: "9/16" }}
        >
          {/* Video placeholder */}
          {meta.image ? (
            <img
              src={meta.image}
              alt="Video"
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-black" />
          )}

          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Right side actions */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
            {/* Profile */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-zinc-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                {author[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">+</span>
              </div>
            </div>

            <SideAction icon={Heart} label="24.5K" />
            <SideAction icon={MessageCircle} label="892" />
            <SideAction icon={Bookmark} label="5,431" />
            <SideAction icon={Share2} label="1,203" />

            {/* Music disc */}
            <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-600 animate-[spin_3s_linear_infinite] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-zinc-500" />
            </div>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-4 left-3 right-16">
            {/* Username */}
            <p className="text-white text-[13px] font-bold mb-1">
              @{author.toLowerCase().replace(/\s+/g, "")}
            </p>

            {/* Caption */}
            <p className="text-white/90 text-[12px] leading-relaxed line-clamp-3 mb-2">
              {caption}
            </p>

            {/* Hashtags */}
            <p className="text-white/60 text-[11px] mb-2">
              #fyp #foryou #trending
            </p>

            {/* Music ticker */}
            <div className="flex items-center gap-1.5">
              <Music className="w-3 h-3 text-white/70 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-white/70 text-[11px] whitespace-nowrap">
                  Original audio — @{author.toLowerCase().replace(/\s+/g, "")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/30 bg-muted/20 text-center">
        <p className="text-[10px] text-muted-foreground/30">
          Preview only — actual rendering may vary
        </p>
      </div>
    </div>
  );
}

function SideAction({ icon: Icon, label }: { icon: typeof Heart; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="w-6 h-6 text-white" />
      <span className="text-white/80 text-[10px] font-medium">{label}</span>
    </div>
  );
}
