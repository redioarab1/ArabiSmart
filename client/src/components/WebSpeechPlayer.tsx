import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Square } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { toast } from "sonner";

interface WebSpeechPlayerProps {
  text: string;
  title: string;
  language: "ar" | "sv" | "en";
}

export function WebSpeechPlayer({ text, title, language }: WebSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Language mapping for Web Speech API
  const languageMap = {
    ar: "ar-SA", // Arabic (Saudi Arabia)
    sv: "sv-SE", // Swedish (Sweden)
    en: "en-US", // English (US)
  };

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (!("speechSynthesis" in window)) {
      toast.error("متصفحك لا يدعم تشغيل الصوت");
    }

    return () => {
      // Cleanup on unmount
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 100;
        }
        return prev + 0.5; // Increment progress slowly
      });
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handlePlay = () => {
    if (isPaused) {
      // Resume
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      startProgressTracking();
      return;
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageMap[language];
    utterance.rate = playbackRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      setProgress(0);
      startProgressTracking();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      stopProgressTracking();
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      toast.error("حدث خطأ أثناء تشغيل الصوت");
      setIsPlaying(false);
      setIsPaused(false);
      stopProgressTracking();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    stopProgressTracking();
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    stopProgressTracking();
  };

  const changePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);

    // If currently playing, restart with new rate
    if (isPlaying || isPaused) {
      handleStop();
      toast.success(`تم تغيير السرعة إلى ${nextRate}x`);
    }
  };

  const skip = (seconds: number) => {
    // Web Speech API doesn't support seeking, so we show a message
    toast.info("التقديم والترجيع غير متاح في وضع البث المباشر");
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm" dir="rtl">
      {/* Title */}
      <div className="mb-4">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          البودكاست الصوتي • {language === "ar" ? "عربي" : language === "sv" ? "سويدي" : "إنجليزي"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[progress]}
          max={100}
          step={1}
          disabled
          className="cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{Math.round(progress)}%</span>
          <span>بث مباشر</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Playback Speed */}
        <Button
          variant="ghost"
          size="sm"
          onClick={changePlaybackRate}
          className="text-xs font-mono"
          disabled={isPlaying || isPaused}
        >
          {playbackRate}x
        </Button>

        {/* Main Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            className="h-8 w-8"
            disabled
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {isPlaying ? (
            <Button
              variant="default"
              size="icon"
              onClick={handlePause}
              className="h-10 w-10"
            >
              <Pause className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handlePlay}
              className="h-10 w-10"
            >
              <Play className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            className="h-8 w-8"
            disabled
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Stop Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          className="h-8 w-8"
          disabled={!isPlaying && !isPaused}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      {/* Info Message */}
      {!isPlaying && !isPaused && (
        <div className="mt-3 text-xs text-muted-foreground text-center">
          💡 سيتم قراءة الخبر بصوت عالٍ باستخدام تقنية البث المباشر
        </div>
      )}
    </div>
  );
}
