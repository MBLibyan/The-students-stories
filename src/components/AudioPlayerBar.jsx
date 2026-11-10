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
      <div className="audio-bar audio-bar-empty" aria-label="Audio player">
        <Volume2 size={18} />
        <span>No audio narration is attached to this story yet.</span>
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
      setErrorMsg('Unable to play audio. Please check your connection or audio format.');
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
    <div className="audio-bar" aria-label={`Audio player for ${title || 'story'}`}>
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
          setErrorMsg('Failed to load the audio narration for this story.');
        }}
      />

      <div className="audio-controls-main">
        <button
          type="button"
          className="btn-audio-play"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          title={isPlaying ? 'Pause' : 'Play'}
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
              <span>Listen to Story</span>
            </span>
            <span className="audio-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <input
            type="range"
            className="audio-seek"
            min={0}
            max={duration || 100}
            step={0.1}
            value={Math.min(currentTime, duration || 100)}
            disabled={!duration}
            onChange={handleSeek}
            aria-label="Seek audio position"
          />
        </div>

        <div className="audio-speed-group" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`speed-pill ${speed === s ? 'active' : ''}`}
              onClick={() => handleSpeedChange(s)}
              aria-pressed={speed === s}
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
