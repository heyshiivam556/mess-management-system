import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, LogOut } from 'lucide-react';
import { BrutalCard, BrutalButton } from '../../components/ui';
import { getTodayBlocklist } from '../../lib/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { getTodayToken, ANIM_COMPONENT_MAP } from '../../utils/tokenUtils';

/* ─────────────────────────────────────────────────────────
   Worker — QR Terminal
   • Token displayed as a proper card (matches student view)
   • Big QR scanner graphic on idle
   • Logout button in header
───────────────────────────────────────────────────────── */

export default function Terminal() {
  const { user, logout }        = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result,   setResult]   = useState(null);
  const [blocklist, setBlocklist] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const { asset, animationType } = getTodayToken();
  const AnimComp = ANIM_COMPONENT_MAP[animationType] ?? ANIM_COMPONENT_MAP['marquee-rtl'];

  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await getTodayBlocklist();
        setBlocklist(list);
        sessionStorage.setItem('cachedBlocklist', JSON.stringify(list));
      } catch {
        const cached = sessionStorage.getItem('cachedBlocklist');
        if (cached) setBlocklist(JSON.parse(cached));
      } finally {
        setLoadingList(false);
      }
    };
    fetchList();
  }, []);

  const startScanner = () => {
    if (!scannerRef.current) return;
    const qr = new Html5Qrcode(scannerRef.current.id);
    html5QrRef.current = qr;
    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => onScan(decodedText),
      () => {}
    ).then(() => setScanning(true)).catch(err => console.warn(err));
  };

  const stopScanner = () => {
    html5QrRef.current?.stop().catch(() => {});
    html5QrRef.current = null;
    setScanning(false);
  };

  const onScan = (uid) => {
    stopScanner();
    if (!blocklist) { setResult({ allowed: false, uid, reason: 'Blocklist not loaded' }); return; }
    const allowed = !blocklist.includes(uid);
    setResult({ allowed, uid });
    setTimeout(() => setResult(null), 6000);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b-2 border-brand-dark flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-xl leading-none">
            Mess<span className="text-brand-gold">App</span>
            <span className="font-sans font-normal text-base text-brand-light ml-2">Worker</span>
          </h1>
          <p className="font-sans text-xs text-brand-light mt-0.5">
            {user?.displayName} · {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 font-sans text-xs font-semibold text-brand-dark/60 hover:text-brand-dark border-2 border-brand-dark/30 hover:border-brand-dark rounded-brutal px-3 py-2 transition-all"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>

      {/* ── Today's token — proper card ── */}
      <div className="px-5 py-5 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className={`
            relative w-full max-w-[340px] rounded-[24px] border-2 border-brand-dark shadow-brutal
            flex flex-col items-center pt-5 pb-4 px-4 ${asset.bg}
          `}
          style={{ userSelect: 'none' }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none rounded-[22px]">
            <span className="font-serif font-bold text-brand-dark/[0.07]" style={{ fontSize: 'clamp(2rem,18vw,5rem)', whiteSpace:'nowrap' }}>
              GEC MESS
            </span>
          </div>

          {/* Label */}
          <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.2em] text-brand-dark/50 mb-1 z-10">
            Today's Pass Token
          </p>
          <p className="font-sans text-[10px] text-brand-dark/40 mb-2 z-10">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {/* Animation zone */}
          <div
            className="z-10 w-full"
            style={{ overflowX: 'hidden', overflowY: 'visible', minHeight: 110, paddingTop: 8, paddingBottom: 8 }}
          >
            <AnimComp emoji={asset.emoji} size="text-5xl" />
          </div>

          {/* Dashed divider */}
          <div className="w-full border-t-2 border-dashed border-brand-dark/20 my-2 z-10" />

          {/* Footer strip */}
          <div className="z-10 flex items-center justify-between w-full px-1 pt-1">
            <p className="font-sans text-[10px] text-brand-dark/50">GEC Sheikhpura Mess</p>
            <p className="font-mono text-[10px] font-bold text-brand-dark/60">
              {blocklist !== null
                ? `${blocklist.length} opted out`
                : loadingList ? 'syncing...' : 'offline'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Scan result ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`mx-5 rounded-brutal border-2 border-brand-dark p-5 flex items-center gap-4 mb-2 ${result.allowed ? 'bg-brand-accent' : 'bg-brand-secondary'}`}
          >
            {result.allowed
              ? <CheckCircle size={36} className="text-green-700 shrink-0" />
              : <XCircle    size={36} className="text-red-700 shrink-0" />}
            <div>
              <p className="font-serif font-bold text-lg leading-tight">
                {result.allowed ? '✓ Entry Allowed' : '✗ Opted Out'}
              </p>
              <p className="font-sans text-xs text-brand-dark/70 mt-0.5">
                {result.allowed ? 'Student may enter the mess.' : 'Deny entry — student has opted out today.'}
              </p>
              <p className="font-mono text-[10px] text-brand-dark/50 mt-1 truncate max-w-[220px]">{result.uid}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scanner area ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8">

        {/* Hidden scanner div (shown when active) */}
        <div
          id="qr-scanner-container"
          ref={scannerRef}
          className={`w-full max-w-sm aspect-square border-2 border-brand-dark rounded-brutal overflow-hidden bg-brand-dark mb-4 ${scanning ? 'block' : 'hidden'}`}
        />

        {/* Idle state — big scanner illustration */}
        {!scanning && !result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            {/* Scanner SVG illustration */}
            <div className="relative mb-6">
              <div className="w-48 h-48 border-2 border-brand-dark/20 rounded-brutal bg-brand-bg flex items-center justify-center relative overflow-hidden">
                {/* Scan line animation */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-brand-dark/40"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
                {/* QR corner marks */}
                {[['top-2 left-2','border-t-2 border-l-2'],
                  ['top-2 right-2','border-t-2 border-r-2'],
                  ['bottom-2 left-2','border-b-2 border-l-2'],
                  ['bottom-2 right-2','border-b-2 border-r-2']].map(([pos, bdr], i) => (
                  <div key={i} className={`absolute ${pos} w-7 h-7 ${bdr} border-brand-dark rounded-sm`} />
                ))}
                {/* Center QR icon */}
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-dark/30">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <path d="M14 14h1v1h-1zM17 14h1v1h-1zM14 17h1v1h-1zM17 17h1v1h-1zM20 14h1v1h-1zM14 20h1v1h-1zM20 17h3v4h-3z"/>
                  <rect x="5" y="5" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
                  <rect x="16" y="5" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
                  <rect x="5" y="16" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </div>
            </div>

            <p className="font-serif font-bold text-xl text-brand-dark mb-1">
              {loadingList ? 'Getting ready...' : 'Ready to Scan'}
            </p>
            <p className="font-sans text-sm text-brand-light text-center mb-6 max-w-[220px]">
              {loadingList
                ? 'Fetching today\'s opt-out list...'
                : `${blocklist?.length ?? 0} students opted out today`}
            </p>

            <BrutalButton
              onClick={startScanner}
              disabled={loadingList}
              size="lg"
              className="px-10"
            >
              {loadingList ? '⏳ Loading...' : '📷 Start Scanning'}
            </BrutalButton>
          </motion.div>
        )}

        {/* Scanning state */}
        {scanning && (
          <div className="text-center mt-4 w-full max-w-sm">
            <motion.p
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="font-sans text-sm text-brand-light mb-4"
            >
              Point camera at student's QR code...
            </motion.p>
            <BrutalButton variant="ghost" onClick={stopScanner} fullWidth>
              Cancel
            </BrutalButton>
          </div>
        )}

        {/* Post-scan — scan next */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-sm"
          >
            <BrutalButton
              onClick={() => { setResult(null); startScanner(); }}
              fullWidth size="lg"
            >
              📷 Scan Next Student
            </BrutalButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}
