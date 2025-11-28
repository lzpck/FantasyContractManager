'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AgentContextType {
  isOpen: boolean;
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAgent = () => setIsOpen(true);
  const closeAgent = () => setIsOpen(false);
  const toggleAgent = () => setIsOpen(prev => !prev);

  return (
    <AgentContext.Provider value={{ isOpen, openAgent, closeAgent, toggleAgent, setIsOpen }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
