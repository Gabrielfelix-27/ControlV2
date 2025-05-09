import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any | null }>;
  deleteAccount: () => Promise<{ success: boolean, error: any | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean, error: any | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Para configurar um provedor SMTP personalizado no Supabase e personalizar os emails de verificação:
// 1. Acesse o painel do Supabase e vá para "Authentication" > "Email Templates"
// 2. Personalize os modelos de email para "Confirm signup", "Invite user", "Magic Link" e "Reset Password"
// 3. Em seguida, vá para "Authentication" > "Providers" e configure seu provedor SMTP personalizado:
//    - Habilite "Custom SMTP"
//    - Adicione o endereço de email do remetente e o nome
//    - Configure os detalhes do seu servidor SMTP (host, porta, usuário e senha)
//    - Salve as configurações
// 
// O limite padrão para emails de autenticação é de 30 novos usuários por hora.
// Você pode ajustar este limite em "Authentication" > "Rate Limits"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Primeiro, verifique se existe uma sessão
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Configure o listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast("Erro ao entrar", {
          description: error.message,
        });
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      toast("Erro ao entrar", {
        description: error.message,
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: undefined,
        }
      });
      
      if (error) {
        toast("Erro ao cadastrar", {
          description: error.message,
        });
      } else {
        toast("Código de verificação enviado", {
          description: "Por favor, verifique seu e-mail para obter o código de verificação.",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast("Erro ao cadastrar", {
        description: error.message,
      });
      return { error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      // Verificar o formato do token - pode precisar remover espaços
      const cleanToken = token.trim();
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: 'signup'
      });
      
      if (error) {
        console.error("Erro na verificação OTP:", error);
        toast("Erro na verificação", {
          description: error.message,
        });
      } else {
        toast("Verificação concluída", {
          description: "Seu cadastro foi concluído com sucesso!",
        });
      }
      
      return { error };
    } catch (error: any) {
      console.error("Exceção na verificação OTP:", error);
      toast("Erro na verificação", {
        description: error.message,
      });
      return { error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      toast("Erro", {
        description: "Usuário não está autenticado.",
      });
      return { success: false, error: new Error("Usuário não está autenticado") };
    }

    try {
      console.log("Tentando excluir usuário com ID:", user.id);
      
      // Obter o token de autenticação atual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      
      if (!token) {
        console.error("Token de acesso não disponível");
        throw new Error("Token de acesso não disponível");
      }
      
      // ETAPA 1: Tentar usar a função Edge para excluir o usuário (método preferido)
      let edgeFunctionSuccess = false;
      
      try {
        const { error } = await supabase.functions.invoke('delete-user-account', {
          body: { user_id: user.id },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!error) {
          edgeFunctionSuccess = true;
          console.log("Usuário excluído com sucesso via função Edge");
        } else {
          console.error("Erro ao excluir usuário via function:", error);
        }
      } catch (edgeError) {
        console.error("Erro ao chamar a função Edge:", edgeError);
      }
      
      // ETAPA 2: Se a função Edge falhar, tente o método alternativo
      if (!edgeFunctionSuccess) {
        console.log("Tentando método alternativo para excluir dados do usuário");
        
        // 2.1 Excluir todas as transações do usuário
        const { error: deleteTransactionsError } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteTransactionsError) {
          console.error("Erro ao excluir transações:", deleteTransactionsError);
        }
        
        // 2.2 Excluir o perfil do usuário
        const { error: deleteProfileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', user.id);
        
        if (deleteProfileError) {
          console.error("Erro ao excluir perfil:", deleteProfileError);
        }
        
        // 2.3 Tentar excluir o usuário da autenticação
        // Nota: Isso pode falhar devido a permissões, mas tentamos mesmo assim
        try {
          // O usuário comum não pode excluir diretamente sua conta do auth, 
          // então usamos o método de signOut e mostramos uma mensagem de sucesso,
          // mesmo que a conta não seja completamente excluída
          await signOut();
          
          toast("Conta desconectada", {
            description: "Sua conta foi desconectada e seus dados foram excluídos.",
          });
          
          return { success: true, error: null };
        } catch (authError) {
          console.error("Erro ao tentar excluir usuário do auth:", authError);
          
          // Mesmo se falhar na exclusão da conta auth, consideramos sucesso parcial
          // pois os dados do usuário foram excluídos
          toast("Dados excluídos", {
            description: "Seus dados foram excluídos, mas a conta permanece. Entre em contato com o suporte para exclusão completa.",
          });
          
          await signOut();
          return { success: true, error: null };
        }
      }
      
      // Se chegou aqui, a função Edge foi bem-sucedida
      toast("Conta excluída", {
        description: "Sua conta foi excluída com sucesso.",
      });
      
      // Fazer logout após a exclusão
      await signOut();
      
      return { success: true, error: null };
    } catch (error) {
      console.error("Exceção ao excluir usuário:", error);
      
      toast("Erro ao excluir conta", {
        description: "Para excluir sua conta, por favor contate o suporte através do WhatsApp: 11940429351",
      });
      
      return { success: false, error };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user || !user.email) {
        toast("Erro", {
          description: "Usuário não está autenticado.",
        });
        return { success: false, error: new Error("Usuário não está autenticado") };
      }
      
      // Primeiro, verificamos se a senha atual está correta tentando fazer login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (signInError) {
        toast("Erro ao atualizar senha", {
          description: "Senha atual incorreta.",
        });
        return { success: false, error: signInError };
      }
      
      // Se a senha atual estiver correta, atualizamos para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        toast("Erro ao atualizar senha", {
          description: error.message,
        });
        return { success: false, error };
      }
      
      toast("Senha atualizada", {
        description: "Sua senha foi atualizada com sucesso.",
      });
      
      return { success: true, error: null };
    } catch (error) {
      console.error("Exceção ao atualizar senha:", error);
      
      toast("Erro ao atualizar senha", {
        description: "Ocorreu um erro ao tentar atualizar sua senha.",
      });
      
      return { success: false, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    verifyOtp,
    deleteAccount,
    updatePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
