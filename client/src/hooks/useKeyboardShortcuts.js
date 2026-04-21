import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { recordRun, recordExtra, recordWicket, selectMatch } from '../redux/slices/matchSlice';

export const useKeyboardShortcuts = ({ onWicket, active = true }) => {
  const dispatch = useDispatch();
  const { shortcutMap, status } = useSelector(selectMatch);

  const handler = useCallback((e) => {
    if (!active || status !== 'live') return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    const k = e.key.toLowerCase();
    const map = shortcutMap;

    if (k === map.dot || k === '0') { dispatch(recordRun({ runs: 0 })); return; }
    if (k === map.single)  { dispatch(recordRun({ runs: 1 })); return; }
    if (k === map.double)  { dispatch(recordRun({ runs: 2 })); return; }
    if (k === map.triple)  { dispatch(recordRun({ runs: 3 })); return; }
    if (k === map.four)    { dispatch(recordRun({ runs: 4 })); return; }
    if (k === map.six)     { dispatch(recordRun({ runs: 6 })); return; }
    if (k === map.wicket)  { onWicket?.('Bowled'); return; }
    if (k === map.wide)    { dispatch(recordExtra({ type: 'wide' })); return; }
    if (k === map.noBall)  { dispatch(recordExtra({ type: 'noball' })); return; }
  }, [active, status, shortcutMap, dispatch, onWicket]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
};

export default useKeyboardShortcuts;
