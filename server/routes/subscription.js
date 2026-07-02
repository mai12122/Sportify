const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { center } = require('../patterns/NotificationCenter');

const router = express.Router();

// Simulates SubsCtrl -> PaymentGW -> SubsMgr -> EventBus -> NotifSvc from the
// sequence diagram. No real payment processor here — this is a prototype.
router.post('/upgrade', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.tier === 'PREMIUM') return res.status(400).json({ error: 'Already Premium.' });

  // "processPayment" — always confirms in the prototype
  const paymentConfirmed = true;
  if (!paymentConfirmed) return res.status(402).json({ error: 'Payment failed.' });

  db.prepare("UPDATE users SET tier = 'PREMIUM' WHERE id = ?").run(user.id);

  // publish(UpgradedEvent) -> Observer pattern broadcasts to notification channels
  center.notify({ userId: user.id, message: 'Welcome to Premium! Ad-free, offline, and 320kbps unlocked.' });

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      displayName: updated.display_name,
      tier: updated.tier,
      skipsUsedToday: updated.skips_used_today,
    },
  });
});

router.post('/downgrade', requireAuth, (req, res) => {
  db.prepare("UPDATE users SET tier = 'FREE' WHERE id = ?").run(req.userId);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      displayName: updated.display_name,
      tier: updated.tier,
      skipsUsedToday: updated.skips_used_today,
    },
  });
});

router.get('/notifications', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    .all(req.userId);
  res.json({ notifications: rows });
});

module.exports = router;
