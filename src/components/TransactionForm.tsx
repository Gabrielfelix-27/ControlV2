import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/AppContext';
import { ExpenseCategory, Platform, PlatformRide } from '@/types';
import { CheckCircle, Circle } from 'lucide-react';

interface TransactionFormProps {
  onCancel: () => void;
}

type GanhoFormValues = {
  amount: number;
  date: string;
  description: string;
  kilometers?: number;
  hoursWorked?: number;
};

type CustoFormValues = {
  amount: number;
  date: string;
  description: string;
  category: ExpenseCategory;
};

export function TransactionForm({ onCancel }: TransactionFormProps) {
  const { addTransaction } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>('ganho');
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [showOtherDescription, setShowOtherDescription] = useState(false);
  
  // Estado para controlar as plataformas selecionadas e suas corridas
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformRide[]>([]);
  
  const ganhoForm = useForm<GanhoFormValues>({
    defaultValues: {
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      description: '',
      kilometers: undefined,
      hoursWorked: undefined
    }
  });

  const custoForm = useForm<CustoFormValues>({
    defaultValues: {
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'fuel'
    }
  });

  // Função para alternar a seleção de uma plataforma
  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      // Verifica se a plataforma já está selecionada
      const isSelected = prev.some(p => p.platform === platform);
      
      if (isSelected) {
        // Se já estiver selecionada, remove da lista
        return prev.filter(p => p.platform !== platform);
      } else {
        // Caso contrário, adiciona à lista com valor vazio
        return [...prev, { platform, rides: 0 }];
      }
    });
  };
  
  // Função para atualizar o número de corridas de uma plataforma
  const updatePlatformRides = (platform: Platform, rides: number) => {
    setSelectedPlatforms(prev => 
      prev.map(p => 
        p.platform === platform 
          ? { ...p, rides: rides } 
          : p
      )
    );
  };

  React.useEffect(() => {
    custoForm.setValue('category', category);
    setShowOtherDescription(category === 'other');
  }, [category, custoForm.setValue]);

  const onSubmitGanho = async (data: GanhoFormValues) => {
    // Verificar se há pelo menos uma plataforma selecionada
    if (selectedPlatforms.length === 0) {
      alert("Por favor, selecione pelo menos uma plataforma.");
      return;
    }
    
    // Calcular o número total de corridas para manter a compatibilidade
    const totalRides = selectedPlatforms.reduce((sum, platform) => sum + platform.rides, 0);
    
    // Usar a primeira plataforma para manter compatibilidade com código existente
    const mainPlatform = selectedPlatforms[0].platform;
    
    // Garantir que os valores corretos estão sendo enviados
    const amount = Number(data.amount) || 0;
    
    const formattedData = {
      ...data,
      type: 'income' as const,
      date: new Date(data.date),
      amount: amount,
      platform: mainPlatform, // Para compatibilidade
      platformRides: selectedPlatforms, // Novo campo com todas as plataformas
      rides: totalRides, // Total para compatibilidade
      kilometers: data.kilometers ? Number(data.kilometers) : undefined,
      hoursWorked: data.hoursWorked ? Number(data.hoursWorked) : undefined,
    };
    
    console.log('Enviando ganho:', formattedData);
    
    try {
      await addTransaction(formattedData);
      ganhoForm.reset();
      setSelectedPlatforms([]);
      onCancel();
    } catch (error) {
      console.error('Erro ao adicionar ganho:', error);
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
      category: category
    };
    
    console.log('Enviando custo:', formattedData);
    
    try {
      await addTransaction(formattedData);
      custoForm.reset();
      onCancel();
    } catch (error) {
      console.error('Erro ao adicionar custo:', error);
    }
  };

  // Plataformas disponíveis
  const availablePlatforms: Platform[] = ['uber', '99', 'indrive', 'particular'];

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h2 className="text-xl font-bold mb-4">Registrar Transação</h2>
      
      <Tabs defaultValue="ganho" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="ganho" className="text-base">
            <span className="text-green-500">Ganhos</span>
          </TabsTrigger>
          <TabsTrigger value="custo" className="text-base">
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
                  placeholder="0,00"
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
                  max={new Date().toISOString().split('T')[0]}
                  {...ganhoForm.register('date', { required: true })}
                />
              </div>
            </div>
            
            <div>
              <Label>Plataformas</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {availablePlatforms.map((platform) => {
                  const isSelected = selectedPlatforms.some(p => p.platform === platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center px-3 py-2 rounded-md border ${
                        isSelected 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-card border-border hover:bg-accent'
                      }`}
                    >
                      {isSelected ? <CheckCircle className="w-4 h-4 mr-1" /> : <Circle className="w-4 h-4 mr-1" />}
                      {platform === '99' ? '99' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {selectedPlatforms.length > 0 && (
              <div className="border border-border rounded-md p-4 bg-card/50">
                <Label className="mb-2 block">Número de corridas por plataforma</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedPlatforms.map((platformRide) => (
                    <div key={platformRide.platform} className="flex flex-col">
                      <Label htmlFor={`rides-${platformRide.platform}`} className="mb-1">
                        {platformRide.platform === '99' ? '99' : platformRide.platform.charAt(0).toUpperCase() + platformRide.platform.slice(1)}
                      </Label>
                      <Input 
                        id={`rides-${platformRide.platform}`}
                        type="number"
                        min="0"
                        value={platformRide.rides > 0 ? platformRide.rides : ''}
                        onChange={(e) => updatePlatformRides(platformRide.platform, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kilometers">Quilômetros rodados</Label>
                <Input 
                  id="kilometers" 
                  type="number" 
                  step="0.1" 
                  min="0"
                  placeholder="0"
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
                  placeholder="0"
                  {...ganhoForm.register('hoursWorked', { valueAsNumber: true })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={ganhoForm.formState.isSubmitting}>
                {ganhoForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Ganho'}
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
                  placeholder="0,00"
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
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                defaultValue="fuel"
                onValueChange={(value: ExpenseCategory) => {
                  setCategory(value);
                  console.log('Categoria selecionada:', value);
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
            
            {showOtherDescription && (
              <div>
                <Label htmlFor="otherDescription" className="text-red-500">Descrição (Outros)</Label>
                <Input 
                  id="otherDescription"
                  placeholder="Descreva este custo"
                  required={category === 'other'}
                  {...custoForm.register('description', { 
                    required: category === 'other',
                    validate: value => category !== 'other' || !!value || 'É necessário fornecer uma descrição para a categoria Outros'
                  })}
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={custoForm.formState.isSubmitting}>
                {custoForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Custo'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
