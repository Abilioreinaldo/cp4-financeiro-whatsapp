// Dados fictícios do protótipo. Nenhum valor vem da plataforma CP4.
const DATA = {
  hoje: '02/10/2026',
  pinDemo: '135790',
  contato: { nome: 'Abílio Reinaldo', primeiro: 'Abílio', fone: '+55 33 9••••-4417' },
  atendente: 'Camila Prates',

  empresas: {
    transcon: {
      id: 'transcon', nome: 'Transcon GV',
      razao: 'Transcon Transportes Governador Valadares Ltda',
      cnpj: '17.482.905/0001-36', responsavel: 'Abílio Reinaldo',
      conta: { limite: 100000, disponivel: 38450 },
      ciclo: { rotulo: 'semanal', inicio: '28/09/2026', fim: '04/10/2026', fechamento: '04/10/2026', vencimento: '09/10/2026', valor: 27814.90, qtd: 14, taxaPct: 1.5 },
      faturas: [
        { num: 'INV-20260928-K7QD', periodo: '21/09 a 27/09/2026', valor: 33735.10, taxa: 506.03, venc: '02/10/2026', status: 'pending', situacao: 'Vence hoje' },
        { num: 'INV-20260921-B2XM', periodo: '14/09 a 20/09/2026', valor: 29980.44, taxa: 449.71, venc: '25/09/2026', status: 'paid', situacao: 'Paga em 24/09/2026' },
        { num: 'INV-20260914-T9WC', periodo: '07/09 a 13/09/2026', valor: 31402.18, taxa: 471.03, venc: '18/09/2026', status: 'paid', situacao: 'Paga em 18/09/2026' },
      ],
      abastecimentos: [
        { id: 48213, quando: '02/10 13:48', posto: 'Posto Graal Valadares', placa: 'GHX-4B21', item: 'Diesel S10 · 412,0 L', valor: 2455.52 },
        { id: 48190, quando: '02/10 09:15', posto: 'Posto Trevo BR-116', placa: 'RTA-9C05', item: 'Diesel S10 · 180,5 L', valor: 1066.76 },
        { id: 48177, quando: '02/10 06:32', posto: 'Auto Posto Rio Doce', placa: 'QPL-2F88', item: 'Diesel S10 · 105,0 L + Arla 32', valor: 690.32 },
        { id: 48142, quando: '01/10 21:10', posto: 'Posto Graal Valadares', placa: 'HKM-7D43', item: 'Diesel S500 · 398,0 L', valor: 2288.50 },
        { id: 48120, quando: '01/10 16:44', posto: 'Posto Estrela da Serra', placa: 'GHX-4B21', item: 'Diesel S10 · 490,6 L', valor: 2919.25 },
      ],
      consumo: {
        hoje: { valor: 4212.60, litros: 697.5, qtd: 3 },
        mes: { nome: 'outubro', valor: 9420.35, litros: 1586.1, qtd: 5 },
        anterior: { nome: 'setembro', valor: 128930.72, litros: 21690.4, qtd: 212 },
      },
      extrato: {
        totais: { '7 dias': { saidas: 39102.35, entradas: 0 }, '30 dias': { saidas: 131746.90, entradas: 91412.18 }, 'Mês atual': { saidas: 9420.35, entradas: 0 } },
        itens: [
          { quando: '02/10 13:48', desc: 'Pedido #48213 · Posto Graal Valadares', valor: -2455.52, saldo: 38450.00 },
          { quando: '02/10 09:15', desc: 'Pedido #48190 · Posto Trevo BR-116', valor: -1066.76, saldo: 40905.52 },
          { quando: '02/10 06:32', desc: 'Pedido #48177 · Auto Posto Rio Doce', valor: -690.32, saldo: 41972.28 },
          { quando: '01/10 21:10', desc: 'Pedido #48142 · Posto Graal Valadares', valor: -2288.50, saldo: 42662.60 },
          { quando: '01/10 16:44', desc: 'Pedido #48120 · Posto Estrela da Serra', valor: -2919.25, saldo: 44951.10 },
          { quando: '30/09 18:05', desc: 'Pedido #48071 · Posto Trevo BR-116', valor: -3104.80, saldo: 47870.35 },
          { quando: '30/09 08:22', desc: 'Pedido #48033 · Auto Posto Rio Doce', valor: -1870.15, saldo: 50975.15 },
          { quando: '29/09 22:40', desc: 'Pedido #48010 · Posto Graal Valadares', valor: -2640.90, saldo: 52845.30 },
        ],
      },
    },
    valeaco: {
      id: 'valeaco', nome: 'Rodoviário Vale do Aço',
      razao: 'Rodoviário Vale do Aço Cargas Ltda',
      cnpj: '08.731.264/0001-90', responsavel: 'Marina Duarte',
      conta: { limite: 60000, disponivel: 12380.40 },
      ciclo: { rotulo: '14 dias', inicio: '21/09/2026', fim: '04/10/2026', fechamento: '04/10/2026', vencimento: '12/10/2026', valor: 19204.75, qtd: 9, taxaPct: 2.0 },
      faturas: [
        { num: 'INV-20260920-M4PL', periodo: '07/09 a 20/09/2026', valor: 28414.85, taxa: 568.30, venc: '28/09/2026', status: 'pending', vencida: true, situacao: 'Vencida há 4 dias' },
        { num: 'INV-20260906-D8RA', periodo: '24/08 a 06/09/2026', valor: 26110.20, taxa: 522.20, venc: '14/09/2026', status: 'paid', situacao: 'Paga em 14/09/2026' },
      ],
      abastecimentos: [
        { id: 48201, quando: '02/10 11:27', posto: 'Posto Ipatinga Centro', placa: 'PVA-3H17', item: 'Diesel S10 · 310,0 L', valor: 1856.90 },
        { id: 48118, quando: '01/10 15:02', posto: 'Posto Timóteo BR-381', placa: 'OQM-8J52', item: 'Diesel S10 · 265,4 L', valor: 1589.75 },
        { id: 48044, quando: '30/09 10:48', posto: 'Posto Ipatinga Centro', placa: 'PVA-3H17', item: 'Diesel S500 · 402,0 L', valor: 2311.50 },
      ],
      consumo: {
        hoje: { valor: 1856.90, litros: 310.0, qtd: 1 },
        mes: { nome: 'outubro', valor: 3446.65, litros: 575.4, qtd: 2 },
        anterior: { nome: 'setembro', valor: 54870.30, litros: 9210.8, qtd: 87 },
      },
      extrato: {
        totais: { '7 dias': { saidas: 11980.45, entradas: 0 }, '30 dias': { saidas: 56720.15, entradas: 26110.20 }, 'Mês atual': { saidas: 3446.65, entradas: 0 } },
        itens: [
          { quando: '02/10 11:27', desc: 'Pedido #48201 · Posto Ipatinga Centro', valor: -1856.90, saldo: 12380.40 },
          { quando: '01/10 15:02', desc: 'Pedido #48118 · Posto Timóteo BR-381', valor: -1589.75, saldo: 14237.30 },
          { quando: '30/09 10:48', desc: 'Pedido #48044 · Posto Ipatinga Centro', valor: -2311.50, saldo: 15827.05 },
          { quando: '29/09 17:33', desc: 'Pedido #48002 · Posto Timóteo BR-381', valor: -2104.60, saldo: 18138.55 },
        ],
      },
    },
  },

  // Indicadores do dia na Central (base; a conversa ao vivo soma por cima).
  kpis: { conversas: 184, abertas: 12, humanos: 7, saldo: 96, fatura: 41, fechamento: 3, erros: 2, authFalhas: 5, sla: '94%', tma: '6 min 40 s' },

  // Conversas de exemplo da Central. A primeira linha da lista é a conversa ao vivo do protótipo.
  conversas: [
    {
      id: 'c2', empresa: 'Rodoviário Vale do Aço', cnpj: '08.731.264/0001-90', contato: 'Marina Duarte', nivel: 'Financeiro', fone: '+55 31 9••••-2208', motivo: 'Contestação de abastecimento',
      ultima: 'não reconheço esse abastecimento de ontem', intent: 'support.dispute.open', status: 'Aguardando atendente', risco: 'Alto', humano: 'Na fila', hora: '14:21',
      conta: { disponivel: 12380.40, limite: 60000, fatura: 19204.75, venc: '12/10/2026', situacao: '1 fatura vencida há 4 dias' },
      resumo: 'Contesta o pedido #48118 (01/10 15:02, Posto Timóteo BR-381, placa OQM-8J52, R$ 1.589,75). Motivo: não reconhece o abastecimento ("não fui eu").',
      abastecimentos: ['02/10 11:27 · PVA-3H17 · R$ 1.856,90', '01/10 15:02 · OQM-8J52 · R$ 1.589,75', '30/09 10:48 · PVA-3H17 · R$ 2.311,50'],
      msgs: [
        { dir: 'in', html: 'quais foram meus últimos abastecimentos?', t: '14:17' },
        { dir: 'out', html: 'Para continuar, digite seu <b>PIN financeiro</b> de 6 dígitos.', t: '14:17' },
        { dir: 'in', html: '••••••', t: '14:18' },
        { dir: 'out', html: '<b>Rodoviário Vale do Aço</b><br>Últimos abastecimentos<br><br>02/10 11:27 · PVA-3H17 · R$ 1.856,90<br>01/10 15:02 · OQM-8J52 · R$ 1.589,75<br>30/09 10:48 · PVA-3H17 · R$ 2.311,50', t: '14:18' },
        { dir: 'in', html: 'não reconheço esse abastecimento de ontem', t: '14:20' },
        { dir: 'out', html: 'Qual abastecimento você não reconhece?', t: '14:20' },
        { dir: 'in', html: '#48118 · R$ 1.589,75', t: '14:20' },
        { dir: 'out', html: 'O que aconteceu?', t: '14:20' },
        { dir: 'in', html: 'Não fui eu', t: '14:21' },
        { dir: 'out', html: 'Certo. Vou te passar para o <b>Financeiro CP4</b> com os dados do pedido <b>#48118</b>. Você não precisa explicar de novo.', t: '14:21' },
        { dir: 'sys', html: 'Conversa na fila do Financeiro CP4 · posição 2', t: '14:21' },
      ],
    },
    {
      id: 'c3', empresa: 'TransLog Ipatinga', cnpj: '22.905.117/0001-08', contato: 'Sérgio Vilela', nivel: 'Financeiro', fone: '+55 31 9••••-7741',
      ultima: 'quero fechar minha fatura agora', intent: 'cycle.close.request', motivo: 'Pedido de fechamento antecipado', status: 'Aguardando atendente', risco: 'Alto', humano: 'Na fila', hora: '14:09',
      conta: { disponivel: 4120.00, limite: 80000, fatura: 52310.60, venc: '09/10/2026', situacao: 'Em dia · limite 95% utilizado' },
      resumo: 'Pede fechamento antecipado do ciclo 28/09–hoje: R$ 52.310,60 em 31 abastecimentos (taxa ainda estimada). Limite 95% utilizado.',
      abastecimentos: ['02/10 12:40 · HNQ-5E90 · R$ 3.214,00', '02/10 08:05 · HNQ-1B44 · R$ 2.870,35'],
      msgs: [
        { dir: 'in', html: 'quero fechar minha fatura agora', t: '14:06' },
        { dir: 'out', html: '<b>TransLog Ipatinga</b><br>Fatura atual: R$ 52.310,60 em abastecimentos.<br><br>O fechamento antecipado é feito pelo <b>Financeiro CP4</b>. Fechar não libera limite: o limite volta quando a fatura é paga.<br><br>Quer que eu passe seu pedido ao financeiro?', t: '14:06' },
        { dir: 'in', html: 'Falar com o financeiro', t: '14:08' },
        { dir: 'out', html: 'Certo. Vou te passar para o <b>Financeiro CP4</b> com os dados do seu ciclo. Você não precisa explicar de novo.', t: '14:09' },
        { dir: 'sys', html: 'Conversa na fila do Financeiro CP4 · posição 1', t: '14:09' },
      ],
    },
    {
      id: 'c4', empresa: 'Transportes Aimorés', cnpj: '31.074.556/0001-71', contato: 'Paula Antunes', nivel: 'Financeiro', fone: '+55 27 9••••-6630',
      ultima: 'meu pagamento não entrou', intent: 'support.payment.issue', status: 'Em atendimento', risco: 'Médio', humano: 'Camila Prates', hora: '13:52',
      conta: { disponivel: 0, limite: 45000, fatura: 8930.10, venc: '09/10/2026', situacao: '1 fatura vencida há 2 dias' },
      resumo: 'Informa ter pago a fatura INV-20260925-Q1ZT em 30/09. Faturamento ainda pendente no sistema.',
      abastecimentos: ['29/09 19:12 · MTR-4C08 · R$ 1.940,20'],
      msgs: [
        { dir: 'in', html: 'meu pagamento não entrou', t: '13:44' },
        { dir: 'out', html: 'Sinto muito pelo transtorno. Encontrei a fatura <b>INV-20260925-Q1ZT</b>, ainda pendente. Vou chamar o Financeiro CP4.', t: '13:44' },
        { dir: 'sys', html: 'Camila Prates assumiu o atendimento', t: '13:49' },
        { dir: 'agent', html: 'Oi, Paula. Aqui é a Camila, do Financeiro CP4. Consegue me enviar o comprovante por aqui?', t: '13:50' },
        { dir: 'in', html: 'vou pegar com o banco e já mando', t: '13:52' },
      ],
    },
    {
      id: 'c5', empresa: 'Cargas Minas Sul', cnpj: '12.660.843/0001-25', contato: 'Renata Lobo', nivel: 'Financeiro', fone: '+55 35 9••••-1195',
      ultima: '••••••', intent: 'session.auth.verify', status: 'Contato bloqueado', risco: 'Crítico', humano: 'Na fila', hora: '13:31',
      conta: { disponivel: 21870.90, limite: 70000, fatura: 15402.00, venc: '09/10/2026', situacao: 'Em dia' },
      resumo: 'Três PINs incorretos ao pedir o extrato. Operações com documento bloqueadas. Administrador da transportadora avisado.',
      abastecimentos: ['02/10 07:48 · QRS-2A61 · R$ 2.105,44'],
      msgs: [
        { dir: 'in', html: 'me envie meu extrato', t: '13:29' },
        { dir: 'out', html: 'Para continuar, digite seu <b>PIN financeiro</b>.', t: '13:29' },
        { dir: 'in', html: '••••••', t: '13:30' },
        { dir: 'out', html: 'PIN incorreto. Você tem mais 2 tentativas.', t: '13:30' },
        { dir: 'in', html: '••••••', t: '13:30' },
        { dir: 'out', html: 'PIN incorreto. Você tem mais 1 tentativa.', t: '13:30' },
        { dir: 'in', html: '••••••', t: '13:31' },
        { dir: 'out', html: 'Por segurança, bloqueei as operações com documento neste número. Um administrador da Cargas Minas Sul pode liberar na plataforma.', t: '13:31' },
      ],
    },
    {
      id: 'c6', empresa: 'Expresso Mantiqueira', cnpj: '05.218.774/0001-63', contato: 'João Paulo Reis', nivel: 'Financeiro', fone: '+55 32 9••••-8054',
      ultima: 'me manda a fatura', intent: 'invoice.document.send', status: 'Resolvido pelo bot', risco: 'Baixo', humano: 'Não', hora: '13:10',
      conta: { disponivel: 30115.75, limite: 50000, fatura: 6204.30, venc: '09/10/2026', situacao: 'Em dia' },
      resumo: 'Recebeu o PDF da fatura INV-20260928-H6NV após validar o PIN.',
      abastecimentos: ['01/10 18:20 · LPX-9D33 · R$ 1.722,10'],
      msgs: [
        { dir: 'in', html: 'me manda a fatura', t: '13:08' },
        { dir: 'out', html: 'Digite seu <b>PIN financeiro</b>.', t: '13:08' },
        { dir: 'in', html: '••••••', t: '13:09' },
        { dir: 'out', html: 'Fatura <b>INV-20260928-H6NV</b> · R$ 13.890,12 · vence em 05/10/2026', t: '13:10', doc: { name: 'fatura_INV-20260928-H6NV.pdf', meta: 'PDF · 148 KB' } },
      ],
    },
    {
      id: 'c7', empresa: 'Frota Caratinga', cnpj: '40.117.392/0001-14', contato: 'Luís Bragança', nivel: 'Consulta', fone: '+55 33 9••••-3072',
      ultima: 'qual meu saldo', intent: 'account.available.get', status: 'Resolvido pelo bot', risco: 'Baixo', humano: 'Não', hora: '12:47',
      conta: { disponivel: 18904.22, limite: 30000, fatura: 4310.00, venc: '09/10/2026', situacao: 'Em dia' },
      resumo: 'Consulta de saldo respondida.',
      abastecimentos: ['02/10 10:02 · KJT-6F20 · R$ 890,45'],
      msgs: [
        { dir: 'in', html: 'qual meu saldo', t: '12:47' },
        { dir: 'out', html: '<b>Frota Caratinga</b><br>Saldo disponível: <b>R$ 18.904,22</b><br>Limite total: R$ 30.000,00<br>Utilizado: R$ 11.095,78<br><br>Posição atualizada às 12:47.', t: '12:47' },
      ],
    },
    {
      id: 'c8', empresa: 'Número não cadastrado', cnpj: '—', contato: '—', nivel: '—', fone: '+55 31 9••••-0932',
      ultima: 'qual o saldo da transcon?', intent: 'account.available.get', status: 'Recusado', risco: 'Médio', humano: 'Não', hora: '11:58',
      conta: null,
      resumo: 'Número sem cadastro pediu saldo citando o nome de uma transportadora. Nenhum dado foi informado.',
      abastecimentos: [],
      msgs: [
        { dir: 'in', html: 'qual o saldo da transcon?', t: '11:58' },
        { dir: 'out', html: 'Este número não está habilitado no Financeiro CP4. Para habilitar, entre na plataforma CP4 em Segurança → WhatsApp Financeiro.', t: '11:58' },
      ],
    },
  ],

  templates: [
    { nome: 'cp4_fatura_fechada', cat: 'Utilidade', status: 'Aprovado', texto: 'Sua fatura {{1}} fechou em {{2}}. Valor: {{3}}. Vencimento: {{4}}.' },
    { nome: 'cp4_fatura_vence_amanha', cat: 'Utilidade', status: 'Aprovado', texto: 'Sua fatura {{1}}, de {{2}}, vence amanhã.' },
    { nome: 'cp4_pagamento_identificado', cat: 'Utilidade', status: 'Aprovado', texto: 'Identificamos o pagamento da fatura {{1}}. Seu disponível agora é {{2}}.' },
    { nome: 'cp4_saldo_baixo', cat: 'Utilidade', status: 'Em análise', texto: 'Seu saldo disponível está abaixo de {{1}}.' },
    { nome: 'cp4_limite_atualizado', cat: 'Utilidade', status: 'Aprovado', texto: 'Seu limite foi atualizado para {{1}}.' },
    { nome: 'cp4_codigo_verificacao', cat: 'Autenticação', status: 'Aprovado', texto: 'Seu código de verificação CP4 é {{1}}.' },
    { nome: 'cp4_pendencia_financeira', cat: 'Utilidade', status: 'Rejeitado', texto: 'Existe uma pendência financeira na sua conta.' },
  ],
};
