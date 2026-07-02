// NotificationCenter.js — Observer Pattern
//
// One subject (NotificationCenter) broadcasts domain events; any number of
// observers subscribe without the subject knowing what they do with the
// event. Here we register two observers: one that persists an in-app
// notification row, one that just logs an "email/push" send to the
// console (stand-ins for NotifSvc's real channels).

class NotificationCenter {
  constructor() {
    this.observers = [];
  }

  subscribe(observerFn) {
    this.observers.push(observerFn);
  }

  /** Broadcast an event to every subscribed observer. */
  notify(event) {
    for (const observer of this.observers) {
      observer(event);
    }
  }
}

function attachDefaultObservers(center, db) {
  // Observer 1: persist to the notifications table (in-app inbox)
  center.subscribe((event) => {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(
      event.userId,
      event.message
    );
  });

  // Observer 2: simulate an external channel (push/email)
  center.subscribe((event) => {
    console.log(`[NotifSvc] would send push/email to user ${event.userId}: "${event.message}"`);
  });
}

const center = new NotificationCenter();
module.exports = { center, attachDefaultObservers };
