import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Função auxiliar genérica para Evolution API / Z-API
async function sendWhatsAppMessage(provider: string, apiUrl: string, apiKey: string, instance: string, fone: string, msg: string) {
  // Em ambiente de produção real, faríamos o fetch para a API do provedor.
  // Como é uma plataforma base, vamos apenas logar ou simular o envio.
  console.log(`[WHATSAPP] Enviando via ${provider} para ${fone}: ${msg}`);
  
  if (provider === 'evolution_api') {
    // Exemplo real de Evolution API v2:
    /*
    const res = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: fone,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: msg }
      })
    });
    if (!res.ok) throw new Error(await res.text());
    */
  }

  // Simulação bem sucedida
  return true; 
}

export async function GET(request: Request) {
  // Esta rota poderia ser chamada por um CRON Job (ex: Vercel Cron a cada 1 min)
  
  // Validação de segurança básica para cron jobs (opcional)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Para simplificar testes locais, deixaremos passar se CRON_SECRET não estiver setado
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createAdminClient();

  // 1. Busca configurações ativas
  const { data: config } = await supabase.from('whatsapp_config').select('*').single();
  
  if (!config || !config.ativo) {
    return NextResponse.json({ status: 'skip', message: 'WhatsApp desativado nas configurações' });
  }

  // 2. Busca mensagens pendentes na fila (limitado a 50 para não sobrecarregar)
  const { data: mensagens, error: msgError } = await supabase
    .from('whatsapp_mensagens')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
    .limit(50);

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  if (!mensagens || mensagens.length === 0) {
    return NextResponse.json({ status: 'ok', sent: 0, message: 'Fila vazia' });
  }

  let successCount = 0;
  let errorCount = 0;

  // 3. Processa a fila
  for (const msg of mensagens) {
    try {
      // Simula / Faz o envio real
      await sendWhatsAppMessage(
        config.provider || 'evolution_api',
        config.instance_id || 'http://localhost:8080', // Exemplo URL
        config.api_key || 'GLOBAL_KEY',
        config.instance_id || 'instancia_quiosque',
        msg.telefone_destino,
        msg.mensagem
      );

      // Marca como enviada
      await supabase
        .from('whatsapp_mensagens')
        .update({ status: 'enviada', erro_detalhe: null })
        .eq('id', msg.id);
        
      successCount++;
    } catch (err: any) {
      // Marca erro para retry futuro
      await supabase
        .from('whatsapp_mensagens')
        .update({ status: 'erro', erro_detalhe: err.message })
        .eq('id', msg.id);
        
      errorCount++;
    }
  }

  return NextResponse.json({
    status: 'ok',
    processed: mensagens.length,
    success: successCount,
    errors: errorCount
  });
}
