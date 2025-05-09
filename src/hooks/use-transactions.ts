import { useAppContext } from "@/contexts/AppContext";

export function useTransactions() {
  const { transactions, addTransaction, updateTransaction, isLoading } = useAppContext();
  
  return {
    transactions,
    addTransaction,
    updateTransaction,
    isLoading
  };
} 