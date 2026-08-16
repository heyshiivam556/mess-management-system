import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUser, setUser } from '../lib/firestoreService';

/* ─────────────────────────────────────────────────────────
   AuthContext — Phase 2
   • signInWithPopup (Google) — works on all origins including LAN IPs
   • getRedirectResult() also handled in case of browser redirect
   • signInWithEmailAndPassword — roll number → @gecmess.internal
   • New Google users prompted for roll number via completeGoogleRegistration
   • Role read from Firestore /users/{uid}
   • Dev mock mode active when VITE_USE_FIREBASE is not "true"
───────────────────────────────────────────────────────── */

const AuthContext    = createContext(null);
const googleProvider = new GoogleAuthProvider();
const DOMAIN         = '@gecmess.internal';
const USE_FIREBASE   = import.meta.env.VITE_USE_FIREBASE === 'true';

const toEmail = (rollNumber) =>
  `${rollNumber.toLowerCase().replace(/\s+/g, '')}${DOMAIN}`;

/* ── Mock users (dev mode) ──────────────────────────────── */
const MOCK_USERS = {
  student:     { uid:'mock-s-001', displayName:'Rahul Kumar',      rollNumber:'23CS001', walletBalance:1250, role:'student',     isActive:true },
  committee:   { uid:'mock-c-002', displayName:'Priya Singh',      rollNumber:'CMTE001', walletBalance:0,    role:'committee',   isActive:true },
  worker:      { uid:'mock-w-003', displayName:'Ramesh Yadav',     rollNumber:'WRK001',  walletBalance:0,    role:'worker',      isActive:true },
  super_admin: { uid:'mock-a-004', displayName:'Dr. Ashok Sharma', rollNumber:'ADMIN001',walletBalance:0,    role:'super_admin', isActive:true },
};

