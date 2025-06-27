/**
 * Componente de Toast para exibir mensagens de feedback
 */

import { useState, useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Aguardar animação
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles =
      'fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-300 z-50';

    if (!isVisible) {
      return `${baseStyles} transform translate-x-full opacity-0`;
    }

    return `${baseStyles} transform translate-x-0 opacity-100`;
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          borderColor: 'border-l-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
        };
      case 'error':
        return {
          icon: '❌',
          borderColor: 'border-l-red-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
        };
      case 'warning':
        return {
          icon: '⚠️',
          borderColor: 'border-l-yellow-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          borderColor: 'border-l-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
        };
    }
  };

  const { icon, borderColor, bgColor, textColor } = getIconAndColor();

  return (
    <div className={getToastStyles()}>
      <div className={`${bgColor} ${borderColor} border-l-4 p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{icon}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex ${textColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose?.(), 300);
              }}
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para gerenciar toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const addToast = (toast: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      ...toast,
      id,
      onClose: () => removeToast(id),
    };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  );

  return {
    addToast,
    removeToast,
    ToastContainer,
  };
}
