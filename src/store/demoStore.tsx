import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useRef,
} from 'react';
import type { DemoAction, DemoState } from './demoReducer.ts';
import {
  clearState,
  createInitialState,
  demoReducer,
  loadState,
  nextId,
  saveState,
} from './demoReducer.ts';

/**
 * Wiring de React sobre demoReducer: provider, hook de acceso, cola de
 * toasts y el undo genérico.
 */

/* ------------------------------------------------------------------ */
/* Toasts                                                             */
/* ------------------------------------------------------------------ */

export type ToastTone = 'success' | 'info' | 'error';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  /** Acción opcional, se usa para "Deshacer". */
  action?: { label: string; run: () => void };
}

const TOAST_MS = 5000;

/* ------------------------------------------------------------------ */
/* Context                                                            */
/* ------------------------------------------------------------------ */

interface DemoContextValue {
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
  /** Despacha y ofrece "Deshacer" volviendo al estado previo. */
  dispatchUndoable: (action: DemoAction, message: string, tone?: ToastTone) => void;
  toasts: Toast[];
  showToast: (message: string, tone?: ToastTone, action?: Toast['action']) => void;
  dismissToast: (id: string) => void;
  resetDemo: () => void;
  /** true si localStorage no está disponible (ventana privada, etc.). */
  persistenceBlocked: boolean;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, null, () => loadState() ?? createInitialState());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [persistenceBlocked, setPersistenceBlocked] = useState(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Persistir en cada cambio.
  useEffect(() => {
    try {
      window.localStorage.setItem('geocartillas.probe', '1');
      window.localStorage.removeItem('geocartillas.probe');
      saveState(state);
    } catch {
      setPersistenceBlocked(true);
    }
  }, [state]);

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success', action?: Toast['action']) => {
      const id = nextId('toast');
      setToasts((prev) => [...prev.slice(-2), { id, message, tone, action }]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, TOAST_MS);
      timers.current.set(id, timer);
    },
    [],
  );

  // Limpiar los timers pendientes al desmontar.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  /**
   * Undo genérico: como el estado es un objeto serializable, alcanza con
   * guardar la referencia previa y despachar RESTORE. Sirve para cualquier
   * acción sin escribir un inverso por cada una.
   */
  const dispatchUndoable = useCallback(
    (action: DemoAction, message: string, tone: ToastTone = 'success') => {
      const snapshot = state;
      dispatch(action);
      showToast(message, tone, {
        label: 'Deshacer',
        run: () => dispatch({ type: 'RESTORE', state: snapshot }),
      });
    },
    [state, showToast],
  );

  const resetDemo = useCallback(() => {
    clearState();
    dispatch({ type: 'RESET_DEMO' });
    showToast('Demo reiniciada con los datos de ejemplo originales.', 'info');
  }, [showToast]);

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      dispatch,
      dispatchUndoable,
      toasts,
      showToast,
      dismissToast,
      resetDemo,
      persistenceBlocked,
    }),
    [state, dispatchUndoable, toasts, showToast, dismissToast, resetDemo, persistenceBlocked],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo debe usarse dentro de <DemoProvider>');
  return ctx;
}
