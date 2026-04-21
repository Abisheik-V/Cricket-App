import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchHistory, deleteMatch } from '../redux/slices/historySlice';

export default function HistoryPage() {
  const dispatch = useDispatch();
  const { matches, loading } = useSelector((s) => s.history);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchHistory());
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (e.target.value.length > 1 || e.target.value === '') {
      dispatch(fetchHistory({ search: e.target.value }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteMatch(id)).unwrap();
      toast.success('Match deleted');
      setConfirmDelete(null);
    } catch {
      toast.error('Could not delete match');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 flex flex-col gap-4 pb-10"
    >
      <div>
        <h1 className="font-display text-2xl text-accent">MATCH HISTORY</h1>
        <p className="text-gray-500 text-sm mt-1">All completed matches</p>
      </div>

      <input
        className="cricket-input"
        placeholder="Search by team name…"
        value={search}
        onChange={handleSearch}
      />

      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1,2,3].map((i) => (
            <div key={i} className="h-20 bg-surface-3 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-4">🏏</div>
          <p className="font-display tracking-wider">No completed matches yet</p>
          <p className="text-sm mt-2">Complete a match to see it here</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {matches.map((m, i) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              className="cricket-card hover:border-pitch-700 transition-colors cursor-pointer"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-display text-base text-white flex items-center gap-2">
                      {m.teamA}
                      <span className="text-gray-600 text-sm font-body">vs</span>
                      {m.teamB}
                    </div>
                    {m.result && (
                      <div className="text-sm text-accent mt-1">{m.result}</div>
                    )}
                    <div className="text-xs text-gray-600 mt-1.5 flex gap-3">
                      <span>{m.totalOvers} overs</span>
                      <span>{new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(m._id)}
                    className="text-gray-700 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded hover:bg-red-950 flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Delete confirm inline */}
              <AnimatePresence>
                {confirmDelete === m._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-4 px-4 py-3 flex items-center gap-3"
                  >
                    <span className="text-xs text-gray-400 flex-1">Delete this match permanently?</span>
                    <button
                      onClick={() => handleDelete(m._id)}
                      className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
