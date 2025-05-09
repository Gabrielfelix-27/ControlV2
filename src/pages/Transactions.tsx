import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionEditForm } from "@/components/TransactionEditForm";
import { formatCurrency } from "@/lib/utils";
import { Edit, Trash, Search, ArrowDownUp, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Transactions() {
  const { transactions, isLoading, deleteTransaction } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowAddForm(false);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    
    try {
      await deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingTransaction(null);
  };

  // Array com os nomes dos meses
  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Função para filtrar transações por mês e ano
  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    const transactionMonth = transactionDate.getMonth().toString();
    const transactionYear = transactionDate.getFullYear().toString();
    
    const matchesMonth = selectedMonth === "all" || transactionMonth === selectedMonth;
    const matchesYear = transactionYear === selectedYear;
    
    const matchesFilter =
      filter === "" || 
      transaction.description?.toLowerCase().includes(filter.toLowerCase()) ||
      transaction.platform?.toLowerCase().includes(filter.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(filter.toLowerCase());

    return matchesMonth && matchesYear && matchesFilter;
  });

  // Ordenar transações por data (mais recentes primeiro)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR");
  };

  const getTransactionTypeLabel = (type: "income" | "expense") => {
    return type === "income" ? "Ganho" : "Custo";
  };

  // Função para traduzir as categorias para português
  const getCategoryName = (category?: string) => {
    if (!category) return "";
    
    const categoryMap: Record<string, string> = {
      fuel: "Combustível",
      tolls: "Pedágios",
      food: "Alimentação",
      maintenance: "Manutenção",
      car_wash: "Lavagem",
      insurance: "Seguro",
      taxes: "Impostos",
      other: "Outros"
    };
    
    return categoryMap[category] || category;
  };

  const getTransactionDetails = (transaction: Transaction) => {
    if (transaction.type === "income") {
      return `${transaction.platform} ${
        transaction.rides ? `- ${transaction.rides} corrida(s)` : ""
      } ${
        transaction.kilometers ? `- ${transaction.kilometers} KM` : ""
      }`;
    } else {
      return getCategoryName(transaction.category);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Button 
          onClick={() => {
            setShowAddForm(true);
            setEditingTransaction(null);
          }}
          style={{ backgroundColor: "#e4ff00", color: "#000000" }}
          className="hover:bg-[#c3d900]"
        >
          Nova Transação
        </Button>
      </header>

      {showAddForm && (
        <div className="mb-8">
          <TransactionForm onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Modal para edição de transação */}
      <Dialog open={editingTransaction !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingTransaction(null);
        }
      }}>
        <DialogContent className="max-w-[95%] md:max-w-lg w-full p-0 bg-transparent border-0 shadow-none">
          {editingTransaction && (
            <TransactionEditForm 
              transaction={editingTransaction} 
              onCancel={() => setEditingTransaction(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={deletingTransaction !== null} onOpenChange={(open) => {
        if (!open) {
          setDeletingTransaction(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card rounded-xl border border-border p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar transações..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={selectedYear}
              onValueChange={(value) => setSelectedYear(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {[
                  new Date().getFullYear().toString(),
                  (new Date().getFullYear() + 1).toString()
                ].map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Carregando transações...</div>
        ) : sortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {filter || selectedMonth !== "all"
              ? "Nenhuma transação encontrada com os filtros aplicados."
              : "Nenhuma transação registrada ainda."}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 rounded-lg border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatDate(transaction.date)}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {transaction.description || getTransactionDetails(transaction)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.description
                      ? getTransactionDetails(transaction)
                      : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={`text-lg font-bold ${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(transaction)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => handleDeleteClick(transaction)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 