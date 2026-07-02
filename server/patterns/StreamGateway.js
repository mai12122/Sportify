// StreamGateway.js — Singleton Pattern
//
// Mirrors the SDD: a single global gateway sits between playback events and
// stream resolution, so every play() request in the process flows through
// one consistent, stateful controller (active session tracking, bitrate
// bookkeeping, etc.) instead of each route re-implementing its own logic.

class StreamGateway {
  constructor() {
    if (StreamGateway._instance) {
      return StreamGateway._instance;
    }
    this.activeSessions = new Map(); // userId -> { songId, startedAt, bitrate }
    StreamGateway._instance = this;
  }

  static getInstance() {
    if (!StreamGateway._instance) {
      StreamGateway._instance = new StreamGateway();
    }
    return StreamGateway._instance;
  }

  /** Resolve a stream URL for a track and register the session. */
  resolveStream(userId, song, bitrateKbps) {
    const streamUrl = `https://cdn.local/stream/${song.id}?br=${bitrateKbps}`;
    this.activeSessions.set(userId, {
      songId: song.id,
      startedAt: Date.now(),
      bitrate: bitrateKbps,
    });
    return streamUrl;
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
