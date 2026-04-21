import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateShortcuts, selectMatch } from '../redux/slices/matchSlice';

const SHORTCUT_KEYS = [
  { key: 'dot',    label: 'Dot Ball',  description: 'No run scored' },
  { key: 'single', label: 'Single',    description: '1 run' },
  { key: 'double', label: 'Double',    description: '2 runs' },
  { key: 'triple', label: 'Triple',    description: '3 runs' },
  { key: 'four',   label: 'Four',      description: 'Boundary 4' },
  { key: 'six',    label: 'Six',       description: 'Maximum 6' },
  { key: 'wicket', label: 'Wicket',    description: 'Bowled (default)' },
  { key: 'wide',   label: 'Wide',      description: 'Extra ball' },
  { key: 'noBall', label: 'No Ball',   description: 'Extra + free hit' },
];

export default function ShortcutsPage() {
  const dispatch = useDispatch();
  const { shortcutMap } = useSelector(selectMatch);
  const [local, setLocal] = useState({ ...shortcutMap });
  const [listening, setListening] = useState(null);

  const startListen = (key) => {
    setListening(key);
    const handler = (e) => {
      e.preventDefault();
      const k = e.key.toLowerCase();
      if (k === 'escape') { setListening(null); window.removeEventListener('keydown', handler); return; }
      if (k.length === 1) {
        setLocal((prev) => ({ ...prev, [key]: k }));
        setListening(null);
        window.removeEventListener('keydown', handler);
      }
    };
    window.addEventListener('keydown', handler);
  };

  const handleSave = () => {
    dispatch(updateShortcuts(local));
    try { localStorage.setItem('cricket_shortcuts', JSON.stringify(local)); } catch {}
    toast.success('Shortcuts saved!');
  };

  const handleReset = () => {
    const defaults = { dot: 'd', single: '1', double: '2', triple: '3', four: '4', six: '6', wicket: 'w', wide: 'x', noBall: 'n' };
    setLocal(defaults);
    dispatch(updateShortcuts(defaults));
    toast.success('Shortcuts reset to defaults');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 flex flex-col gap-5 pb-10 max-w-md mx-auto"
    >
      <div>
        <h1 className="font-display text-2xl text-accent">SHORTCUTS</h1>
        <p className="text-gray-500 text-sm mt-1">Click a key to remap it, then press any key</p>
      </div>

      <div className="cricket-card">
        {SHORTCUT_KEYS.map(({ key, label, description }, i) => (
          <div
            key={key}
            className={`flex items-center justify-between px-4 py-3 ${i < SHORTCUT_KEYS.length - 1 ? 'border-b border-surface-4' : ''}`}
          >
            <div>
              <div className="text-sm text-white font-medium">{label}</div>
              <div className="text-[11px] text-gray-600">{description}</div>
            </div>
            <button
              onClick={() => startListen(key)}
              className={`w-10 h-10 rounded-lg font-display text-base uppercase tracking-wider border transition-all ${
                listening === key
                  ? 'bg-pitch-800 border-pitch-400 text-accent animate-pulse'
                  : 'bg-surface-3 border-surface-4 text-gray-300 hover:border-pitch-600 hover:text-accent'
              }`}
            >
              {listening === key ? '…' : local[key]?.toUpperCase()}
            </button>
          </div>
        ))}
      </div>

      {listening && (
        <div className="text-center text-sm text-amber-400 animate-pulse font-display tracking-wider">
          Press any key to assign — ESC to cancel
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 bg-surface-3 border border-surface-4 text-gray-400 hover:text-white rounded-xl py-3 text-sm font-display tracking-wider transition-all"
        >
          Reset Defaults
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-pitch-700 hover:bg-pitch-600 text-white rounded-xl py-3 text-sm font-display tracking-wider transition-all"
        >
          Save Shortcuts
        </button>
      </div>

      <div className="cricket-card p-4">
        <div className="cricket-card-header -mx-4 -mt-4 mb-3 px-4 rounded-t-xl">CURRENT MAP</div>
        <div className="grid grid-cols-3 gap-2">
          {SHORTCUT_KEYS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center gap-1 bg-surface-3 rounded-lg p-2">
              <span className="font-display text-lg text-accent">{local[key]?.toUpperCase()}</span>
              <span className="text-[10px] text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
