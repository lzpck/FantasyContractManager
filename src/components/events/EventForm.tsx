'use client';

import { useState, useEffect } from 'react';
import { Event, CreateEventData, UpdateEventData } from '@/types';
import { format } from 'date-fns';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-xl border border-slate-700 bg-slate-900 px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-100">
              {event ? 'Editar Evento' : 'Novo Evento'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do evento */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">
                Nome do evento *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg shadow-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.name ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder="Ex: Draft de Calouros 2024"
                disabled={loading}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                Descrição
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Descreva os detalhes do evento..."
                disabled={loading}
              />
            </div>

            {/* Data de início */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-400 mb-1">
                Data e hora de início *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="startDate"
                  value={formData.startDate}
                  onChange={e => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-800 border rounded-lg shadow-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:dark] ${
                    errors.startDate ? 'border-red-500' : 'border-slate-700'
                  }`}
                  disabled={loading}
                  required
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-slate-500 pointer-events-none" />
              </div>
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
            </div>

            {/* Data de fim */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-400 mb-1">
                Data e hora de fim (opcional)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="endDate"
                  value={formData.endDate}
                  onChange={e => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-800 border rounded-lg shadow-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:dark] ${
                    errors.endDate ? 'border-red-500' : 'border-slate-700'
                  }`}
                  disabled={loading}
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-slate-500 pointer-events-none" />
              </div>
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Salvando...' : event ? 'Atualizar' : 'Criar Evento'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
