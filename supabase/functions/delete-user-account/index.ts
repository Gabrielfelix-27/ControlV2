// Importando tipos e biblioteca do Supabase Edge Functions
// @ts-ignore: Ignorar erros de tipagem do Deno
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
// @ts-ignore: Ignorar erros de tipagem do Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
// @ts-ignore: Ignorar erros de extensão de arquivo
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função delete-user-account carregada");

// Esta é uma função Deno Edge para o Supabase
// Ela só funcionará quando implantada no ambiente Supabase
serve(async (req: Request) => {
  // Lidar com solicitações OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Obter o token de autorização do cabeçalho
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado. Token não fornecido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter dados do corpo da requisição
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "ID do usuário não fornecido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter variáveis de ambiente do Supabase
    // @ts-ignore: Ignorar erros de tipagem do Deno.env
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    // @ts-ignore: Ignorar erros de tipagem do Deno.env
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas");
      return new Response(
        JSON.stringify({ error: "Erro de configuração do servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com chave de serviço
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o token pertence ao usuário que está sendo excluído
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user || user.id !== user_id) {
      console.error("Erro de autenticação:", authError);
      return new Response(
        JSON.stringify({ error: "Não autorizado. O token não corresponde ao usuário." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tentando excluir dados do usuário: ${user_id}`);
    
    // 1. Primeiro excluir os dados do usuário de todas as tabelas relacionadas
    
    // Excluir transações do usuário
    const { error: transactionError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user_id);
    
    if (transactionError) {
      console.error("Erro ao excluir transações do usuário:", transactionError);
      // Continuamos mesmo com erro para tentar limpar o máximo possível
    }
    
    // Excluir perfil do usuário
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user_id);
    
    if (profileError) {
      console.error("Erro ao excluir perfil do usuário:", profileError);
      // Continuamos mesmo com erro para tentar limpar o máximo possível
    }
    
    // Aqui poderia adicionar exclusão de outros dados relacionados ao usuário
    // ...

    console.log(`Tentando excluir usuário auth: ${user_id}`);

    // 2. Por último, excluir o usuário do sistema de autenticação
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Erro ao excluir usuário:", deleteError);
      return new Response(
        JSON.stringify({ error: "Erro ao excluir usuário: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuário excluído com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro na função:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: "Erro interno: " + errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 