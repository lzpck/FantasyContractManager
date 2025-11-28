'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  MessageSquare,
  X,
  Send,
  User as UserIcon,
  Trash2,
  ChevronRight,
  Check,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React from 'react';

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  isHidden?: boolean;
};

type Player = {
  id: string;
  name: string;
  position: string;
  avatarUrl: string;
};

export function AgentChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'selection' | 'chat'>('selection');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [imageError, setImageError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch players on open
  useEffect(() => {
    if (isOpen && view === 'selection') {
      fetchPlayers();
    }
  }, [isOpen, view]);

  // Scroll to bottom
  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view, isOpen]);

  // Mark as read when opening chat
  useEffect(() => {
    if (isOpen && view === 'chat') {
      setUnreadCount(0);
    }
  }, [isOpen, view]);

  const fetchPlayers = async () => {
    setIsLoadingPlayers(true);
    try {
      const response = await fetch('/api/agent/my-players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async (content: string, isUser = true) => {
    const newMessage: Message = {
      role: isUser ? 'user' : 'assistant',
      content,
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);

    if (!isUser) {
      if (!isOpen) setUnreadCount(prev => prev + 1);
      return;
    }

    setIsLoading(true);

    // Prepare context for API
    const contextMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Add system context about the player if starting
    if (messages.length === 0 && selectedPlayer) {
      contextMessages.push({
        role: 'system',
        content: `O usuário quer negociar o contrato do jogador: ${selectedPlayer.name}.`,
      } as any);
    }

    contextMessages.push({ role: 'user', content });

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages }),
      });

      if (!response.ok) throw new Error('Falha na comunicação');

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content || 'Desculpe, não entendi.',
        timestamp: new Date(),
        status: 'read',
      };

      setMessages(prev =>
        prev
          .map(m => (m === newMessage ? { ...m, status: 'read' as const } : m))
          .concat(assistantMessage),
      );

      if (!isOpen) setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Erro no chat:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Desculpe, estou com problemas de conexão. Tente novamente.',
          timestamp: new Date(),
          status: 'read',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handlePlayerSelect = async (player: Player) => {
    setSelectedPlayer(player);
    setView('chat');

    // Send visible context message
    await sendMessage(`Olá, gostaria de negociar o contrato de ${player.name}.`, true);
  };

  const handleReset = () => {
    setMessages([]);
    setSelectedPlayer(null);
    setView('selection');
    setInputText('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[100]">
        {!isOpen && (
          <div className="relative">
            <Button
              onClick={() => setIsOpen(true)}
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-white/20"
            >
              <MessageSquare className="h-7 w-7" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[100] w-[90vw] max-w-[400px] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Card className="border-0 shadow-2xl flex flex-col h-[600px] max-h-[80vh] overflow-hidden rounded-2xl bg-[#efeae2] dark:bg-slate-950">
            {/* Header */}
            <div className="bg-emerald-700 p-3 flex flex-row items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="relative h-10 w-10 rounded-full border-2 border-white/20 overflow-hidden bg-emerald-800 flex items-center justify-center">
                    {!imageError ? (
                      <Image
                        src="/jordan-spencer.jpg"
                        alt="Jordan Spencer"
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        unoptimized
                      />
                    ) : (
                      <UserIcon className="h-6 w-6 text-emerald-100" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-emerald-700"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">Jordan Spencer</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {view === 'selection' ? 'Agente' : isLoading ? 'Digitando...' : 'Online'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {view === 'chat' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-100 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={handleReset}
                    title="Reiniciar negociação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-[#efeae2] dark:bg-slate-900 relative">
              {/* VIEW: SELECTION */}
              {view === 'selection' && (
                <div className="absolute inset-0 flex flex-col overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-slate-700">
                  <div className="mb-4 text-center">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Com quem vamos negociar?
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Selecione um jogador do seu time.
                    </p>
                  </div>

                  {isLoadingPlayers ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="h-16 bg-white/50 dark:bg-slate-800/50 animate-pulse rounded-xl"
                        />
                      ))}
                    </div>
                  ) : players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-slate-500">
                      <p>Você não tem jogadores elegíveis ou não possui um time ativo.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 pb-4">
                      {players.map(player => (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerSelect(player)}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-transparent hover:border-emerald-200 dark:hover:border-slate-600 rounded-xl transition-all duration-200 shadow-sm group text-left"
                        >
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                            <Image
                              src={player.avatarUrl}
                              alt={player.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {player.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {player.position}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: CHAT */}
              {view === 'chat' && (
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-slate-700">
                    {messages.filter(m => !m.isHidden).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 opacity-50">
                        <div className="animate-pulse">Iniciando negociação...</div>
                      </div>
                    ) : (
                      messages
                        .filter(m => !m.isHidden && (m.role === 'user' || m.role === 'assistant'))
                        .map((msg, index) => {
                          const parts = msg.content
                            .split('\n\n')
                            .filter(part => part.trim() !== '');

                          return (
                            <React.Fragment key={index}>
                              {parts.map((part, partIndex) => (
                                <div
                                  key={`${index}-${partIndex}`}
                                  className={cn(
                                    'flex w-full mb-1',
                                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'relative px-3 py-2 text-sm shadow-sm max-w-[85%]',
                                      msg.role === 'user'
                                        ? 'bg-[#d9fdd3] dark:bg-emerald-700 text-slate-900 dark:text-white rounded-lg rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg rounded-tl-none',
                                    )}
                                  >
                                    <div className="mr-2">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        urlTransform={value => {
                                          if (
                                            value.startsWith('data:') ||
                                            value.startsWith('blob:')
                                          ) {
                                            return value;
                                          }
                                          return value;
                                        }}
                                        components={{
                                          p: ({ node, ...props }) => (
                                            <p
                                              className="mb-1 last:mb-0 leading-relaxed"
                                              {...props}
                                            />
                                          ),
                                          strong: ({ node, ...props }) => (
                                            <strong className="font-bold" {...props} />
                                          ),
                                          b: ({ node, ...props }) => (
                                            <b className="font-bold" {...props} />
                                          ),
                                          ul: ({ node, ...props }) => (
                                            <ul
                                              className="list-disc pl-4 mb-2 space-y-1"
                                              {...props}
                                            />
                                          ),
                                          ol: ({ node, ...props }) => (
                                            <ol
                                              className="list-decimal pl-4 mb-2 space-y-1"
                                              {...props}
                                            />
                                          ),
                                          li: ({ node, ...props }) => (
                                            <li className="mb-0.5" {...props} />
                                          ),
                                          a: ({ node, ...props }) => {
                                            const isPdf =
                                              props.href?.startsWith('data:application/pdf');

                                            const handleClick = (e: React.MouseEvent) => {
                                              if (isPdf && props.href) {
                                                e.preventDefault();
                                                const link = document.createElement('a');
                                                link.href = props.href;
                                                link.download = 'Contrato_Fantasy.pdf';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                              }
                                            };

                                            return (
                                              <a
                                                className="text-blue-500 hover:underline break-all cursor-pointer"
                                                target={isPdf ? undefined : '_blank'}
                                                rel="noopener noreferrer"
                                                download={
                                                  isPdf ? 'Contrato_Fantasy.pdf' : undefined
                                                }
                                                onClick={handleClick}
                                                {...props}
                                              />
                                            );
                                          },
                                        }}
                                      >
                                        {part}
                                      </ReactMarkdown>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 mt-1 select-none">
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {formatTime(msg.timestamp)}
                                      </span>
                                      {msg.role === 'user' && (
                                        <span className="text-slate-500 dark:text-emerald-300">
                                          {msg.status === 'read' ? (
                                            <CheckCheck className="h-3 w-3 text-blue-500" />
                                          ) : msg.status === 'delivered' ? (
                                            <CheckCheck className="h-3 w-3" />
                                          ) : (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </React.Fragment>
                          );
                        })
                    )}

                    {isLoading && (
                      <div className="flex justify-start w-full animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-lg rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-2 bg-[#f0f2f5] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="flex w-full items-end gap-2">
                      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border-none shadow-sm flex items-center min-h-[44px] px-4 py-2">
                        <input
                          className="w-full bg-transparent border-none text-sm focus:outline-none placeholder:text-slate-400 text-slate-900 dark:text-white max-h-32 overflow-y-auto"
                          placeholder="Digite uma mensagem"
                          value={inputText}
                          onChange={e => setInputText(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !inputText.trim()}
                        className={cn(
                          'h-11 w-11 rounded-full shrink-0 transition-all duration-200 shadow-sm',
                          inputText.trim()
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400',
                        )}
                      >
                        <Send className="h-5 w-5 ml-0.5" />
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
