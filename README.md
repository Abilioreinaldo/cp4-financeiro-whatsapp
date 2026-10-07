# CP4 Financeiro via WhatsApp — protótipo navegável

Protótipo em HTML/CSS/JS puro, com dados fictícios e sem nenhuma integração. Serve para validar a experiência antes de qualquer desenvolvimento.

**Escopo: somente consulta.** O canal não altera nenhum dado financeiro. Pedidos de fechamento antecipado e contestações são reconhecidos pelo assistente e transferidos ao Financeiro CP4 com contexto; a execução segue no processo atual.

Online: https://abilioreinaldo.github.io/cp4-financeiro-whatsapp/

## Abrir localmente

```bash
python -m http.server 8171
```

Depois acesse http://localhost:8171. Também funciona abrindo o `index.html` direto no navegador.

## Roteiro de demonstração

1. **Cliente · WhatsApp**: clique nas frases de exemplo ou escreva livremente. O PIN de demonstração aparece no painel "Cenário".
2. "Quero fechar minha fatura" → o assistente mostra o ciclo aberto e a taxa estimada → "Falar com o financeiro" → a conversa entra na fila com o pedido resumido.
3. "Não reconheço esse abastecimento" → PIN → escolha o pedido → escolha o motivo → transferência com os dados do abastecimento.
4. **Central Financeira**: abra a conversa "ao vivo", veja o resumo e a posição financeira, clique em "Assumir atendimento" e responda; a mensagem aparece no telefone.
5. "Me manda o boleto": a CP4 não emite boleto hoje; o assistente orienta para o PDF da fatura.
6. Painel "Cenário": número não cadastrado, duas transportadoras, API fora do ar, falha de PDF, nível do contato, fora do horário.

O painel "Bastidores" mostra, a cada mensagem: webhook, sessão, intenção, política, chamada à API, resposta e auditoria.
