import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { ProgressRing } from "@/components/ProgressRing";
import { StatCard } from "@/components/StatCard";
import { PlatformCard } from "@/components/PlatformCard";
import { TransactionForm } from "@/components/TransactionForm";
import { GoalForm } from "@/components/GoalForm";
import { formatCurrency, formatCurrencyInteger } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Car, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { userProfile, dashboardStats, transactions, fetchDashboardData } = useAppContext();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Adicionar log para debug dos valores do dashboard
  useEffect(() => {
    console.log('Dashboard Stats:', dashboardStats);
  }, [dashboardStats]);
  
  // Atualizar dashboard sempre que o perfil do usuário mudar
  useEffect(() => {
    fetchDashboardData();
  }, [userProfile.monthlyGoal, fetchDashboardData]);

  // Function to determine efficiency color based on value per km
  const getEfficiencyColor = (valuePerKm: number): string => {
    if (valuePerKm > 2.0) return "text-success";
    if (valuePerKm > 1.8) return "text-warning";
    return "text-danger";
  };

  // Helper function to calculate safe percentages
  const safePercentage = (value: number, total: number): number => {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Bem vindo, {userProfile.name}</h1>
      </header>

      {/* Meta em destaque */}
      <div className="mb-8 bg-card rounded-xl p-4 sm:p-6 border border-border relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0 w-full md:w-auto justify-center md:justify-start">
            <Target className="h-10 w-10 sm:h-12 sm:w-12 text-primary mr-3 sm:mr-4" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Sua Meta Mensal</h2>
              <div className="text-2xl sm:text-3xl font-bold text-primary mt-1">
                {formatCurrencyInteger(userProfile.monthlyGoal || 0)}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="text-center min-w-[80px]">
              <div className="text-sm sm:text-lg text-muted-foreground">Progresso</div>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {dashboardStats.goalProgress.toFixed(0)}%
              </div>
            </div>
            
            <div className="text-center min-w-[80px]">
              <div className="text-sm sm:text-lg text-muted-foreground">Ganhos Atuais</div>
              <div className="text-xl sm:text-2xl font-bold text-green-500">
                {formatCurrencyInteger(dashboardStats.realized)}
              </div>
            </div>
            
            <Button 
              onClick={() => setShowGoalForm(true)} 
              variant="outline"
              className="w-full sm:w-auto mt-2 md:mt-0"
            >
              {userProfile.monthlyGoal ? "Atualizar Meta" : "Definir Meta"}
            </Button>
          </div>
        </div>
        
        <div className="w-full bg-muted h-3 rounded-full mt-4">
          <div 
            className="bg-primary h-3 rounded-full" 
            style={{ width: `${Math.min(dashboardStats.goalProgress, 100)}%` }} 
          />
        </div>

        {userProfile.monthlyGoal > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Dias Restantes</div>
              <div className="text-lg font-bold">{dashboardStats.daysRemaining}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Valor Faltante</div>
              <div className="text-lg font-bold text-amber-500">
                {formatCurrencyInteger(dashboardStats.remainingAmount)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Meta Diária Necessária</div>
              <div className="text-lg font-bold text-emerald-500">
                {formatCurrencyInteger(dashboardStats.dailyGoalNeeded)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulário de definição de meta */}
      {showGoalForm && (
        <div className="mb-8">
          <GoalForm 
            onCancel={() => setShowGoalForm(false)}
            currentGoal={userProfile.monthlyGoal} 
          />
        </div>
      )}

      {/* Main statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="stat-card flex flex-col justify-center items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">PLANEJADO</h3>
          <ProgressRing 
            progress={100} 
            color="hsl(var(--primary))" 
            size={100} 
            strokeWidth={6}
            className="sm:hidden"
          >
            <div className="text-center">
              <div className="text-base font-bold">{formatCurrencyInteger(dashboardStats.planned)}</div>
            </div>
          </ProgressRing>
          <ProgressRing 
            progress={100} 
            color="hsl(var(--primary))" 
            size={180} 
            strokeWidth={12}
            className="hidden sm:flex"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrencyInteger(dashboardStats.planned)}</div>
              <div className="text-sm text-muted-foreground">100%</div>
            </div>
          </ProgressRing>
        </div>

        <div className="stat-card flex flex-col justify-center items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">LÍQUIDO</h3>
          <ProgressRing 
            progress={Math.min(100, safePercentage(dashboardStats.netProfit, dashboardStats.realized))} 
            color="#22c55e" 
            size={100} 
            strokeWidth={6}
            className="sm:hidden"
          >
            <div className="text-center">
              <div className="text-base font-bold">{formatCurrencyInteger(dashboardStats.netProfit)}</div>
            </div>
          </ProgressRing>
          <ProgressRing 
            progress={Math.min(100, safePercentage(dashboardStats.netProfit, dashboardStats.realized))} 
            color="#22c55e" 
            size={180} 
            strokeWidth={12}
            className="hidden sm:flex"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrencyInteger(dashboardStats.netProfit)}</div>
              <div className="text-sm text-muted-foreground">
                {safePercentage(dashboardStats.netProfit, dashboardStats.realized).toFixed(0)}%
              </div>
            </div>
          </ProgressRing>
        </div>

        <div className="stat-card flex flex-col justify-center items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">Evolução Meta</h3>
          <ProgressRing 
            progress={dashboardStats.goalProgress} 
            color="#22c55e" 
            size={100} 
            strokeWidth={6}
            className="sm:hidden"
          >
            <div className="text-center">
              <div className="text-base font-bold">{dashboardStats.goalProgress.toFixed(0)}%</div>
            </div>
          </ProgressRing>
          <ProgressRing 
            progress={dashboardStats.goalProgress} 
            color="#22c55e" 
            size={180} 
            strokeWidth={12}
            className="hidden sm:flex"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{dashboardStats.goalProgress.toFixed(0)}%</div>
            </div>
          </ProgressRing>
        </div>

        <div className="stat-card flex flex-col justify-center items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">GANHOS</h3>
          <ProgressRing 
            progress={dashboardStats.goalProgress} 
            color="#22c55e" 
            size={100}
            strokeWidth={6}
            className="sm:hidden"
          >
            <div className="text-center">
              <div className="text-base font-bold">{formatCurrencyInteger(dashboardStats.realized)}</div>
            </div>
          </ProgressRing>
          <ProgressRing 
            progress={dashboardStats.goalProgress} 
            color="#22c55e" 
            size={180} 
            strokeWidth={12}
            className="hidden sm:flex"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrencyInteger(dashboardStats.realized)}</div>
              <div className="text-sm text-muted-foreground">{dashboardStats.goalProgress.toFixed(0)}%</div>
            </div>
          </ProgressRing>
        </div>

        <div className="stat-card flex flex-col justify-center items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">CUSTOS</h3>
          <ProgressRing 
            progress={safePercentage(dashboardStats.costs, dashboardStats.planned)} 
            color="#ef4444" 
            size={100} 
            strokeWidth={6}
            className="sm:hidden"
          >
            <div className="text-center">
              <div className="text-base font-bold">{formatCurrencyInteger(dashboardStats.costs)}</div>
            </div>
          </ProgressRing>
          <ProgressRing 
            progress={safePercentage(dashboardStats.costs, dashboardStats.planned)} 
            color="#ef4444" 
            size={180} 
            strokeWidth={12}
            className="hidden sm:flex"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrencyInteger(dashboardStats.costs)}</div>
              <div className="text-sm text-muted-foreground">
                {safePercentage(dashboardStats.costs, dashboardStats.planned).toFixed(0)}%
              </div>
            </div>
          </ProgressRing>
        </div>

        <div className="stat-card flex flex-col items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">RODAGEM</h3>
          <div className="mb-2 sm:mb-4">
            <Car className="h-8 w-8 sm:h-12 sm:w-12 text-orange-500 mb-1 sm:mb-2" />
            <div className="text-xl sm:text-2xl font-bold">{dashboardStats.kilometers || 0} KM</div>
          </div>
          <div className="flex items-center">
            <div 
              className={cn(
                "text-base sm:text-lg font-medium",
                getEfficiencyColor(dashboardStats.valuePerKm || 0)
              )}
            >
              {dashboardStats.valuePerKm ? `R$ ${dashboardStats.valuePerKm.toFixed(2)}/km` : "R$ 0.00/km"}
            </div>
            <div className="ml-2 w-16 sm:w-24 h-2 bg-gray-700 rounded-full">
              <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{
                width: `${Math.min(((dashboardStats.valuePerKm || 0) / 2.5) * 100, 100)}%`
              }}></div>
            </div>
          </div>
          <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            {dashboardStats.rides || 0} corridas
          </div>
        </div>

        <div className="stat-card flex flex-col justify-center items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">VALOR POR MINUTO</h3>
          <div className="text-2xl sm:text-4xl font-bold text-success">
            {formatCurrency(dashboardStats.valuePerMinute || 0)}
          </div>
          <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            {formatCurrency((dashboardStats.valuePerMinute || 0) * 60)}/hora
          </div>
        </div>

        <div className="stat-card flex flex-col justify-center items-center p-3 sm:p-4">
          <h3 className="stat-title mb-2 sm:mb-4 text-sm sm:text-base">VALOR POR HORA</h3>
          <div className="text-2xl sm:text-4xl font-bold text-success">
            {formatCurrency(dashboardStats.valuePerHour || 0)}
          </div>
        </div>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
      </div>

      {/* Platform breakdown */}
      <h2 className="text-xl font-bold mb-4">Corridas por Plataforma</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {dashboardStats.platformBreakdown.map((platform) => (
          <PlatformCard
            key={platform.platform}
            platform={platform.platform}
            rides={platform.rides}
            percentage={platform.percentage}
          />
        ))}
      </div>

      {/* Transaction Form */}
      {showTransactionForm ? (
        <div className="mb-8">
          <TransactionForm onCancel={() => setShowTransactionForm(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowTransactionForm(true)}
          className="flex items-center justify-center w-full p-4 bg-card rounded-xl border border-border hover:bg-accent transition-colors mb-8"
        >
          <Plus className="mr-2" />
          <span>Registrar Transação</span>
        </button>
      )}
    </div>
  );
}
