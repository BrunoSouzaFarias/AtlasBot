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

## 🎯 Próximos Passos Recomendados

1. **Testar Ingestão**: Carregue PDFs reais da sua operação na página `/knowledge`.
2. **Ajustar Prompt**: Modifique o `SYSTEM_PROMPT` em [prompts.ts](file:///C:/Users/LIBERTY.TEC020462/OneDrive - Liberty Comercio e Serviços/Área de Trabalho/PROJETOS/liberty-chatbot/src/lib/ai/prompts.ts) para customizar as regras de atendimento humano e escalonamento.
3. **Validar Respostas**: Converse com o bot no widget de playground e verifique as citações das fontes e a precisão do RAG.
4. **Ver Analytics**: Acesse `/dashboard` após interagir para validar o registro de métricas e detecção de gaps (perguntas sem resposta).

---

## ☁️ Transição para Produção (Vercel + Neon Postgres + Qdrant Cloud)

Para realizar o deploy em ambiente produtivo, siga os passos abaixo:

### 1. Transicionar o Banco para PostgreSQL (Neon)
No arquivo [schema.prisma](file:///C:/Users/LIBERTY.TEC020462/OneDrive - Liberty Comercio e Serviços/Área de Trabalho/PROJETOS/liberty-chatbot/prisma/schema.prisma), altere a definição do `datasource db` para utilizar o PostgreSQL:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

* **`DATABASE_URL`**: String de conexão pooled do Neon (utilizada pela aplicação em tempo de execução).
* **`DIRECT_URL`**: String de conexão direta do Neon (necessária para que o Prisma execute as migrations de banco de dados).

### 2. Criar e Aplicar Migrations no Neon
Execute o comando a seguir no terminal apontando para a sua base de dados Neon para inicializar a estrutura de tabelas:

```bash
# Apague a pasta prisma/migrations (que pode conter histórico local de SQLite)
# Execute o comando abaixo para gerar o schema inicial no Neon:
npx prisma migrate dev --name init
```

### 3. Deploy na Vercel
O projeto já está configurado com o script `"vercel-build"` no `package.json`, o qual aplica automaticamente `prisma migrate deploy` a cada build de produção na Vercel.

Configure as seguintes variáveis de ambiente no painel da Vercel:
* `DATABASE_URL`: Connection string pooled (SSL obrigatório).
* `DIRECT_URL`: Connection string direct (SSL obrigatório).
* `OPENAI_API_KEY`: Chave da NVIDIA AI.
* `QDRANT_URL`: Endpoint do cluster Qdrant Cloud.
* `QDRANT_API_KEY`: API Key do cluster Qdrant Cloud.
* `QDRANT_COLLECTION`: Nome da coleção (ex.: `liberty_knowledge`).
* `ADMIN_PASSWORD`: Senha para acessar o painel administrativo.
* `AUTH_SECRET`: Segredo para assinar o cookie JWT (gere com `openssl rand -base64 32`).
* `NEXT_PUBLIC_APP_URL`: URL de produção do seu app na Vercel (ex.: `https://seu-app.vercel.app`).
* `NEXT_PUBLIC_APP_NAME`: `LibertyBot`.
```
