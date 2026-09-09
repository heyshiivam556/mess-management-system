import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../../components/AnimatedPage';
import { BrutalCard, BrutalBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { listenMyOptOuts, listenMyPenalties, getOptOutEndDate } from '../../lib/firestoreService';

/* ─────────────────────────────────────────────────────────
   Student — Wallet History Page
   Shows all transactions: opt-out refunds + penalties
   Filtered by: All | Opt-outs | Penalties
───────────────────────────────────────────────────────── */

const STATUS_CONF = {
  pending:   { label: 'Pending',   color: 'bg-brand-purple',    Icon: Clock         },
  approved:  { label: 'Approved',  color: 'bg-brand-accent',    Icon: CheckCircle2  },
  rejected:  { label: 'Rejected',  color: 'bg-brand-secondary', Icon: XCircle       },
  cancelled: { label: 'Cancelled', color: 'bg-brand-bg border border-brand-dark/20', Icon: XCircle },
};

const PILLS = [
  { key: 'all',      label: 'All' },
  { key: 'optouts',  label: 'Opt-outs' },
  { key: 'penalties',label: 'Penalties' },
];

export default function WalletHistory({ direction }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [optOuts,   setOptOuts]   = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [pill,      setPill]      = useState('all');

  useEffect(() => {
    if (!user?.uid) return;
    const unsub1 = listenMyOptOuts(user.uid, setOptOuts);
    const unsub2 = listenMyPenalties(user.uid, setPenalties);
    return () => { unsub1?.(); unsub2?.(); };
  }, [user?.uid]);

  // Build unified timeline
  const optOutItems = optOuts.map(r => ({
    id:        r.id,
    type:      'optout',
    amount:    r.status === 'approved' ? +(r.estimatedRefund || 0) : 0,
    sign:      '+',
    label:     `${r.numDays} day${r.numDays > 1 ? 's' : ''} opt-out · ${r.startDate} → ${getOptOutEndDate(r.startDate, r.numDays)}`,
    sublabel:  r.reason,
    status:    r.status,
    ts:        r.submittedAt?.seconds ?? 0,
  }));

  const penaltyItems = penalties.map(p => ({
    id:       p.id,
    type:     'penalty',
    amount:   p.amount,
    sign:     '−',
    label:    p.reason,
    sublabel: `By ${p.appliedBy || 'Committee'}${p.appliedAt?.toDate ? ' · ' + new Date(p.appliedAt.toDate()).toLocaleDateString('en-IN') : ''}`,
    status:   p.resolved ? 'resolved' : 'active',
    ts:       p.appliedAt?.seconds ?? 0,
  }));

  const allItems = [...optOutItems, ...penaltyItems].sort((a, b) => b.ts - a.ts);

  const displayed =
    pill === 'optouts'   ? optOutItems.sort((a,b) => b.ts - a.ts)
    : pill === 'penalties' ? penaltyItems.sort((a,b) => b.ts - a.ts)
    : allItems;

  // Wallet stats
  const totalIn  = optOuts.filter(r => r.status === 'approved').reduce((s, r) => s + (r.estimatedRefund || 0), 0);
  const totalOut = penalties.filter(p => !p.resolved).reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <AnimatedPage direction={direction} className="min-h-screen bg-brand-bg">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-brand-bg/95 backdrop-blur-sm border-b-2 border-brand-dark px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-brutal border-2 border-brand-dark flex items-center justify-center shrink-0 hover:bg-brand-primary/40 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif font-bold text-xl leading-none">
            My <span className="text-brand-gold">Wallet</span>
          </h1>
          <p className="font-sans text-[10px] text-brand-light uppercase tracking-widest mt-0.5">Transaction History</p>
        </div>
      </div>

      <div className="px-5 pt-5 pb-28">

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gold border-2 border-brand-dark rounded-brutal p-5 shadow-brutal mb-4 relative overflow-hidden"
        >
          <span className="absolute -bottom-4 -right-4 font-serif font-bold text-brand-dark/10 select-none pointer-events-none" style={{ fontSize: '5rem' }}>₹</span>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-brand-dark/70" />
              <p className="font-sans font-bold text-xs uppercase tracking-wider text-brand-dark/70">Current Balance</p>
            </div>
            <p className="font-serif font-bold text-4xl text-brand-dark leading-none">
              ₹{user?.walletBalance ?? 0}
            </p>
          </div>
        </motion.div>

        {/* In / Out summary */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <BrutalCard color="bg-brand-accent" className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-700" />
              <p className="font-sans text-[10px] text-brand-dark/60 uppercase tracking-wider">Total Credited</p>
            </div>
            <p className="font-serif font-bold text-xl text-brand-dark">+₹{totalIn}</p>
          </BrutalCard>
          <BrutalCard color="bg-brand-secondary" className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={14} className="text-red-600" />
              <p className="font-sans text-[10px] text-brand-dark/60 uppercase tracking-wider">Total Deducted</p>
            </div>
            <p className="font-serif font-bold text-xl text-brand-dark">−₹{totalOut}</p>
          </BrutalCard>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4">
          {PILLS.map(p => (
            <button
              key={p.key}
              onClick={() => setPill(p.key)}
              className={`font-sans font-bold text-xs px-4 py-1.5 rounded-pill border-2 border-brand-dark transition-all
                ${pill === p.key ? 'bg-brand-dark text-brand-bg shadow-brutal-sm' : 'bg-brand-bg text-brand-dark/60 hover:text-brand-dark'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {displayed.length === 0 ? (
              <BrutalCard key="empty" className="p-8 text-center">
                <p className="font-sans text-sm text-brand-light">No transactions yet.</p>
              </BrutalCard>
            ) : displayed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.03 }}
              >
                <BrutalCard className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {item.type === 'optout' ? (
                          <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-brand-dark/40 bg-brand-primary px-1.5 py-0.5 rounded-full">Opt-out</span>
                        ) : (
                          <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-brand-dark/40 bg-brand-secondary px-1.5 py-0.5 rounded-full">Penalty</span>
                        )}
                        {item.type === 'optout' && (
                          <BrutalBadge color={(STATUS_CONF[item.status] ?? STATUS_CONF.pending).color}>
                            {(STATUS_CONF[item.status] ?? STATUS_CONF.pending).label}
                          </BrutalBadge>
                        )}
                        {item.type === 'penalty' && (
                          <BrutalBadge color={item.status === 'resolved' ? 'bg-brand-accent' : 'bg-brand-secondary'}>
                            {item.status === 'resolved' ? 'Resolved' : 'Active'}
                          </BrutalBadge>
                        )}
                      </div>
                      <p className="font-sans font-semibold text-sm text-brand-dark leading-snug truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="font-sans text-xs text-brand-light mt-0.5 truncate">{item.sublabel}</p>
                      )}
                    </div>
                    {/* Amount badge */}
                    {item.amount > 0 && (
                      <span className={`font-serif font-bold text-lg shrink-0 ${item.sign === '+' ? 'text-green-700' : 'text-red-600'}`}>
                        {item.sign}₹{item.amount}
                      </span>
                    )}
                  </div>
                </BrutalCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedPage>
  );
}
