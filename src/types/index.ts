// Transaction types
export type TransactionType = 'income' | 'expense';

export type Platform = 'uber' | '99' | 'indrive' | 'particular' | string;

export type ExpenseCategory = 
  | 'fuel' 
  | 'tolls' 
  | 'food' 
  | 'maintenance' 
  | 'car_wash'
  | 'insurance'
  | 'taxes'
  | 'other';

// Novo tipo para armazenar informações de plataforma e corridas
export interface PlatformRide {
  platform: Platform;
  rides: number;
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: TransactionType;
  description?: string;
  
  // For income transactions - campos atualizados
  // O campo platform ainda é mantido por compatibilidade com código existente
  platform?: Platform;
  platformRides?: PlatformRide[]; // Novo campo para múltiplas plataformas
  rides?: number; // Campo mantido por compatibilidade
  kilometers?: number;
  hoursWorked?: number;
  
  // For expense transactions
  category?: ExpenseCategory;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

// User profile and settings
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  monthlyGoal: number;
  licensePlate?: string;
}

// Dashboard statistics
export interface DashboardStats {
  planned: number;
  realized: number;
  costs: number;
  netProfit: number;
  goalProgress: number;
  kilometers: number;
  rides: number;
  valuePerKm: number;
  valuePerHour: number;
  valuePerMinute: number;
  // Informações complementares de meta
  daysRemaining: number;
  remainingAmount: number;
  dailyGoalNeeded: number;
  platformBreakdown: {
    platform: Platform;
    rides: number;
    percentage: number;
  }[];
}
