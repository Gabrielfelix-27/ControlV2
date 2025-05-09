import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyInteger(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to determine vehicle rotation day based on license plate
export function getVehicleRotationDay(licensePlate: string): string {
  if (!licensePlate || licensePlate.length < 1) return "Desconhecido";
  
  // Get the last digit of the license plate
  const lastDigit = licensePlate.charAt(licensePlate.length - 1);
  
  // Determine the day based on the last digit
  switch(lastDigit) {
    case '1':
    case '2':
      return "Segunda-feira";
    case '3':
    case '4':
      return "Terça-feira";
    case '5':
    case '6':
      return "Quarta-feira";
    case '7':
    case '8':
      return "Quinta-feira";
    case '9':
    case '0':
      return "Sexta-feira";
    default:
      return "Desconhecido";
  }
}
