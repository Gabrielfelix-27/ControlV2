import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { DashboardStats, Transaction, UserProfile } from "@/types";
import { toast } from "@/components/ui/sonner";

interface AppContextType {
  userProfile: UserProfile;
  dashboardStats: DashboardStats;
  transactions: Transaction[];
  isLoading: boolean;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchDashboardData: () => Promise<void>;
}

const defaultDashboardStats: DashboardStats = {
  planned: 0,
  realized: 0,
  costs: 0,
  netProfit: 0,
  goalProgress: 0,
  kilometers: 0,
  rides: 0,
  valuePerKm: 0,
  valuePerHour: 0,
  valuePerMinute: 0,
  daysRemaining: 0,
  remainingAmount: 0,
  dailyGoalNeeded: 0,
  platformBreakdown: [
    { platform: "uber", rides: 0, percentage: 0 },
    { platform: "99", rides: 0, percentage: 0 },
    { platform: "indrive", rides: 0, percentage: 0 },
    { platform: "particular", rides: 0, percentage: 0 },
  ],
};

const defaultUserProfile: UserProfile = {
  id: "",
  name: "Usuário",
  email: "",
  monthlyGoal: 0,
};

// Chaves para o localStorage
const STORAGE_KEYS = {
  DASHBOARD_STATS: 'control-dashboard-stats',
  USER_PROFILE: 'control-user-profile',
  TRANSACTIONS: 'control-transactions'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    // Tenta recuperar do localStorage
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return savedProfile ? JSON.parse(savedProfile) : defaultUserProfile;
    } catch (e) {
      console.error('Erro ao recuperar perfil do localStorage:', e);
      return defaultUserProfile;
    }
  });
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(() => {
    // Tenta recuperar do localStorage
    try {
      const savedStats = localStorage.getItem(STORAGE_KEYS.DASHBOARD_STATS);
      return savedStats ? JSON.parse(savedStats) : defaultDashboardStats;
    } catch (e) {
      console.error('Erro ao recuperar estatísticas do localStorage:', e);
      return defaultDashboardStats;
    }
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    // Tenta recuperar do localStorage
    try {
      const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);
        // Converte as strings de data para objetos Date
        return parsedTransactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
      }
      return [];
    } catch (e) {
      console.error('Erro ao recuperar transações do localStorage:', e);
      return [];
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Persistir no localStorage quando os estados mudarem
  useEffect(() => {
    if (userProfile.id) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
      
      // Recalcular as estatísticas do dashboard quando a meta do usuário mudar
      if (transactions.length > 0) {
        const newStats = calculateDashboardStats(transactions);
        setDashboardStats(newStats);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(dashboardStats));
  }, [dashboardStats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    // Recalcular as estatísticas do dashboard quando as transações mudarem
    if (transactions.length > 0) {
      const newStats = calculateDashboardStats(transactions);
      setDashboardStats(newStats);
    }
  }, [transactions]);

  // Fetch user profile when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchTransactions();
      fetchDashboardData();
    } else {
      // Quando não tem usuário, reseta os dados para evitar mostrar dados de outro usuário
      setUserProfile(defaultUserProfile);
      setDashboardStats(defaultDashboardStats);
      setTransactions([]);
      
      // Limpa dados do localStorage
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.DASHBOARD_STATS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      console.log('Buscando perfil para o usuário:', user.id);
      
      // Primeiro, verifica se o perfil existe
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Se o erro for que o perfil não existe, tente criar um novo perfil
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando um novo perfil');
          
          const { data: newProfileData, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              name: user.email?.split('@')[0] || 'Usuário',
              email: user.email,
              monthly_goal: 0,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating user profile:', createError);
            return;
          }
          
          console.log('Novo perfil criado:', newProfileData);
          
          if (newProfileData) {
            const updatedProfile = {
              id: newProfileData.id,
              name: newProfileData.name || user.email?.split('@')[0] || 'Usuário',
              email: user.email || '',
              monthlyGoal: newProfileData.monthly_goal || 0,
            };
            
            // Inicializa o perfil com valores padrão
            setUserProfile(updatedProfile);
            
            // Zera as transações para um novo usuário
            setTransactions([]);
            
            // Inicializa estatísticas com valores zerados
            setDashboardStats(defaultDashboardStats);
            
            // Atualiza localStorage
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(defaultDashboardStats));
          }
          
          return;
        }
        
        return;
      }
      
      console.log('Perfil encontrado:', data);
      
      if (data) {
        const updatedProfile = {
          id: data.id,
          name: data.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          monthlyGoal: data.monthly_goal || 0,
        };
        setUserProfile(updatedProfile);
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      console.log('Buscando transações para o usuário:', user.id);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }
      
      console.log('Transações encontradas:', data?.length || 0);
      
      if (data) {
        const formattedTransactions: Transaction[] = data.map(item => ({
          id: item.id,
          date: new Date(item.date),
          amount: item.amount,
          type: item.type as 'income' | 'expense',
          description: item.description,
          platform: item.platform,
          platformRides: item.platform_rides ? JSON.parse(item.platform_rides) : undefined,
          rides: item.rides,
          kilometers: item.kilometers,
          hoursWorked: item.hours_worked,
          category: item.category,
        }));
        
        setTransactions(formattedTransactions);
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(formattedTransactions));
      }
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
    }
  };

  const calculateDashboardStats = (transactions: Transaction[]): DashboardStats => {
    // Filter transactions for the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    
    // Calculate income and expenses
    const incomeTransactions = monthTransactions.filter(t => t.type === 'income');
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');
    
    // Ensure we're adding up numeric values
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    
    // Calculate ride metrics
    const totalKilometers = incomeTransactions.reduce((sum, t) => sum + (Number(t.kilometers) || 0), 0);
    const totalRides = incomeTransactions.reduce((sum, t) => sum + (Number(t.rides) || 0), 0);
    const totalHours = incomeTransactions.reduce((sum, t) => sum + (Number(t.hoursWorked) || 0), 0);
    
    // Calculate value per km and per hour
    const valuePerKm = totalKilometers > 0 ? totalIncome / totalKilometers : 0;
    const valuePerHour = totalHours > 0 ? totalIncome / totalHours : 0;
    const valuePerMinute = totalHours > 0 ? totalIncome / (totalHours * 60) : 0;
    
    // Calculate goal progress
    const goalProgress = userProfile.monthlyGoal > 0 
      ? Math.min(100, (totalIncome / userProfile.monthlyGoal) * 100) 
      : 0;
    
    // Calcular dias restantes no mês atual
    const currentDate = new Date();
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - currentDate.getDate() + 1; // +1 para incluir o dia atual
    
    // Calcular valor restante para atingir a meta
    const remainingAmount = Math.max(0, userProfile.monthlyGoal - totalIncome);
    
    // Calcular meta diária necessária
    const dailyGoalNeeded = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;
    
    // Calculate platform breakdown
    const platformCounts: Record<string, number> = {};
    incomeTransactions.forEach(t => {
      if (t.platformRides && t.platformRides.length > 0) {
        // Se temos platformRides, usamos esses dados
        t.platformRides.forEach(pr => {
          platformCounts[pr.platform] = (platformCounts[pr.platform] || 0) + pr.rides;
        });
      } else if (t.platform) {
        // Caso contrário, continuamos com o comportamento anterior
        platformCounts[t.platform] = (platformCounts[t.platform] || 0) + (Number(t.rides) || 1);
      }
    });
    
    const totalPlatformRides = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);
    
    const platformBreakdown = Object.entries(platformCounts).map(([platform, rides]) => ({
      platform,
      rides,
      percentage: totalPlatformRides > 0 ? Math.round((rides / totalPlatformRides) * 100) : 0
    }));
    
    // Add default platforms if missing
    const defaultPlatforms = ['uber', '99', 'indrive', 'particular'];
    defaultPlatforms.forEach(platform => {
      if (!platformBreakdown.some(p => p.platform === platform)) {
        platformBreakdown.push({ platform, rides: 0, percentage: 0 });
      }
    });
    
    console.log("Stats calculation:", {
      totalIncome,
      totalExpenses,
      netProfit,
      totalKilometers,
      totalRides,
      totalHours,
      valuePerKm,
      valuePerHour,
      valuePerMinute,
      goalProgress,
      daysRemaining,
      remainingAmount,
      dailyGoalNeeded
    });
    
    const stats = {
      planned: userProfile.monthlyGoal,
      realized: parseFloat(totalIncome.toFixed(2)),
      costs: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      goalProgress: parseFloat(goalProgress.toFixed(2)),
      kilometers: Math.round(totalKilometers),
      rides: totalRides,
      valuePerKm: parseFloat(valuePerKm.toFixed(2)),
      valuePerHour: parseFloat(valuePerHour.toFixed(2)),
      valuePerMinute: parseFloat(valuePerMinute.toFixed(2)),
      daysRemaining: daysRemaining,
      remainingAmount: parseFloat(remainingAmount.toFixed(2)),
      dailyGoalNeeded: parseFloat(dailyGoalNeeded.toFixed(2)),
      platformBreakdown,
    };
    
    // Salvar no localStorage
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(stats));
    
    return stats;
  };

  // Usar useCallback para evitar loops infinitos com o useEffect no Dashboard
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await fetchTransactions();
      // Dashboard stats são calculados a partir das transações mais recentes obtidas via fetchTransactions
      const stats = calculateDashboardStats(transactions);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Removida a dependência de transactions para evitar loops

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: profile.name,
          monthly_goal: profile.monthlyGoal,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        toast("Erro ao atualizar perfil", {
          description: error.message,
        });
        return;
      }
      
      const updatedProfile = { ...userProfile, ...profile };
      setUserProfile(updatedProfile);
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
      
      toast("Perfil atualizado", {
        description: "Suas informações foram atualizadas com sucesso."
      });
      
      // Não é mais necessário recalcular as estatísticas aqui,
      // pois isso será feito automaticamente pelo useEffect que monitora userProfile
    } catch (error: any) {
      console.error('Error in updateUserProfile:', error);
      toast("Erro ao atualizar perfil", {
        description: error.message,
      });
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!user) return;
    
    try {
      console.log('Adicionando transação:', transaction);
      console.log('ID do usuário:', user.id);
      
      // Garantir que todos os valores numéricos sejam convertidos corretamente
      const amount = Number(transaction.amount) || 0;
      const rides = transaction.rides ? Number(transaction.rides) : undefined;
      const kilometers = transaction.kilometers ? Number(transaction.kilometers) : undefined;
      const hoursWorked = transaction.hoursWorked ? Number(transaction.hoursWorked) : undefined;
      
      const now = new Date().toISOString();
      
      // Se temos platformRides, precisamos armazená-lo como JSON no banco de dados
      const platformRidesJson = transaction.platformRides 
        ? JSON.stringify(transaction.platformRides) 
        : null;
      
      const newTransaction = {
        user_id: user.id,
        type: transaction.type,
        amount: amount,
        date: transaction.date.toISOString(),
        description: transaction.description,
        platform: transaction.type === 'income' ? transaction.platform : null,
        platform_rides: platformRidesJson, // Novo campo
        category: transaction.type === 'expense' ? transaction.category : null,
        rides: rides,
        kilometers: kilometers,
        hours_worked: hoursWorked,
        created_at: now,
        updated_at: now
      };
      
      console.log('Transação a ser salva:', newTransaction);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransaction)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding transaction:', error);
        toast("Erro ao adicionar transação", {
          description: error.message,
        });
        return;
      }
      
      console.log('Transação salva com sucesso:', data);
      
      // Add the new transaction to the state
      const formattedTransaction: Transaction = {
        id: data.id,
        date: new Date(data.date),
        amount: data.amount,
        type: data.type,
        description: data.description,
        platform: data.platform,
        platformRides: data.platform_rides ? JSON.parse(data.platform_rides) : undefined,
        category: data.category,
        rides: data.rides,
        kilometers: data.kilometers,
        hoursWorked: data.hours_worked
      };
      
      const updatedTransactions = [formattedTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
      
      // Não é mais necessário recalcular as estatísticas aqui,
      // pois isso será feito automaticamente pelo useEffect que monitora transactions
      
      toast("Transação adicionada", {
        description: "Sua transação foi registrada com sucesso."
      });
    } catch (error: any) {
      console.error('Error in addTransaction:', error);
      toast("Erro ao adicionar transação", {
        description: error.message,
      });
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!user) return;
    
    try {
      console.log('Atualizando transação:', id, transaction);
      
      // Converter valores para o formato correto para o Supabase
      const updateData: any = {};
      
      if (transaction.amount !== undefined) {
        updateData.amount = Number(transaction.amount);
      }
      
      if (transaction.date !== undefined) {
        updateData.date = transaction.date instanceof Date 
          ? transaction.date.toISOString() 
          : new Date(transaction.date).toISOString();
      }
      
      if (transaction.description !== undefined) {
        updateData.description = transaction.description;
      }
      
      if (transaction.type !== undefined) {
        updateData.type = transaction.type;
      }
      
      if (transaction.type === 'income') {
        if (transaction.platform !== undefined) {
          updateData.platform = transaction.platform;
          updateData.category = null;
        }
        
        if (transaction.rides !== undefined) {
          updateData.rides = Number(transaction.rides);
        }
        
        if (transaction.kilometers !== undefined) {
          updateData.kilometers = Number(transaction.kilometers);
        }
        
        if (transaction.hoursWorked !== undefined) {
          updateData.hours_worked = Number(transaction.hoursWorked);
        }
      } else if (transaction.type === 'expense') {
        if (transaction.category !== undefined) {
          updateData.category = transaction.category;
          updateData.platform = null;
          updateData.rides = null;
          updateData.kilometers = null;
          updateData.hours_worked = null;
        }
      }
      
      // Agora que temos um trigger no banco de dados para atualizar automaticamente,
      // não precisamos definir explicitamente o updated_at
      // O campo será atualizado pelo trigger que criamos no banco de dados
      
      console.log('Dados a serem atualizados:', updateData);
      
      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error updating transaction:', error);
        toast("Erro ao atualizar transação", {
          description: error.message,
        });
        return;
      }
      
      // Atualiza o estado local
      const updatedTransactions = transactions.map(t => 
        t.id === id 
          ? { ...t, ...transaction }
          : t
      );
      
      setTransactions(updatedTransactions);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
      
      toast("Transação atualizada", {
        description: "Sua transação foi atualizada com sucesso."
      });
    } catch (error: any) {
      console.error('Error in updateTransaction:', error);
      toast("Erro ao atualizar transação", {
        description: error.message,
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    
    try {
      console.log('Excluindo transação:', id);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting transaction:', error);
        toast("Erro ao excluir transação", {
          description: error.message,
        });
        return;
      }
      
      // Atualiza o estado local removendo a transação
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
      
      // Recalcula imediatamente as estatísticas após a exclusão
      const newStats = calculateDashboardStats(updatedTransactions);
      setDashboardStats(newStats);
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(newStats));
      
      toast("Transação excluída", {
        description: "Sua transação foi excluída com sucesso."
      });
    } catch (error: any) {
      console.error('Error in deleteTransaction:', error);
      toast("Erro ao excluir transação", {
        description: error.message,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        userProfile,
        dashboardStats,
        transactions,
        isLoading,
        updateUserProfile,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        fetchDashboardData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
