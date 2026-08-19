import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, Lock, Mail, Loader2, Sparkles } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, addToast } = useApp();
  const { login, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const { error } = await login(email, password);
      if (error) {
        setErrorMsg(error.message || 'بيانات الدخول غير صحيحة');
      } else {
        addToast('تم تسجيل الدخول بنجاح 👋', 'success');
        setIsLoginModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-md bg-surface-200 border border-surface-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-100/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-600/20 text-purple-300">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">تسجيل الدخول إلى الأرشيف</h3>
          </div>

          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center space-y-1 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0f172a] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-300" />
              </div>
            </div>
            <h4 className="text-base font-bold text-slate-100">مرحباً بك مجدداً</h4>
            <p className="text-xs text-slate-400">
              {isConfigured ? 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة' : 'وضع المعاينة المحلي (Local Mode)'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-100 border border-surface-border rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-100 border border-surface-border rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>دخول</span>
              </>
            )}
          </button>
        </form>

      </div>

    </div>
  );
};
