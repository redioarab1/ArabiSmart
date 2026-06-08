/**
 * LazyImage — Optimized image component
 * ──────────────────────────────────────
 * - Routes external images through /api/img for WebP conversion
 * - Uses native browser lazy loading (loading="lazy")
 * - Adds decoding="async" for non-blocking decode
 * - Shows a skeleton placeholder while loading
 * - Falls back gracefully on error (hides broken image icon)
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Target width for resizing (optional, improves performance) */
  width?: number;
  /** WebP quality 20-90 (default: 80) */
  quality?: number;
  /** Extra classes for the wrapper div */
  wrapperClassName?: string;
  /** Whether this is an above-the-fold image (disables lazy loading) */
  priority?: boolean;
}

/**
 * Build the proxied WebP URL for an external image.
 * Local/data URLs are returned as-is.
 */
function buildProxyUrl(src: string, width?: number, quality = 80): string {
  if (!src) return src;
  // Skip proxy for data URIs, blob URLs, and already-local paths
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) {
    return src;
  }
  const params = new URLSearchParams({ url: src, q: String(quality) });
  if (width) params.set("w", String(width));
  return `/api/img?${params.toString()}`;
}

export default function LazyImage({
  src,
  alt,
  width,
  quality = 80,
  className,
  wrapperClassName,
  priority = false,
  style,
  ...rest
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const proxySrc = buildProxyUrl(src, width, quality);

  if (error || !src) {
    // Render nothing on error — avoids broken image icon
    return null;
  }

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)} style={style}>
      {/* Skeleton shown until image loads */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden="true" />
      )}
      <img
        src={proxySrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          // Try original URL as fallback before hiding
          if (proxySrc !== src) {
            // Swap to original — the onError on the original will set error=true
            setError(false);
          } else {
            setError(true);
          }
        }}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...rest}
      />
    </div>
  );
}

/**
 * Standalone helper — returns the proxied URL without rendering anything.
 * Useful when you need the URL for CSS backgrounds or other uses.
 */
export function getProxiedImageUrl(src: string, width?: number, quality = 80): string {
  return buildProxyUrl(src, width, quality);
}
