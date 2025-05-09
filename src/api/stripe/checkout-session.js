import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { priceId, userId, successUrl, cancelUrl, mode = 'payment' } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId é obrigatório' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    // Verificar se o usuário existe no Supabase
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o usuário já tem um customerId do Stripe
    let customerId;
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente:', customerError);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }

    // Se o cliente já existe, usar o customerId existente
    if (customer?.stripe_customer_id) {
      customerId = customer.stripe_customer_id;
    } else {
      // Obter informações do usuário para criar um cliente no Stripe
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Criar um novo cliente no Stripe
      const newCustomer = await stripe.customers.create({
        email: authUser.user.email,
        metadata: {
          userId: userId
        }
      });

      customerId = newCustomer.id;

      // Salvar o customerId no Supabase
      await supabase
        .from('customers')
        .insert({
          user_id: userId,
          stripe_customer_id: customerId,
          created_at: new Date().toISOString()
        });
    }

    // Obter o produto associado ao priceId
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product);

    // Criar uma sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pagamento-cancelado`,
      metadata: {
        userId: userId,
        productId: product.id,
        priceName: price.nickname || 'Compra'
      }
    });

    // Registrar a sessão no Supabase para rastreamento
    await supabase
      .from('checkout_sessions')
      .insert({
        user_id: userId,
        session_id: session.id,
        payment_status: session.payment_status,
        mode: session.mode,
        price_id: priceId,
        product_id: product.id,
        amount_total: session.amount_total,
        currency: session.currency,
        created_at: new Date().toISOString()
      });

    // Retornar a URL da sessão para redirecionamento
    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ 
      error: 'Erro ao criar sessão de checkout',
      details: error.message 
    });
  }
} 