import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { login, register, logout } from '../redux/slices/authSlice';

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async () => {
    try {
      if (mode === 'login') {
        await dispatch(login({ email: form.email, password: form.password })).unwrap();
        toast.success('Logged in!');
      } else {
        await dispatch(register(form)).unwrap();
        toast.success('Account created!');
      }
      navigate('/');
    } catch (e) {
      toast.error(e || 'Authentication failed');
    }
  };

  if (user) {
    return (
      <div className="p-6 flex flex-col items-center gap-6 pt-16">
        <div className="w-16 h-16 rounded-full bg-pitch-900 flex items-center justify-center text-2xl font-display text-accent">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div className="text-center">
          <div className="font-display text-xl text-white">{user.name}</div>
          <div className="text-sm text-gray-500 mt-1">{user.email}</div>
          {user.role === 'admin' && (
            <span className="text-xs bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded font-display tracking-wider mt-2 inline-block">ADMIN</span>
          )}
        </div>
        <button
          onClick={() => { dispatch(logout()); toast.success('Logged out'); }}
          className="bg-surface-3 border border-surface-4 text-gray-400 hover:text-white rounded-xl px-8 py-3 font-display tracking-wider text-sm transition-all"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-sm mx-auto flex flex-col gap-5 pt-10"
    >
      <div>
        <h1 className="font-display text-2xl text-accent">{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</h1>
        <p className="text-gray-500 text-sm mt-1">Access match history and shortcuts</p>
      </div>

      <div className="flex rounded-xl overflow-hidden border border-surface-4">
        {['login', 'register'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 text-sm font-display tracking-wider transition-all ${
              mode === m ? 'bg-pitch-900 text-accent' : 'bg-surface-3 text-gray-500 hover:text-gray-300'
            }`}
          >
            {m === 'login' ? 'LOGIN' : 'REGISTER'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {mode === 'register' && (
          <div>
            <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">Name</label>
            <input
              className="cricket-input"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
        )}
        <div>
          <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">Email</label>
          <input
            className="cricket-input"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">Password</label>
          <input
            className="cricket-input"
            type="password"
            placeholder="••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-pitch-700 hover:bg-pitch-600 disabled:opacity-50 text-white font-display tracking-widest text-sm py-3.5 rounded-xl transition-all"
      >
        {loading ? 'Please wait…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
      </button>
    </motion.div>
  );
}
