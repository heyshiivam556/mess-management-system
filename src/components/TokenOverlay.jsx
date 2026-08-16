import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getTodayToken, ANIM_COMPONENT_MAP } from '../utils/tokenUtils';

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function TokenOverlay({ onClose }) {
  const { user }                 = useAuth();
  const time                     = useLiveClock();
  const { asset, animationType } = getTodayToken();

  const timeStr  = format(time, 'h:mm:ss aa');
  const dateStr  = format(time, 'EEE, dd MMM yyyy');
  const AnimComp = ANIM_COMPONENT_MAP[animationType] ?? ANIM_COMPONENT_MAP['marquee-rtl'];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-5"
      style={{ background: 'rgba(30,24,16,0.65)', backdropFilter: 'blur(4px)' }}
    >
      {/* Token card */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 48 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 48 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className={`
          relative w-full max-w-[340px] rounded-[24px] border-2 border-brand-dark shadow-brutal-lg
          flex flex-col
          ${asset.bg}
        `}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
          <span
            className="font-serif font-bold whitespace-nowrap"
            style={{
              fontSize: 'clamp(2rem, 18vw, 5.5rem)',
              transform: 'rotate(-22deg)',
              color: 'rgba(30,24,16,0.07)',
            }}
          >
            {user?.rollNumber ?? '00CS000'}
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full pt-7 pb-6 gap-4">

          {/* Date badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 border border-brand-dark/20 rounded-pill">
            <span className="font-sans font-semibold text-xs text-brand-dark">📅 {dateStr}</span>
          </div>

          {/* Clock */}
          <motion.p
            key={timeStr}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="font-mono font-bold text-brand-dark text-4xl tracking-widest leading-none"
          >
            {timeStr}
          </motion.p>

          {/* === Multi-emoji animation zone — matches worker === */}
          <div
            style={{ width: '100%', overflowX: 'hidden', overflowY: 'visible', minHeight: 120, paddingTop: 12, paddingBottom: 12 }}
          >
            <AnimComp emoji={asset.emoji} size="text-6xl" />
          </div>

          {/* Label */}
          <p className="font-serif italic text-brand-dark/55 text-base -mt-2">
            Active Meal Pass
          </p>

          {/* Name + Roll strip */}
          <div className="w-full mx-5 bg-white border-2 border-brand-dark rounded-brutal px-4 py-3.5 text-center shadow-brutal-sm" style={{ width: 'calc(100% - 40px)' }}>
            <p className="font-sans font-bold text-xl text-brand-dark leading-tight">
              {user?.displayName ?? 'Student Name'}
            </p>
            <p className="font-mono text-sm text-brand-light mt-0.5">
              {user?.rollNumber ?? '00CS000'}
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
        className="mt-6 w-[52px] h-[52px] rounded-full bg-brand-bg border-2 border-brand-dark shadow-brutal flex items-center justify-center"
        aria-label="Close token"
      >
        <X size={22} className="text-brand-dark" />
      </motion.button>
    </div>
  );
}
