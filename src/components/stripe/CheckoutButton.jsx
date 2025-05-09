'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutButton({
  priceId,
  userId,
  mode = 'payment',
  buttonText = 'Comprar agora',
  buttonClassName = 'bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded',
  disabled = false,
  successUrl,
  cancelUrl,
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          mode,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao criar sessão de checkout');
      }

      // Redirecionar para a URL de checkout do Stripe
      if (data.url) {
        router.push(data.url);
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-button-container">
      <button
        onClick={handleCheckout}
        disabled={isLoading || disabled}
        className={`${buttonClassName} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Processando...' : buttonText}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
} 