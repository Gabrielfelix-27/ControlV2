import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Função principal para processar os webhooks do Stripe
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  let event;
  try {
    // Obter o corpo da requisição como string bruta
    const payload = await buffer(req);
    const signature = req.headers['stripe-signature'];

    // Verificar a assinatura do webhook
    event = stripe.webhooks.constructEvent(
      payload.toString(),
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Processar o evento do Stripe
    await handleStripeEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
}

// Converter stream para buffer para verificação de assinatura
async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Processar os diferentes tipos de eventos do Stripe
async function handleStripeEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }
}

// Tratar evento de conclusão de checkout
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout Session concluído:', session);
  
  // Extrair metadados (incluindo o ID do usuário)
  const { userId, productId } = session.metadata || {};
  
  if (!userId) {
    console.error('UserID não encontrado nos metadados da sessão');
    return;
  }

  try {
    // Verificar se existe um cliente relacionado
    let customerId = session.customer;
    
    // Se estamos tratando de uma assinatura
    if (session.mode === 'subscription' && session.subscription) {
      // Armazenar informações de assinatura
      await storeSubscriptionData(userId, session.subscription, customerId);
    } else {
      // Para pagamentos únicos
      await storePaymentData(userId, session, productId);
    }
    
    // Conceder acesso ao usuário
    await grantUserAccess(userId);
  } catch (error) {
    console.error('Erro ao processar checkout completo:', error);
    throw error;
  }
}

// Tratar evento de pagamento bem-sucedido
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('PaymentIntent bem-sucedido:', paymentIntent);
  
  // Extrair metadados
  const { userId, productId } = paymentIntent.metadata || {};
  
  if (!userId) {
    console.error('UserID não encontrado nos metadados do paymentIntent');
    return;
  }
  
  try {
    // Registrar pagamento no Supabase
    await storePaymentData(userId, paymentIntent, productId);
    
    // Conceder acesso ao usuário
    await grantUserAccess(userId);
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
}

// Armazenar dados de pagamento no Supabase
async function storePaymentData(userId, paymentData, productId) {
  const paymentRecord = {
    user_id: userId,
    payment_id: paymentData.id,
    payment_status: 'completed',
    amount: paymentData.amount_total || paymentData.amount,
    currency: paymentData.currency,
    payment_method: paymentData.payment_method_types?.[0] || 'card',
    product_id: productId || null,
    created_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('payments')
    .insert(paymentRecord);

  if (error) {
    console.error('Erro ao armazenar pagamento:', error);
    throw error;
  }
}

// Armazenar dados de assinatura no Supabase
async function storeSubscriptionData(userId, subscriptionId, customerId) {
  try {
    // Obter detalhes da assinatura do Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const subscriptionRecord = {
      user_id: userId,
      subscription_id: subscription.id,
      customer_id: customerId,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('subscriptions')
      .insert(subscriptionRecord);

    if (error) {
      console.error('Erro ao armazenar assinatura:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao obter detalhes da assinatura:', error);
    throw error;
  }
}

// Tratar atualizações de assinatura
async function handleSubscriptionUpdated(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription.id);

    if (error) {
      console.error('Erro ao atualizar assinatura:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao processar atualização de assinatura:', error);
    throw error;
  }
}

// Tratar cancelamento de assinatura
async function handleSubscriptionDeleted(subscription) {
  try {
    // Primeiro, encontrar o usuário que possui esta assinatura
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('subscription_id', subscription.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar assinatura:', fetchError);
      throw fetchError;
    }

    // Atualizar o status da assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription.id);

    if (updateError) {
      console.error('Erro ao atualizar assinatura cancelada:', updateError);
      throw updateError;
    }

    // Revogar o acesso do usuário, se necessário
    if (subscriptionData?.user_id) {
      await revokeUserAccess(subscriptionData.user_id);
    }
  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    throw error;
  }
}

// Conceder acesso ao usuário
async function grantUserAccess(userId) {
  try {
    // Atualizar o status de acesso do usuário
    const { error } = await supabase
      .from('profiles')
      .update({ 
        has_payment: true,
        has_access: true,
        access_granted_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao conceder acesso ao usuário:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao conceder acesso:', error);
    throw error;
  }
}

// Revogar acesso ao usuário
async function revokeUserAccess(userId) {
  try {
    // Verificar se o usuário tem outra assinatura ativa
    const { data: activeSubscriptions, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar assinaturas ativas:', checkError);
      throw checkError;
    }

    // Se não houver assinaturas ativas, revogar o acesso
    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          has_access: false,
          access_revoked_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao revogar acesso ao usuário:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Erro ao revogar acesso:', error);
    throw error;
  }
}

// Configuração para impedir que o Next.js analise o corpo da solicitação
export const config = {
  api: {
    bodyParser: false,
  },
}; 