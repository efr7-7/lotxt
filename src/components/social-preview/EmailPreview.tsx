import type { OGMeta } from "@/types/social";
import { PreviewFrame } from "./PreviewFrame";

interface Props {
  meta: OGMeta;
  content: string;
}

export function EmailPreview({ meta, content }: Props) {
  return (
    <PreviewFrame platform="email" label="Email Client">
      <div className="w-full max-w-[600px] bg-white rounded-lg overflow-hidden shadow-md">
        {/* Email client chrome */}
        <div className="bg-gray-100 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold">
              {(meta.author || meta.siteName || "N")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {meta.author || meta.siteName || "Newsletter Author"}
              </p>
              <p className="text-xs text-gray-500">to me</p>
            </div>
          </div>
          <p className="text-base font-semibold text-gray-900">
            {meta.title || "Newsletter Subject Line"}
          </p>
        </div>

        {/* Email body */}
        <div className="p-6 text-gray-800 text-sm leading-relaxed max-h-[400px] overflow-y-auto">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="text-gray-400 italic">
              Write something in the editor to preview it here...
            </p>
          )}
        </div>

        {/* Email footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            You're receiving this because you subscribed to{" "}
            {meta.siteName || "this newsletter"}.
          </p>
        </div>
      </div>
    </PreviewFrame>
  );
}
