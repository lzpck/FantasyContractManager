'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, League } from '../types';

export interface AppState {
  user: User | null;
  leagues: League[];
  currentLeague: League | null;
  loading: boolean;
  error: string | null;
}

// Tipos para as ações
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LEAGUES'; payload: League[] }
  | { type: 'ADD_LEAGUE'; payload: League }
  | { type: 'SET_CURRENT_LEAGUE'; payload: League | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialState: AppState = {
  user: null,
  leagues: [],
  currentLeague: null,
  loading: false,
  error: null,
};

// Reducer para gerenciar o estado
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LEAGUES':
      return { ...state, leagues: action.payload };
    case 'ADD_LEAGUE':
      return { ...state, leagues: [...state.leagues, action.payload] };
    case 'SET_CURRENT_LEAGUE':
      return { ...state, currentLeague: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Interface do contexto
interface AppContextType {
  state: AppState;
  setUser: (user: User | null) => void;
  setLeagues: (leagues: League[]) => void;
  addLeague: (league: League) => void;
  setCurrentLeague: (league: League | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Criação do contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider do contexto
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Funções para manipular o estado
  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const setLeagues = (leagues: League[]) => {
    dispatch({ type: 'SET_LEAGUES', payload: leagues });
  };

  const addLeague = (league: League) => {
    dispatch({ type: 'ADD_LEAGUE', payload: league });
  };

  const setCurrentLeague = (league: League | null) => {
    dispatch({ type: 'SET_CURRENT_LEAGUE', payload: league });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AppContextType = {
    state,
    setUser,
    setLeagues,
    addLeague,
    setCurrentLeague,
    setLoading,
    setError,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook customizado para consumir o contexto da aplicação
 *
 * @returns {AppContextType} Objeto contendo o estado global e funções para manipulá-lo
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, setUser, addLeague } = useAppContext();
 *
 *   return (
 *     <div>
 *       <p>Usuário: {state.user?.name || 'Não logado'}</p>
 *       <p>Ligas: {state.leagues.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }

  return context;
}
