'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Props do componente ConfirmationModal
 */
interface ConfirmationModalProps {
  /** Se o modal está aberto */
  isOpen: boolean;
  /** Função para fechar o modal */
  onClose: () => void;
  /** Função chamada quando confirma a ação */
  onConfirm: () => void;
  /** Título do modal */
  title: string;
  /** Mensagem de confirmação */
  message: string;
  /** Texto do botão de confirmação (padrão: "Confirmar") */
  confirmText?: string;
  /** Texto do botão de cancelamento (padrão: "Cancelar") */
  cancelText?: string;
  /** Tipo de ação (determina a cor do botão) */
  type?: 'danger' | 'warning' | 'info';
  /** Se está processando a ação */
  loading?: boolean;
}

/**
 * Componente de modal de confirmação personalizado
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false,
}: ConfirmationModalProps) {
  /**
   * Retorna as classes CSS do botão de confirmação baseado no tipo
   */
  const getConfirmButtonClasses = () => {
    const baseClasses =
      'inline-flex justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    switch (type) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600`;
      case 'info':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600`;
      default:
        return `${baseClasses} bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600`;
    }
  };

  /**
   * Retorna as classes CSS do ícone baseado no tipo
   */
  const getIconClasses = () => {
    switch (type) {
      case 'danger':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  /**
   * Retorna as classes CSS do fundo do ícone baseado no tipo
   */
  const getIconBackgroundClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20';
      default:
        return 'bg-red-100 dark:bg-red-900/20';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${getIconBackgroundClasses()}`}
                    >
                      <ExclamationTriangleIcon
                        className={`h-6 w-6 ${getIconClasses()}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                      >
                        {title}
                      </Dialog.Title>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                </div>

                {/* Botões */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    onClick={onClose}
                    disabled={loading}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={getConfirmButtonClasses()}
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processando...
                      </div>
                    ) : (
                      confirmText
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
