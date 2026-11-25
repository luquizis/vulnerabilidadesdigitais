# Instalação, migração e validação

## Ambiente necessário

Use Node.js 24 ou superior, npm e MySQL 8 com InnoDB e suporte a transações e bloqueios de linha. A aplicação continua usando o provedor de identidade Kimi. É necessário ter as credenciais e a URL de retorno da aplicação configuradas no provedor.

O runtime nativo usado nos testes desta entrega foi Node.js 24.22.1. Não há dependências novas no package.json. O lockfile original foi preservado, com atualização dos metadados de versão mínima do Node.

## Preparação

No terminal, entre em `app` e execute:

```sh
npm ci
cp .env.example .env
```

Preencha `.env` sem colocar credenciais no código ou enviar o arquivo a terceiros. Configure APP_ID e APP_SECRET com os valores do provedor Kimi. SESSION_SECRET deve ser um segredo próprio, aleatório, com pelo menos 32 caracteres; não é necessário alterar o segredo OAuth fornecido pelo Kimi. Configure DATABASE_URL, KIMI_AUTH_URL, KIMI_OPEN_URL e APP_ORIGIN. APP_ORIGIN é a origem exata, sem caminho, por exemplo `https://jogo.example.org`. Para desenvolvimento, utilize `http://localhost:3000`.

OWNER_UNION_ID identifica a conta que recebe o primeiro papel administrador no login. Após o primeiro acesso, o administrador pode ajustar papéis e concessões em Área do pesquisador, Administrar usuários e permissões. Um usuário com login, mas sem papel e concessão, não tem acesso aos dados de pesquisa. Administradores têm acesso global; não distribua esse papel para acesso limitado a uma turma.

O callback OAuth é `APP_ORIGIN/api/oauth/callback`. O botão de login usa `/api/oauth/start`. As variáveis VITE_APP_ID e VITE_KIMI_AUTH_URL do template deixaram de ser usadas pelo botão, mas foram mantidas no exemplo para compatibilidade documental.

TRUST_PROXY deve permanecer false se não houver um proxy de confiança que sobrescreva X-Forwarded-For. Em múltiplas réplicas, configure também limitação compartilhada no gateway. Ative HTTPS em produção, não registre corpos tRPC nem cookies e desative buffering do SSE no proxy. O servidor já envia no-store e X-Accel-Buffering para os eventos.

## Banco novo

Somente em um banco vazio de desenvolvimento ou homologação:

```sh
npm run db:push
```

Esse comando utiliza o esquema revisado. Não o use como atualização automática de um banco existente. O arquivo db/seed.ts continua sendo um placeholder do projeto original; não é necessário para o conteúdo, que é preservado nos contratos e em snapshots ao criar sessões.

## Atualização do banco original

Faça uma cópia consistente do banco e teste a restauração antes de atualizar. Interrompa os processos da aplicação e não migre durante uma atividade em andamento. Configure DATABASE_URL para a cópia de homologação primeiro.

```sh
npm run db:preflight
npm run db:migrate
```

O novo db:migrate usa `scripts/migrate.mjs`, pois o pacote recebido não continha histórico de migrações Drizzle. O SQL das tabelas novas está em `db/migrations/001_hardening.sql`. O script controla as adições de colunas, enums e índices já existentes e usa um bloqueio de migração no MySQL. Não misture esse fluxo com um histórico Drizzle gerado posteriormente sem consolidar a linha de base.

Se o preflight identificar respostas duplicadas por dupla e parada, ele interrompe a execução antes de alterar a estrutura. Preserve as respostas e consulte o responsável pela pesquisa para reconciliar os conflitos. Não existe remoção automática, deduplicação destrutiva ou atualização retroativa de classificações.

A migração acrescenta taxonomy_versions, session_access e review_decisions. Acrescenta capacidade, controle de inscrições, referência de versão, chave de entrada repetível, atividade recente, próximo destino persistido, modo de visibilidade no envio e tipo de contribuição. Cria unicidade por dupla e parada e por credencial de entrada da sessão.

DDL MySQL pode efetivar alterações separadamente. Se houver falha intermediária, mantenha a aplicação parada, examine o erro e retome o script após corrigir a causa; as adições são verificadas antes da execução. O script não faz downgrade destrutivo. Para recuperação, use a cópia anterior do banco e o código original juntos. Não remova tabelas com históricos para tentar reverter apenas o código.

