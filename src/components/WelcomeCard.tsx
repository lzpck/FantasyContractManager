'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Users, Trophy, DollarSign, TrendingUp } from 'lucide-react';

export function WelcomeCard() {
  const { user } = useAuth();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Bem-vindo ao Fantasy Contract Manager
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {user?.name ? `Olá, ${user.name}!` : 'Gerencie seus contratos fantasy com facilidade'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-600">Times</p>
              <p className="text-2xl font-bold text-blue-900">-</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <Trophy className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">Ligas</p>
              <p className="text-2xl font-bold text-green-900">-</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Salary Cap</p>
              <p className="text-2xl font-bold text-yellow-900">$279M</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-600">Contratos</p>
              <p className="text-2xl font-bold text-purple-900">-</p>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>
            Gerencie contratos de jogadores, acompanhe o salary cap e tome decisões estratégicas 
            para suas ligas fantasy. Comece criando sua primeira liga!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
