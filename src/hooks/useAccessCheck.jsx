'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function useAccessCheck({ redirectTo = '/pagamento', loadingComponent = null }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkUserAccess() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Verificar no Supabase se o usuário tem acesso
        const { data, error } = await supabase
          .from('profiles')
          .select('has_access, has_payment')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        // Se o usuário tem acesso, atualizar o estado
        if (data?.has_access) {
          setHasAccess(true);
        } else {
          // Se a página de redirecionamento foi fornecida, redirecionar
          if (redirectTo) {
            router.push(redirectTo);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar acesso:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (user !== undefined) {
      checkUserAccess();
    }
  }, [user, supabase, router, redirectTo]);

  return { hasAccess, isLoading, error, user };
} 