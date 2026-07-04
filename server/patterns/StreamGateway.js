// StreamGateway.js — Singleton Pattern
//
// Mirrors the SDD: a single global gateway sits between playback events and
// stream resolution, so every play() request in the process flows through
// one consistent, stateful controller (active session tracking, bitrate
// bookkeeping, etc.) instead of each route re-implementing its own logic.
//
// This gateway also owns the streaming-optimization engine: a lightweight
// adaptive bitrate (ABR) simulation modeled on the same hybrid approach real
// players use (BOLA/buffer-based + throughput-based), so quality changes
// react to a simulated network signal instead of being hard-coded.

// Discrete network conditions the simulator can be in. Each has a score
// threshold and a realistic round-trip latency band.
const NETWORK_STATES = [
  { label: 'excellent', min: 0.85, latencyMs: [15, 50] },
  { label: 'good', min: 0.6, latencyMs: [40, 110] },
  { label: 'fair', min: 0.35, latencyMs: [90, 220] },
  { label: 'poor', min: 0, latencyMs: [180, 450] },
];

function classifyNetwork(score) {
  return NETWORK_STATES.find((s) => score >= s.min);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

class StreamGateway {
  constructor() {
    if (StreamGateway._instance) {
      return StreamGateway._instance;
    }
    this.activeSessions = new Map(); // userId -> session state
    StreamGateway._instance = this;
  }

  static getInstance() {
    if (!StreamGateway._instance) {
      StreamGateway._instance = new StreamGateway();
    }
    return StreamGateway._instance;
  }

  /**
   * Resolve a stream URL for a track and register the session, running one
   * ABR decision up front to pick a sane starting rung and simulate the
   * "connecting" buffering delay a real player shows before first sound.
   */
  resolveStream(userId, song, playback) {
    const ladder = playback.ladderKbps;
    // Start the session with a fresh, slightly-optimistic network sample —
    // real players usually start a shade below max rung and climb once the
    // buffer proves the pipe is healthy, rather than assuming the best case.
    const startScore = clamp(0.55 + Math.random() * 0.3, 0, 1);
    const state = classifyNetwork(startScore);
    const latencyMs = Math.round(
      state.latencyMs[0] + Math.random() * (state.latencyMs[1] - state.latencyMs[0])
    );
    // If the playback hint already requested the top rung (e.g. Premium strategy),
    // start at the top to give Premium users the best experience immediately.
    let startIndex = clamp(Math.floor(startScore * ladder.length), 0, ladder.length - 1);
    if (playback && playback.bitrateKbps && ladder[ladder.length - 1] === playback.bitrateKbps) {
      startIndex = ladder.length - 1;
    }

    const streamUrl = `https://cdn.local/stream/${song.id}?br=${ladder[startIndex]}`;

    this.activeSessions.set(userId, {
      songId: song.id,
      startedAt: Date.now(),
      ladder,
      ladderIndex: startIndex,
      bitrate: ladder[startIndex],
      networkScore: startScore,
      networkLabel: state.label,
      latencyMs,
      bufferHealthMs: 6000, // simulated seconds of audio currently buffered ahead
    });

    // Startup buffering delay scales with latency, like a real CDN handshake +
    // initial segment fetch. Capped so free/poor connections don't feel broken.
    const bufferingMs = clamp(180 + latencyMs * 2, 200, 1200);

    return {
      streamUrl,
      bitrateKbps: ladder[startIndex],
      networkQuality: state.label,
      latencyMs,
      bufferingMs,
    };
  }

  /**
   * Re-evaluate stream quality mid-playback. Called periodically by the
   * client (like a real player's ABR tick) to simulate network drift and
   * decide whether to step the bitrate up or down.
   *
   * Uses a hybrid rule: throughput (network score) sets the *ceiling* rung
   * reachable, buffer health decides whether it's safe to actually move
   * there this tick — climbing requires a healthy buffer, dropping happens
   * immediately to protect against stalls, matching how real ABR ladders
   * (e.g. buffer-based algorithms like BOLA) behave.
   */
  adapt(userId) {
    const session = this.activeSessions.get(userId);
    if (!session) return null;

    // Simulated network drift: a smoothed random walk so quality doesn't
    // flicker wildly tick to tick, but can still trend up or down.
    const drift = (Math.random() - 0.5) * 0.35;
    const score = clamp(session.networkScore + drift, 0, 1);
    const state = classifyNetwork(score);
    const latencyMs = Math.round(
      state.latencyMs[0] + Math.random() * (state.latencyMs[1] - state.latencyMs[0])
    );

    const ceilingIndex = clamp(Math.floor(score * session.ladder.length), 0, session.ladder.length - 1);

    // Buffer health rises when throughput exceeds the current rung, drains
    // when it can't keep up.
    const headroom = score - session.ladderIndex / Math.max(1, session.ladder.length - 1);
    session.bufferHealthMs = clamp(session.bufferHealthMs + headroom * 2500, 0, 12000);

    let nextIndex = session.ladderIndex;
    if (ceilingIndex < nextIndex) {
      nextIndex = ceilingIndex; // drop immediately to avoid a stall
    } else if (ceilingIndex > nextIndex && session.bufferHealthMs > 5000) {
      nextIndex = nextIndex + 1; // only climb one rung at a time, once buffer is healthy
    }

    const switched = nextIndex !== session.ladderIndex;
    session.ladderIndex = nextIndex;
    session.bitrate = session.ladder[nextIndex];
    session.networkScore = score;
    session.networkLabel = state.label;
    session.latencyMs = latencyMs;

    return {
      bitrateKbps: session.bitrate,
      networkQuality: state.label,
      latencyMs,
      bufferHealthMs: Math.round(session.bufferHealthMs),
      switched,
    };
  }

  getActiveSession(userId) {
    return this.activeSessions.get(userId) || null;
  }

  endSession(userId) {
    this.activeSessions.delete(userId);
  }

  get totalActiveStreams() {
    return this.activeSessions.size;
  }
}

module.exports = StreamGateway.getInstance();
