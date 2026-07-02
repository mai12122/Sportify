import React, { useEffect, useRef, useState } from 'react';

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

export default function Player({ track, playback, onSkip, skipDisabledReason }) {
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    setElapsed(0);
    setIsPlaying(true);
  }, [track?.id]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!track || !isPlaying) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => Math.min(track.durationSec, e + 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [track, isPlaying]);

  if (!track) {
    return (
      <div className="player-bar player-empty">
        <span>Pick a track to start listening.</span>
      </div>
    );
  }

  const pct = Math.min(100, (elapsed / track.durationSec) * 100);

  return (
    <div className="player-bar">
      {playback?.adBreak && (
        <div className="ad-banner">Advertisement — upgrade to Premium to remove ads.</div>
      )}
      <div className="player-inner">
        <div className="player-track">
          <span className="player-cover" style={{ background: track.coverColor }} />
          <div>
            <div className="player-title">{track.title}</div>
            <div className="player-artist">{track.artist}</div>
          </div>
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button className="icon-btn" onClick={() => setElapsed(0)} title="Restart">
              ⟲
            </button>
            <button className="play-btn" onClick={() => setIsPlaying((p) => !p)} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button className="icon-btn" onClick={onSkip} title={skipDisabledReason || 'Skip'} disabled={!!skipDisabledReason}>
              ⏭
            </button>
            <span className="waveform" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, i) => (
                <i key={i} className={isPlaying ? 'live' : ''} style={{ animationDelay: `${i * 0.07}s` }} />
              ))}
            </span>
          </div>
          <div className="player-progress">
            <span>{formatDuration(elapsed)}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span>{formatDuration(track.durationSec)}</span>
          </div>
        </div>

        <div className="player-quality">
          <span className={`quality-badge ${playback?.bitrateKbps >= 320 ? 'hq' : ''}`}>
            {playback?.bitrateKbps || 128} kbps
          </span>
          {skipDisabledReason ? (
            <span className="skip-note">{skipDisabledReason}</span>
          ) : (
            playback && playback.skipsRemaining !== Infinity && (
              <span className="skip-note">{playback.skipsRemaining} skips left today</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
