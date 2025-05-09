
import { 
  Transaction, 
  TransactionType, 
  Platform, 
  ExpenseCategory,
  UserProfile,
  DashboardStats
} from "@/types";

// Generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Get date for specified days ago
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Sample user profile
export const mockUserProfile: UserProfile = {
  id: "user1",
  name: "Gabriel Lima",
  email: "gabriel@example.com",
  monthlyGoal: 2000,
  licensePlate: "ABC1234"
};

// Sample transactions
export const mockTransactions: Transaction[] = [
  // Income transactions
  {
    id: generateId(),
    date: daysAgo(0),
    amount: 180,
    type: "income",
    platform: "uber",
    rides: 8,
    kilometers: 60,
    hoursWorked: 4
  },
  {
    id: generateId(),
    date: daysAgo(0),
    amount: 150,
    type: "income",
    platform: "indrive",
    rides: 5,
    kilometers: 45,
    hoursWorked: 3
  },
  {
    id: generateId(),
    date: daysAgo(1),
    amount: 200,
    type: "income",
    platform: "uber",
    rides: 10,
    kilometers: 75,
    hoursWorked: 5
  },
  {
    id: generateId(),
    date: daysAgo(1),
    amount: 90,
    type: "income",
    platform: "99",
    rides: 4,
    kilometers: 30,
    hoursWorked: 2
  },
  {
    id: generateId(),
    date: daysAgo(2),
    amount: 220,
    type: "income",
    platform: "uber",
    rides: 12,
    kilometers: 80,
    hoursWorked: 6
  },
  {
    id: generateId(),
    date: daysAgo(3),
    amount: 150,
    type: "income",
    platform: "particular",
    rides: 5,
    kilometers: 40,
    hoursWorked: 3
  },
  {
    id: generateId(),
    date: daysAgo(3),
    amount: 200,
    type: "income",
    platform: "indrive",
    rides: 10,
    kilometers: 70,
    hoursWorked: 5
  },
  
  // Expense transactions
  {
    id: generateId(),
    date: daysAgo(0),
    amount: 40,
    type: "expense",
    category: "fuel",
    description: "Abastecimento posto Shell"
  },
  {
    id: generateId(),
    date: daysAgo(1),
    amount: 15,
    type: "expense",
    category: "food",
    description: "Almoço"
  },
  {
    id: generateId(),
    date: daysAgo(2),
    amount: 20,
    type: "expense",
    category: "tolls",
    description: "Pedágio rodovia"
  },
  {
    id: generateId(),
    date: daysAgo(3),
    amount: 25,
    type: "expense",
    category: "car_wash",
    description: "Lavagem do veículo"
  }
];

// Calculate dashboard statistics from transactions
export function calculateDashboardStats(
  transactions: Transaction[], 
  monthlyGoal: number
): DashboardStats {
  // Filter transactions for current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });
  
  // Calculate income totals
  const incomeTransactions = currentMonthTransactions.filter(t => t.type === "income");
  const realized = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate expense totals
  const expenseTransactions = currentMonthTransactions.filter(t => t.type === "expense");
  const costs = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate net profit
  const netProfit = realized - costs;
  
  // Calculate goal progress
  const goalProgress = (realized / monthlyGoal) * 100;
  
  // Calculate total kilometers and rides
  const kilometers = incomeTransactions.reduce((sum, t) => sum + (t.kilometers || 0), 0);
  const rides = incomeTransactions.reduce((sum, t) => sum + (t.rides || 0), 0);
  
  // Calculate value per kilometer and value per hour
  const totalHoursWorked = incomeTransactions.reduce((sum, t) => sum + (t.hoursWorked || 0), 0);
  const valuePerKm = kilometers > 0 ? netProfit / kilometers : 0;
  const valuePerHour = totalHoursWorked > 0 ? netProfit / totalHoursWorked : 0;
  
  // Calculate platform breakdown
  const platformCounts: Record<string, { rides: number, amount: number }> = {};
  incomeTransactions.forEach(t => {
    if (!t.platform) return;
    
    if (!platformCounts[t.platform]) {
      platformCounts[t.platform] = { rides: 0, amount: 0 };
    }
    
    platformCounts[t.platform].rides += (t.rides || 0);
    platformCounts[t.platform].amount += t.amount;
  });
  
  const totalRides = rides;
  const platformBreakdown = Object.entries(platformCounts).map(([platform, data]) => ({
    platform: platform as Platform,
    rides: data.rides,
    percentage: totalRides > 0 ? (data.rides / totalRides) * 100 : 0
  }));
  
  return {
    planned: monthlyGoal,
    realized,
    costs,
    netProfit,
    goalProgress,
    kilometers,
    rides,
    valuePerKm,
    valuePerHour,
    platformBreakdown
  };
}

// Sample dashboard stats (pre-calculated)
export const mockDashboardStats: DashboardStats = {
  planned: 2000,
  realized: 1190,
  costs: 40,
  netProfit: 1150,
  goalProgress: 59.5,
  kilometers: 360,
  rides: 50,
  valuePerKm: 3.31,
  valuePerHour: 16.53,
  platformBreakdown: [
    { platform: "uber", rides: 30, percentage: 60 },
    { platform: "indrive", rides: 15, percentage: 30 },
    { platform: "particular", rides: 5, percentage: 10 }
  ]
};

// Helper function to get the expense category options
export function getExpenseCategories(): {value: ExpenseCategory, label: string}[] {
  return [
    { value: "fuel", label: "Combustível" },
    { value: "tolls", label: "Pedágios" },
    { value: "food", label: "Alimentação" },
    { value: "maintenance", label: "Manutenção" },
    { value: "car_wash", label: "Lavagem" },
    { value: "insurance", label: "Seguro" },
    { value: "taxes", label: "Impostos" },
    { value: "other", label: "Outros" },
  ];
}

// Helper function to get platform options
export function getPlatforms(): {value: Platform, label: string}[] {
  return [
    { value: "uber", label: "Uber" },
    { value: "99", label: "99" },
    { value: "indrive", label: "Indriver" },
    { value: "particular", label: "Particular" },
  ];
}
