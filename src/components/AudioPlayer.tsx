import { useRef, useState, useEffect, useCallback } from 'react';
import type { ProgressData } from '../api/client';
import './AudioPlayer.css';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SLEEP_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: 'Fin del capítulo', value: -1 },
];

interface AudioPlayerProps {
  url: string;
  title: string;
  bookId: string;
  progress?: ProgressData | null;
  onProgressSave?: (data: Partial<ProgressData>) => void;
  onBack?: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ url, title, bookId, progress, onProgressSave, onBack }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(() => {
    if (!duration || !bookId) return;
    const pct = duration > 0 ? currentTime / duration : 0;
    onProgressSave?.({
      progress: pct,
      currentPage: Math.floor(currentTime),
      totalPages: Math.floor(duration),
      location: String(Math.floor(currentTime)),
      lastReadAt: new Date().toISOString(),
    });
  }, [currentTime, duration, bookId, onProgressSave]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => { setPlaying(false); saveProgress(); };
    const onEnded = () => { setPlaying(false); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onError = () => {
      const mediaErr = audio.error;
      if (mediaErr) {
        const msgs: Record<number, string> = {
          1: 'La carga del audio fue cancelada.',
          2: 'Error de red al cargar el audio.',
          3: 'El audio está corrupto o el formato no es soportado.',
          4: 'El formato de audio no es soportado por el navegador.',
        };
        setAudioError(msgs[mediaErr.code] || `Error de audio (código ${mediaErr.code})`);
      } else {
        setAudioError('No se pudo cargar el archivo de audio.');
      }
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };
  }, [saveProgress]);

  useEffect(() => {
    if (playing) {
      progressInterval.current = setInterval(saveProgress, 15000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [playing, saveProgress]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const startSleepTimer = (minutes: number) => {
    setShowSleepMenu(false);
    if (minutes === -1) {
      const remaining = duration - currentTime;
      if (remaining > 0) {
        setSleepTimer(Math.round(remaining / 60));
        sleepTimerRef.current = setTimeout(() => {
          audioRef.current?.pause();
          setSleepTimer(null);
        }, remaining * 1000);
      }
    } else {
      setSleepTimer(minutes);
      sleepTimerRef.current = setTimeout(() => {
        audioRef.current?.pause();
        setSleepTimer(null);
      }, minutes * 60 * 1000);
    }
  };

  const cancelSleepTimer = () => {
    setSleepTimer(null);
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
  };

  useEffect(() => {
    if (progress?.location && audioRef.current) {
      const pos = parseInt(progress.location, 10);
      if (!isNaN(pos) && pos > 0) audioRef.current.currentTime = pos;
    }
  }, [progress?.location]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioError) setAudioError(null);
    if (playing) audio.pause();
    else audio.play().catch(err => {
      console.error('Audio play error:', err);
      setAudioError('Error al reproducir: ' + err.message);
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pos = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = pos;
    setCurrentTime(pos);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <div className="audio-player__header">
        <button className="audio-player__back" onClick={onBack}>← Volver</button>
        <h2 className="audio-player__title">{title}</h2>
      </div>
      <div className="audio-player__body">
        <div className="audio-player__cover">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="audio-player__controls">
          <button className="audio-player__play-btn" onClick={togglePlay}>
            {playing ? '⏸' : '▶'}
          </button>
          <div className="audio-player__seek">
            <span className="audio-player__time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={pct}
              onChange={handleSeek}
              className="audio-player__seek-bar"
            />
            <span className="audio-player__time">{formatTime(duration)}</span>
          </div>
          <div className="audio-player__volume">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolume}
              className="audio-player__volume-bar"
            />
          </div>
          <div className="audio-player__extras">
            <div className="audio-player__speed">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  className={`audio-player__speed-btn ${playbackRate === s ? 'audio-player__speed-btn--active' : ''}`}
                  onClick={() => setPlaybackRate(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="audio-player__sleep">
              <button className="audio-player__sleep-btn" onClick={() => setShowSleepMenu(prev => !prev)}>
                {sleepTimer ? `⏰ ${sleepTimer}min` : '😴'}
              </button>
              {showSleepMenu && (
                <div className="audio-player__sleep-menu">
                  {sleepTimer && (
                    <button className="audio-player__sleep-opt" onClick={cancelSleepTimer}>
                      Cancelar temporizador
                    </button>
                  )}
                  {SLEEP_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className="audio-player__sleep-opt"
                      onClick={() => startSleepTimer(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {audioError && <p className="audio-player__error">{audioError}</p>}
      <audio ref={audioRef} src={url} preload="auto" />
    </div>
  );
}