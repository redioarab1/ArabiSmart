import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Zap } from "lucide-react";

export function BreakingNewsTicker() {
  const { data: items } = trpc.breakingNews.list.useQuery(undefined, {
    refetchInterval: 60_000, // refresh every minute
  });
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate items for seamless loop
  const displayItems = items && items.length > 0 ? items : null;

  // Adjust animation duration based on content length
  useEffect(() => {
    if (trackRef.current && displayItems) {
      const totalChars = displayItems.reduce((sum, i) => sum + i.text.length, 0);
      // ~15px per char, speed ~120px/s
      const duration = Math.max(20, Math.round((totalChars * 15) / 120));
      trackRef.current.style.setProperty("--ticker-duration", `${duration}s`);
    }
  }, [displayItems]);

  if (!displayItems || displayItems.length === 0) return null;

  return (
    <div
      dir="rtl"
      className="w-full bg-red-600 text-white overflow-hidden flex items-stretch select-none"
      style={{ height: "36px" }}
    >
      {/* Label */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 bg-red-800 font-bold text-sm z-10 border-l border-red-500">
        <Zap className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300 animate-pulse" />
        <span className="whitespace-nowrap tracking-wide">عاجل</span>
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={trackRef}
          className="ticker-track flex items-center h-full gap-0 whitespace-nowrap"
          style={{
            animation: "ticker-scroll var(--ticker-duration, 30s) linear infinite",
          }}
        >
          {/* First copy */}
          {displayItems.map((item) => (
            <span key={`a-${item.id}`} className="inline-flex items-center">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer text-sm font-medium px-6"
                >
                  {item.text}
                </a>
              ) : (
                <span className="text-sm font-medium px-6">{item.text}</span>
              )}
              <span className="text-red-300 text-lg mx-1">◆</span>
            </span>
          ))}
          {/* Second copy for seamless loop */}
          {displayItems.map((item) => (
            <span key={`b-${item.id}`} className="inline-flex items-center">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer text-sm font-medium px-6"
                >
                  {item.text}
                </a>
              ) : (
                <span className="text-sm font-medium px-6">{item.text}</span>
              )}
              <span className="text-red-300 text-lg mx-1">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
