'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  TagIcon,
  IdentificationIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useLeagues } from '@/hooks/useLeagues';
import { DeadMoneyConfigForm } from '@/components/leagues/DeadMoneyConfigForm';
import { SeasonTurnoverManager } from '@/components/leagues/SeasonTurnoverManager';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_DEAD_MONEY_CONFIG } from '@/types';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Página de configurações avançadas da liga
 */
export default function LeagueSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const leagueId = params.leagueId as string;

  const { leagues, loading: leaguesLoading } = useLeagues();

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    sleeperLeagueId: '',
    salaryCap: 0,
    maxFranchiseTags: 0,
    annualIncreasePercentage: 0,
    minimumSalary: 0,
    seasonTurnoverDate: '',
    deadMoneyConfig: DEFAULT_DEAD_MONEY_CONFIG,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Encontrar a liga atual
  const league = leagues.find(l => l.id === leagueId);

  // Lógica de permissão simplificada
  const canEdit = true;

  const validationSchema = useMemo(
    () =>
      z.object({
        salaryCap: z.coerce.number().min(1, 'O Salary Cap deve ser positivo.'),
        maxFranchiseTags: z.coerce
          .number()
          .min(0, 'Máximo de Franchise Tags deve ser não negativo.'),
        minimumSalary: z.coerce.number().min(0, 'Salário mínimo deve ser não negativo.'),
        annualIncreasePercentage: z.coerce.number().min(0, 'Aumento anual deve ser não negativo.'),
        seasonTurnoverDate: z
          .string()
          .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Data no formato MM-DD (ex: 04-01)'),
        sleeperLeagueId: z.string().optional(),
      }),
    [],
  );

  const initialValues = useMemo(() => {
    if (!league) return formData;

    let deadMoneyConfig = DEFAULT_DEAD_MONEY_CONFIG;
    if (league.deadMoneyConfig) {
      try {
        deadMoneyConfig =
          typeof league.deadMoneyConfig === 'string'
            ? JSON.parse(league.deadMoneyConfig)
            : league.deadMoneyConfig;
      } catch (e) {
        console.error('Erro ao parsear deadMoneyConfig', e);
      }
    }

    return {
      sleeperLeagueId: league.sleeperLeagueId || '',

      salaryCap: league.salaryCap || 0,
      maxFranchiseTags: league.maxFranchiseTags || 0,
      annualIncreasePercentage: league.annualIncreasePercentage || 0,
      minimumSalary: league.minimumSalary || 0,
      seasonTurnoverDate: league.seasonTurnoverDate || '',
      deadMoneyConfig,
    };
  }, [league]);

  useEffect(() => {
    if (league) {
      setFormData(initialValues);
      setErrors({});
    }
  }, [initialValues, league]);

  const isDirty = useMemo(() => {
    return (
      formData.sleeperLeagueId !== initialValues.sleeperLeagueId ||
      formData.salaryCap !== initialValues.salaryCap ||
      formData.maxFranchiseTags !== initialValues.maxFranchiseTags ||
      formData.annualIncreasePercentage !== initialValues.annualIncreasePercentage ||
      formData.minimumSalary !== initialValues.minimumSalary ||
      formData.seasonTurnoverDate !== initialValues.seasonTurnoverDate ||
      JSON.stringify(formData.deadMoneyConfig) !== JSON.stringify(initialValues.deadMoneyConfig)
    );
  }, [formData, initialValues]);

  const validateField = (key: keyof typeof formData, value: any) => {
    // Skip validation for deadMoneyConfig object
    if (key === 'deadMoneyConfig') return true;

    const candidate = { ...formData, [key]: value };
    try {
      validationSchema.parse(candidate);
      setErrors(prev => ({ ...prev, [key]: '' }));
      return true;
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const fieldErr = e.errors.find(err => String(err.path[0]) === key);
        setErrors(prev => ({ ...prev, [key]: fieldErr?.message || '' }));
      }
      return false;
    }
  };

  const updateField = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    validateField(key, value);
  };

  const handleSave = async () => {
    try {
      validationSchema.parse(formData);
    } catch (e) {
      addToast({ message: 'Verifique os campos inválidos', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/leagues/${leagueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleeperLeagueId: formData.sleeperLeagueId,
          salaryCap: formData.salaryCap,
          maxFranchiseTags: formData.maxFranchiseTags,
          minimumSalary: formData.minimumSalary,
          annualIncreasePercentage: formData.annualIncreasePercentage,
          seasonTurnoverDate: formData.seasonTurnoverDate,
          deadMoneyConfig: formData.deadMoneyConfig,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        addToast({
          message: 'Configurações atualizadas com sucesso!',
          type: 'success',
        });
        window.location.reload();
      } else {
        addToast({
          message: data.error || 'Erro ao atualizar configurações',
          type: 'error',
        });
      }
    } catch (err) {
      addToast({ message: 'Erro inesperado ao salvar', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (leaguesLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-lg font-medium text-muted-foreground">
          Carregando configurações...
        </span>
      </div>
    );
  }

  // Liga não encontrada
  if (!league) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Liga não encontrada</h1>
        <p className="text-muted-foreground">
          A liga solicitada não foi encontrada ou você não tem acesso a ela.
        </p>
        <Button onClick={() => router.push('/leagues')}>Voltar às Ligas</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header - Matches History Page Style */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Configurações da Liga</h1>
        <p className="text-muted-foreground">Gerencie regras, finanças e virada de temporada.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400"
          >
            Configurações Gerais
          </TabsTrigger>
          <TabsTrigger
            value="season-turnover"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400"
          >
            Virada de Temporada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-0 animate-in fade-in-50 duration-500">
          {/* Main Config Card */}
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <IdentificationIcon className="h-5 w-5 text-blue-500" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Nome da Liga
                </label>
                <div className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-sm">
                  {league.name}
                </div>
                <p className="mt-1 text-xs text-slate-500">Nome importado do Sleeper</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  ID Sleeper
                </label>
                <input
                  type="text"
                  value={formData.sleeperLeagueId || ''}
                  onChange={e => updateField('sleeperLeagueId', e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.sleeperLeagueId
                      ? 'border-red-500/50 focus:ring-red-500'
                      : 'border-slate-700'
                  }`}
                  placeholder="Ex: 123456789012345678"
                />
                {errors.sleeperLeagueId && (
                  <p className="mt-1 text-xs text-red-400">{errors.sleeperLeagueId}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Finance Card */}
            <Card className="border-slate-800 bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                  Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Salary Cap ($)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryCap}
                    onChange={e => updateField('salaryCap', parseInt(e.target.value) || 0)}
                    disabled={isSaving}
                    className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.salaryCap ? 'border-red-500/50' : 'border-slate-700'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Salário Mínimo
                    </label>
                    <input
                      type="number"
                      value={formData.minimumSalary}
                      onChange={e => updateField('minimumSalary', parseInt(e.target.value) || 0)}
                      disabled={isSaving}
                      className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors.minimumSalary ? 'border-red-500/50' : 'border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Aumento Anual (%)
                    </label>
                    <input
                      type="number"
                      value={formData.annualIncreasePercentage}
                      onChange={e =>
                        updateField('annualIncreasePercentage', parseFloat(e.target.value) || 0)
                      }
                      disabled={isSaving}
                      className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors.annualIncreasePercentage ? 'border-red-500/50' : 'border-slate-700'
                      }`}
                      step={0.1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rules Card */}
            <Card className="border-slate-800 bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-yellow-500" />
                  Regras & Prazos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Máximo de Franchise Tags
                  </label>
                  <input
                    type="number"
                    value={formData.maxFranchiseTags}
                    onChange={e => updateField('maxFranchiseTags', parseInt(e.target.value) || 0)}
                    disabled={isSaving}
                    className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.maxFranchiseTags ? 'border-red-500/50' : 'border-slate-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Data de Virada (MM-DD)
                  </label>
                  <div className="relative">
                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={formData.seasonTurnoverDate}
                      onChange={e => updateField('seasonTurnoverDate', e.target.value)}
                      disabled={isSaving}
                      className={`w-full pl-9 pr-3 py-2 bg-slate-800/50 border rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors.seasonTurnoverDate ? 'border-red-500/50' : 'border-slate-700'
                      }`}
                      placeholder="ex: 03-01"
                    />
                  </div>
                  {errors.seasonTurnoverDate && (
                    <p className="mt-1 text-xs text-red-400">{errors.seasonTurnoverDate}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dead Money Card */}
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-red-500" />
                Configuração de Dead Money
              </CardTitle>
              <CardDescription className="text-slate-400">
                Defina as penalidades para dispensa de jogadores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeadMoneyConfigForm
                config={formData.deadMoneyConfig}
                onChange={newConfig => updateField('deadMoneyConfig', newConfig)}
                disabled={isSaving}
                variant="clean"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setFormData(initialValues)}
              disabled={isSaving || !isDirty}
              className="text-slate-400 hover:text-slate-200"
            >
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !isDirty || Object.values(errors).some(v => v)}
              className="bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="season-turnover" className="mt-0 animate-in fade-in-50 duration-500">
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-100">
                Virada de Temporada
              </CardTitle>
              <CardDescription className="text-slate-400">
                Processo anual de atualização de contratos e virada de ano fiscal da liga.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SeasonTurnoverManager
                league={league}
                canEdit={true}
                onSuccess={() => {
                  addToast({
                    message: 'Dados atualizados após virada de temporada',
                    type: 'success',
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
