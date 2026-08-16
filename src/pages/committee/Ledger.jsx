import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Printer, FileText, Calendar, Eye, X } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import { BrutalCard, BrutalButton, BrutalBadge } from '../../components/ui';
import { QRCodeSVG } from 'qrcode.react';
import { listenPendingOptOuts, approveOptOut, rejectOptOut } from '../../lib/firestoreService';
import { getUser } from '../../lib/firestoreService';

/* ─────────────────────────────────────────────────────────
   Committee — Ledger & Opt-Out Requests (Phase 2: live)
───────────────────────────────────────────────────────── */

function DocViewModal({ base64, name, onClose }) {
  return (
    <div className="fixed inset-0 bg-brand-dark/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-brand-bg border-2 border-brand-dark rounded-brutal shadow-brutal-lg p-5 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans font-bold text-sm truncate">{name}</p>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto">
          {base64?.startsWith('data:image') ? (
            <img src={base64} alt={name} className="w-full rounded" />
          ) : base64?.startsWith('data:application/pdf') ? (
            <iframe src={base64} title={name} className="w-full h-[60vh] border rounded" />
          ) : (
            <p className="font-sans text-sm text-brand-light text-center py-10">
              Preview not available for this file type.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Ledger() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const [docView, setDocView]   = useState(null);
  const [penaltyUid, setPenaltyUid] = useState('');
  const [penaltyAmt, setPenaltyAmt] = useState('');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    const unsub = listenPendingOptOuts((data) => {
      setRequests(data);
      setLoading(false);
    });
    return () => unsub?.();
  }, []);

  const handleApprove = async (r) => {
    if (processing[r.id]) return;
    setProcessing(p => ({ ...p, [r.id]: true }));
    try {
      // Get current wallet balance
      const student = await getUser(r.uid);
      await approveOptOut(r.id, {
        uid:            r.uid,
        refundAmount:   r.estimatedRefund || 0,
        currentBalance: student?.walletBalance || 0,
      });
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setProcessing(p => ({ ...p, [r.id]: false }));
    }
  };

  const handleReject = async (r) => {
    if (processing[r.id]) return;
    setProcessing(p => ({ ...p, [r.id]: true }));
    try {
      await rejectOptOut(r.id);
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setProcessing(p => ({ ...p, [r.id]: false }));
    }
  };

  return (
    <AnimatedPage direction={1} className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-serif font-bold text-3xl">
            Opt-Out <span className="highlight">Requests</span>
          </h2>
          <p className="font-sans text-sm text-brand-light mt-1">
            {loading ? 'Loading...' : `${requests.length} pending approval`}
          </p>
        </div>
        <BrutalButton icon={Printer} onClick={() => setShowPrint(true)} variant="secondary">
          Print Passes
        </BrutalButton>
      </div>

      {/* Request cards */}
      <div className="flex flex-col gap-4 mb-10 max-w-3xl">
        <AnimatePresence>
          {!loading && requests.length === 0 && (
            <BrutalCard className="p-8 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-sans text-sm text-brand-light">All caught up! No pending requests.</p>
            </BrutalCard>
          )}
          {requests.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <BrutalCard className="p-5">
                {/* Student info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-primary border-2 border-brand-dark flex items-center justify-center font-serif font-bold shrink-0">
                    {(r.studentName || r.rollNumber || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold text-sm">{r.studentName || 'Unknown'}</p>
                    <p className="font-mono text-xs text-brand-light">{r.rollNumber}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-serif font-bold text-2xl text-brand-gold">₹{r.estimatedRefund || 0}</span>
                    <p className="font-sans text-[10px] text-brand-light">estimated</p>
                  </div>
                </div>

                {/* Leave details */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-2 bg-brand-primary/30 rounded-brutal px-3 py-2">
                    <Calendar size={13} className="shrink-0" />
                    <div>
                      <p className="font-sans text-[10px] text-brand-light">Start Date</p>
                      <p className="font-sans font-semibold text-xs">{r.startDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-brand-accent/30 rounded-brutal px-3 py-2">
                    <Calendar size={13} className="shrink-0" />
                    <div>
                      <p className="font-sans text-[10px] text-brand-light">Duration</p>
                      <p className="font-sans font-semibold text-xs">{r.numDays} day{r.numDays > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-3 bg-brand-bg border border-brand-dark/20 rounded-brutal px-3 py-2">
                  <p className="font-sans text-[10px] text-brand-light mb-0.5">Reason</p>
                  <p className="font-sans text-xs text-brand-dark">{r.reason}</p>
                </div>

                {/* Document */}
                {r.docFileName && (
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={13} className="text-brand-dark/60" />
                    <span className="font-sans text-xs truncate max-w-[150px]">{r.docFileName}</span>
                    {r.docBase64 && (
                      <button
                        onClick={() => setDocView({ base64: r.docBase64, name: r.docFileName })}
                        className="flex items-center gap-1 font-sans text-xs text-brand-light hover:text-brand-dark ml-auto"
                      >
                        <Eye size={12} /> View
                      </button>
                    )}
                    <BrutalBadge color="bg-brand-accent" className="text-[9px]">Uploaded</BrutalBadge>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <BrutalButton
                    variant="success" icon={CheckCircle} fullWidth
                    disabled={!!processing[r.id]}
                    onClick={() => handleApprove(r)}
                  >
                    {processing[r.id] ? '...' : 'Approve & Refund'}
                  </BrutalButton>
                  <BrutalButton
                    variant="danger" icon={XCircle} fullWidth
                    disabled={!!processing[r.id]}
                    onClick={() => handleReject(r)}
                  >
                    Reject
                  </BrutalButton>
                </div>
              </BrutalCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Apply Penalty */}
      <h3 className="font-serif font-bold text-xl mb-3">Apply Penalty</h3>
      <BrutalCard className="p-5 max-w-md mb-8">
        <div className="flex flex-col gap-3">
          <input value={penaltyUid} onChange={e => setPenaltyUid(e.target.value)}
            placeholder="Student Roll No" className="border-2 border-brand-dark rounded-brutal px-3 py-2.5 font-sans text-sm bg-brand-bg outline-none" />
          <input value={penaltyAmt} onChange={e => setPenaltyAmt(e.target.value)}
            placeholder="Penalty amount (₹)" type="number"
            className="border-2 border-brand-dark rounded-brutal px-3 py-2.5 font-sans text-sm bg-brand-bg outline-none" />
          <BrutalButton variant="danger" icon={AlertTriangle} fullWidth
            onClick={() => { setPenaltyUid(''); setPenaltyAmt(''); }}>
            Apply Penalty
          </BrutalButton>
        </div>
      </BrutalCard>

      {/* Doc view modal */}
      {docView && <DocViewModal {...docView} onClose={() => setDocView(null)} />}
    </AnimatedPage>
  );
}
