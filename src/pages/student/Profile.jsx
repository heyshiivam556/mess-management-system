import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Wallet, Clock, CheckCircle2, XCircle } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import { BrutalCard, BrutalButton, BrutalBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { listenMyOptOuts } from '../../lib/firestoreService';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

/* ─────────────────────────────────────────────────────────
   Student — Profile (Phase 2: live wallet + opt-out history)
───────────────────────────────────────────────────────── */

const STATUS_CONF = {
  pending:  { label: 'Pending',  color: 'bg-brand-purple',   Icon: Clock         },
  approved: { label: 'Approved', color: 'bg-brand-accent',   Icon: CheckCircle2  },
  rejected: { label: 'Rejected', color: 'bg-brand-secondary', Icon: XCircle       },
};

export default function Profile({ direction }) {
  const { user, logout, refreshProfile } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenMyOptOuts(user.uid, (list) => {
      setHistory(list);
      refreshProfile?.();
    });
    return () => unsub?.();
  }, [user?.uid]);

  const totalSaved = history
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.estimatedRefund || 0), 0);

  return (
    <AnimatedPage direction={direction} className="px-5 pt-5 pb-6">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-primary border-2 border-brand-dark rounded-brutal p-5 shadow-brutal mb-5 relative overflow-hidden"
      >
        {/* BG watermark */}
        <span className="absolute -bottom-4 -right-4 font-serif font-bold text-brand-dark/10 select-none pointer-events-none"
          style={{ fontSize: '5rem' }}>🎓</span>

        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-white border-2 border-brand-dark flex items-center justify-center font-serif font-bold text-3xl shadow-brutal-sm shrink-0">
            {user?.displayName?.[0] ?? 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif font-bold text-xl text-brand-dark leading-tight">
              {user?.displayName ?? 'Student'}
            </h2>
            <p className="font-mono text-sm text-brand-dark/70">{user?.rollNumber}</p>
            <p className="font-sans text-xs text-brand-dark/50 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Wallet + Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <BrutalCard color="bg-brand-gold" className="p-4 text-center">
          <Wallet size={20} className="mx-auto mb-1 text-brand-dark" />
          <p className="font-sans text-xs text-brand-dark/60 uppercase tracking-wider mb-1">Wallet</p>
          <p className="font-serif font-bold text-2xl text-brand-dark">₹{user?.walletBalance ?? 0}</p>
        </BrutalCard>
        <BrutalCard color="bg-brand-accent" className="p-4 text-center">
          <CheckCircle2 size={20} className="mx-auto mb-1 text-brand-dark" />
          <p className="font-sans text-xs text-brand-dark/60 uppercase tracking-wider mb-1">Total Saved</p>
          <p className="font-serif font-bold text-2xl text-brand-dark">₹{totalSaved}</p>
        </BrutalCard>
      </div>

      {/* Inline QR Code */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-brand-dark rounded-brutal p-6 flex flex-col items-center gap-3 shadow-brutal mb-6"
      >
        <p className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark">
          GEC Sheikhpura — Entry QR
        </p>
        <QRCodeSVG value={user?.uid ?? 'unknown'} size={160} level="H" />
        <p className="font-sans text-[10px] text-brand-light text-center max-w-[160px] mt-1">
          Show this at the mess gate when asked
        </p>
      </motion.div>

      {/* Opt-out history */}
      <h3 className="font-serif font-bold text-lg mb-3">Opt-Out History</h3>
      <div className="flex flex-col gap-3 mb-6">
        {history.length === 0 && (
          <BrutalCard className="p-5 text-center">
            <p className="font-sans text-sm text-brand-light">No opt-out requests yet.</p>
          </BrutalCard>
        )}
        {history.map((r, i) => {
          const conf = STATUS_CONF[r.status] ?? STATUS_CONF.pending;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <BrutalCard className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <conf.Icon size={18} className="text-brand-dark shrink-0" />
                  <div>
                    <p className="font-sans font-bold text-sm">
                      {r.numDays} day{r.numDays > 1 ? 's' : ''} from {r.startDate}
                    </p>
                    <p className="font-sans text-xs text-brand-light truncate max-w-[160px]">
                      {r.reason}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <BrutalBadge color={conf.color}>{conf.label}</BrutalBadge>
                  {r.status === 'approved' && (
                    <span className="font-serif font-bold text-sm text-brand-gold">+₹{r.estimatedRefund}</span>
                  )}
                </div>
              </BrutalCard>
            </motion.div>
          );
        })}
      </div>

      {/* Logout */}
      <BrutalButton icon={LogOut} onClick={logout} variant="ghost" fullWidth>
        Sign Out
      </BrutalButton>

    </AnimatedPage>
  );
}
