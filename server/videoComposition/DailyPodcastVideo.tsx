import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  staticFile,
} from "remotion";

export type TopNewsItem = {
  title: string;
  source: string;
  image?: string;
};

export type DailyPodcastVideoProps = {
  summary: string;
  date: string; // e.g. "2026-06-08"
  topNews: TopNewsItem[];
  trendingTopics: string[];
  audioUrl?: string;
  language: "ar" | "sv" | "en";
  siteName?: string;
  siteUrl?: string;
};

// ─── Helper: RTL text direction ──────────────────────────────────────────────
const isRTL = (lang: string) => lang === "ar";

// ─── Animated Title Card ─────────────────────────────────────────────────────
const TitleCard: React.FC<{
  date: string;
  language: string;
  siteName: string;
}> = ({ date, language, siteName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 20 } });
  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 15 } }),
    [0, 1],
    [60, 0]
  );

  const subtitleOpacity = spring({
    frame: frame - 10,
    fps,
    config: { damping: 20 },
  });

  const labels: Record<string, { title: string; subtitle: string }> = {
    ar: { title: "الملخص اليومي", subtitle: "أبرز أخبار اليوم" },
    sv: { title: "Daglig sammanfattning", subtitle: "Dagens viktigaste nyheter" },
    en: { title: "Daily Summary", subtitle: "Today's top news" },
  };

  const label = labels[language] || labels.ar;
  const rtl = isRTL(language);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      {/* Logo / Site name */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#38bdf8",
            fontFamily: "Arial, sans-serif",
            letterSpacing: rtl ? 0 : 2,
          }}
        >
          {siteName}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1.2,
          }}
        >
          {label.title}
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#94a3b8",
            marginTop: 16,
            fontFamily: "Arial, sans-serif",
            opacity: subtitleOpacity,
          }}
        >
          {label.subtitle}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#38bdf8",
            marginTop: 24,
            fontFamily: "Arial, sans-serif",
            opacity: subtitleOpacity,
          }}
        >
          {date}
        </div>
      </div>

      {/* Decorative line */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "60%",
          height: 3,
          background: "linear-gradient(90deg, transparent, #38bdf8, transparent)",
          opacity: subtitleOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── News Item Card ───────────────────────────────────────────────────────────
const NewsCard: React.FC<{
  item: TopNewsItem;
  index: number;
  language: string;
}> = ({ item, index, language }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rtl = isRTL(language);

  const opacity = spring({
    frame: frame - index * 8,
    fps,
    config: { damping: 18 },
  });

  const x = interpolate(
    spring({ frame: frame - index * 8, fps, config: { damping: 15 } }),
    [0, 1],
    [rtl ? 80 : -80, 0]
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: "16px 24px",
        marginBottom: 16,
        direction: rtl ? "rtl" : "ltr",
        border: "1px solid rgba(56,189,248,0.2)",
      }}
    >
      {item.image && (
        <Img
          src={item.image}
          style={{
            width: 100,
            height: 70,
            objectFit: "cover",
            borderRadius: 8,
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 16,
            color: "#38bdf8",
            marginTop: 6,
            fontFamily: "Arial, sans-serif",
          }}
        >
          {item.source}
        </div>
      </div>
    </div>
  );
};

// ─── Top News Section ─────────────────────────────────────────────────────────
const TopNewsSection: React.FC<{
  topNews: TopNewsItem[];
  language: string;
}> = ({ topNews, language }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rtl = isRTL(language);

  const titleOpacity = spring({ frame, fps, config: { damping: 20 } });

  const sectionLabel: Record<string, string> = {
    ar: "أبرز الأخبار",
    sv: "Toppnyheter",
    en: "Top News",
  };

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "60px 80px",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
          color: "#38bdf8",
          fontFamily: "Arial, sans-serif",
          marginBottom: 32,
          opacity: titleOpacity,
        }}
      >
        {sectionLabel[language] || sectionLabel.ar}
      </div>
      {topNews.slice(0, 4).map((item, i) => (
        <NewsCard key={i} item={item} index={i} language={language} />
      ))}
    </AbsoluteFill>
  );
};

