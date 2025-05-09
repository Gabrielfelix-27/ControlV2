'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAccessCheck from '@/hooks/useAccessCheck';

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/pagamento',
  loadingComponent = null
}) {
  const { hasAccess, isLoading, error, user } = useAccessCheck({
    redirectTo,
    loadingComponent
  });

  // Exibir o componente de carregamento enquanto verificamos o acesso
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Se ocorrer um erro, exibir mensagem de erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md max-w-md">
          <h2 className="text-lg font-semibold mb-2">Erro ao verificar acesso</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Se o usuário não estiver autenticado (useAccessCheck já lida com o redirecionamento)
  // Ou se não tiver acesso
  if (!user || !hasAccess) {
    return null;
  }

  // Se tiver acesso, renderizar os filhos
  return children;
} 