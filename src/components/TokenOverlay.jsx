import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { listenMyActiveOptOut, getOptOutEndDate } from '../lib/firestoreService';

/* ─────────────────────────────────────────────────────────
   TokenOverlay — Student QR meal pass
   • Shows a unique QR that changes every meal period
   • QR content: "GECMESS|{uid}|{yyyy-MM-dd}|{mealKey}"
   • If outside a meal window: shows "No Active Meal"
   • If opted out today: shows blocked state (no QR)
   • The worker scans this QR to verify entry
───────────────────────────────────────────────────────── */

const MEAL_WINDOWS = [
  { key: 'breakfast', label: 'Breakfast',  emoji: '☀️',  start: 8,  end: 10, color: '#fef3c7', border: '#d97706' },
  { key: 'lunch',     label: 'Lunch',      emoji: '🌤️', start: 13, end: 15, color: '#fce7f3', border: '#db2777' },
  { key: 'snacks',    label: 'Snacks',     emoji: '🫖',  start: 18, end: 19, color: '#ede9fe', border: '#7c3aed' },
  { key: 'dinner',    label: 'Dinner',     emoji: '🌙',  start: 20, end: 22, color: '#d1fae5', border: '#059669' },
];

/*
  DEV TESTING — override the current hour here to
  simulate a specific meal window without waiting for it.

  Set to null for live (real clock).
  Set to a number (0-23) to force that hour:
    8  → Breakfast  (8–10)
    13 → Lunch      (13–15)
    18 → Snacks     (18–19)
    20 → Dinner     (20–22)
    12 → No meal    (between windows)

  Must match DEV_HOUR in src/pages/worker/Terminal.jsx!
  Remember to set back to null before going live!
───────────────────────────────────────────────────────── */
const DEV_HOUR = null; // ← live mode

function getActiveMeal() {
  const h = DEV_HOUR ?? new Date().getHours();
  return MEAL_WINDOWS.find(m => h >= m.start && h < m.end) ?? null;
}

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function TokenOverlay({ onClose }) {
  const { user } = useAuth();
  const time     = useLiveClock();
  const [optedOut, setOptedOut] = useState(null);
  const [meal, setMeal] = useState(getActiveMeal);

  // Re-check meal window every minute
  useEffect(() => {
    if (DEV_HOUR !== null) return;
    const id = setInterval(() => setMeal(getActiveMeal()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = format(time, 'yyyy-MM-dd');
  const dayStr  = format(time, 'EEE, dd MMM yyyy');

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenMyActiveOptOut(user.uid, dateStr, setOptedOut);
    return () => unsub?.();
  }, [user?.uid, dateStr]);

  // QR payload — opted-out ho to QR nahi
  const qrPayload = meal && !optedOut
    ? `GECMESS|${user?.uid}|${dateStr}|${meal.key}`
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-5"
      style={{ background: 'rgba(20,16,10,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 48 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 48 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative w-full max-w-[300px] rounded-[20px] border-2 border-brand-dark shadow-brutal-lg flex flex-col overflow-hidden bg-white"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* ── Header strip (meal-coloured) ── */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            background: meal ? meal.color : '#f3f4f6',
            borderBottom: `2px solid ${meal ? meal.border : '#d1d5db'}`,
          }}
        >
          <div>
            <p className="font-sans font-bold text-sm text-brand-dark">
              {meal ? `${meal.emoji} ${meal.label} Pass` : '⏳ No Active Meal'}
            </p>
            <p className="font-sans text-[10px] text-brand-dark/50 mt-0.5">{dayStr}</p>
          </div>
          {meal && (
            <span className="font-sans text-[10px] font-semibold text-brand-dark/60 bg-white/60 px-2 py-1 rounded-full border border-brand-dark/20">
              {meal.start}:00–{meal.end}:00
            </span>
          )}
        </div>

        {/* ── QR / State area ── */}
        <div className="flex flex-col items-center px-5 pt-5 pb-4">
          {optedOut ? (
            <div className="w-full rounded-brutal border-2 border-brand-dark p-5 bg-brand-secondary shadow-brutal-sm mb-4 text-center">
              <p className="text-4xl mb-2">⛔</p>
              <p className="font-sans font-bold text-sm text-brand-dark">You are opted out</p>
              <p className="font-sans text-xs text-brand-dark/70 mt-1.5">
                {optedOut.startDate} → {getOptOutEndDate(optedOut.startDate, optedOut.numDays)}<br />
                Gate entry will be denied during this period.
              </p>
            </div>
          ) : qrPayload ? (
            <>
              <div className="rounded-brutal border-2 border-brand-dark p-3 bg-white shadow-brutal-sm">
                <QRCodeSVG
                  value={qrPayload}
                  size={210}
                  level="M"
                  includeMargin={false}
                  fgColor="#1a1209"
                />
              </div>
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-sans text-[10px] text-brand-dark/40 mt-2 mb-1"
              >
                Show this to the mess worker
              </motion.p>
            </>
          ) : (
            <div className="w-[210px] h-[210px] rounded-brutal border-2 border-brand-dark/20 bg-brand-bg flex flex-col items-center justify-center gap-2">
              <span className="text-5xl">⏳</span>
              <p className="font-sans text-xs text-brand-dark/50 text-center px-4">
                No active meal right now.<br />QR will appear during meal windows.
              </p>
            </div>
          )}

          {/* ── Gap + Name & Roll ── */}
          <div className="w-full mt-4 border-2 border-brand-dark rounded-brutal px-4 py-3 text-center bg-brand-bg shadow-brutal-sm">
            <p className="font-sans font-bold text-base text-brand-dark leading-tight">
              {user?.displayName ?? 'Student'}
            </p>
            <p className="font-mono text-sm text-brand-light mt-0.5">
              {user?.rollNumber ?? '—'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18 }}
        onClick={onClose}
        className="mt-5 w-[50px] h-[50px] rounded-full bg-brand-bg border-2 border-brand-dark shadow-brutal flex items-center justify-center"
        aria-label="Close token"
      >
        <X size={20} className="text-brand-dark" />
      </motion.button>
    </div>
  );
}
