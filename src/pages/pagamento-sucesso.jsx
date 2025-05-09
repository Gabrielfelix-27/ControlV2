'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PaymentSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Esperar até que o router esteja pronto e tenhamos o session_id
    if (!router.isReady || !session_id) return;

    const fetchSessionDetails = async () => {
      try {
        // Buscar detalhes da sessão do Stripe
        const response = await fetch(`/api/stripe/session?id=${session_id}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar detalhes da sessão');
        }
        
        const data = await response.json();
        setSessionDetails(data.session);
      } catch (err) {
        console.error('Erro ao buscar detalhes da sessão:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [router.isReady, session_id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Pagamento realizado com sucesso!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Obrigado pela sua compra. Você agora tem acesso à aplicação.
          </p>

          {loading ? (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          ) : sessionDetails ? (
            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">ID da transação:</span>
                <span className="font-medium">{session_id.substring(0, 12)}...</span>
              </div>
              
              {sessionDetails.amount_total && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: sessionDetails.currency || 'BRL'
                    }).format(sessionDetails.amount_total / 100)}
                  </span>
                </div>
              )}
              
              {sessionDetails.payment_status && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">
                    {sessionDetails.payment_status === 'paid' ? 'Pago' : sessionDetails.payment_status}
                  </span>
                </div>
              )}
            </div>
          ) : null}

          <div className="space-y-4">
            <Link href="/app/dashboard">
              <a className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center">
                Ir para o Dashboard
              </a>
            </Link>
            
            <Link href="/contato">
              <a className="block w-full text-blue-600 hover:text-blue-800 py-2 px-4 rounded text-center">
                Precisa de ajuda?
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 