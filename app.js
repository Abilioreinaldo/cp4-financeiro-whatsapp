// Protótipo navegável do CP4 Financeiro via WhatsApp.
// Tudo roda no navegador com os dados fictícios de data.js. O "classificador" abaixo é por
// palavras-chave e faz o papel do LLM; os valores vêm sempre das funções determinísticas.
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dec = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const hhmm = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const rid = (p) => p + Math.random().toString(36).slice(2, 10).toUpperCase();

  const BASE = JSON.stringify(DATA.empresas);
  // Canal somente consulta: os níveis só recortam o que cada contato pode ver.
  const NIVEIS = { 0: '—', 1: 'Consulta', 2: 'Financeiro' };

  // ---------------------------------------------------------------- catálogo de intents
  // risk: classe de risco · level: nível mínimo do contato · auth: nível de autenticação exigido
  const INTENTS = {
    'account.available.get': { risk: 'R1', level: 1, auth: 'A1' },
    'account.limit.get': { risk: 'R1', level: 1, auth: 'A1' },
    'account.projection.get': { risk: 'R1', level: 1, auth: 'A1' },
    'cycle.open.get': { risk: 'R1', level: 1, auth: 'A1' },
    'cycle.open.entries': { risk: 'R2', level: 2, auth: 'A2' },
    'cycle.close.request': { risk: 'R1', level: 1, auth: 'A1' }, // informa o ciclo e transfere; não fecha nada
    'invoice.list': { risk: 'R1', level: 1, auth: 'A1' },
    'invoice.status.get': { risk: 'R1', level: 1, auth: 'A1' },
    'invoice.due.get': { risk: 'R1', level: 1, auth: 'A1' },
    'invoice.document.send': { risk: 'R2', level: 2, auth: 'A2' },
    'invoice.payment.send': { risk: 'R1', level: 1, auth: 'A1' }, // não há boleto: só orienta para o PDF da fatura
    'invoice.overdue.list': { risk: 'R1', level: 1, auth: 'A1' },
    'statement.get': { risk: 'R2', level: 1, auth: 'A2' },
    'statement.document.send': { risk: 'R2', level: 2, auth: 'A2' },
    'fuel.latest.list': { risk: 'R2', level: 1, auth: 'A2' },
    'fuel.period.sum': { risk: 'R1', level: 1, auth: 'A1' },
    'support.handoff.request': { risk: 'R0', level: 0, auth: 'A0' },
    'support.dispute.open': { risk: 'R2', level: 1, auth: 'A2' }, // lista abastecimentos (placa e local) antes de transferir
    'support.payment.issue': { risk: 'R0', level: 0, auth: 'A0' },
    'support.closure.handoff': { risk: 'R0', level: 1, auth: 'A1' },
    'session.company.select': { risk: 'R0', level: 0, auth: 'A0' },
    'session.end': { risk: 'R0', level: 0, auth: 'A0' },
    'meta.greeting': { risk: 'R0', level: 0, auth: 'A0' },
    'meta.help': { risk: 'R0', level: 0, auth: 'A0' },
    'meta.thanks': { risk: 'R0', level: 0, auth: 'A0' },
    'meta.unknown': { risk: 'R0', level: 0, auth: 'A0' },
  };

  // A ordem importa: contestação primeiro, saudação por último.
  const RULES = [
    [/cobraram errado|cobranca errada|boleto.*errad|pagamento nao (entrou|caiu)|paguei e nao/, 'support.payment.issue', 'regra'],
    [/nao reconhe|contest|nao fui eu|fraude/, 'support.dispute.open', 'regra'],
    [/atendente|humano|falar com (alguem|o financeiro|financeiro|uma pessoa|voces)/, 'support.handoff.request', 'regra'],
    [/ja fechou|fechou\?|ja foi paga|foi paga\?/, 'invoice.status.get', 'regra'],
    [/fecha.*fatura|fechamento antecipado|antecipar.*fech/, 'cycle.close.request', 'regra'],
    [/depois da fatura|apos a fatura|depois de pagar|se eu pagar|quando eu pagar/, 'account.projection.get', 'LLM (simulado)'],
    [/boleto|segunda via|2a via|linha digit/, 'invoice.payment.send', 'regra'],
    [/extrato.*pdf|pdf.*extrato/, 'statement.document.send', 'regra'],
    [/pdf|(manda|mande|envia|envie|receber|quero).*fatura/, 'invoice.document.send', 'regra'],
    [/atras|pendencia|vencid|devendo/, 'invoice.overdue.list', 'regra'],
    [/vence|vencimento/, 'invoice.due.get', 'regra'],
    [/extrato|movimenta/, 'statement.get', 'regra'],
    [/lancamento/, 'cycle.open.entries', 'regra'],
    [/(quanto|total).*(abasteci|gastei|consumi)|consumo/, 'fuel.period.sum', 'regra'],
    [/abasteci/, 'fuel.latest.list', 'regra'],
    [/limite|quanto (ja )?usei|utilizado/, 'account.limit.get', 'regra'],
    [/alguma fatura|faturas?( em)? abert|minhas faturas|faturas/, 'invoice.list', 'regra'],
    [/fatura/, 'cycle.open.get', 'regra'],
    [/saldo|disponivel/, 'account.available.get', 'regra'],
    [/quanto (eu )?tenho|quanto sobrou|posso gastar|quanto ainda/, 'account.available.get', 'LLM (simulado)'],
    [/trocar (de )?empresa|outra empresa|outra transportadora/, 'session.company.select', 'regra'],
    [/^(sair|encerrar|tchau)/, 'session.end', 'regra'],
    [/ajuda|menu|opcoes|o que voce faz/, 'meta.help', 'regra'],
    [/obrigad|valeu/, 'meta.thanks', 'regra'],
    [/^(oi|ola|bom dia|boa tarde|boa noite|opa|e ai)\b/, 'meta.greeting', 'regra'],
  ];

  function classify(text) {
    const t = norm(text);
    for (const [re, intent, by] of RULES) {
      if (re.test(t)) {
        const slots = {};
        if (intent === 'fuel.period.sum') slots.period = /hoje/.test(t) ? 'hoje' : 'mes';
        return { intent, by, conf: by === 'regra' ? 0.99 : 0.87, slots };
      }
    }
    return { intent: 'meta.unknown', by: 'LLM (simulado)', conf: 0.31, slots: {} };
  }

  // ---------------------------------------------------------------- estado
  const freshSession = () => ({ started: false, company: null, auth: 'A1', pinTries: 0, blocked: false, awaiting: null, deferred: null, unknown: 0, mode: 'bot' });
  const freshLive = () => ({ id: 'live', live: true, msgs: [], status: 'Em andamento (bot)', risco: 'Baixo', humano: 'Não', resumo: 'Conversa conduzida pelo assistente.', log: [] });

  const S = {
    sim: { nivel: 2, multi: false, desconhecido: false, api: false, pdf: false, horario: false },
    session: freshSession(),
    live: freshLive(),
    trace: [],
    stats: { saldo: 0, fatura: 0, fechamento: 0, erros: 0, authFalhas: 0, humanos: 0 },
    typing: false,
    filtro: 'Todas',
    sel: null,
    timer: null,
  };

  const co = () => DATA.empresas[S.session.company];
  const iso = (d) => d.split('/').reverse().join('-');
  // Pendentes da mais urgente para a menos urgente (vencimento mais antigo primeiro).
  const pendentes = (c) => c.faturas.filter((f) => f.status === 'pending').sort((a, b) => iso(a.venc).localeCompare(iso(b.venc)));
  const totalFatura = (f) => f.valor + f.taxa;

  // ---------------------------------------------------------------- mensagens
  function push(conv, m) {
    conv.msgs.push({ t: hhmm(), ...m });
  }

  function reply(msgs) {
    S.typing = true;
    renderChat();
    setTimeout(() => {
      S.typing = false;
      msgs.forEach((m) => push(S.live, { dir: 'out', ...m }));
      renderAll();
    }, 450);
  }

  function msgHTML(m, opt) {
    if (m.dir === 'sys') return `<div class="sys">${m.html}</div>`;
    const mine = opt.phone ? m.dir === 'in' : m.dir !== 'in';
    let who = '';
    if (m.dir === 'agent') who = `<div class="who">${esc(m.who || DATA.atendente)} · Financeiro CP4</div>`;
    else if (m.dir === 'out' && !opt.phone) who = `<div class="who">${m.tpl ? 'Template ' + esc(m.tpl) : 'Assistente'}</div>`;
    else if (m.dir === 'out' && m.tpl) who = `<div class="who">Mensagem automática</div>`;
    let extra = '';
    if (m.doc) extra += `<div class="doc"><span class="docicon">PDF</span><span><strong>${esc(m.doc.name)}</strong><small>${esc(m.doc.meta)}</small></span></div>`;
    if (m.list) {
      extra += `<div class="walist">${m.list.map((r) => `<button type="button" ${opt.phone ? `data-p="${esc(r.p)}" data-l="${esc(r.l)}"` : 'disabled'}><strong>${esc(r.l)}</strong>${r.d ? `<small>${esc(r.d)}</small>` : ''}</button>`).join('')}</div>`;
    }
    let btns = '';
    if (m.buttons) {
      btns = `<div class="wabtns">${m.buttons.map((b) => `<button type="button" ${opt.phone ? `data-p="${esc(b.p)}" data-l="${esc(b.l)}"` : 'disabled'}>${b.p === 'open' ? '↗ ' : ''}${esc(b.l)}</button>`).join('')}</div>`;
    }
    return `<div class="m ${mine ? 'me' : 'them'}${m.dir === 'agent' ? ' agent' : ''}"><div class="bub">${who}${m.html ? `<div class="txt">${m.html}</div>` : ''}${extra}<span class="time">${m.t}</span></div>${btns}</div>`;
  }

  // ---------------------------------------------------------------- bastidores
  function newTrace(text) {
    return {
      id: rid('EVT-'), req: rid('req_'), wamid: rid('wamid.'), t: hhmm(), text,
      intent: '—', by: '—', conf: null, slots: {}, risk: '—', policy: { dec: '—', why: '' }, api: [], resp: '', note: '',
      auth: S.session.auth,
    };
  }

  function api(T, method, path) {
    const down = S.sim.api;
    T.api.push({ method, path, status: down ? 503 : 200, ms: down ? 5000 : 40 + Math.floor(Math.random() * 140) });
    if (down) S.stats.erros++;
    return !down;
  }

  const FALHA = (o) => ({ html: `Não consegui consultar ${o} neste momento. <b>Nenhuma alteração foi realizada.</b><br><br>Você pode tentar de novo em alguns minutos ou falar com o Financeiro CP4.`, buttons: [{ l: 'Falar com financeiro', p: 'i:support.handoff.request' }] });

  function finish(T, msgs, resp) {
    T.resp = resp || T.resp || 'resposta por template fixo';
    T.auth = S.session.auth;
    T.company = S.session.company ? co().nome : '—';
    S.trace.unshift(T);
    reply(msgs);
    renderSide();
  }

  // ---------------------------------------------------------------- entrada
  function inbound(text, payload) {
    if (S.typing) return;
    const ss = S.session;
    const isPin = ss.awaiting?.type === 'pin' && !payload && /^\s*\d[\d\s]{3,9}$/.test(text);
    push(S.live, { dir: 'in', html: isPin ? '••••••' : esc(text) });
    const T = newTrace(isPin ? '•••••• (mascarado)' : text);

    if (ss.mode === 'humano') {
      T.policy = { dec: 'silêncio', why: 'conversa em atendimento humano; o assistente não responde' };
      T.resp = 'mensagem entregue ao atendente';
      S.trace.unshift(T);
      return renderAll();
    }

    if (S.sim.desconhecido) {
      const cls = classify(text);
      T.intent = cls.intent; T.by = cls.by; T.conf = cls.conf; T.risk = INTENTS[cls.intent].risk;
      T.auth = 'A0';
      T.policy = { dec: 'negado', why: 'número sem cadastro verificado (A0); nenhum dado é informado' };
      S.live.status = 'Recusado'; S.live.risco = 'Médio';
      S.live.resumo = 'Número sem cadastro tentou usar o canal. Nenhum dado foi informado.';
      S.trace.unshift(T);
      reply([{ html: 'Este número não está habilitado no <b>Financeiro CP4</b>.<br><br>Para habilitar, entre na plataforma CP4 em <b>Segurança → WhatsApp Financeiro</b>. Se precisar de ajuda, fale com o administrador da sua empresa.' }]);
      return renderSide();
    }

    if (isPin) return pin(text, T);
    if (ss.awaiting?.type === 'pin') ss.awaiting = null; // digitou outra coisa: desiste do PIN

    const cls = payload ? fromPayload(payload, T) : classify(text);
    if (!cls) return; // payload já tratado

    if (!ss.started) {
      ss.started = true;
      if (S.sim.multi) {
        ss.deferred = cls;
        T.intent = cls.intent; T.by = cls.by; T.conf = cls.conf; T.risk = INTENTS[cls.intent].risk;
        T.policy = { dec: 'reforço', why: 'contato vinculado a 2 transportadoras; precisa escolher' };
        return finish(T, [askCompany(true)], 'seleção de transportadora');
      }
      ss.company = 'transcon';
    } else if (!ss.company) {
      T.policy = { dec: 'reforço', why: 'transportadora ainda não escolhida' };
      return finish(T, [askCompany(false)], 'seleção de transportadora');
    }
    route(cls, T, text);
  }

  function fromPayload(p, T) {
    const [k, a, b] = p.split(':');
    if (k === 'i') return { intent: a, by: 'botão', conf: 1, slots: b ? { ref: b } : {} };
    if (k === 'co') { selectCompany(a, T); return null; }
    if (k === 'per') return { intent: 'statement.get', by: 'botão', conf: 1, slots: { period: a } };
    if (k === 'sum') return { intent: 'fuel.period.sum', by: 'botão', conf: 1, slots: { period: a } };
    if (k === 'disp') return { intent: 'support.dispute.open', by: 'botão', conf: 1, slots: { ref: a } };
    if (k === 'mot') return { intent: 'support.dispute.open', by: 'botão', conf: 1, slots: { ref: a, motivo: b } };
    return { intent: 'meta.help', by: 'botão', conf: 1, slots: {} };
  }

  function askCompany(first) {
    return {
      html: `${first ? `Olá, <b>${DATA.contato.primeiro}</b> 👋 Sou o Assistente Financeiro CP4.<br><br>` : ''}Seu número está vinculado a mais de uma transportadora. De qual delas você quer tratar?`,
      list: Object.values(DATA.empresas).map((e) => ({ l: e.nome, d: 'CNPJ ' + e.cnpj, p: 'co:' + e.id })),
    };
  }

  function selectCompany(id, T) {
    const ss = S.session;
    ss.company = id; ss.auth = 'A1'; ss.started = true;
    T.intent = 'session.company.select'; T.by = 'botão'; T.conf = 1; T.risk = 'R0';
    T.slots = { carrier: co().nome };
    const d = ss.deferred; ss.deferred = null;
    if (d && !d.intent.startsWith('meta.') && d.intent !== 'session.company.select') {
      T.note = 'Empresa escolhida; retomando a pergunta original (' + d.intent + ').';
      return route(d, T, '', [{ html: `Certo. Vamos tratar da <b>${co().nome}</b>. A troca de empresa reinicia a autenticação.` }]);
    }
    T.policy = { dec: 'permitido', why: 'vínculo do contato com a transportadora conferido' };
    finish(T, [home(false)], 'menu inicial');
  }

  // ---------------------------------------------------------------- política
  function route(cls, T, text, pre = []) {
    const ss = S.session;
    const def = INTENTS[cls.intent];
    T.intent = cls.intent; T.by = cls.by; T.conf = cls.conf; T.slots = { ...T.slots, ...cls.slots }; T.risk = def.risk;
    if (cls.intent !== 'meta.unknown') ss.unknown = 0;
    if (S.live.status === 'Encerrada') { S.live.status = 'Em andamento (bot)'; S.live.humano = 'Não'; }

    if (def.level > S.sim.nivel) {
      T.policy = { dec: 'negado', why: `exige nível ${NIVEIS[def.level]}; o contato tem ${NIVEIS[S.sim.nivel]}` };
      return finish(T, [...pre, { html: `Seu acesso neste canal é de <b>${NIVEIS[S.sim.nivel]}</b>, e esse pedido exige o nível <b>${NIVEIS[def.level]}</b>.<br><br>O administrador da ${co().nome} pode liberar na plataforma, em Usuários → WhatsApp Financeiro.`, buttons: [{ l: 'Menu', p: 'menu' }] }], 'recusa por permissão');
    }
    if (ss.blocked && def.auth === 'A2') {
      T.policy = { dec: 'negado', why: 'contato bloqueado por PIN incorreto' };
      return finish(T, [...pre, { html: 'As operações com documento estão bloqueadas neste número. Um administrador da sua empresa pode liberar na plataforma.', buttons: [{ l: 'Falar com financeiro', p: 'i:support.handoff.request' }] }], 'recusa por bloqueio');
    }
    if (def.auth === 'A2' && ss.auth !== 'A2') {
      T.policy = { dec: 'reforço', why: 'classe R2 exige PIN financeiro (A2)' };
      ss.awaiting = { type: 'pin', cls };
      return finish(T, [...pre, { html: 'Para continuar, digite seu <b>PIN financeiro</b> de 6 dígitos.<br><small>Ele não fica salvo na conversa.</small>' }], 'pedido de PIN');
    }
    T.policy = { dec: 'permitido', why: `nível ${NIVEIS[S.sim.nivel]} · sessão ${ss.auth} atende ${def.risk} · canal somente consulta` };
    const out = HANDLERS[cls.intent](cls, T, text);
    finish(T, [...pre, ...out.msgs], out.resp);
  }

  function pin(text, T) {
    const ss = S.session;
    const aw = ss.awaiting;
    T.intent = 'session.auth.verify'; T.by = 'estado da sessão'; T.conf = 1; T.risk = '—';
    T.note = 'O PIN não é gravado na conversa, na auditoria nem em log.';
    if (text.replace(/\D/g, '') === DATA.pinDemo) {
      ss.auth = 'A2'; ss.pinTries = 0; ss.awaiting = null;
      T.policy = { dec: 'permitido', why: 'PIN conferido; sessão em A2 por 15 minutos' };
      const out = HANDLERS[aw.cls.intent](aw.cls, T, '');
      T.note += ' Retomado o intent ' + aw.cls.intent + '.';
      return finish(T, out.msgs, out.resp);
    }
    ss.pinTries++; S.stats.authFalhas++;
    if (ss.pinTries >= 3) {
      ss.blocked = true; ss.awaiting = null;
      S.live.status = 'Contato bloqueado'; S.live.risco = 'Crítico';
      S.live.resumo = 'Três PINs incorretos. Operações com documento bloqueadas; administrador da transportadora avisado.';
      T.policy = { dec: 'negado', why: '3 PINs incorretos; contato bloqueado e administrador avisado' };
      return finish(T, [{ html: `Por segurança, bloqueei as operações com documento neste número. Um administrador da ${co().nome} pode liberar na plataforma.<br><br>As consultas de saldo e de fatura continuam disponíveis.` }], 'bloqueio do contato');
    }
    T.policy = { dec: 'negado', why: `PIN incorreto (${ss.pinTries} de 3)` };
    const r = 3 - ss.pinTries;
    finish(T, [{ html: `PIN incorreto. Você tem mais ${r} tentativa${r > 1 ? 's' : ''}.` }], 'PIN incorreto');
  }

  // ---------------------------------------------------------------- respostas
  const head = () => `<b>${co().nome}</b><br>`;
  const MENU = { l: 'Menu', p: 'menu' };

  function home(withHello = true) {
    return {
      html: `${withHello ? `Olá, <b>${DATA.contato.primeiro}</b> 👋<br>Sou o Assistente Financeiro CP4.<br><br>` : ''}Transportadora:<br><b>${co().nome}</b><br><br>Posso te ajudar com:`,
      list: [
        { l: 'Saldo', d: 'Quanto ainda está disponível', p: 'i:account.available.get' },
        { l: 'Faturas', d: 'Fatura atual, vencimento e PDF', p: 'i:cycle.open.get' },
        { l: 'Extrato', d: 'Movimentação da conta corrente', p: 'i:statement.get' },
        { l: 'Abastecimentos', d: 'Últimos abastecimentos e consumo', p: 'i:fuel.latest.list' },
        { l: 'Limite', d: 'Limite total e utilizado', p: 'i:account.limit.get' },
        { l: 'Falar com financeiro', d: 'Atendimento humano CP4', p: 'i:support.handoff.request' },
      ],
    };
  }

  const greet = (text) => {
    const m = norm(text || '').match(/^(bom dia|boa tarde|boa noite)/);
    return m ? `${m[1][0].toUpperCase()}${m[1].slice(1)}, ${DATA.contato.primeiro}.<br><br>` : '';
  };

  const HANDLERS = {
    'meta.greeting': () => ({ msgs: [home()], resp: 'menu inicial' }),
    'meta.help': () => ({ msgs: [home(false)], resp: 'menu inicial' }),
    'meta.thanks': () => ({ msgs: [{ html: 'Por nada! Se precisar, é só chamar.' }], resp: 'texto fixo' }),
    'meta.unknown': () => {
      S.session.unknown++;
      if (S.session.unknown >= 2) {
        return { msgs: [{ html: 'Ainda não consegui entender. Prefere falar com uma pessoa do Financeiro CP4?', buttons: [{ l: 'Falar com financeiro', p: 'i:support.handoff.request' }, MENU] }], resp: 'segunda falha de entendimento: oferta de atendente' };
      }
      const h = home(false);
      h.html = 'Não entendi o que você precisa. Pode escrever de outro jeito ou escolher uma opção:';
      return { msgs: [h], resp: 'não entendido: menu' };
    },

    'account.available.get': (cls, T, text) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/account`)) return { msgs: [FALHA('seu saldo')], resp: 'falha de serviço' };
      S.stats.saldo++;
      const a = co().conta;
      return {
        msgs: [{ html: `${greet(text)}${head()}<br>Saldo disponível:<br><b class="big">${brl(a.disponivel)}</b><br><br>Limite total:<br>${brl(a.limite)}<br><br>Utilizado:<br>${brl(a.limite - a.disponivel)}<br><br><small>Posição atualizada às ${hhmm()}.</small>`, buttons: [{ l: 'Fatura atual', p: 'i:cycle.open.get' }, { l: 'Abastecimentos', p: 'i:fuel.latest.list' }, { l: 'Extrato', p: 'i:statement.get' }] }],
        resp: 'template saldo',
      };
    },

    'account.limit.get': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/account`)) return { msgs: [FALHA('seu limite')], resp: 'falha de serviço' };
      const a = co().conta; const u = a.limite - a.disponivel;
      return { msgs: [{ html: `${head()}<br>Limite total:<br><b class="big">${brl(a.limite)}</b><br><br>Utilizado: ${brl(u)} (${dec(u / a.limite * 100)}%)<br>Disponível: ${brl(a.disponivel)}<br><br><small>Posição atualizada às ${hhmm()}. Alteração de limite é feita só pela plataforma.</small>`, buttons: [{ l: 'Saldo após fatura', p: 'i:account.projection.get' }, MENU] }], resp: 'template limite' };
    },

    'account.projection.get': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/account/projection`)) return { msgs: [FALHA('a projeção')], resp: 'falha de serviço' };
      const c = co(); const p = pendentes(c);
      if (!p.length) return { msgs: [{ html: `${head()}<br>Você não tem fatura pendente. Seu disponível hoje é <b>${brl(c.conta.disponivel)}</b>.` }], resp: 'template projeção' };
      const volta = p.reduce((s, f) => s + f.valor, 0);
      const proj = Math.min(c.conta.disponivel + volta, c.conta.limite);
      return { msgs: [{ html: `${head()}<br>Disponível hoje:<br>${brl(c.conta.disponivel)}<br><br>Volta ao limite com o pagamento de ${p.length} fatura${p.length > 1 ? 's' : ''}:<br>${brl(volta)}<br><br>Disponível após o pagamento:<br><b class="big">${brl(proj)}</b><br><br><small>É uma projeção. Novos abastecimentos reduzem esse valor, e o disponível nunca passa do limite de ${brl(c.conta.limite)}.</small>`, buttons: [{ l: 'Receber PDF', p: 'i:invoice.document.send:' + p[0].num }, MENU] }], resp: 'template projeção' };
    },

    'cycle.open.get': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/open-cycle`)) return { msgs: [FALHA('sua fatura')], resp: 'falha de serviço' };
      const cy = co().ciclo;
      if (!cy.valor) return { msgs: [{ html: `${head()}<br>Seu novo ciclo começou em ${cy.inicio} e ainda não tem abastecimentos.<br>Fechamento previsto: ${cy.fechamento}`, buttons: [{ l: 'Minhas faturas', p: 'i:invoice.list' }, MENU] }], resp: 'template ciclo vazio' };
      return {
        msgs: [{ html: `${head()}<b>Fatura atual</b> (ciclo em aberto)<br><br>Período:<br>${cy.inicio} a ${cy.fim}<br><br>Valor acumulado:<br><b class="big">${brl(cy.valor)}</b><br>${cy.qtd} abastecimentos<br><br>Fechamento:<br>${cy.fechamento}<br><br>Vencimento:<br>${cy.vencimento}<br><br><small>Valor dos abastecimentos, ainda sem a taxa do faturamento.</small><br><br>Quer consultar os lançamentos dessa fatura?`, buttons: [{ l: 'Ver lançamentos', p: 'i:cycle.open.entries' }, { l: 'Antecipar fechamento', p: 'i:cycle.close.request' }, { l: 'Faturas fechadas', p: 'i:invoice.list' }] }],
        resp: 'template ciclo em aberto',
      };
    },

    'cycle.open.entries': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/open-cycle/entries`)) return { msgs: [FALHA('os lançamentos')], resp: 'falha de serviço' };
      const c = co();
      const linhas = c.abastecimentos.map((a) => `${a.quando} · ${a.placa}<br>${esc(a.posto)}<br><b>${brl(a.valor)}</b>`).join('<br><br>');
      const resto = c.ciclo.qtd - c.abastecimentos.length;
      return { msgs: [{ html: `${head()}<b>Lançamentos do ciclo</b><br><br>${linhas}${resto > 0 ? `<br><br><small>e mais ${resto} lançamentos anteriores.</small>` : ''}<br><br>Total do ciclo: <b>${brl(c.ciclo.valor)}</b>`, buttons: [{ l: 'Não reconheço um deles', p: 'i:support.dispute.open' }, MENU] }], resp: 'template lançamentos' };
    },

    'invoice.list': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/invoices`)) return { msgs: [FALHA('suas faturas')], resp: 'falha de serviço' };
      const c = co(); const p = pendentes(c);
      return { msgs: [{ html: `${head()}<br>${p.length ? `Você tem <b>${p.length} fatura${p.length > 1 ? 's' : ''} pendente${p.length > 1 ? 's' : ''}</b>.` : 'Você não tem fatura pendente.'} Toque em uma para receber o PDF:`, list: c.faturas.map((f) => ({ l: f.num, d: `${brl(totalFatura(f))} · vence ${f.venc} · ${f.situacao}`, p: 'i:invoice.document.send:' + f.num })) }], resp: 'template lista de faturas' };
    },

    'invoice.status.get': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/invoices?limit=1`)) return { msgs: [FALHA('sua fatura')], resp: 'falha de serviço' };
      const c = co(); const f = c.faturas[0]; const cy = c.ciclo;
      return { msgs: [{ html: `${head()}<br>Última fatura fechada:<br><b>${f.num}</b> · período ${f.periodo}<br>${brl(totalFatura(f))} · ${f.situacao}<br><br>O ciclo atual (${cy.inicio} a ${cy.fim}) <b>ainda está aberto</b> e fecha em ${cy.fechamento}.`, buttons: [{ l: 'Fatura atual', p: 'i:cycle.open.get' }, { l: 'Receber PDF', p: 'i:invoice.document.send:' + f.num }] }], resp: 'template situação da fatura' };
    },

    'invoice.due.get': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/invoices?status=pending`)) return { msgs: [FALHA('o vencimento')], resp: 'falha de serviço' };
      const c = co(); const p = pendentes(c); const cy = c.ciclo;
      const prox = `Próxima fatura (ciclo em aberto): fecha em ${cy.fechamento} e vence em <b>${cy.vencimento}</b>.`;
      if (!p.length) return { msgs: [{ html: `${head()}<br>Você não tem fatura pendente.<br><br>${prox}` }], resp: 'template vencimento' };
      const f = p[0];
      return { msgs: [{ html: `${head()}<br>Fatura <b>${f.num}</b><br>Valor: <b>${brl(totalFatura(f))}</b><br>Vencimento: <b>${f.venc}</b><br>${f.vencida ? '⚠️ ' : ''}${f.situacao}<br><br>${prox}`, buttons: [{ l: 'Receber PDF', p: 'i:invoice.document.send:' + f.num }, MENU] }], resp: 'template vencimento' };
    },

    'invoice.document.send': (cls, T) => {
      const c = co(); const f = c.faturas.find((x) => x.num === cls.slots.ref) || pendentes(c)[0] || c.faturas[0];
      T.slots = { ...T.slots, invoice: f.num };
      if (!api(T, 'GET', `/internal/v1/carriers/${c.id}/invoices/${f.num}/document`)) return { msgs: [FALHA('sua fatura')], resp: 'falha de serviço' };
      if (S.sim.pdf) {
        T.api[T.api.length - 1].status = 500; S.stats.erros++;
        return { msgs: [{ html: 'Não consegui gerar o PDF da fatura agora. <b>Nenhuma alteração foi realizada.</b><br><br>Posso tentar de novo ou você pode falar com o Financeiro CP4.', buttons: [{ l: 'Tentar de novo', p: 'i:invoice.document.send:' + f.num }, { l: 'Falar com financeiro', p: 'i:support.handoff.request' }] }], resp: 'falha na geração do PDF' };
      }
      S.stats.fatura++;
      return { msgs: [{ html: `${head()}Fatura <b>${f.num}</b><br>Período ${f.periodo}<br>${brl(totalFatura(f))} · vence ${f.venc}`, doc: { name: `fatura_${f.num}.pdf`, meta: 'PDF · 2 páginas · 148 KB' }, buttons: [MENU] }], resp: 'documento por URL assinada de uso único' };
    },

    'invoice.payment.send': (cls, T) => {
      const c = co(); const f = c.faturas.find((x) => x.num === cls.slots.ref && x.status === 'pending') || pendentes(c)[0];
      T.note = 'A CP4 não emite boleto hoje (sem cobrança registrada). O canal orienta pelo PDF da fatura.';
      if (!f) return { msgs: [{ html: `${head()}<br>Você não tem fatura pendente no momento.`, buttons: [MENU] }], resp: 'sem fatura pendente' };
      return { msgs: [{ html: `${head()}<br>O boleto não está disponível por este canal. Os dados para pagamento da fatura <b>${f.num}</b> (${brl(totalFatura(f))}, vence ${f.venc}) estão no PDF da fatura.`, buttons: [{ l: 'Receber PDF', p: 'i:invoice.document.send:' + f.num }, { l: 'Falar com financeiro', p: 'i:support.handoff.request' }] }], resp: 'orientação: boleto fora do canal' };
    },

    'invoice.overdue.list': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/pending`)) return { msgs: [FALHA('suas pendências')], resp: 'falha de serviço' };
      const c = co(); const v = pendentes(c).filter((f) => f.vencida); const hoje = pendentes(c).filter((f) => !f.vencida);
      if (!v.length) {
        return { msgs: [{ html: `${head()}<br>✅ Você <b>não tem pagamentos em atraso</b>.${hoje.length ? `<br><br>Fatura pendente: <b>${hoje[0].num}</b>, ${brl(totalFatura(hoje[0]))}. ${hoje[0].situacao} (${hoje[0].venc}).` : ''}`, buttons: hoje.length ? [{ l: 'Receber PDF', p: 'i:invoice.document.send:' + hoje[0].num }, MENU] : [MENU] }], resp: 'template pendências' };
      }
      const tot = v.reduce((s, f) => s + totalFatura(f), 0);
      return { msgs: [{ html: `${head()}<br>⚠️ Você tem <b>${v.length} fatura vencida</b>:<br><br>${v.map((f) => `<b>${f.num}</b><br>${brl(totalFatura(f))} · venceu em ${f.venc}<br>${f.situacao}`).join('<br><br>')}<br><br>Total em atraso: <b>${brl(tot)}</b><br><br><small>Encargos por atraso são calculados pelo Financeiro CP4.</small>`, buttons: [{ l: 'Receber PDF', p: 'i:invoice.document.send:' + v[0].num }, { l: 'Falar com financeiro', p: 'i:support.handoff.request' }] }], resp: 'template pendências' };
    },

    'statement.get': (cls, T) => {
      const per = cls.slots.period;
      if (!per) return { msgs: [{ html: `${head()}<br>De qual período você quer o extrato?`, buttons: [{ l: '7 dias', p: 'per:7 dias' }, { l: '30 dias', p: 'per:30 dias' }, { l: 'Mês atual', p: 'per:Mês atual' }] }], resp: 'pergunta de período' };
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/statement?period=${encodeURIComponent(per)}`)) return { msgs: [FALHA('seu extrato')], resp: 'falha de serviço' };
      const e = co().extrato; const tot = e.totais[per];
      const linhas = e.itens.map((i) => `${i.quando} · <b>${i.valor < 0 ? '−' : '+'} ${brl(Math.abs(i.valor))}</b><br><small>${esc(i.desc)}<br>Saldo após: ${brl(i.saldo)}</small>`).join('<br>');
      return { msgs: [{ html: `${head()}<b>Extrato · ${esc(per)}</b><br><br>Saídas: ${brl(tot.saidas)}<br>Entradas: ${brl(tot.entradas)}<br><br>Últimos lançamentos:<br>${linhas}`, buttons: [{ l: 'Receber em PDF', p: 'i:statement.document.send' }, MENU] }], resp: 'template extrato' };
    },

    'statement.document.send': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/statement/document`)) return { msgs: [FALHA('seu extrato')], resp: 'falha de serviço' };
      if (S.sim.pdf) {
        T.api[T.api.length - 1].status = 500; S.stats.erros++;
        return { msgs: [{ html: 'Não consegui gerar o PDF do extrato agora. <b>Nenhuma alteração foi realizada.</b>', buttons: [{ l: 'Tentar de novo', p: 'i:statement.document.send' }, MENU] }], resp: 'falha na geração do PDF' };
      }
      return { msgs: [{ html: `${head()}Extrato da conta corrente · últimos 30 dias`, doc: { name: `extrato_${co().id}_2026-10-02.pdf`, meta: 'PDF · 4 páginas · 210 KB' }, buttons: [MENU] }], resp: 'documento por URL assinada de uso único' };
    },

    'fuel.latest.list': (cls, T) => {
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/fuelings?limit=5`)) return { msgs: [FALHA('seus abastecimentos')], resp: 'falha de serviço' };
      const c = co();
      const linhas = c.abastecimentos.map((a) => `${a.quando} · <b>${a.placa}</b><br>${esc(a.posto)}<br>${esc(a.item)}<br><b>${brl(a.valor)}</b>`).join('<br><br>');
      return { msgs: [{ html: `${head()}<b>Últimos abastecimentos</b><br><br>${linhas}`, buttons: [{ l: 'Consumo do mês', p: 'sum:mes' }, { l: 'Não reconheço um deles', p: 'i:support.dispute.open' }, MENU] }], resp: 'template abastecimentos' };
    },

    'fuel.period.sum': (cls, T) => {
      const per = (cls.slots.period || cls.slots.ref) === 'hoje' ? 'hoje' : 'mes';
      if (!api(T, 'GET', `/internal/v1/carriers/${co().id}/fuelings/summary?period=${per === 'hoje' ? 'today' : 'month'}`)) return { msgs: [FALHA('seu consumo')], resp: 'falha de serviço' };
      const k = co().consumo;
      if (per === 'hoje') return { msgs: [{ html: `${head()}<b>Hoje, ${DATA.hoje}</b><br><br>Total abastecido:<br><b class="big">${brl(k.hoje.valor)}</b><br>${dec(k.hoje.litros)} L em ${k.hoje.qtd} abastecimento${k.hoje.qtd > 1 ? 's' : ''}<br><br><small>Posição atualizada às ${hhmm()}.</small>`, buttons: [{ l: 'Ver abastecimentos', p: 'i:fuel.latest.list' }, { l: 'Consumo do mês', p: 'sum:mes' }] }], resp: 'template consumo do dia' };
      return { msgs: [{ html: `${head()}<b>Consumo de ${k.mes.nome}</b> (até ${DATA.hoje})<br><br>Total abastecido:<br><b class="big">${brl(k.mes.valor)}</b><br>${dec(k.mes.litros)} L em ${k.mes.qtd} abastecimentos<br><br>${k.anterior.nome[0].toUpperCase() + k.anterior.nome.slice(1)} inteiro:<br>${brl(k.anterior.valor)} · ${dec(k.anterior.litros)} L · ${k.anterior.qtd} abastecimentos`, buttons: [{ l: 'Ver abastecimentos', p: 'i:fuel.latest.list' }, { l: 'Gasto de hoje', p: 'sum:hoje' }] }], resp: 'template consumo do mês' };
    },

    // Contestação: o canal só coleta abastecimento e motivo e transfere. Não abre protocolo nem bloqueia nada.
    'support.dispute.open': (cls, T) => {
      const c = co();
      if (!cls.slots.ref) {
        if (!api(T, 'GET', `/internal/v1/carriers/${c.id}/fuelings?limit=5`)) return { msgs: [FALHA('seus abastecimentos')], resp: 'falha de serviço' };
        return { msgs: [{ html: 'Sinto muito por isso. Para eu passar ao Financeiro CP4 já com os dados, qual abastecimento você não reconhece?', list: [...c.abastecimentos.map((a) => ({ l: `#${a.id} · ${brl(a.valor)}`, d: `${a.quando} · ${a.placa} · ${a.posto}`, p: 'disp:' + a.id })), { l: 'É outro assunto', d: 'Falar direto com o financeiro', p: 'i:support.handoff.request' }] }], resp: 'triagem: qual abastecimento' };
      }
      const a = c.abastecimentos.find((x) => String(x.id) === String(cls.slots.ref));
      if (!cls.slots.motivo) {
        return { msgs: [{ html: `Pedido <b>#${a.id}</b> · ${a.quando} · ${esc(a.posto)} · ${a.placa} · ${brl(a.valor)}<br><br>O que aconteceu?`, buttons: [{ l: 'Não fui eu', p: `mot:${a.id}:naofui` }, { l: 'Valor ou litros errados', p: `mot:${a.id}:valor` }, { l: 'Outro motivo', p: `mot:${a.id}:outro` }] }], resp: 'triagem: motivo' };
      }
      const MOT = { naofui: 'não reconhece o abastecimento ("não fui eu")', valor: 'valor ou litros divergentes', outro: 'outro motivo' };
      const naoFui = cls.slots.motivo === 'naofui';
      const out = handoff(T, 'Contestação de abastecimento', `Contesta o pedido #${a.id} (${a.quando}, ${a.posto}, placa ${a.placa}, ${brl(a.valor)}). Motivo: ${MOT[cls.slots.motivo]}.`, naoFui ? 'Alto' : 'Médio');
      if (naoFui) out.msgs.push({ html: 'Se o veículo <b>não estava</b> com sua empresa nesse horário, recomendamos bloqueá-lo agora na plataforma CP4, em Frota → Veículos. O bloqueio não é feito por aqui.' });
      return out;
    },

    'support.payment.issue': (cls, T, text) => {
      const p = pendentes(co())[0];
      return handoff(T, 'Divergência de cobrança ou pagamento', `Cliente escreveu: "${text}". ${p ? 'Fatura pendente: ' + p.num + '.' : ''}`, 'Alto');
    },

    'support.handoff.request': (cls, T) => handoff(T, 'Pedido de atendimento humano', 'Cliente pediu para falar com o Financeiro CP4.', 'Médio'),

    // Fechamento antecipado: o canal mostra o ciclo e transfere. O financeiro executa no Admin, como hoje.
    'cycle.close.request': (cls, T) => {
      const c = co(); const cy = c.ciclo;
      if (!api(T, 'GET', `/internal/v1/carriers/${c.id}/open-cycle`)) return { msgs: [FALHA('sua fatura')], resp: 'falha de serviço' };
      T.note = 'Canal somente consulta: nenhuma chamada de escrita. Se o cliente quiser, a conversa vai para o Financeiro CP4.';
      if (!cy.valor) return { msgs: [{ html: `${head()}<br>O ciclo atual ainda não tem abastecimentos, então não há o que fechar.`, buttons: [MENU] }], resp: 'ciclo vazio' };
      const taxa = Math.round(cy.valor * cy.taxaPct) / 100;
      const vencida = pendentes(c).some((f) => f.vencida);
      return {
        msgs: [{ html: `${head()}<b>Fatura atual</b> (ciclo em aberto)<br><br>Período: ${cy.inicio} até hoje<br>Abastecimentos: ${brl(cy.valor)} (${cy.qtd})<br>Taxa estimada (${dec(cy.taxaPct)}%): ${brl(taxa)}<br>Total estimado: <b>${brl(cy.valor + taxa)}</b><br><br>O fechamento antecipado é feito pelo <b>Financeiro CP4</b>. Lembre que fechar <b>não libera limite</b>: o limite volta quando a fatura é paga.${vencida ? '<br><br>⚠️ Existe uma fatura vencida nesta conta; o financeiro vai tratar as duas juntas.' : ''}<br><br>Quer que eu passe seu pedido ao financeiro?`, buttons: [{ l: 'Falar com o financeiro', p: 'i:support.closure.handoff' }, MENU] }],
        resp: 'informativo do ciclo + oferta de atendente',
      };
    },

    'support.closure.handoff': (cls, T) => {
      const cy = co().ciclo;
      S.stats.fechamento++;
      return handoff(T, 'Pedido de fechamento antecipado', `Pede fechamento antecipado do ciclo ${cy.inicio}–hoje: ${brl(cy.valor)} em ${cy.qtd} abastecimentos (taxa ainda estimada).`, 'Alto');
    },

    'session.company.select': () => {
      if (!S.sim.multi) return { msgs: [{ html: `Seu número está vinculado só à <b>${co().nome}</b>.` }], resp: 'texto fixo' };
      S.session.company = null; S.session.auth = 'A1';
      return { msgs: [askCompany(false)], resp: 'seleção de transportadora' };
    },

    'session.end': () => {
      S.session.auth = 'A1';
      return { msgs: [{ html: 'Sessão encerrada. Quando precisar, é só mandar uma mensagem.' }], resp: 'texto fixo' };
    },
  };

  // ---------------------------------------------------------------- transbordo
  function handoff(T, motivo, resumo, risco) {
    const L = S.live;
    L.resumo = resumo; L.risco = risco; L.motivo = motivo;
    S.stats.humanos++;
    T.note = 'Contexto enviado à Central: resumo, posição financeira e histórico da conversa.';
    if (S.sim.horario) {
      L.status = 'Aguardando (fora do horário)'; L.humano = 'Na fila';
      return { msgs: [{ html: `Registrei seu pedido: <b>${esc(motivo)}</b>.<br><br>O atendimento humano funciona de segunda a sexta, das 8h às 18h. O Financeiro CP4 responde por aqui no próximo dia útil, a partir das 8h.<br><br>As consultas automáticas continuam funcionando.`, buttons: [MENU] }, { dir: 'sys', html: 'Atendimento registrado · retorno no próximo dia útil' }], resp: 'transbordo fora do horário' };
    }
    L.status = 'Aguardando atendente'; L.humano = 'Na fila';
    return { msgs: [{ html: `Certo. Vou te passar para o <b>Financeiro CP4</b>.<br><br>Já enviei para a equipe o assunto (<b>${esc(motivo)}</b>) e o histórico desta conversa. Você não precisa explicar de novo.` }, { dir: 'sys', html: 'Conversa na fila do Financeiro CP4 · posição 3 · espera estimada de 4 min' }], resp: 'transbordo com contexto' };
  }

  // ---------------------------------------------------------------- telefone
  function renderChat() {
    const el = $('#chat');
    const msgs = S.live.msgs;
    let html = '<div class="daychip">HOJE</div><div class="sys enc">As mensagens são protegidas. Esta conta comercial usa um serviço seguro da CP4 para gerenciar a conversa.</div>';
    if (!msgs.length) html += '<div class="hint">Envie uma mensagem para começar.<br>Experimente “Bom dia, quanto ainda tenho disponível?”</div>';
    html += msgs.map((m) => msgHTML(m, { phone: true })).join('');
    if (S.typing) html += '<div class="m them"><div class="bub typing"><i></i><i></i><i></i></div></div>';
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
    $('#wa-status').textContent = S.session.mode === 'humano' ? `${DATA.atendente} · atendimento humano` : S.typing ? 'digitando…' : 'conta comercial';
    $('#wa-text').placeholder = S.session.awaiting?.type === 'pin' ? 'Digite seu PIN' : 'Mensagem';
  }

  function renderSide() {
    const T = S.trace[0];
    const pipe = $('#pipe');
    if (!T) {
      pipe.innerHTML = '<li class="empty">Envie uma mensagem para ver cada etapa: webhook, sessão, intenção, política, API CP4, resposta e auditoria.</li>';
    } else {
      const pol = T.policy.dec;
      const polCls = pol === 'permitido' ? 'ok' : pol === 'negado' ? 'bad' : 'warn';
      const slots = Object.entries(T.slots || {}).map(([k, v]) => `${k}=${v}`).join(', ');
      pipe.innerHTML = `
        <li><b>WhatsApp → Webhook</b><span>“${esc(T.text)}”</span><span class="mono">${T.wamid} · assinatura válida · sem duplicidade</span></li>
        <li><b>Sessão</b><span>${S.sim.desconhecido ? 'Número sem cadastro' : `${esc(DATA.contato.nome)} · ${esc(T.company || '—')}`}</span><span>Nível ${S.sim.desconhecido ? '—' : NIVEIS[S.sim.nivel]} · autenticação <span class="tag">${T.auth}</span></span></li>
        <li><b>Intenção</b><span class="mono">${esc(T.intent)}</span><span>Origem: ${esc(T.by)}${T.conf != null ? ` · confiança ${dec(T.conf * 100, 0)}%` : ''}${slots ? ` · ${esc(slots)}` : ''}</span></li>
        <li><b>Política</b><span>Risco ${T.risk} · <span class="tag ${polCls}">${esc(pol)}</span></span><span>${esc(T.policy.why)}</span></li>
        <li><b>API CP4</b>${T.api.length ? T.api.map((a) => `<span class="mono">${a.method} ${esc(a.path)}</span><span><span class="tag ${a.status < 300 ? 'ok' : 'bad'}">${a.status}</span> ${a.status === 503 ? 'tempo esgotado' : a.ms + ' ms'}</span>`).join('') : '<span>Nenhuma chamada ao financeiro.</span>'}</li>
        <li><b>Resposta</b><span>${esc(T.resp)}</span><span>Valores vindos da API; texto de template fixo.</span>${T.note ? `<span class="note">${esc(T.note)}</span>` : ''}</li>
        <li><b>Auditoria</b><span class="mono">${T.id} · ${T.req}</span><span>conversation_id conv_live_0210 · tenant ${esc(T.company || '—')}</span></li>`;
    }
    $('#audit tbody').innerHTML = S.trace.slice(0, 12).map((t) => `<tr><td>${t.t}</td><td class="mono">${esc(t.intent)}</td><td>${t.auth}</td><td>${esc(t.policy.dec)}</td><td>${t.api.length ? t.api.map((a) => a.status).join(', ') : '—'}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Sem eventos ainda.</td></tr>';

    const pend = $('#pendente');
    if (S.live.humano === 'Na fila') {
      pend.innerHTML = `<div class="pendbox"><strong>Conversa na fila do Financeiro CP4</strong><span>${esc(S.live.motivo || 'Atendimento humano')}. Abra a Central para ver o contexto que o atendente recebe.</span><button class="btn primary" id="btn-go">Ir para a Central</button></div>`;
      $('#btn-go').onclick = () => { show('central'); openConv('live'); };
    } else pend.innerHTML = '';
  }

  // ---------------------------------------------------------------- central
  function liveRow() {
    const L = S.live; const c = S.session.company ? co() : null;
    const last = [...L.msgs].reverse().find((m) => m.dir === 'in');
    const fila = pendentes(c || { faturas: [] });
    return {
      ...L,
      empresa: S.sim.desconhecido ? 'Número não cadastrado' : c ? c.nome : '(identificando)',
      cnpj: c && !S.sim.desconhecido ? c.cnpj : '—',
      contato: S.sim.desconhecido ? '—' : DATA.contato.nome,
      nivel: S.sim.desconhecido ? '—' : NIVEIS[S.sim.nivel],
      fone: DATA.contato.fone,
      ultima: last ? last.html : '—',
      intent: S.trace[0]?.intent || '—',
      hora: last ? last.t : '—',
      conta: c && !S.sim.desconhecido ? { disponivel: c.conta.disponivel, limite: c.conta.limite, fatura: c.ciclo.valor, venc: c.ciclo.vencimento, situacao: fila.some((f) => f.vencida) ? '1 fatura vencida' : fila.length ? `Em dia · ${fila.length} fatura pendente` : 'Em dia' } : null,
      responsavel: c ? c.responsavel : '—',
      abastecimentos: c && !S.sim.desconhecido ? c.abastecimentos.slice(0, 3).map((a) => `${a.quando} · ${a.placa} · ${brl(a.valor)}`) : [],
    };
  }

  const allConvs = () => (S.live.msgs.length ? [liveRow(), ...DATA.conversas] : DATA.conversas);
  const naFila = (c) => c.humano === 'Na fila';
  const aberta = (c) => !/Resolvido|Encerrada|Recusado/.test(c.status);
  const riscoCls = { Baixo: 'ok', 'Médio': 'warn', Alto: 'bad', 'Crítico': 'crit' };

  function renderCentral() {
    const k = DATA.kpis; const st = S.stats; const on = S.live.msgs.length ? 1 : 0;
    const liveOpen = on && aberta(S.live) ? 1 : 0;
    const cards = [
      ['Conversas hoje', k.conversas + on],
      ['Conversas abertas', k.abertas + liveOpen],
      ['Atendimentos humanos', k.humanos + st.humanos],
      ['Consultas de saldo', k.saldo + st.saldo],
      ['Solicitações de fatura', k.fatura + st.fatura],
      ['Pedidos de fechamento', k.fechamento + st.fechamento, '', 'tratados pelo financeiro'],
      ['Erros', k.erros + st.erros, st.erros ? 'bad' : ''],
      ['Autenticações falhas', k.authFalhas + st.authFalhas, st.authFalhas ? 'warn' : ''],
      ['SLA 1ª resposta humana', k.sla, '', 'meta: 5 min'],
      ['Tempo médio de atendimento', k.tma],
    ];
    $('#kpis').innerHTML = cards.map(([l, v, cls, sub]) => `<div class="kpi ${cls || ''}"><span>${l}</span><strong>${v}</strong>${sub ? `<small>${sub}</small>` : ''}</div>`).join('');

    const filtros = ['Todas', 'Abertas', 'Fila humana', 'Risco alto'];
    $('#filtros').innerHTML = filtros.map((f) => `<button class="fbtn" aria-pressed="${S.filtro === f}" data-f="${f}">${f}</button>`).join('');
    const list = allConvs().filter((c) => S.filtro === 'Todas' || (S.filtro === 'Abertas' && aberta(c)) || (S.filtro === 'Fila humana' && (naFila(c) || c.status === 'Em atendimento')) || (S.filtro === 'Risco alto' && /Alto|Crítico/.test(c.risco)));
    $('#convs tbody').innerHTML = list.map((c) => `
      <tr data-id="${c.id}" tabindex="0">
        <td><strong>${esc(c.empresa)}</strong>${c.live ? ' <span class="tag live">ao vivo</span>' : ''}</td>
        <td>${esc(c.contato)}<small>${esc(c.nivel)}</small></td>
        <td class="mono">${esc(c.fone)}</td>
        <td class="ult">${c.ultima}</td>
        <td class="mono">${esc(c.intent)}</td>
        <td>${esc(c.status)}</td>
        <td><span class="tag ${riscoCls[c.risco]}">${c.risco}</span></td>
        <td>${esc(c.humano)}</td>
        <td>${c.hora}</td>
        <td><button class="btn small" data-open="${c.id}">Abrir</button></td>
      </tr>`).join('') || '<tr><td colspan="10" class="muted">Nenhuma conversa neste filtro.</td></tr>';

    const fila = allConvs().filter(naFila).length;
    const b = $('#tab-fila'); b.hidden = !fila; b.textContent = fila;
    if (S.sel) renderDetalhe();
  }

  const getConv = (id) => (id === 'live' ? liveRow() : DATA.conversas.find((c) => c.id === id));
  const rawConv = (id) => (id === 'live' ? S.live : DATA.conversas.find((c) => c.id === id));

  function openConv(id) {
    S.sel = id;
    $('#central-lista').hidden = true;
    $('#central-detalhe').hidden = false;
    renderDetalhe();
  }

  function renderDetalhe() {
    const c = getConv(S.sel); const raw = rawConv(S.sel);
    const assumida = c.status === 'Em atendimento';
    const encerrada = c.status === 'Encerrada';
    const a = c.conta;
    $('#central-detalhe').innerHTML = `
      <div class="pagehead">
        <div><button class="btn ghost" id="voltar">← Conversas</button></div>
        <div class="row">
          <span class="tag ${riscoCls[c.risco]}">Risco ${c.risco}</span>
          <span class="tag">${esc(c.status)}</span>
        </div>
      </div>
      <div class="det">
        <section class="card flush convcol">
          <div class="cardhead"><div><h2>${esc(c.empresa)}</h2><span class="muted small">${esc(c.contato)} · ${esc(c.fone)} · intent atual <span class="mono">${esc(c.intent)}</span></span></div></div>
          <div class="resumo"><strong>Resumo para o atendente</strong><p>${esc(c.resumo)}</p></div>
          <div class="timeline" id="tl">${c.msgs.map((m) => msgHTML(m, { phone: false })).join('')}</div>
          <form class="composer" id="composer">
            <input id="ag-text" type="text" placeholder="${assumida ? 'Responder ao cliente' : 'Assuma o atendimento para responder'}" ${assumida ? '' : 'disabled'} aria-label="Mensagem do atendente">
            <button class="btn primary" ${assumida ? '' : 'disabled'}>Enviar mensagem</button>
          </form>
          <p class="muted small pad">Janela de 24 horas aberta: resposta livre permitida. Depois dela, só template aprovado.</p>
        </section>
        <aside class="panel">
          <section class="card">
            <h2>Transportadora</h2>
            <dl class="dl">
              <dt>Transportadora</dt><dd>${esc(c.empresa)}</dd>
              <dt>CNPJ</dt><dd class="mono">${esc(c.cnpj)}</dd>
              <dt>Responsável</dt><dd>${esc(c.responsavel || c.contato)}</dd>
              <dt>Contato</dt><dd>${esc(c.contato)}</dd>
              <dt>Permissões</dt><dd>${esc(c.nivel)}</dd>
              <dt>Telefone</dt><dd class="mono">${esc(c.fone)}</dd>
            </dl>
          </section>
          <section class="card">
            <h2>Posição financeira</h2>
            ${a ? `<dl class="dl">
              <dt>Saldo disponível</dt><dd><strong>${brl(a.disponivel)}</strong></dd>
              <dt>Limite</dt><dd>${brl(a.limite)}</dd>
              <dt>Fatura atual</dt><dd>${brl(a.fatura)}</dd>
              <dt>Vencimento</dt><dd>${a.venc}</dd>
              <dt>Status financeiro</dt><dd>${esc(a.situacao)}</dd>
            </dl>
            <p class="muted small" id="consulta">${raw.consulta ? esc(raw.consulta) : 'Posição carregada na abertura da conversa.'}</p>
            <h3>Últimos abastecimentos</h3>
            <ul class="mini">${c.abastecimentos.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>—</li>'}</ul>` : '<p class="muted">Número sem cadastro. Nenhum dado financeiro é exibido para esta conversa.</p>'}
          </section>
          <section class="card">
            <h2>Ações</h2>
            ${c.motivo === 'Pedido de fechamento antecipado' || c.intent === 'cycle.close.request' ? '<p class="muted small">O fechamento é executado no Admin CP4, pelo processo atual. Registre aqui o resultado ao responder o cliente.</p>' : ''}
            ${/Contestação/.test(c.motivo || '') || c.intent === 'support.dispute.open' ? '<p class="muted small">A análise da contestação segue o processo atual do financeiro. O canal não bloqueia veículo nem estorna.</p>' : ''}
            <div class="acts">
              <button class="btn primary" data-act="assumir" ${assumida || encerrada ? 'disabled' : ''}>Assumir atendimento</button>
              <button class="btn" data-act="fatura" ${a ? '' : 'disabled'}>Enviar fatura</button>
              <button class="btn" data-act="conta" ${a ? '' : 'disabled'}>Consultar conta</button>
              <button class="btn danger" data-act="encerrar" ${encerrada ? 'disabled' : ''}>Encerrar atendimento</button>
            </div>
            <h3>Ações registradas</h3>
            <ul class="mini">${(raw.log || []).map((x) => `<li>${esc(x)}</li>`).join('') || '<li class="muted">Nenhuma ação do atendente ainda.</li>'}</ul>
          </section>
        </aside>
      </div>`;
    const tl = $('#tl'); tl.scrollTop = tl.scrollHeight;
  }

  function act(name) {
    const raw = rawConv(S.sel); const c = getConv(S.sel); const who = DATA.atendente;
    raw.log = raw.log || [];
    const log = (s) => raw.log.push(`${hhmm()} · ${who} ${s}`);
    if (name === 'assumir') {
      raw.status = 'Em atendimento'; raw.humano = who;
      push(raw, { dir: 'sys', html: `${who} assumiu o atendimento` });
      if (raw.live) S.session.mode = 'humano';
      log('assumiu o atendimento');
    } else if (name === 'encerrar') {
      raw.status = 'Encerrada'; raw.humano = 'Encerrado';
      push(raw, { dir: 'sys', html: 'Atendimento encerrado. O assistente voltou a responder.' });
      if (raw.live) S.session.mode = 'bot';
      log('encerrou o atendimento');
    } else if (name === 'fatura') {
      const num = raw.live ? (pendentes(co())[0] || co().faturas[0]).num : 'INV-20260928-0000';
      push(raw, { dir: 'agent', who, html: `Segue a fatura <b>${num}</b>.`, doc: { name: `fatura_${num}.pdf`, meta: 'PDF · 2 páginas · 148 KB' } });
      log(`enviou a fatura ${num} ao contato verificado`);
      toast('Fatura enviada ao cliente.');
    } else if (name === 'conta') {
      raw.consulta = `Posição consultada às ${hhmm()} por ${who}. Consulta registrada na auditoria.`;
      log('consultou a conta da transportadora');
      toast('Conta consultada. A consulta ficou registrada.');
    }
    renderAll();
  }

  // ---------------------------------------------------------------- configurações
  function renderConfig() {
    const f = (l, v, h) => `<label class="fld">${l}<input type="text" value="${esc(v)}">${h ? `<small>${h}</small>` : ''}</label>`;
    const sel = (l, opts, h) => `<label class="fld">${l}<select>${opts.map((o) => `<option>${o}</option>`).join('')}</select>${h ? `<small>${h}</small>` : ''}</label>`;
    const chk = (l, on) => `<label class="chk"><input type="checkbox" ${on ? 'checked' : ''}> ${l}</label>`;
    const stCls = { Aprovado: 'ok', 'Em análise': 'warn', Rejeitado: 'bad' };
    $('#cfg').innerHTML = `
      <section class="card">
        <h2>Integração</h2>
        <div class="grid2">
          ${f('Número CP4', '+55 33 3030-0404', 'Número oficial, conta comercial verificada.')}
          ${sel('Provider', ['Meta WhatsApp Cloud API (direto)', 'BSP parceiro'], 'Hoje a plataforma já envia pela Meta Cloud API.')}
          ${f('Webhook', 'https://assistente.cp4.com.br/webhooks/whatsapp', 'Assinatura conferida em toda chamada.')}
          <div class="fld">Status da integração
            <div class="status"><span class="dot ok"></span> Conectado · último evento há 12 s</div>
            <small>Qualidade do número: alta · limite de envio: 10 mil conversas/dia</small>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Templates aprovados</h2>
        <p class="muted small">Mensagens iniciadas pela CP4 só podem usar templates aprovados pela Meta e exigem opt-in do contato.</p>
        <div class="tablewrap"><table class="tbl">
          <thead><tr><th>Nome</th><th>Categoria</th><th>Situação</th><th>Texto</th></tr></thead>
          <tbody>${DATA.templates.map((t) => `<tr><td class="mono">${t.nome}</td><td>${t.cat}</td><td><span class="tag ${stCls[t.status]}">${t.status}</span></td><td>${esc(t.texto)}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>

      <section class="card">
        <h2>Conversa</h2>
        <div class="grid2">
          <label class="fld wide">Mensagem inicial<textarea rows="3">Olá, {{nome}} 👋 Sou o Assistente Financeiro CP4. Transportadora: {{transportadora}}. Posso te ajudar com:</textarea></label>
          ${f('Horário de atendimento humano', 'Segunda a sexta, 08:00 às 18:00', 'Fora do horário o pedido é registrado e as consultas continuam.')}
          ${f('Feriados', 'Calendário nacional + Governador Valadares')}
          <label class="fld wide">Fallback (serviço indisponível)<textarea rows="2">Não consegui consultar essa informação neste momento. Nenhuma alteração foi realizada.</textarea></label>
          ${sel('Depois de 2 mensagens não entendidas', ['Oferecer atendente', 'Mostrar o menu de novo'])}
          ${sel('Timeout de sessão', ['30 minutos de inatividade', '15 minutos de inatividade', '60 minutos de inatividade'])}
        </div>
      </section>

      <section class="card">
        <h2>Política de autenticação</h2>
        <div class="tablewrap"><table class="tbl">
          <thead><tr><th>Classe</th><th>Exemplos</th><th>Exigência</th></tr></thead>
          <tbody>
            <tr><td>R1 Consulta agregada</td><td>Saldo, limite, vencimento, valor da fatura</td><td><select><option>Número cadastrado (A1)</option><option>PIN financeiro (A2)</option></select></td></tr>
            <tr><td>R2 Detalhe e documentos</td><td>Extrato, lançamentos, PDF, abastecimentos (placa e local)</td><td><select><option>PIN financeiro (A2)</option></select></td></tr>
            <tr><td>Fora do canal</td><td>Fechamento antecipado, contestação, negociação, limite, cadastro</td><td>Transferência para o Financeiro CP4 · o canal não altera nada</td></tr>
          </tbody>
        </table></div>
        <div class="grid2">
          ${sel('Validade do PIN na sessão', ['15 minutos', '5 minutos', '30 minutos'])}
          ${sel('Tentativas de PIN antes do bloqueio', ['3', '5'])}
          ${sel('Nova verificação do número sem uso', ['90 dias', '60 dias', '180 dias'])}
          <div class="fld">Regras
            ${chk('Trocar de transportadora reinicia a autenticação', true)}
            ${chk('Avisar o administrador em PIN incorreto', true)}
            ${chk('Exigir PIN em toda sessão (mesmo para saldo)', false)}
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Permissões</h2>
        <div class="tablewrap"><table class="tbl perm">
          <thead><tr><th>Capacidade (somente consulta)</th><th>Consulta</th><th>Financeiro</th></tr></thead>
          <tbody>${[
            ['Saldo, limite, fatura, vencimento, pendências', 1, 1],
            ['Consumo e últimos abastecimentos', 1, 1],
            ['Extrato resumido na conversa', 1, 1],
            ['PDF da fatura', 0, 1],
            ['Extrato em documento', 0, 1],
            ['Pedir fechamento ou contestar (vai para o financeiro)', 1, 1],
          ].map(([l, a, b]) => `<tr><td>${l}</td>${[a, b].map((v) => `<td>${v ? '<span class="yes">Sim</span>' : '<span class="no">Não</span>'}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <p class="muted small">O nível de cada usuário é concedido pelo administrador da transportadora, na plataforma. Nenhum nível altera dado financeiro pelo WhatsApp.</p>
      </section>

      <section class="card">
        <h2>Escopo do canal</h2>
        <p class="muted small">O WhatsApp Financeiro é <b>somente consulta</b>. A API financeira usada pelo canal aceita apenas leitura.</p>
        <div class="grid2">
          ${sel('Pedido de fechamento antecipado', ['Mostrar o ciclo e transferir para a fila Fechamento'])}
          ${sel('Contestação de abastecimento', ['Coletar abastecimento e motivo e transferir para a fila Contestação'])}
          <div class="fld">Desligar sem deploy (kill switch)
            ${chk('Canal ativo', true)}
            ${chk('Envio de documentos (PDF) ativo', true)}
            ${chk('Classificação por LLM ativa (desligada usa só regras e botões)', true)}
          </div>
        </div>
      </section>`;
  }

  // ---------------------------------------------------------------- navegação e eventos
  function show(v) {
    $$('.view').forEach((s) => { s.hidden = s.id !== 'v-' + v; });
    $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === v)));
    if (v === 'central') renderCentral();
    if (v === 'cliente') renderChat();
  }

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2600);
  }

  function renderAll() { renderChat(); renderSide(); renderCentral(); }

  function reset(msg) {
    DATA.empresas = JSON.parse(BASE);
    S.session = freshSession(); S.live = freshLive(); S.trace = [];
    S.stats = { saldo: 0, fatura: 0, fechamento: 0, erros: 0, authFalhas: 0, humanos: 0 };
    if (S.sel === 'live') { S.sel = null; $('#central-lista').hidden = false; $('#central-detalhe').hidden = true; }
    renderAll();
    if (msg) toast(msg);
  }

  function init() {
    $('#pin-demo').textContent = DATA.pinDemo;
    const frases = ['Bom dia, quanto ainda tenho disponível?', 'E minha próxima fatura?', 'Quando vence?', 'Me envia minha fatura', 'Me manda o boleto', 'Quanto abasteci esse mês?', 'Quero meu extrato', 'Quais foram meus últimos abastecimentos?', 'Tenho pagamentos em atraso?', 'Qual meu saldo disponível depois da fatura?', 'Quero fechar minha fatura', 'Não reconheço esse abastecimento', 'Quero falar com o financeiro'];
    $('#frases').innerHTML = frases.map((f) => `<button type="button" class="chip">${esc(f)}</button>`).join('');
    $('#frases').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) inbound(b.textContent); });

    $('#wa-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const i = $('#wa-text'); const v = i.value.trim();
      if (!v) return;
      i.value = ''; inbound(v);
    });
    $('#chat').addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      inbound(b.dataset.l, b.dataset.p);
    });

    $$('.tabs button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));

    $('#sim-nivel').addEventListener('change', (e) => { S.sim.nivel = +e.target.value; renderSide(); toast('Nível do contato: ' + NIVEIS[S.sim.nivel]); });
    const bind = (id, key, restart) => $(id).addEventListener('change', (e) => { S.sim[key] = e.target.checked; if (restart) reset('Cenário alterado. Conversa reiniciada.'); });
    bind('#sim-multi', 'multi', true); bind('#sim-desconhecido', 'desconhecido', true);
    bind('#sim-api', 'api'); bind('#sim-pdf', 'pdf'); bind('#sim-horario', 'horario');
    $('#btn-reset').addEventListener('click', () => reset('Conversa reiniciada.'));
    $('#btn-expirar').addEventListener('click', () => {
      if (!S.session.started) return toast('Não há sessão ativa.');
      S.session.auth = 'A1'; S.session.awaiting = null;
      push(S.live, { dir: 'sys', html: 'Sessão expirada por inatividade. O PIN será pedido de novo.' });
      renderAll();
    });

    $('#filtros').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { S.filtro = b.dataset.f; renderCentral(); } });
    $('#convs').addEventListener('click', (e) => { const r = e.target.closest('tr[data-id]'); if (r) openConv(r.dataset.id); });
    $('#convs').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const r = e.target.closest('tr[data-id]'); if (r) openConv(r.dataset.id); } });
    $('#central-detalhe').addEventListener('click', (e) => {
      if (e.target.closest('#voltar')) { S.sel = null; $('#central-lista').hidden = false; $('#central-detalhe').hidden = true; return renderCentral(); }
      const a = e.target.closest('[data-act]'); if (a) act(a.dataset.act);
    });
    $('#central-detalhe').addEventListener('submit', (e) => {
      e.preventDefault();
      const i = $('#ag-text'); const v = i.value.trim(); if (!v) return;
      const raw = rawConv(S.sel);
      push(raw, { dir: 'agent', who: DATA.atendente, html: esc(v) });
      (raw.log = raw.log || []).push(`${hhmm()} · ${DATA.atendente} enviou mensagem`);
      renderAll();
      $('#ag-text').focus();
    });

    $('#btn-salvar').addEventListener('click', () => toast('Configurações salvas (simulação).'));

    renderConfig();
    renderAll();
  }

  init();
})();
