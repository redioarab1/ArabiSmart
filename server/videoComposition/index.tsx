import React from "react";
import { Composition } from "remotion";
import { DailyPodcastVideo, DailyPodcastVideoProps } from "./DailyPodcastVideo";

// Default props for preview/development
const defaultProps: DailyPodcastVideoProps = {
  summary:
    "هذا ملخص اليوم الإخباري. تابع أبرز الأخبار العربية والعالمية مع ArabiSmart News.",
  date: new Date().toISOString().split("T")[0],
  topNews: [
    {
      title: "عنوان الخبر الأول",
      source: "المصدر",
      image: undefined,
    },
    {
      title: "عنوان الخبر الثاني",
      source: "المصدر",
      image: undefined,
    },
    {
      title: "عنوان الخبر الثالث",
      source: "المصدر",
      image: undefined,
    },
  ],
  trendingTopics: ["سياسة", "اقتصاد", "رياضة"],
  audioUrl: undefined,
  language: "ar",
  siteName: "ArabiSmart News",
  siteUrl: "arabismart.vip",
};

export const RemotionRoot: React.FC = () => {
  // Total duration: 4s title + 8s news + 10s summary + 4s outro = 26s at 30fps = 780 frames
  return (
    <Composition
      id="DailyPodcastVideo"
      component={DailyPodcastVideo}
      durationInFrames={780}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
    />
  );
};
