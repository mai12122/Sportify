// ValidationChain.js — Chain of Responsibility Pattern
//
// Each handler checks exactly one rule, then either passes the request to
// the next handler or halts with an error. Used here to validate playlist
// creation, but the shape generalizes to any "run N independent checks in
// order" flow (e.g. artist upload validation in the full SDD).

class Handler {
  setNext(handler) {
    this.next = handler;
    return handler; // allows chaining: a.setNext(b).setNext(c)
  }

  handle(request) {
    if (this.next) return this.next.handle(request);
    return { ok: true };
  }
}

class NameNotEmptyHandler extends Handler {
  handle(request) {
    if (!request.name || !request.name.trim()) {
      return { ok: false, error: 'Playlist name cannot be empty.' };
    }
    return super.handle(request);
  }
}

class NameLengthHandler extends Handler {
  handle(request) {
    if (request.name.trim().length > 60) {
      return { ok: false, error: 'Playlist name must be 60 characters or fewer.' };
    }
    return super.handle(request);
  }
}

class NameUniquePerUserHandler extends Handler {
  constructor(db) {
    super();
    this.db = db;
  }
  handle(request) {
    const existing = this.db
      .prepare('SELECT id FROM playlists WHERE user_id = ? AND lower(name) = lower(?)')
      .get(request.userId, request.name.trim());
    if (existing) {
      return { ok: false, error: 'You already have a playlist with that name.' };
    }
    return super.handle(request);
  }
}

function buildPlaylistValidationChain(db) {
  const nameNotEmpty = new NameNotEmptyHandler();
  const nameLength = new NameLengthHandler();
  const nameUnique = new NameUniquePerUserHandler(db);
  nameNotEmpty.setNext(nameLength).setNext(nameUnique);
  return nameNotEmpty;
}

module.exports = { buildPlaylistValidationChain };
