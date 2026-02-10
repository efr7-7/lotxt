import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Share2, Download, Scissors, MoreHorizontal } from "lucide-react";
import type { OGMeta } from "@/types/social";

interface Props {
  meta: OGMeta;
}

export function YouTubePreview({ meta }: Props) {
  const title = meta.title || "Video Title";
  const description = meta.description || "Video description will appear here...";
  const channel = meta.author || meta.siteName || "Your Channel";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Platform label */}
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-red-600 text-white text-[9px] font-bold">
          ▶
        </div>
        <span className="text-[12px] font-medium text-foreground/70">YouTube</span>
        <span className="text-[10px] text-muted-foreground/40 ml-auto">Preview</span>
      </div>

      <div className="bg-white dark:bg-zinc-950">
        {/* Video thumbnail area */}
        <div className="aspect-video bg-zinc-900 relative flex items-center justify-center">
          {meta.image ? (
            <img
              src={meta.image}
              alt="Thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
              </div>
              <p className="text-[11px] text-zinc-500">16:9 thumbnail preview</p>
            </div>
          )}
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium">
            12:34
          </div>
        </div>

        {/* Video info */}
        <div className="px-4 py-3">
          <div className="flex gap-3">
            {/* Channel avatar */}
            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-500 shrink-0 mt-0.5">
              {channel[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 mb-1">
                {title}
              </h3>

              {/* Channel name + meta */}
              <div className="flex items-center gap-1 text-[12px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                <span>{channel}</span>
                <span className="text-[10px]">✓</span>
              </div>
              <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                <span>12K views</span>
                <span className="mx-1">·</span>
                <span>2 hours ago</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <ActionButton icon={ThumbsUp} label="1.2K" />
            <ActionButton icon={ThumbsDown} label="" />
            <ActionButton icon={Share2} label="Share" />
            <ActionButton icon={Download} label="Download" />
            <ActionButton icon={Scissors} label="Clip" />
            <ActionButton icon={MoreHorizontal} label="" />
          </div>

          {/* Description snippet */}
          <div className="mt-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900">
            <p className="text-[12px] text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">
              {description}
            </p>
            <button className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
              ...more
            </button>
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

function ActionButton({ icon: Icon, label }: { icon: typeof ThumbsUp; label: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
      <Icon className="w-3.5 h-3.5" />
      {label && <span className="text-[11px] font-medium">{label}</span>}
    </div>
  );
}