// ─── Summary Section ──────────────────────────────────────────────────────────
const SummarySection: React.FC<{
  summary: string;
  trendingTopics: string[];
  language: string;
  siteUrl: string;
}> = ({ summary, trendingTopics, language, siteUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rtl = isRTL(language);

  const opacity = spring({ frame, fps, config: { damping: 20 } });
  const y = interpolate(
    spring({ frame, fps, config: { damping: 15 } }),
    [0, 1],
    [40, 0]
  );

  const labels: Record<string, { summary: string; trending: string }> = {
    ar: { summary: "ملخص اليوم", trending: "المواضيع الرائجة" },
    sv: { summary: "Dagens sammanfattning", trending: "Trendande ämnen" },
    en: { summary: "Today's Summary", trending: "Trending Topics" },
  };
  const label = labels[language] || labels.ar;

  // Truncate summary to ~200 chars for display
  const displaySummary =
    summary.length > 220 ? summary.slice(0, 220) + "..." : summary;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "60px 80px",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <div style={{ opacity, transform: `translateY(${y}px)` }}>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: "#38bdf8",
            fontFamily: "Arial, sans-serif",
            marginBottom: 28,
          }}
        >
          {label.summary}
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#e2e8f0",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1.8,
            marginBottom: 40,
          }}
        >
          {displaySummary}
        </div>

        {trendingTopics.length > 0 && (
          <>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#38bdf8",
                fontFamily: "Arial, sans-serif",
                marginBottom: 20,
              }}
            >
              {label.trending}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {trendingTopics.slice(0, 6).map((topic, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(56,189,248,0.15)",
                    border: "1px solid rgba(56,189,248,0.4)",
                    borderRadius: 24,
                    padding: "8px 20px",
                    fontSize: 20,
                    color: "#38bdf8",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  #{topic}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 22,
          color: "#64748b",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {siteUrl}
      </div>
    </AbsoluteFill>
  );
};

// ─── Outro Card ───────────────────────────────────────────────────────────────
const OutroCard: React.FC<{
  siteName: string;
  siteUrl: string;
  language: string;
}> = ({ siteName, siteUrl, language }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rtl = isRTL(language);

  const opacity = spring({ frame, fps, config: { damping: 20 } });
  const scale = interpolate(
    spring({ frame, fps, config: { damping: 15 } }),
    [0, 1],
    [0.8, 1]
  );

  const cta: Record<string, string> = {
    ar: "تابعنا يومياً للمزيد من الأخبار",
    sv: "Följ oss dagligen för fler nyheter",
    en: "Follow us daily for more news",
  };

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#38bdf8",
            fontFamily: "Arial, sans-serif",
            marginBottom: 24,
          }}
        >
          {siteName}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            fontFamily: "Arial, sans-serif",
            marginBottom: 16,
          }}
        >
          {cta[language] || cta.ar}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#38bdf8",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {siteUrl}
        </div>
      </div>

      {/* Pulsing circle */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: "2px solid rgba(56,189,248,0.2)",
          opacity: interpolate(frame % 60, [0, 30, 60], [0.3, 0.8, 0.3]),
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Main Composition ─────────────────────────────────────────────────────────
export const DailyPodcastVideo: React.FC<DailyPodcastVideoProps> = ({
  summary,
  date,
  topNews,
  trendingTopics,
  audioUrl,
  language = "ar",
  siteName = "ArabiSmart News",
  siteUrl = "arabismart.vip",
}) => {
  const { fps } = useVideoConfig();

  // Durations in frames (30fps)
  const titleDuration = fps * 4; // 4s
  const newsDuration = fps * 8; // 8s
  const summaryDuration = fps * 10; // 10s
  const outroDuration = fps * 4; // 4s

  return (
    <AbsoluteFill style={{ background: "#0f172a" }}>
      {/* Background audio (podcast) */}
      {audioUrl && (
        <Audio src={audioUrl} volume={0.85} />
      )}

      {/* Title Card: 0 → 4s */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <TitleCard date={date} language={language} siteName={siteName} />
      </Sequence>

      {/* Top News: 4s → 12s */}
      <Sequence from={titleDuration} durationInFrames={newsDuration}>
        <TopNewsSection topNews={topNews} language={language} />
      </Sequence>

      {/* Summary: 12s → 22s */}
      <Sequence from={titleDuration + newsDuration} durationInFrames={summaryDuration}>
        <SummarySection
          summary={summary}
          trendingTopics={trendingTopics}
          language={language}
          siteUrl={siteUrl}
        />
      </Sequence>

      {/* Outro: 22s → 26s */}
      <Sequence
        from={titleDuration + newsDuration + summaryDuration}
        durationInFrames={outroDuration}
      >
        <OutroCard siteName={siteName} siteUrl={siteUrl} language={language} />
      </Sequence>
    </AbsoluteFill>
  );
};
