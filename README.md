# 🤖 LibertyBot — AI Support Agent N1 (Liberty TI)

> Assistente virtual inteligente desenvolvido em Next.js para automação de atendimento N1, utilizando RAG (Retrieval-Augmented Generation) com base de conhecimento própria.

---

## 🚀 Funcionalidades

- 🧠 **Motor de IA Generativa**: Respostas naturais, contextuais e precisas baseadas na documentação oficial da Liberty TI.
- 📚 **Gestão de Wiki**: Ingestão automática de arquivos (PDF, DOCX, TXT, Markdown) com processamento inteligente (chunking → embeddings → vector database).
- 🌐 **Widget de Chat Embedável**: Script JavaScript leve para incorporar o chat flutuante em qualquer sistema ou portal do cliente.
- 📊 **Dashboard de Analytics**: Rastreabilidade de conversas, métricas de satisfação (CSAT) e identificação de "gaps de conhecimento" (perguntas frequentes sem resposta).
- 🔒 **Arquitetura RAG Segura**: Prevenção de alucinação de IA (hallucination prevention) com restrição de escopo.

---

## 🛠️ Stack Tecnológica

- **Frontend/Backend**: [Next.js 16 (App Router)](https://nextjs.org) + React 19 + TypeScript
- **Banco Relacional**: [PostgreSQL](https://www.postgresql.org/) (usando Neon ou Supabase) + [Prisma ORM](https://www.prisma.io/)
- **Vector Database**: [Qdrant](https://qdrant.tech/) (banco de vetores de alta performance)
- **Framework de IA**: [LangChain.js](https://js.langchain.com/) + [OpenAI API](https://openai.com/)
- **UI & Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) (ícones)
- **Parsing de Documentos**: [pdf-parse](https://www.npmjs.com/package/pdf-parse) + [mammoth](https://www.npmjs.com/package/mammoth) (DOCX parser) + [marked](https://marked.js.org/) (Markdown parser)

---

## 📁 Estrutura do Projeto

```
liberty-chatbot/
├── prisma/
│   └── schema.prisma               # Modelagem do Banco (PostgreSQL)
├── public/
│   └── widget.js                   # Script de integração em sites externos
├── src/
│   ├── app/
│   │   ├── api/                    # Endpoints da API (chat, docs, analytics, feedback)
│   │   ├── dashboard/              # Painel de Controle de Métricas
│   │   ├── knowledge/              # Gestão da Base de Conhecimento
│   │   ├── settings/               # Configurações do Prompt e Cores
│   │   ├── widget/                 # Rota pública do chat (iframe)
│   │   ├── layout.tsx              # Layout Raiz
│   │   └── page.tsx                # Portal / Landing Page Inicial
│   ├── components/                 # Componentes React reutilizáveis
│   └── lib/
│       ├── ai/                     # Motor RAG (embeddings, prompts, vectorstore, chain)
│       ├── db/                     # Conexão do Prisma (Singleton)
│       └── documents/              # Processadores de arquivo (parsers, chunker, ingester)
```

---

## ⚙️ Configuração do Ambiente

1. Copie o arquivo de exemplo e preencha os valores (a chave NVIDIA é gerada em [build.nvidia.com](https://build.nvidia.com)):

```bash
cp .env.example .env.local
```

> Em desenvolvimento o banco relacional é **SQLite** (`DATABASE_URL="file:./dev.db"` — já é o default). PostgreSQL (Neon) entra apenas em produção.

---

## 🏃 Como Iniciar Localmente

### 1. Instalar dependências e criar o banco

```bash
npm install          # roda `prisma generate` automaticamente (postinstall)
npx prisma db push   # cria/atualiza o dev.db SQLite
```

### 2. (Opcional) Iniciar o Banco de Vetores (Qdrant)

A busca semântica usa Qdrant. **Sem ele o app continua funcionando** com fallback de busca por palavras-chave no banco local. Para rodar via **Docker**:

```bash
docker run -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

### 3. Rodar o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🔌 Integrando o Chat no seu Site

Para adicionar o widget flutuante no seu portal do cliente ou intranet, adicione as seguintes tags no final da sua página HTML antes de fechar a tag `</body>`:

```html
<!-- Configurações do LibertyBot -->
<script>
  window.LIBERTYBOT_SETTINGS = {
    welcomeMessage: "Olá! Como posso ajudar você no suporte da Liberty TI?",
    primaryColor: "#06b6d4" // Cor em formato HEX
  };
</script>

<!-- Script de Inicialização -->
<script src="http://localhost:3000/widget.js" async></script>
```

---

## 🎯 Próximos Passos recomendados

1. **Testar Ingestão**: Carregue PDFs reais da sua operação na página `/knowledge`.
2. **Ajustar Prompt**: Modifique o `SYSTEM_PROMPT` in `src/lib/ai/prompts.ts` para customizar as regras de atendimento humano e escalonamento.
3. **Validar Respostas**: Converse com o bot no widget de demonstração na Home page `/` e verifique as citações das fontes.
4. **Ver Analytics**: Acesse `/dashboard` após interagir para validar o registro de métricas de uso e feedbacks.
