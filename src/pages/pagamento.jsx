'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CheckoutButton from '@/components/stripe/CheckoutButton';

export default function PagamentoPage() {
  const user = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Verifique se o usuário está autenticado
  useEffect(() => {
    if (user === null) {
      // Redirecione para a página de login se o usuário não estiver autenticado
      router.push('/login?redirectTo=/pagamento');
    } else if (user) {
      setIsLoading(false);
    }
  }, [user, router]);

  // Planos de pagamento (em uma aplicação real, estes podem vir do banco de dados)
  const planos = [
    {
      id: 1,
      nome: 'Plano Básico',
      preco: 'R$ 49,90',
      periodo: 'mês',
      priceId: 'price_1xxxxxxxxxxxxxx', // ID do preço no Stripe
      recursos: [
        'Acesso a todas as funcionalidades básicas',
        'Suporte por email',
        'Atualizações gratuitas',
      ],
      popular: false,
      corDestaque: 'bg-blue-500',
    },
    {
      id: 2,
      nome: 'Plano Pro',
      preco: 'R$ 99,90',
      periodo: 'mês',
      priceId: 'price_2xxxxxxxxxxxxxx', // ID do preço no Stripe
      recursos: [
        'Todos os recursos do plano básico',
        'Funcionalidades avançadas',
        'Suporte prioritário',
        'Integrações premium',
      ],
      popular: true,
      corDestaque: 'bg-purple-600',
    },
    {
      id: 3,
      nome: 'Plano Empresarial',
      preco: 'R$ 199,90',
      periodo: 'mês',
      priceId: 'price_3xxxxxxxxxxxxxx', // ID do preço no Stripe
      recursos: [
        'Todos os recursos do plano Pro',
        'API completa',
        'Suporte 24/7',
        'Múltiplos usuários',
        'Personalização completa',
      ],
      popular: false,
      corDestaque: 'bg-indigo-700',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Escolha seu plano
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Selecione o plano ideal para suas necessidades
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plano.popular ? 'ring-2 ring-purple-600 transform scale-105 z-10' : ''
              }`}
            >
              {plano.popular && (
                <div className="bg-purple-600 text-white text-center py-2 font-medium">
                  Mais popular
                </div>
              )}
              
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">{plano.nome}</h2>
                <p className="mt-4">
                  <span className="text-3xl font-extrabold text-gray-900">{plano.preco}</span>
                  <span className="text-base font-medium text-gray-500">/{plano.periodo}</span>
                </p>
                
                <ul className="mt-6 space-y-4">
                  {plano.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg 
                          className={`h-6 w-6 ${plano.corDestaque} text-white rounded-full p-1`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-700">{recurso}</p>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <CheckoutButton
                    priceId={plano.priceId}
                    userId={user.id}
                    buttonText={`Assinar ${plano.nome}`}
                    buttonClassName={`w-full py-3 px-4 rounded-md text-white font-medium ${plano.corDestaque} hover:opacity-90 transition-opacity`}
                    mode="subscription"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Perguntas Frequentes</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow rounded-lg overflow-hidden divide-y divide-gray-200">
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Como funciona o pagamento?</h3>
                <p className="mt-2 text-gray-600">
                  Utilizamos o Stripe para processamento seguro de pagamentos. Seu pagamento é criptografado e seguro.
                </p>
              </div>
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Posso cancelar a qualquer momento?</h3>
                <p className="mt-2 text-gray-600">
                  Sim, você pode cancelar sua assinatura a qualquer momento. O acesso será mantido até o final do período já pago.
                </p>
              </div>
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Existe garantia de devolução?</h3>
                <p className="mt-2 text-gray-600">
                  Sim, oferecemos garantia de 7 dias. Se não estiver satisfeito, entre em contato com nosso suporte para reembolso total.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <p className="text-gray-600">
              Ainda tem dúvidas?{' '}
              <Link href="/contato">
                <a className="text-purple-600 hover:text-purple-800 font-medium">Entre em contato conosco</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 