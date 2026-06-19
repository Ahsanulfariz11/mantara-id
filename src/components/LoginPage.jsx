import { useState, useEffect } from 'react';
import { auth, db, ref as dbRef, set as dbSet, get as dbGet, child as dbChild } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LoginPage({ onLogin, onCancel, lang, setLang, t }) {
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Email Verification States
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val.replace(/\D/g, ''));
  };

  const handleAgeChange = (e) => {
    const val = e.target.value;
    setAge(val.replace(/\D/g, ''));
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      const userSnapshot = await dbGet(dbChild(dbRef(db), `users/${fbUser.uid}`));
      let profile = {};
      if (userSnapshot.exists()) {
        profile = userSnapshot.val();
      } else {
        profile = {
          name: fbUser.displayName || 'Google User',
          email: fbUser.email,
          phone: fbUser.phoneNumber || '',
          age: '30',
          role: 'user'
        };
        await dbSet(dbRef(db, `users/${fbUser.uid}`), profile);
      }
      
      const fullUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: profile.name,
        phone: profile.phone,
        age: profile.age,
        role: profile.role
      };
      onLogin(fullUser);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError(lang === 'id' ? 'Masuk dengan Google dibatalkan.' : 'Google sign-in was cancelled.');
      } else {
        setError(lang === 'id' ? 'Gagal masuk dengan Google.' : 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Check if it's an operator admin login first
      const operatorsSnapshot = await dbGet(dbChild(dbRef(db), 'operators'));
      if (operatorsSnapshot.exists()) {
        const opsData = operatorsSnapshot.val();
        const opFound = Object.keys(opsData)
          .map(k => ({ ...opsData[k], id: k }))
          .find(op => op.loginUsername && op.loginPassword && op.loginUsername === email && op.loginPassword === password);
        
        if (opFound) {
          onLogin({
            uid: `op_${opFound.id || Date.now()}`,
            email: opFound.loginUsername,
            name: `Admin ${opFound.name}`,
            role: 'operator',
            operatorName: opFound.name
          });
          setLoading(false);
          return;
        }
      }

      let userCredential;
      const targetEmail = email.trim();
      try {
        userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      } catch (err) {
        const isDemoUser = targetEmail.toLowerCase() === 'user@email.com' && password === 'user123';
        const isDemoAdmin = targetEmail.toLowerCase() === 'admin@email.com' && password === 'admin123';
        
        if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && (isDemoUser || isDemoAdmin)) {
          const role = isDemoAdmin ? 'admin' : 'user';
          const demoName = isDemoAdmin ? 'Mantara Admin' : 'Mantara User';
          const demoPhone = isDemoAdmin ? '08111111111' : '08222222222';
          const demoAge = isDemoAdmin ? '35' : '28';
          
          userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password);
          const fbUser = userCredential.user;
          await dbSet(dbRef(db, `users/${fbUser.uid}`), {
            name: demoName,
            email: targetEmail,
            phone: demoPhone,
            age: demoAge,
            role: role
          });
        } else {
          throw err;
        }
      }
      const fbUser = userCredential.user;
      
      // Check email verification (except for demo users)
      if (!fbUser.emailVerified && fbUser.email !== 'user@mantara.com' && fbUser.email !== 'admin@mantara.com' && fbUser.email !== 'user@email.com' && fbUser.email !== 'admin@email.com') {
        await signOut(auth);
        setVerificationEmail(fbUser.email);
        setVerificationSent(true);
        setError(lang === 'id' 
          ? 'Email Anda belum diverifikasi. Harap verifikasi email Anda terlebih dahulu.' 
          : 'Your email is not verified yet. Please verify your email first.');
        setLoading(false);
        return;
      }
      
      const userSnapshot = await dbGet(dbChild(dbRef(db), `users/${fbUser.uid}`));
      let profile = {};
      if (userSnapshot.exists()) {
        profile = userSnapshot.val();
      }
      
      const fullUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: profile.name || fbUser.displayName || 'User',
        phone: profile.phone || '',
        age: profile.age || '30',
        role: profile.role || ((fbUser.email === 'admin@mantara.com' || fbUser.email === 'admin@email.com') ? 'admin' : 'user')
      };
      onLogin(fullUser);
    } catch (err) {
      console.error(err);
      setError(lang === 'id' ? 'Email atau kata sandi salah.' : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    // Step 1 Validation
    if (registerStep === 1) {
      if (!name.trim()) {
        setError(lang === 'id' ? 'Nama lengkap harus diisi.' : 'Full name is required.');
        return;
      }
      if (!phone.trim()) {
        setError(lang === 'id' ? 'Nomor handphone harus diisi.' : 'Phone number is required.');
        return;
      }
      if (!age.trim()) {
        setError(lang === 'id' ? 'Usia harus diisi.' : 'Age is required.');
        return;
      }
      setRegisterStep(2);
      return;
    }
    
    // Step 2 Submission
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      const role = (email === 'admin@mantara.com' || email === 'admin@email.com') ? 'admin' : 'user';
      const profileData = {
        name,
        email,
        phone,
        age: age || '30',
        role
      };
      
      // Save profile to Realtime Database
      await dbSet(dbRef(db, `users/${fbUser.uid}`), profileData);
      
      // Send Firebase verification email
      await sendEmailVerification(fbUser);
      
      // Logout immediately so they must verify
      await signOut(auth);
      
      setVerificationEmail(email);
      setVerificationSent(true);
      setResendCooldown(60);
      
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'id' ? 'Email sudah terdaftar.' : 'Email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError(lang === 'id' ? 'Kata sandi minimal 6 karakter.' : 'Password must be at least 6 characters.');
      } else {
        setError(lang === 'id' ? 'Registrasi gagal. Coba lagi.' : 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setResendCooldown(60);
      setError(lang === 'id' ? 'Link verifikasi baru telah dikirim!' : 'New verification link sent!');
    } catch (err) {
      console.error(err);
      setError(lang === 'id' ? 'Gagal mengirim ulang email verifikasi. Cek credentials Anda.' : 'Failed to resend verification email. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };



  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-6 bg-slate-50/65 border border-slate-100 p-2.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black transition-all duration-300 ${registerStep === 1 ? 'bg-primary text-white scale-110 shadow-md shadow-sky-100' : 'bg-slate-200 text-slate-650'}`}>1</span>
          <span className={`text-[10px] font-extrabold uppercase tracking-wide ${registerStep === 1 ? 'text-slate-800' : 'text-slate-400'}`}>
            {lang === 'id' ? 'Data Diri' : 'Personal Details'}
          </span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-200 mx-4"></div>
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black transition-all duration-300 ${registerStep === 2 ? 'bg-primary text-white scale-110 shadow-md shadow-sky-100' : 'bg-slate-200 text-slate-650'}`}>2</span>
          <span className={`text-[10px] font-extrabold uppercase tracking-wide ${registerStep === 2 ? 'text-slate-800' : 'text-slate-400'}`}>
            {lang === 'id' ? 'Akun Baru' : 'New Account'}
          </span>
        </div>
      </div>
    );
  };

  if (verificationSent) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50 animate-fade-in">
        {/* Left Column: Beautiful Thematic Image */}
        <div className="w-full lg:w-1/2 relative bg-primary min-h-[240px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-16 text-white overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
            style={{ backgroundImage: "url('/login_banner.png')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-950/70 to-primary/80 z-0"></div>

          <div className="relative z-10 flex items-center gap-2.5 cursor-pointer" onClick={onCancel}>
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white">MANTARA</h1>
          </div>

          <div className="relative z-10 max-w-md my-auto hidden lg:block text-left">
            <span className="text-[10px] font-extrabold bg-accent/90 text-white px-3 py-1 rounded-full uppercase tracking-widest">
              {lang === 'id' ? 'E-TICKET RESMI KALTARA' : 'OFFICIAL KALTARA E-TICKET'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mt-4 text-white drop-shadow-md">
              {lang === 'id' ? 'Verifikasi Akun Anda' : 'Verify Your Account'}
            </h2>
            <p className="text-sm text-slate-200/95 mt-3 font-medium leading-relaxed drop-shadow-sm">
              {lang === 'id' 
              ? 'Langkah terakhir sebelum memesan tiket speedboat dengan mudah dan aman.' 
              : 'Final step before easily and securely booking your speedboat tickets.'}
            </p>
          </div>

          <div className="relative z-10 hidden lg:flex items-center justify-between text-slate-350 text-[10px] font-bold tracking-wider uppercase">
            <span>© 2026 MANTARA SPEEDBOAT</span>
          </div>
        </div>

        {/* Right Column: Verification Sent Content */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 relative min-h-[calc(100vh-240px)] lg:min-h-screen">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sky-50 border border-sky-100 text-primary animate-pulse mb-4">
              <i className="fa-regular fa-paper-plane text-3xl"></i>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'id' ? 'Verifikasi Surel Dikirim!' : 'Verification Email Sent!'}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-550 leading-relaxed max-w-sm mx-auto">
              {lang === 'id' 
                ? `Kami telah mengirimkan tautan verifikasi ke surel:` 
                : `We have sent a verification link to the email:`}
              <strong className="block text-slate-800 text-sm mt-1 mb-2 font-black">{verificationEmail}</strong>
              {lang === 'id' 
                ? 'Silakan klik tautan di dalam surel tersebut untuk mengaktifkan akun Anda sebelum masuk.'
                : 'Please click the link inside the email to activate your account before logging in.'}
            </p>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 text-left shadow-sm">
                <i className="fa-solid fa-circle-exclamation text-sm"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setVerificationSent(false);
                  setIsRegister(false);
                  setRegisterStep(1);
                  setError('');
                }}
                className="w-full bg-primary hover:bg-sky-850 text-white py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm uppercase tracking-widest transition shadow-lg shadow-sky-100/60"
              >
                {lang === 'id' ? 'Ke Halaman Masuk' : 'Go to Sign In'}
              </button>

              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={handleResendVerification}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 
                  ? (lang === 'id' ? `Kirim Ulang dalam (${resendCooldown}s)` : `Resend in (${resendCooldown}s)`)
                  : (lang === 'id' ? 'Kirim Ulang Email Verifikasi' : 'Resend Verification Email')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50">
      {/* Left Column: Beautiful Thematic Image */}
      <div className="w-full lg:w-1/2 relative bg-primary min-h-[240px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-16 text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
          style={{ backgroundImage: "url('/login_banner.png')" }}
        ></div>
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-950/70 to-primary/80 z-0"></div>

        {/* Brand Logo & Name */}
        <div className="relative z-10 flex items-center gap-2.5 cursor-pointer" onClick={onCancel}>
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white">MANTARA</h1>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-md my-auto hidden lg:block text-left">
          <span className="text-[10px] font-extrabold bg-accent/90 text-white px-3 py-1 rounded-full uppercase tracking-widest">
            {lang === 'id' ? 'E-TICKET RESMI KALTARA' : 'OFFICIAL KALTARA E-TICKET'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mt-4 text-white drop-shadow-md">
            {lang === 'id' ? 'Kemudahan Tiket Speedboat di Tangan Anda' : 'Speedboat Ticketing Made Simple & Fast'}
          </h2>
          <p className="text-sm text-slate-200/95 mt-3 font-medium leading-relaxed drop-shadow-sm">
            {lang === 'id' 
              ? 'Hubungkan perjalanan Anda antar pulau Tarakan, Tanjung Selor, Nunukan, Malinau, dan Derawan dengan satu platform modern.'
              : 'Connect your travel between Tarakan, Tanjung Selor, Nunukan, Malinau, and Derawan with our modern digital platform.'}
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 hidden lg:flex items-center justify-between text-slate-350 text-[10px] font-bold tracking-wider uppercase">
          <span>© 2026 MANTARA SPEEDBOAT</span>
          <div className="flex gap-4 text-slate-300">
            <span>{lang === 'id' ? 'Bantuan' : 'Help'}</span>
            <span>{lang === 'id' ? 'Syarat & Ketentuan' : 'Terms & Conditions'}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Login/Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 relative min-h-[calc(100vh-240px)] lg:min-h-screen">
        {/* Header Controls inside Form Area */}
        <div className="absolute top-4 sm:top-8 right-6 left-6 flex justify-between items-center z-10">
          <button 
            onClick={onCancel}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-655 hover:text-slate-900 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <i className="fa-solid fa-arrow-left text-[10px]"></i>
            <span>{lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}</span>
          </button>

          {/* Language Selector */}
          <div className="flex bg-slate-200/50 p-0.5 rounded-xl border border-slate-200/50">
            <button onClick={() => setLang('id')} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-extrabold transition ${lang === 'id' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              ID
            </button>
            <button onClick={() => setLang('en')} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-extrabold transition ${lang === 'en' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              EN
            </button>
          </div>
        </div>

        <div className="w-full max-w-md space-y-6 sm:space-y-8 mt-4 lg:mt-0">
          <div className="text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isRegister ? (lang === 'id' ? 'Daftar Akun Baru' : 'Create New Account') : (lang === 'id' ? 'Selamat Datang Kembali' : 'Welcome Back')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-550 mt-1.5 font-medium">
              {isRegister ? (lang === 'id' ? 'Isi data diri untuk memulai pemesanan tiket Anda.' : 'Fill in details to start booking your tickets.') : (lang === 'id' ? 'Masuk untuk mengelola pesanan dan tiket Anda.' : 'Sign in to access your bookings and tickets.')}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 animate-bounce-short shadow-sm">
              <i className="fa-solid fa-circle-exclamation text-sm"></i>
              <span>{error}</span>
            </div>
          )}

          {isRegister ? (
            registerStep === 1 ? (
              <div key="register-step-1" className="space-y-4">
                {renderStepIndicator()}
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1.5 uppercase tracking-wider">{lang === 'id' ? 'Nama Lengkap' : 'Full Name'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      <i className="fa-regular fa-user"></i>
                    </span>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'id' ? 'Nama sesuai kartu identitas' : 'Name as on your ID card'}
                      className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-4 py-3.5 text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-850 font-medium transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1.5 uppercase tracking-wider">{lang === 'id' ? 'Nomor Handphone' : 'Phone Number'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      <i className="fa-solid fa-phone"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="Contoh: 08123456789"
                      className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-4 py-3.5 text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-855 font-medium transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1.5 uppercase tracking-wider">{lang === 'id' ? 'Usia (Tahun)' : 'Age (Years)'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      <i className="fa-regular fa-calendar-check"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={age}
                      onChange={handleAgeChange}
                      placeholder="Contoh: 28"
                      className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-4 py-3.5 text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-855 font-medium transition shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFirebaseRegister}
                  className="w-full bg-primary hover:bg-sky-850 text-white py-4 rounded-2xl font-extrabold text-xs sm:text-sm uppercase tracking-widest transition shadow-lg shadow-sky-100/60 mt-4 flex items-center justify-center gap-2 group"
                >
                  <span>{lang === 'id' ? 'Selanjutnya' : 'Next'}</span>
                  <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            ) : (
              <form key="register-step-2" onSubmit={handleFirebaseRegister} className="space-y-4 animate-fade-in">
                {renderStepIndicator()}
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1.5 uppercase tracking-wider">{lang === 'id' ? 'Surel (Email)' : 'Email'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      <i className="fa-regular fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-4 py-3.5 text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-850 font-medium transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1.5 uppercase tracking-wider">{lang === 'id' ? 'Kata Sandi' : 'Password'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-12 py-3.5 text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-850 font-medium transition shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 transition focus:outline-none"
                    >
                      {showRegisterPassword ? (
                        <i className="fa-solid fa-eye-slash"></i>
                      ) : (
                        <i className="fa-solid fa-eye"></i>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-sm"
                  >
                    {lang === 'id' ? 'Kembali' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-sky-850 text-white py-4 rounded-2xl font-extrabold text-xs sm:text-sm uppercase tracking-widest transition shadow-lg shadow-sky-100/60 disabled:bg-slate-350 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <i className="fa-solid fa-spinner animate-spin"></i>}
                    <span>{lang === 'id' ? 'Daftar Sekarang' : 'Register Now'}</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <form key="login" onSubmit={handleFirebaseLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-555 mb-1.5 uppercase tracking-wider">{lang === 'id' ? 'Email / Username' : 'Email / Username'}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <i className="fa-regular fa-user"></i>
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com / username"
                    className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-4 py-3.5 text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-850 font-medium transition shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-555 mb-1.5 uppercase tracking-wider">{lang === 'id' ? 'Kata Sandi' : 'Password'}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-12 py-3.5 text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-850 font-medium transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-700 transition focus:outline-none"
                  >
                    {showPassword ? (
                      <i className="fa-solid fa-eye-slash"></i>
                    ) : (
                      <i className="fa-solid fa-eye"></i>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-sky-850 text-white py-4 rounded-2xl font-extrabold text-xs sm:text-sm uppercase tracking-widest transition shadow-lg shadow-sky-100/60 mt-2 disabled:bg-slate-350 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <i className="fa-solid fa-spinner animate-spin"></i>}
                <span>{lang === 'id' ? 'Masuk Sekarang' : 'Sign In Now'}</span>
              </button>
            </form>
          )}

          {/* Google Login Button */}
          <div className="space-y-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                {lang === 'id' ? 'ATAU' : 'OR'}
              </span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.35 1 3.4 3.65 1.48 7.5l3.85 2.99C6.28 7.02 8.9 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.46-1.1 2.69-2.33 3.51l3.62 2.81c2.12-1.95 3.74-4.83 3.74-8.68z" />
                <path fill="#FBBC05" d="M5.33 14.51c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 6.94C.54 8.82 0 10.91 0 13.09s.54 4.27 1.48 6.15l3.85-2.73z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.62-2.81c-1 .67-2.28 1.07-4.34 1.07-3.1 0-5.72-1.98-6.67-4.96L1.48 16.1C3.4 19.94 7.35 23 12 23z" />
              </svg>
              <span>{lang === 'id' ? 'Masuk dengan Google' : 'Sign In with Google'}</span>
            </button>
          </div>

          {/* Toggle Login/Register */}
          <div className="text-center text-xs font-bold text-slate-550">
            {isRegister ? (
              <span>
                {lang === 'id' ? 'Sudah punya akun?' : 'Already have an account?'}{' '}
                <button onClick={() => { setIsRegister(false); setRegisterStep(1); setError(''); setShowPassword(false); setShowRegisterPassword(false); }} className="text-primary hover:underline ml-1">
                  {lang === 'id' ? 'Masuk' : 'Sign In'}
                </button>
              </span>
            ) : (
              <span>
                {lang === 'id' ? 'Belum punya akun?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsRegister(true); setRegisterStep(1); setError(''); setShowPassword(false); setShowRegisterPassword(false); }} className="text-primary hover:underline ml-1">
                  {lang === 'id' ? 'Daftar' : 'Sign Up'}
                </button>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
