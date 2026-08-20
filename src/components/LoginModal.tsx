import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, Lock, Mail, User, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, addToast } = useApp();
  const { login, signUp, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('كلمتا المرور غير متطابقتين');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await login(email, password);
        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن الحساب غير موجود بعد. يمكنك إنشاء حساب جديد من تبويب "حساب جديد".');
          } else {
            setErrorMsg(error.message || 'بيانات الدخول غير صحيحة');
          }
        } else {
          addToast('تم تسجيل الدخول بنجاح 👋', 'success');
          setIsLoginModalOpen(false);
        }
      } else {
        const { error, data } = await signUp(email, password, name);
        if (error) {
          if (error.message.toLowerCase().includes('rate limit')) {
            setErrorMsg('تم تجاوز الحد المسموح لإرسال رسائل التأكيد عبر البريد في Supabase. يرجى إيقاف "Confirm email" من إعدادات Authentication في لوحة Supabase لإتاحة تسجيل المستخدمين فورياً دون الحاجة لإرسال رسائل بريد.');
          } else if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
            setErrorMsg('هذا البريد الإلكتروني مسجل مسبقاً. يرجى التبديل لتبويب "تسجيل الدخول".');
          } else {
            setErrorMsg(error.message || 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً');
          }
        } else {
          if (data?.session) {
            addToast('تم إنشاء الحساب وتسجيل الدخول بنجاح 🎉', 'success');
            setIsLoginModalOpen(false);
          } else {
            setSuccessMsg('تم إنشاء الحساب بنجاح! إذا كان تأكيد البريد مفعلاً في Supabase يرجى تفقد بريدك لتأكيد الحساب، أو يمكنك تسجيل الدخول الآن.');
            setMode('signin');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-md bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {mode === 'signin' ? 'تسجيل الدخول إلى حسابك' : 'إنشاء حساب مستخدم جديد'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'signin' ? 'الوصول إلى مكتبة برومبتاتك الخاصة' : 'خصص مساحتك المستقلة لحفظ البرومبتات'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-5">
          <div className="flex p-1 rounded-2xl bg-surface-100 border border-surface-border">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name field (for Signup) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">الاسم أو اللقب</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-100 border border-surface-border rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-100 border border-surface-border rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-100 border border-surface-border rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Confirm Password (for Signup) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-100 border border-surface-border rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all mt-2 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التنفيذ...</span>
              </>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>إنشاء الحساب والمتابعة</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 pt-1">
            {mode === 'signin' ? (
              <>
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-purple-400 hover:underline font-semibold"
                >
                  أنشئ حساباً جديداً
                </button>
              </>
            ) : (
              <>
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-purple-400 hover:underline font-semibold"
                >
                  سجل دخولك هنا
                </button>
              </>
            )}
          </p>

        </form>

      </div>

    </div>
  );
};
