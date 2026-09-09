import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Wallet, ChevronRight, ArrowLeftRight, Clock, CheckCircle2, XCircle, FileText, Eye, X } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import { BrutalCard, BrutalButton, BrutalBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { listenMyOptOuts, listenMyPenalties, getOptOutEndDate } from '../../lib/firestoreService';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────
   Student — Profile
   • Single wallet card → taps to Wallet History page
   • Opt-out history list
   • No QR (QR is in the Token Overlay only)
───────────────────────────────────────────────────────── */

const STATUS_CONF = {
  pending:   { label: 'Pending',   color: 'bg-brand-purple',    Icon: Clock         },
  approved:  { label: 'Approved',  color: 'bg-brand-accent',    Icon: CheckCircle2  },
  rejected:  { label: 'Rejected',  color: 'bg-brand-secondary', Icon: XCircle       },
  cancelled: { label: 'Cancelled', color: 'bg-brand-bg',        Icon: XCircle       },
};

function DocViewModal({ base64, name, onClose }) {
  return (
    <div className="fixed inset-0 bg-brand-dark/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-brand-bg border-2 border-brand-dark rounded-brutal shadow-brutal-lg p-5 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="font-sans font-bold text-sm truncate">{name || 'Document'}</p>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto">
          {base64?.startsWith('data:image') ? (
            <img src={base64} alt={name} className="w-full rounded" />
          ) : base64?.startsWith('data:application/pdf') ? (
            <iframe src={base64} title={name} className="w-full h-[60vh] border rounded" />
          ) : base64 ? (
            <div className="text-center py-10">
              <p className="font-sans text-sm text-brand-light mb-3">Preview not available for this file type.</p>
              <a href={base64} download={name || 'document'} className="font-sans text-xs font-bold underline">Download file</a>
            </div>
          ) : (
            <p className="font-sans text-sm text-brand-light text-center py-10">No document attached.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile({ direction }) {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [history,   setHistory]   = useState([]);
  const [docView,   setDocView]   = useState(null);

  const isStaff    = user?.role === 'committee';
  const panelPath  = '/committee';
  const panelLabel = 'Committee Panel';

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenMyOptOuts(user.uid, (list) => {
      setHistory(list);
      refreshProfile?.();
    });
    return () => unsub?.();
  }, [user?.uid]);

  return (
    <AnimatedPage direction={direction} className="px-5 pt-5 pb-6">

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-primary border-2 border-brand-dark rounded-brutal p-5 shadow-brutal mb-4 relative overflow-hidden"
      >
        <span className="absolute -bottom-4 -right-4 font-serif font-bold text-brand-dark/10 select-none pointer-events-none" style={{ fontSize: '5rem' }}>🎓</span>
        <div className="flex items-center gap-4 relative z-10">
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

      {/* Panel switch — committee/admin only */}
      {isStaff && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { window.location.href = panelPath; }}
          className="w-full mb-4 flex items-center justify-between gap-3 bg-brand-dark text-brand-bg border-2 border-brand-dark rounded-brutal px-5 py-3.5 shadow-brutal-sm hover:shadow-brutal transition-shadow"
        >
          <div className="flex items-center gap-3">
            <ArrowLeftRight size={18} className="shrink-0" />
            <div className="text-left">
              <p className="font-sans font-bold text-sm">Switch to {panelLabel}</p>
              <p className="font-sans text-xs text-brand-bg/60">You have staff access</p>
            </div>
          </div>
          <span className="font-sans text-xs bg-brand-gold text-brand-dark px-2 py-0.5 rounded-pill font-bold capitalize">
            {user.role.replace('_', ' ')}
          </span>
        </motion.button>
      )}

      {/* Wallet — single card, tap to open history */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/student/wallet')}
        className="w-full mb-5 text-left"
      >
        <BrutalCard color="bg-brand-gold" className="p-4 flex items-center justify-between gap-3 hover:shadow-brutal transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-brutal bg-brand-dark/10 border-2 border-brand-dark/20 flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-brand-dark" />
            </div>
            <div>
              <p className="font-sans text-xs text-brand-dark/60 uppercase tracking-wider leading-none mb-0.5">Mess Wallet</p>
              <p className="font-serif font-bold text-2xl text-brand-dark leading-none">₹{user?.walletBalance ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-brand-dark/50">
            <p className="font-sans text-xs font-semibold">History</p>
            <ChevronRight size={16} />
          </div>
        </BrutalCard>
      </motion.button>

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
              <BrutalCard className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <conf.Icon size={18} className="text-brand-dark shrink-0" />
                    <div>
                      <p className="font-sans font-bold text-sm">
                        {r.numDays} day{r.numDays > 1 ? 's' : ''} · {r.startDate} → {getOptOutEndDate(r.startDate, r.numDays)}
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
                </div>
                {r.status === 'rejected' && r.rejectReason && (
                  <p className="font-sans text-xs text-red-700 bg-red-50 border border-red-200 rounded-brutal px-2.5 py-1.5 mt-3">
                    Reject reason: {r.rejectReason}
                  </p>
                )}
                {r.docBase64 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-dark/10">
                    <FileText size={13} className="text-brand-dark/60 shrink-0" />
                    <span className="font-sans text-xs truncate max-w-[150px]">{r.docFileName || 'Document'}</span>
                    <button
                      onClick={() => setDocView({ base64: r.docBase64, name: r.docFileName })}
                      className="flex items-center gap-1 font-sans text-xs font-semibold text-brand-light hover:text-brand-dark ml-auto"
                    >
                      <Eye size={12} /> View
                    </button>
                  </div>
                )}
              </BrutalCard>
            </motion.div>
          );
        })}
      </div>

      {/* Logout */}
      <BrutalButton icon={LogOut} onClick={logout} variant="ghost" fullWidth>
        Sign Out
      </BrutalButton>

      {docView && <DocViewModal {...docView} onClose={() => setDocView(null)} />}

    </AnimatedPage>
  );
}
