# CP4 Financeiro via WhatsApp — protótipo navegável

Protótipo em HTML/CSS/JS puro, com dados fictícios e sem nenhuma integração. Serve para validar a experiência antes de qualquer desenvolvimento.

Online: https://abilioreinaldo.github.io/cp4-financeiro-whatsapp/

## Abrir localmente

```bash
python -m http.server 8171
```

Depois acesse http://localhost:8171. Também funciona abrindo o `index.html` direto no navegador.

## Roteiro de demonstração

1. **Cliente · WhatsApp**: clique nas frases de exemplo ou escreva livremente. O PIN de demonstração aparece no painel "Cenário".
2. "Quero fechar minha fatura" → Continuar → PIN → "Abrir na plataforma" → informe 6 dígitos → confirme.
3. **Central Financeira**: abra a conversa "ao vivo" e clique em "Executar fechamento solicitado". Volte ao WhatsApp: a fatura fechada chegou.
4. "Não reconheço esse abastecimento" → escolha o pedido → na Central, "Assumir atendimento" e responda; a mensagem aparece no telefone.
5. Painel "Cenário": número não cadastrado, duas transportadoras, API fora do ar, falha de PDF, nível do contato, fora do horário.

O painel "Bastidores" mostra, a cada mensagem: webhook, sessão, intenção, política, chamada à API, resposta e auditoria.
