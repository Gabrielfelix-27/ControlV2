// Configuração de CORS para todas as funções Edge

// Defina os domínios permitidos para acessar as funções Edge
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'https://gyogfvfmsotveacjcckr.supabase.co',
  // Adicione seu domínio de produção aqui
];

// Obtenha a origem da solicitação ou use uma string vazia se não houver
export const getOrigin = (req: Request): string => {
  const origin = req.headers.get('origin');
  return origin || '';
};

// Verifique se a origem está na lista de origens permitidas
export const isOriginAllowed = (origin: string): boolean => {
  return allowedOrigins.includes(origin) || origin.startsWith('http://localhost');
};

// Cabeçalhos CORS para usar em todas as funções Edge
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Em produção, você pode limitar isso para origens específicas
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, X-Requested-With, Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, apikey',
  'Access-Control-Max-Age': '86400',  // 24 horas em segundos
};

// Função para obter cabeçalhos CORS específicos para uma origem
export const getCorsHeaders = (req: Request) => {
  const origin = getOrigin(req);
  
  if (isOriginAllowed(origin)) {
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin
    };
  }
  
  return corsHeaders;
}; 