Sessões antigas não recebem automaticamente o conteúdo atual. Sua referência de versão permanece vazia. Os dados ficam disponíveis na pesquisa autorizada, com proveniência histórica não comprovada. Para novas atividades, crie uma nova sessão. Recuperar a continuidade de uma sessão antiga exige o snapshot original e procedimento específico, não incluído nesta entrega.

## Validação

Testes de domínio, sem precisar instalar as dependências:

```sh
node --test tests/domain.test.mjs
```

Com as dependências instaladas:

```sh
npm run check
npm run lint
npm run build
```

Para os testes de integração, crie um banco descartável cujo nome termine em `_test` e aplique nele o esquema revisado com `npm run db:push` (somente em banco vazio). Configure TEST_DATABASE_URL apontando para esse banco. Não use o banco de produção. Os testes inserem sessões, respostas e usuários de teste, que permanecem nesse banco até seu descarte manual.

```sh
TEST_DATABASE_URL=mysql://usuario:senha@localhost:3306/entre_mundos_test npm test
```

Sem TEST_DATABASE_URL, a suíte MySQL fica ignorada. Portanto, um resultado sem erros nessa condição não significa que a integração foi validada. Com ela configurada, os dezessete casos, em dois arquivos, verificam papéis, criação de sessão, snapshots, entrada e envio simultâneos, capacidade, inscrições, repetição com percurso original, pulo de paradas sensíveis, privacidade, concessões por sessão, exportações com escape, histórico de moderação e curadoria, sessão legada sem versão, encerramento, consulta paginada e agregados de pesquisa.

Nota de ambiente: a validação desta entrega rodou sobre MariaDB 10.11. Nele, o `drizzle-kit push` expande colunas `serial` de forma incompatível; o esquema do banco de testes foi aplicado a partir do DDL gerado pelo próprio Drizzle, com a expansão corrigida. Em MySQL 8, alvo documentado do projeto, `npm run db:push` permanece o caminho indicado.

Depois de configurar TEST_DATABASE_URL, é possível executar a sequência completa:

```sh
npm run validate
```

O script encadeia testes de domínio, integração, verificação de tipos, lint e build. Todas essas etapas foram executadas com aprovação nesta entrega; os resultados estão em `validacao.json`.

Existe ainda `node scripts/verify-package.mjs`, utilitário de reverificação que executa localmente os testes de domínio e as checagens disponíveis e regrava `validacao.json`, `testes-dominio.tap` e registros de saída por etapa. Execute-o apenas com as dependências instaladas e TEST_DATABASE_URL configurada; sem isso, os itens constarão como bloqueados no arquivo regravado. Os resultados da homologação desta entrega são os registrados na seção Validação do RELATORIO.md.

## Execução

```sh
npm run dev
```

Em produção, após build aprovado:

```sh
npm start
```

Crie uma sessão com a conta administradora. Ela começa com inscrições abertas e capacidade padrão de 40 duplas. Guarde a chave de mediação em separado do código público. A entrada das duplas armazena sua credencial antes da requisição; repetições retomam a mesma dupla. Para trocar de aparelho, a dupla pode informar sua chave no formulário de entrada. Conhecer apenas o código público não permite recuperar uma dupla ou obter privilégio de mediação.

## Conferência no navegador

Teste a criação, entrada repetida, recuperação em outro aparelho, lotação e fechamento de inscrições. Use duas abas da mesma dupla para responder simultaneamente e confirme um único registro e um único avanço. Reenvie a primeira resposta com outra escolha e confira que o percurso original permanece.

Teste também queda de rede, recarga offline após acesso anterior, retomada dos rascunhos, reenvio da fila e falhas de armazenamento local. A dupla continua na parada confirmada até a sincronização; respostas pendentes não provocam avanço local simulado.

Confirme que experiência pessoal não aparece no mediador nem na projeção; que texto pendente ou oculto não aparece na projeção; que não projetar exclui o registro da síntese; e que revogar uma concessão bloqueia consulta e exportação. Verifique login e callback reais, expiração e reconexão SSE, exportações CSV/XLSX/JSON-LD/Turtle e a preservação do hash ao publicar novo conteúdo em outra sessão.

Teste teclado, foco, zoom, leitura assistiva, celular e preferências de redução de movimento. Defina com a instituição a política de retenção e limpeza dos dispositivos compartilhados antes da aplicação com participantes.
