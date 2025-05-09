import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/AppContext';
import { ExpenseCategory, Platform, Transaction } from '@/types';

interface TransactionEditFormProps {
  transaction: Transaction;
  onCancel: () => void;
}

type GanhoFormValues = {
  amount: number;
  date: string;
  description: string;
  platform: Platform;
  rides?: number;
  kilometers?: number;
  hoursWorked?: number;
};

type CustoFormValues = {
  amount: number;
  date: string;
  description: string;
  category: ExpenseCategory;
};

export function TransactionEditForm({ transaction, onCancel }: TransactionEditFormProps) {
  const { updateTransaction } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>(transaction.type === 'income' ? 'ganho' : 'custo');
  const [platform, setPlatform] = useState<Platform>(transaction.platform as Platform || 'uber');
  const [category, setCategory] = useState<ExpenseCategory>(transaction.category as ExpenseCategory || 'fuel');
  
  const ganhoForm = useForm<GanhoFormValues>({
    defaultValues: {
      amount: transaction.amount,
      date: transaction.date.toISOString().split('T')[0],
      description: transaction.description || '',
      platform: transaction.platform as Platform || 'uber',
      rides: transaction.rides,
      kilometers: transaction.kilometers,
      hoursWorked: transaction.hoursWorked
    }
  });

  const custoForm = useForm<CustoFormValues>({
    defaultValues: {
      amount: transaction.amount,
      date: transaction.date.toISOString().split('T')[0],
      description: transaction.description || '',
      category: transaction.category as ExpenseCategory || 'fuel'
    }
  });

  // Atualiza os valores ocultos quando as seleções mudam
  useEffect(() => {
    ganhoForm.setValue('platform', platform);
  }, [platform, ganhoForm.setValue]);

  useEffect(() => {
    custoForm.setValue('category', category);
  }, [category, custoForm.setValue]);

  const onSubmitGanho = async (data: GanhoFormValues) => {
    // Garantir que os valores corretos estão sendo enviados
    const amount = Number(data.amount) || 0;
    
    const formattedData = {
      ...data,
      type: 'income' as const,
      date: new Date(data.date),
      amount: amount,
      rides: data.rides ? Number(data.rides) : undefined,
      kilometers: data.kilometers ? Number(data.kilometers) : undefined,
      hoursWorked: data.hoursWorked ? Number(data.hoursWorked) : undefined,
      platform: platform,
      category: undefined
    };
    
    console.log('Enviando edição de ganho:', formattedData);
    
    try {
      await updateTransaction(transaction.id, formattedData);
      onCancel();
    } catch (error) {
      console.error('Erro ao editar ganho:', error);
    }
  };

  const onSubmitCusto = async (data: CustoFormValues) => {
    // Garantir que os valores corretos estão sendo enviados
    const amount = Number(data.amount) || 0;
    
    const formattedData = {
      ...data,
      type: 'expense' as const,
      date: new Date(data.date),
      amount: amount,
      category: category,
      platform: undefined,
      rides: undefined,
      kilometers: undefined,
      hoursWorked: undefined
    };
    
    console.log('Enviando edição de custo:', formattedData);
    
    try {
      await updateTransaction(transaction.id, formattedData);
      onCancel();
    } catch (error) {
      console.error('Erro ao editar custo:', error);
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h2 className="text-xl font-bold mb-4">Editar Transação</h2>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="ganho" className="text-base" disabled={transaction.type !== 'income'}>
            <span className="text-green-500">Ganhos</span>
          </TabsTrigger>
          <TabsTrigger value="custo" className="text-base" disabled={transaction.type !== 'expense'}>
            <span className="text-red-500">Custos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ganho">
          <form onSubmit={ganhoForm.handleSubmit(onSubmitGanho)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-green-500 font-semibold">Valor (R$)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required
                  className="border-green-300 focus:border-green-500"
                  {...ganhoForm.register('amount', { required: true, valueAsNumber: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="date">Data</Label>
                <Input 
                  id="date" 
                  type="date" 
                  required
                  {...ganhoForm.register('date', { required: true })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input 
                  id="description" 
                  {...ganhoForm.register('description')}
                />
              </div>
              
              <div>
                <Label htmlFor="platform">Plataforma</Label>
                <Select 
                  value={platform}
                  onValueChange={(value: Platform) => {
                    setPlatform(value);
                    console.log('Plataforma selecionada:', value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uber">Uber</SelectItem>
                    <SelectItem value="99">99</SelectItem>
                    <SelectItem value="indrive">Indrive</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rides">Número de corridas</Label>
                <Input 
                  id="rides" 
                  type="number" 
                  min="0"
                  {...ganhoForm.register('rides', { valueAsNumber: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="kilometers">Quilômetros rodados</Label>
                <Input 
                  id="kilometers" 
                  type="number" 
                  step="0.1" 
                  min="0"
                  {...ganhoForm.register('kilometers', { valueAsNumber: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="hoursWorked">Horas trabalhadas</Label>
                <Input 
                  id="hoursWorked" 
                  type="number" 
                  step="0.1" 
                  min="0"
                  {...ganhoForm.register('hoursWorked', { valueAsNumber: true })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={ganhoForm.formState.isSubmitting}>
                {ganhoForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="custo">
          <form onSubmit={custoForm.handleSubmit(onSubmitCusto)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-red-500 font-semibold">Valor (R$)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required
                  className="border-red-300 focus:border-red-500"
                  {...custoForm.register('amount', { required: true, valueAsNumber: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="date">Data</Label>
                <Input 
                  id="date" 
                  type="date" 
                  required
                  {...custoForm.register('date', { required: true })}
                />
              </div>
            </div>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={category}
                  onValueChange={(value: ExpenseCategory) => {
                    setCategory(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuel">Combustível</SelectItem>
                    <SelectItem value="tolls">Pedágios</SelectItem>
                    <SelectItem value="food">Alimentação</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="car_wash">Lavagem</SelectItem>
                    <SelectItem value="insurance">Seguro</SelectItem>
                    <SelectItem value="taxes">Impostos</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {category === 'other' && (
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    id="description" 
                    placeholder="Descreva este custo"
                    required
                    {...custoForm.register('description', { required: category === 'other' })}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={custoForm.formState.isSubmitting}>
                {custoForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
} 