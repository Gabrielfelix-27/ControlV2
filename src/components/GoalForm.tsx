import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';

interface GoalFormProps {
  onCancel: () => void;
  currentGoal?: number;
}

type FormValues = {
  monthlyGoal: number;
};

export function GoalForm({ onCancel, currentGoal = 0 }: GoalFormProps) {
  const { updateUserProfile, userProfile } = useAppContext();
  const [isConfirming, setIsConfirming] = useState(false);
  
  const { register, handleSubmit, formState: { isSubmitting, errors }, watch } = useForm<FormValues>({
    defaultValues: {
      monthlyGoal: currentGoal
    }
  });

  const currentValue = watch('monthlyGoal');

  const onSubmit = async (data: FormValues) => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    try {
      await updateUserProfile({ 
        monthlyGoal: Number(data.monthlyGoal) 
      });
      onCancel();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h2 className="text-xl font-bold mb-4">Definir Meta Mensal</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="monthlyGoal">Meta Mensal (R$)</Label>
          <Input 
            id="monthlyGoal" 
            type="number" 
            step="any" 
            min="0"
            placeholder="Ex: 5000"
            required
            className="text-lg"
            {...register('monthlyGoal', { 
              required: true, 
              valueAsNumber: true,
              min: {
                value: 0,
                message: "A meta precisa ser um valor positivo"
              }
            })}
          />
          {errors.monthlyGoal && (
            <p className="text-red-500 text-sm">{errors.monthlyGoal.message}</p>
          )}
          
          {!isConfirming && currentValue > 0 && (
            <p className="text-muted-foreground mt-2">
              Após definir sua meta, ela será utilizada como base para o cálculo de seu progresso financeiro mensal.
            </p>
          )}
          
          {isConfirming && (
            <div className="bg-accent p-4 rounded-md mt-4">
              <p className="font-medium">Confirmar meta mensal de {formatCurrency(currentValue)}?</p>
              <p className="text-muted-foreground mt-1">
                Esta meta será utilizada para calcular seu progresso financeiro durante este mês.
                Você poderá alterá-la a qualquer momento.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (isConfirming) {
                setIsConfirming(false);
              } else {
                onCancel();
              }
            }}
          >
            {isConfirming ? 'Voltar' : 'Cancelar'}
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className={isConfirming ? "bg-green-600 hover:bg-green-700" : ""}
            style={!isConfirming ? { backgroundColor: "#e4ff00", color: "#000000" } : {}}
          >
            {isSubmitting 
              ? 'Salvando...' 
              : isConfirming 
                ? 'Confirmar Meta' 
                : 'Continuar'
            }
          </Button>
        </div>
      </form>
    </div>
  );
} 