'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { SeasonHistory } from '@/services/sleeperService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, Search, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeadToHeadMatrixProps {
  history: SeasonHistory[];
}

interface OwnerStats {
  ownerId: string;
  name: string;
  avatar?: string;
}

function TeamAvatar({
  avatar,
  teamName,
  size,
  className,
}: {
  avatar?: string;
  teamName: string;
  size: number;
  className?: string;
}) {
  const [src, setSrc] = useState(
    avatar
      ? `https://sleepercdn.com/avatars/thumbs/${avatar}`
      : 'https://sleepercdn.com/images/v2/icons/player_default.webp',
  );

  useEffect(() => {
    setSrc(
      avatar
        ? `https://sleepercdn.com/avatars/thumbs/${avatar}`
        : 'https://sleepercdn.com/images/v2/icons/player_default.webp',
    );
  }, [avatar]);

  return (
    <Image
      src={src}
      alt={teamName}
      width={size}
      height={size}
      className={cn('rounded-full bg-slate-800', className)}
      onError={() => {
        setSrc('https://sleepercdn.com/images/v2/icons/player_default.webp');
      }}
      unoptimized
    />
  );
}

interface TeamSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  owners: OwnerStats[];
  exclude?: string;
  align?: 'left' | 'right';
}

function TeamSelector({ label, value, onChange, owners, exclude }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOwner = owners.find(o => o.ownerId === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOwners = owners.filter(owner => {
    if (owner.ownerId === exclude) return false;
    if (!searchTerm) return true;
    return owner.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all duration-200 group',
          isOpen && 'ring-2 ring-blue-500/50 border-blue-500/50',
          !value && 'text-slate-400',
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedOwner ? (
            <>
              <TeamAvatar
                avatar={selectedOwner.avatar}
                teamName={selectedOwner.name}
                size={32}
                className="ring-2 ring-blue-500/20"
              />
              <span className="font-semibold text-slate-100 truncate">{selectedOwner.name}</span>
            </>
          ) : (
            <>
              <div className="h-8 w-8 rounded-full bg-slate-700/50 flex items-center justify-center">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <span className="text-slate-400">Selecione um time...</span>
            </>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-500 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar time..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent p-1">
            {filteredOwners.length > 0 ? (
              filteredOwners.map(owner => (
                <button
                  key={owner.ownerId}
                  onClick={() => {
                    onChange(owner.ownerId);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                    value === owner.ownerId
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-200 hover:bg-slate-700/50',
                  )}
                >
                  <TeamAvatar avatar={owner.avatar} teamName={owner.name} size={28} />
                  <span className="truncate text-sm font-medium">{owner.name}</span>
                  {value === owner.ownerId && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Nenhum time encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HeadToHeadMatrix({ history }: HeadToHeadMatrixProps) {
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');

  // 1. Extrair lista única de owners de todo o histórico
  const owners = useMemo(() => {
    const uniqueOwners = new Map<string, OwnerStats>();

    history.forEach(season => {
      season.standings.forEach(team => {
        if (!team.ownerId) return;
        if (!uniqueOwners.has(team.ownerId)) {
          const avatar =
            season.champion?.ownerId === team.ownerId ? season.champion.avatar : undefined;

          uniqueOwners.set(team.ownerId, {
            ownerId: team.ownerId,
            name: team.teamName,
            avatar,
          });
        }
      });
    });

    return Array.from(uniqueOwners.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [history]);

  // 2. Calcular histórico H2H quando times selecionados
  const comparison = useMemo(() => {
    if (!teamA || !teamB || teamA === teamB) return null;

    let winsA = 0;
    let winsB = 0;
    let pointsA = 0;
    let pointsB = 0;
    const games: {
      year: number;
      week: number;
      scoreA: number;
      scoreB: number;
      winner: string;
    }[] = [];

    history.forEach(season => {
      const rosterA = season.standings.find(s => s.ownerId === teamA)?.rosterId;
      const rosterB = season.standings.find(s => s.ownerId === teamB)?.rosterId;

      if (!rosterA || !rosterB || !season.matchups) return;

      Object.entries(season.matchups).forEach(([weekStr, weekMatchups]) => {
        const week = parseInt(weekStr);

        // Define o início dos playoffs (padrão semana 15 se não definido)
        const playoffStart = season.settings?.playoffWeekStart || 15;

        // Ignora playoffs e consolation (apenas temporada regular)
        if (week >= playoffStart) return;

        const matchA = weekMatchups.find(m => m.roster_id === rosterA);
        const matchB = weekMatchups.find(m => m.roster_id === rosterB);

        if (!matchA || !matchB) return;

        if (matchA.matchup_id === matchB.matchup_id) {
          const scoreTotalA = matchA.points;
          const scoreTotalB = matchB.points;

          pointsA += scoreTotalA;
          pointsB += scoreTotalB;

          if (scoreTotalA > scoreTotalB) winsA++;
          if (scoreTotalB > scoreTotalA) winsB++;

          games.push({
            year: season.year,
            week,
            scoreA: scoreTotalA,
            scoreB: scoreTotalB,
            winner: scoreTotalA > scoreTotalB ? 'A' : scoreTotalB > scoreTotalA ? 'B' : 'Tie',
          });
        }
      });
    });

    const sortedGames = games.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    return { winsA, winsB, pointsA, pointsB, games: sortedGames };
  }, [history, teamA, teamB]);

  const ownerA = owners.find(o => o.ownerId === teamA);
  const ownerB = owners.find(o => o.ownerId === teamB);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Selection Area */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 lg:p-8 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Team A Selector */}
          <div className="w-full relative z-20">
            <TeamSelector
              label="TIME A (CASA)"
              value={teamA}
              onChange={setTeamA}
              owners={owners}
              exclude={teamB}
            />
          </div>

          {/* VS Badge */}
          <div className="flex-shrink-0 relative z-10 flex items-center justify-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-lg shadow-black/50">
              <Swords className="w-6 h-6 md:w-8 md:h-8 text-slate-500" />
            </div>
            {/* Connecting lines for desktop */}
            <div className="absolute top-1/2 left-full w-6 md:w-12 h-px bg-slate-800 -z-10 hidden md:block" />
            <div className="absolute top-1/2 right-full w-6 md:w-12 h-px bg-slate-800 -z-10 hidden md:block" />
          </div>

          {/* Team B Selector */}
          <div className="w-full relative z-20">
            <TeamSelector
              label="TIME B (VISITANTE)"
              value={teamB}
              onChange={setTeamB}
              owners={owners}
              exclude={teamA}
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Comparison Result */}
      {comparison && ownerA && ownerB ? (
        <Card className="overflow-hidden border-slate-700 bg-slate-800 shadow-xl shadow-black/20">
          <CardHeader className="bg-gradient-to-b from-slate-700/50 to-slate-800/50 pb-12 pt-10 text-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-slate-700/[0.2] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24">
              {/* Owner A Big */}
              <div className="flex flex-col items-center group">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-blue-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative h-28 w-28 md:h-32 md:w-32 overflow-hidden rounded-full border-4 border-slate-600 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                    <TeamAvatar
                      avatar={ownerA.avatar}
                      teamName={ownerA.name}
                      size={128}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {comparison.winsA > comparison.winsB && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-yellow-400">
                      VENCEU
                    </div>
                  )}
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-100">{ownerA.name}</h2>
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-5xl font-black text-blue-400 tabular-nums">
                    {comparison.winsA}
                  </span>
                  <span className="text-xs font-bold tracking-widest text-blue-500/60 uppercase mt-1">
                    Vitórias
                  </span>
                </div>
              </div>

              {/* Stats Center */}
              <div className="flex flex-col items-center gap-4 py-4 md:py-0">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-4xl font-black text-slate-600">VS</span>
                  <span className="text-sm font-medium text-slate-500 rounded-full bg-slate-900/50 px-3 py-1 border border-slate-700">
                    {comparison.games.length} Jogos
                  </span>
                </div>
              </div>

              {/* Owner B Big */}
              <div className="flex flex-col items-center group">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-red-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
                  <div className="relative h-28 w-28 md:h-32 md:w-32 overflow-hidden rounded-full border-4 border-slate-600 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                    <TeamAvatar
                      avatar={ownerB.avatar}
                      teamName={ownerB.name}
                      size={128}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {comparison.winsB > comparison.winsA && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-yellow-400">
                      VENCEU
                    </div>
                  )}
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-100">{ownerB.name}</h2>
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-5xl font-black text-red-400 tabular-nums">
                    {comparison.winsB}
                  </span>
                  <span className="text-xs font-bold tracking-widest text-red-500/60 uppercase mt-1">
                    Vitórias
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 px-6 md:px-12 bg-slate-800">
            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-2 gap-px bg-slate-700/50 rounded-2xl overflow-hidden mb-10">
              <div className="bg-slate-800/80 p-6 flex flex-col items-center text-center">
                <span className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Pontuação Total
                </span>
                <span className="text-2xl md:text-3xl font-bold text-slate-200 tabular-nums">
                  {comparison.pointsA.toLocaleString('pt-BR', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
              </div>
              <div className="bg-slate-800/80 p-6 flex flex-col items-center text-center">
                <span className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Pontuação Total
                </span>
                <span className="text-2xl md:text-3xl font-bold text-slate-200 tabular-nums">
                  {comparison.pointsB.toLocaleString('pt-BR', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                  Histórico de Partidas
                </h4>
                <span className="text-xs text-slate-600">
                  Últimos {Math.min(comparison.games.length, 10)} jogos
                </span>
              </div>

              <div className="space-y-3">
                {comparison.games.slice(0, 10).map((game, idx) => {
                  const winnerA = game.winner === 'A';
                  const winnerB = game.winner === 'B';

                  return (
                    <div
                      key={`${game.year}-${game.week}`}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-slate-700/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                            {game.year}
                          </span>
                          <span className="text-xs text-slate-500">Semana {game.week}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
                        <div className="flex items-center gap-3 justify-end flex-1">
                          <span
                            className={cn(
                              'text-lg font-bold tabular-nums',
                              winnerA ? 'text-blue-400' : 'text-slate-500',
                            )}
                          >
                            {game.scoreA.toFixed(2)}
                          </span>
                          {winnerA && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>

                        <span className="text-slate-600 font-medium">-</span>

                        <div className="flex items-center gap-3 justify-start flex-1">
                          {winnerB && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          <span
                            className={cn(
                              'text-lg font-bold tabular-nums',
                              winnerB ? 'text-red-400' : 'text-slate-500',
                            )}
                          >
                            {game.scoreB.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-700/50 text-center">
              <p className="text-xs text-slate-500 italic">
                * Estatísticas baseadas exclusivamente em jogos da Temporada Regular. Playoffs e
                Consolation não são contabilizados.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Swords className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            Selecione dois times para comparar
          </h3>
          <p className="text-slate-500 max-w-sm">
            Escolha dois adversários acima para ver o histórico completo de confrontos, vitórias e
            estatísticas.
          </p>
        </div>
      )}
    </div>
  );
}