export function AuthProvider({ children }) {
  const [user,    setUser_]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  // Tracks a new Google user who needs to enter their roll number
  const [pendingGoogle, setPendingGoogle] = useState(null); // { uid, displayName, email }

  const [mockRole, setMockRole] = useState(
    () => sessionStorage.getItem('devRole') || 'student'
  );
  const useMock = !USE_FIREBASE;

  /* ── Mock mode ── */
  useEffect(() => {
    if (!useMock) return;
    const timer = setTimeout(() => {
      setUser_(MOCK_USERS[mockRole] ?? MOCK_USERS.student);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [useMock, mockRole]);

  /* ── Real Firebase: auth state + redirect result ── */
  useEffect(() => {
    if (useMock) return;

    // Handle any pending redirect result (in case browser used redirect flow)
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        await handleGoogleUser(result.user);
      })
      .catch((err) => {
        console.warn('getRedirectResult error (safe to ignore if no redirect was started):', err.code);
      });

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser_(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await getUser(fbUser.uid);
        if (profile?.role) {
          // Fully registered user — set and go
          setUser_({ uid: fbUser.uid, email: fbUser.email, ...profile });
        } else {
          // Authenticated but no Firestore profile yet (new Google user)
          setPendingGoogle({
            uid:         fbUser.uid,
            displayName: fbUser.displayName || '',
            email:       fbUser.email || '',
          });
          setUser_(null);
        }
      } catch (err) {
        console.error('Profile load failed:', err);
        setError('Could not load your profile. Check your connection.');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, [useMock]);

  /* helper — called after Google popup/redirect result */
  const handleGoogleUser = async (fbUser) => {
    const profile = await getUser(fbUser.uid);
    if (!profile?.role) {
      setPendingGoogle({
        uid:         fbUser.uid,
        displayName: fbUser.displayName || '',
        email:       fbUser.email || '',
      });
      setUser_(null);
    }
    // If profile exists, onAuthStateChanged will set the user
  };

  /* ── Google sign-in (popup — works on any origin) ── */
  const loginWithGoogle = async () => {
    setError(null);
    if (useMock) {
      sessionStorage.setItem('devRole', 'student');
      setMockRole('student');
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleGoogleUser(result.user);
    } catch (err) {
      // Re-throw so Login.jsx can show the right message
      throw err;
    }
  };

  /* ── Complete registration for new Google users ── */
  const completeGoogleRegistration = async (rollNumber, password) => {
    if (!pendingGoogle?.uid) throw new Error('No pending Google user');
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Auth state lost. Please sign in with Google again.');

    // Link an Email/Password credential so they can login with ID later
    try {
      const credential = EmailAuthProvider.credential(toEmail(rollNumber), password);
      await linkWithCredential(fbUser, credential);
    } catch (err) {
      // If it says email-already-in-use, it means someone else already claimed this roll number!
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('This Registration Number is already registered.');
      } else if (err.code === 'auth/credential-already-in-use') {
        throw new Error('This Registration Number is already linked to another account.');
      }
      throw err;
    }

    const profile = {
      displayName:   pendingGoogle.displayName || rollNumber.toUpperCase(),
      rollNumber:    rollNumber.toUpperCase(),
      role:          'student',
      walletBalance: 0,
      isActive:      true,
      email:         pendingGoogle.email, // store original gmail
    };
    await setUser(pendingGoogle.uid, profile);
    setPendingGoogle(null);
    setUser_({ uid: pendingGoogle.uid, ...profile });
  };

  /* ── Roll number + password login ── */
  const login = async (rollNumber, password) => {
    setError(null);
    if (useMock) {
      const role = Object.keys(MOCK_USERS).find(
        r => MOCK_USERS[r].rollNumber.toLowerCase() === rollNumber.toLowerCase()
      ) || 'student';
      sessionStorage.setItem('devRole', role);
      setMockRole(role);
      return;
    }
    await signInWithEmailAndPassword(auth, toEmail(rollNumber), password);
  };

  /* ── Logout ── */
  const logout = async () => {
    if (useMock) {
      sessionStorage.removeItem('devRole');
      setMockRole('student');
      setUser_(null);
      return;
    }
    setPendingGoogle(null);
    await signOut(auth);
  };

  /* ── Refresh profile after wallet updates ── */
  const refreshProfile = async () => {
    if (!user?.uid || useMock) return;
    const profile = await getUser(user.uid);
    if (profile) setUser_(prev => ({ ...prev, ...profile }));
  };

  const switchDevRole = (role) => {
    sessionStorage.setItem('devRole', role);
    setMockRole(role);
    setLoading(true);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, loginWithGoogle, completeGoogleRegistration,
      logout, refreshProfile,
      pendingGoogle,  // { uid, displayName, email } when new Google user needs roll number
    }}>
      {children}
      {import.meta.env.DEV && useMock && (
        <DevRoleSwitcher current={mockRole} onSwitch={switchDevRole} />
      )}
    </AuthContext.Provider>
  );
}

/* ── Dev Role Switcher ──────────────────────────────────── */
function DevRoleSwitcher({ current, onSwitch }) {
  const [open, setOpen] = useState(false);
  const roles  = ['student', 'committee', 'worker', 'super_admin'];
  const colors = { student:'#f9c74f', committee:'#90be6d', worker:'#43aa8b', super_admin:'#f94144' };
  return (
    <div style={{ position:'fixed', bottom:80, left:12, zIndex:9999, fontFamily:'monospace' }}>
      {open && (
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:6,
          background:'#fff', border:'2px solid #1a1a1a', borderRadius:12,
          padding:8, boxShadow:'3px 3px 0 #1a1a1a' }}>
          {roles.map(r => (
            <button key={r} onClick={() => { onSwitch(r); setOpen(false); }}
              style={{ padding:'5px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                border:'2px solid #1a1a1a', cursor:'pointer', textAlign:'left',
                background:current===r ? colors[r] : '#f5f5f5', color:'#1a1a1a' }}>
              {current===r ? '▶ ':''}{r}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        style={{ padding:'5px 10px', borderRadius:20, fontSize:11, fontWeight:700,
          border:'2px solid #1a1a1a', cursor:'pointer',
          background:colors[current]??'#ccc', boxShadow:'2px 2px 0 #1a1a1a' }}>
        🛠 {current}
      </button>
    </div>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
