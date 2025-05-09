import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da sessão é obrigatório' });
  }

  try {
    // Buscar detalhes da sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ['line_items', 'customer', 'payment_intent']
    });

    // Retornar detalhes da sessão
    res.status(200).json({ session });
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    res.status(500).json({
      error: 'Erro ao buscar detalhes da sessão',
      details: error.message
    });
  }
} 