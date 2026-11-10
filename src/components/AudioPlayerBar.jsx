import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { formatTime } from '../lib/validation';

const SPEEDS = [0.75, 1, 1.25];

export default function AudioPlayerBar({ audioUrl, title }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setErrorMsg('');
    setIsBuffering(false);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.playbackRate = speed;
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  if (!audioUrl) {
    return (
      <div className="audio-bar audio-bar-empty" aria-label="مشغل الصوت">
        <Volume2 size={18} />
        <span>لا يوجد ملف صوتي مرفق لهذه القصة حالياً.</span>
      </div>
    );
  }

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    setErrorMsg('');

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }

    try {
      el.playbackRate = speed;
      await el.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setErrorMsg('تعذر تشغيل الصوت. تحقق من الاتصال أو صيغة الملف الصوتي.');
    }
  };

  const handleSeek = (e) => {
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const handleSpeedChange = (nextSpeed) => {
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className="audio-bar" aria-label={`مشغل صوت القصة: ${title || ''}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setDuration(Number.isFinite(el.duration) ? el.duration : 0);
          el.playbackRate = speed;
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
          if (audioRef.current) audioRef.current.playbackRate = speed;
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlaying(false);
          setIsBuffering(false);
          setErrorMsg('تعذر تحميل الملف الصوتي الخاص بهذه القصة.');
        }}
      />

      <div className="audio-controls-main">
        <button
          type="button"
          className="btn-audio-play"
          onClick={togglePlay}
          aria-label={isPlaying ? 'إيقاف الصوت مؤقتاً' : 'تشغيل الصوت'}
          title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
        >
          {isBuffering ? (
            <Loader2 size={20} className="spin" />
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>

        <div className="audio-track-group">
          <div className="audio-meta-row">
            <span className="audio-label">
              <Volume2 size={15} />
              <span>الاستماع للقصة</span>
            </span>
            <span className="audio-time" dir="ltr">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <input
            type="range"
            className="audio-seek"
            dir="ltr"
            min={0}
            max={duration || 100}
            step={0.1}
            value={Math.min(currentTime, duration || 100)}
            disabled={!duration}
            onChange={handleSeek}
            aria-label="شريط تقديم وتأخير الصوت"
          />
        </div>

        <div className="audio-speed-group" role="group" aria-label="سرعة التشغيل">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`speed-pill ${speed === s ? 'active' : ''}`}
              onClick={() => handleSpeedChange(s)}
              aria-pressed={speed === s}
              dir="ltr"
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="audio-error" role="alert">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
