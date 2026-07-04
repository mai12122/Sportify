import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { RotateCcw, Pause, Play, SkipForward } from 'lucide-react';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

const ADAPT_INTERVAL_MS = 4000;
const WAVE_BARS = 14;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function Player({ track, playback, onSkip, skipDisabledReason, user }) {
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [stream, setStream] = useState(playback);

  const intervalRef = useRef(null);
  const bufferTimeoutRef = useRef(null);
  const adaptIntervalRef = useRef(null);

  const bufferingMs = useMemo(() => playback?.bufferingMs ?? 300, [playback?.bufferingMs]);
  const durationSec = track?.durationSec ?? 0;
  const progressPct = durationSec ? clamp((elapsed / durationSec) * 100, 0, 100) : 0;
  const quality = stream?.networkQuality || 'good';

  useEffect(() => {
    setElapsed(0);
    setStream(playback);
    clearTimeout(bufferTimeoutRef.current);

    if (!track) return;

    setIsPlaying(false);
    setBuffering(true);

    bufferTimeoutRef.current = setTimeout(() => {
      setBuffering(false);
      setIsPlaying(true);
    }, bufferingMs);

    return () => clearTimeout(bufferTimeoutRef.current);
  }, [track?.id]);

  useEffect(() => {
    if (!playback) return;
    setStream((prev) => ({
      ...prev,
      skipsRemaining: playback.skipsRemaining,
      adBreak: playback.adBreak,
    }));
  }, [playback?.skipsRemaining, playback?.adBreak]);

  // Elapsed-time ticker (paused during buffering).
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!track || !isPlaying || buffering) return;

    intervalRef.current = setInterval(() => {
      setElapsed((e) => Math.min(durationSec, e + 1));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [track, isPlaying, buffering, durationSec]);
  useEffect(() => {
    clearInterval(adaptIntervalRef.current);
    if (!track || !isPlaying || buffering) return;

    adaptIntervalRef.current = setInterval(async () => {
      try {
        const result = await api.adapt(track.id);
        setStream((prev) => ({ ...prev, ...result }));
      } catch {
        // Track may have changed mid-flight; ignore.
      }
    }, ADAPT_INTERVAL_MS);

    return () => clearInterval(adaptIntervalRef.current);
  }, [track, isPlaying, buffering]);

  // When we finish (elapsed hits duration), stop the player.
  useEffect(() => {
    if (!track) return;
    if (!durationSec) return;
    if (elapsed >= durationSec && isPlaying) setIsPlaying(false);
  }, [elapsed, durationSec, isPlaying, track]);

  const canSkip = !skipDisabledReason && !buffering;

  if (!track) {
    return (
      <div className="player-bar player-empty">
        <span>Pick a track to start listening.</span>
      </div>
    );
  }

  return (
    <div className="player-bar" role="region" aria-label="Now playing">
      {stream?.adBreak && user?.tier !== 'PREMIUM' ? (
        <div className="ad-banner">Advertisement — upgrade to Premium to remove ads.</div>
      ) : null}

      <div className="player-inner">
        <div className="player-track">
          <span className="player-cover" style={{ background: track.coverColor || 'linear-gradient(135deg, #3a3a3a, #1a1a1a)' }} />
          <div>
            <div className="player-title">{track.title}</div>
            <div className="player-artist">{track.artist}</div>
          </div>
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button
              className="icon-btn control-btn"
              onClick={() => {
                setElapsed(0);
                setIsPlaying(true);
              }}
              title="Restart"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
            </button>

            <button
              className="play-btn"
              onClick={() => setIsPlaying((p) => !p)}
              title={isPlaying ? 'Pause' : 'Play'}
              disabled={buffering}
            >
              {buffering ? (
                <span className="buffer-spinner" aria-label="Buffering" />
              ) : isPlaying ? (
                <Pause size={16} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={16} fill="currentColor" strokeWidth={0} />
              )}
            </button>

            <button
              className="icon-btn control-btn"
              onClick={onSkip}
              title={skipDisabledReason || 'Skip'}
              disabled={!canSkip}
            >
              <SkipForward size={16} strokeWidth={2.5} fill={canSkip ? 'currentColor' : 'none'} />
            </button>

            <span className="waveform" aria-hidden="true">
              {Array.from({ length: WAVE_BARS }).map((_, i) => {
                const live = isPlaying && !buffering;
                return <i key={i} className={live ? 'live' : ''} style={{ animationDelay: `${i * 0.07}s` }} />;
              })}
            </span>
          </div>

          <div className="player-progress">
            <span>{formatDuration(elapsed)}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }}>
                <div className="progress-handle" />
              </div>
            </div>
            <span>{formatDuration(track.durationSec)}</span>
          </div>
        </div>

        <div className="player-quality">
          {buffering ? (
            <span className="quality-badge buffering">Buffering…</span>
          ) : (
            <span className={`quality-badge ${stream?.bitrateKbps >= 320 ? 'hq' : ''}`}>
              {stream?.bitrateKbps || 128} kbps
            </span>
          )}

          <span className={`network-dot network-${quality}`} title={`Network: ${quality}`} />

          {skipDisabledReason ? (
            <span className="skip-note">{skipDisabledReason}</span>
          ) : (
            // Show remaining skips only for explicit Free users
            user?.tier === 'FREE' && stream && stream.skipsRemaining !== Infinity ? (
              <span className="skip-note">{stream.skipsRemaining} skips left today</span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}