/**
 * SENA LUXE - Admin Login View
 * Secure Firebase Authentication (Email / Password)
 * Server-verified administrative role access.
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const AdminLoginView: React.FC = () => {
  const { loginAdminWithEmail, setCurrentView } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await loginAdminWithEmail(email.trim(), password);
      if (res.success) {
        setCurrentView('admin_dashboard');
      } else {
        setErrorMsg(res.error || '管理者認証に失敗しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 animate-fade-in">
      <div className="rounded-xl bg-[#111216] border border-[#d4af37]/40 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.12)]">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-cinzel tracking-widest text-[#d4af37] uppercase">
            SENA LUXE MANAGEMENT ACCESS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white">管理者専用認証</h1>
          <p className="text-xs text-stone-400">
            Firebase Authenticationによる厳格な個別認証
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300">管理者メールアドレス</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sena-luxe.com"
                className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300">パスワード</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-stone-900/40 border border-stone-800/80 text-[11px] text-stone-400 leading-relaxed space-y-1">
            <div className="text-stone-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>管理者権限セキュリティ方針</span>
            </div>
            <p>
              一般利用者向けの自己登録機能は提供しておりません。管理者アカウントの追加・変更はFirebase Authenticationコンソールまたは統括管理者により安全に発行されます。
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password}
            className="w-full py-3 px-4 rounded-lg font-semibold text-xs sm:text-sm text-black bg-[#d4af37] hover:bg-[#e2bd4e] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>認証中...</span>
              </>
            ) : (
              <>
                <span>ログインしてダッシュボードを開く</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('top')}
            className="w-full text-xs text-stone-500 hover:text-stone-300 py-1 transition-colors text-center"
          >
            トップページへ戻る
          </button>
        </form>
      </div>
    </div>
  );
};
