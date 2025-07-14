'use client';

import { useState, useEffect } from 'react';
import { Event, CreateEventData, UpdateEventData } from '@/types';
import { format } from 'date-fns';
import { XMarkIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

/**
 * Props do componente EventForm
 */
interface EventFormProps {
  /** Evento para edição (undefined para criação) */
  event?: Event;
  /** Se o modal está aberto */
  isOpen: boolean;
  /** Callback para fechar o modal */
  onClose: () => void;
  /** Callback para submeter o formulário */
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>;
  /** Se está carregando */
  loading?: boolean;
}

/**
 * Componente de formulário para criação e edição de eventos
 */
export function EventForm({ event, isOpen, onClose, onSubmit, loading = false }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preencher formulário quando evento for fornecido (modo edição)
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        startDate: formatDateForInput(event.startDate),
        endDate: event.endDate ? formatDateForInput(event.endDate) : '',
      });
    } else {
      // Limpar formulário para novo evento
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
      });
    }
    setErrors({});
  }, [event, isOpen]);

  /**
   * Formata data para input datetime-local
   */
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  /**
   * Valida os dados do formulário
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Nome é obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do evento é obrigatório';
    }

    // Data de início é obrigatória
    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    // Validar que data de fim é posterior à data de início
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        newErrors.endDate = 'Data de fim deve ser posterior à data de início';
      }
    }

    // Validar que a data não é no passado (apenas para novos eventos)
    if (!event && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const now = new Date();

      if (startDate < now) {
        newErrors.startDate = 'Data de início não pode ser no passado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Manipula mudanças nos campos do formulário
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Manipula submissão do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {event ? 'Editar Evento' : 'Novo Evento'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 transition-colors"
              disabled={loading}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do evento */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nome do evento *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Draft de Calouros 2024"
                disabled={loading}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Descrição
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descreva os detalhes do evento..."
                disabled={loading}
              />
            </div>

            {/* Data de início */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Data e hora de início *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="startDate"
                  value={formData.startDate}
                  onChange={e => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                  required
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
              )}
            </div>

            {/* Data de fim */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Data e hora de fim (opcional)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="endDate"
                  value={formData.endDate}
                  onChange={e => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading ? 'Salvando...' : event ? 'Atualizar' : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
