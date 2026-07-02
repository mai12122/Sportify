// PlaybackStrategy.js — Strategy Pattern
//
// FREE and PREMIUM listeners need fundamentally different playback rules
// (ads, skip limits, bitrate). Each tier gets its own strategy class behind
// a shared interface, so StreamPlayer/the play route never branches on
// tier internally — it just calls strategy.evaluatePlay(user).

class PlaybackStrategy {
  /* eslint-disable no-unused-vars */
  evaluatePlay(user) {
    throw new Error('evaluatePlay() must be implemented by subclass');
  }
}

class FreePlaybackStrategy extends PlaybackStrategy {
  static MAX_SKIPS_PER_DAY = 6;
  static BITRATE_KBPS = 128;

  evaluatePlay(user) {
    return {
      bitrateKbps: FreePlaybackStrategy.BITRATE_KBPS,
      adBreak: Math.random() < 0.34, // roughly every third play
      skipsRemaining: Math.max(
        0,
        FreePlaybackStrategy.MAX_SKIPS_PER_DAY - user.skips_used_today
      ),
      offlineAllowed: false,
    };
  }
}

class PremiumPlaybackStrategy extends PlaybackStrategy {
  static BITRATE_KBPS = 320;

  evaluatePlay(_user) {
    return {
      bitrateKbps: PremiumPlaybackStrategy.BITRATE_KBPS,
      adBreak: false,
      skipsRemaining: Infinity,
      offlineAllowed: true,
    };
  }
}

/** Small factory so callers don't `new` the right class themselves. */
function getStrategyForUser(user) {
  return user.tier === 'PREMIUM' ? new PremiumPlaybackStrategy() : new FreePlaybackStrategy();
}

module.exports = { PlaybackStrategy, FreePlaybackStrategy, PremiumPlaybackStrategy, getStrategyForUser };
