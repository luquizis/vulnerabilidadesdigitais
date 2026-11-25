# Relatório de auditoria e implementação

Data: 25 de novembro de 2026 (segunda rodada; a primeira rodada é de 19 de novembro de 2026). Projeto: Entre Mundos Digitais, Vulnerabilidade Digital e Ódio.

## Escopo e conclusão

Esta rodada partiu do pacote revisado anteriormente, trabalhado em cópia separada. Foram preservados React, TypeScript, Hono, tRPC, Drizzle e MySQL, a identidade visual, os avatares, as cinco fases, as narrativas e as alternativas pedagógicas. Não foram criadas classes ontológicas, contas de estudantes ou coleta de nomes reais, e nenhum registro foi eliminado.

O trabalho desta rodada teve três frentes: confirmar diretamente nos arquivos cada problema e cada correção relatados na rodada anterior; executar pela primeira vez o pipeline completo de validação (instalação, tipagem, lint, testes de domínio, testes de integração contra banco real, build e migração em base legada simulada); e corrigir os problemas novos que essa execução revelou. Todas as verificações listadas em `validacao.json` passaram de fato neste ambiente. Login com o provedor Kimi real, testes de navegador, ensaio de carga do SSE e avaliação formal com tecnologia assistiva continuam pendentes e não são apresentados como validados.

## Confirmação da revisão anterior

Cada item do relatório anterior foi conferido no código, e não apenas presumido. As verificações abaixo usam o arquivo e a operação, que permanecem identificáveis.

| ID | Gravidade | Localização | Causa e impacto no original | Situação confirmada nesta rodada |
| --- | --- | --- | --- | --- |
| C01 | Crítica | `app/api/research-router.ts` | Dados de pesquisa e curadoria abertos a qualquer usuário autenticado. | Confirmado o histórico; o código atual verifica papéis de pesquisador, curador e administrador no servidor, com concessão por sessão em `session_access` (`app/api/access.ts`). Coberto por testes de integração. |
| C02 | Crítica | `app/api/routes/events.ts` | Código público liberava todos os eventos. | Confirmado; SSE agora exige credencial temporária assinada, com escopo por sessão e audiência, e invalidações sem textos nem experiência pessoal. |
| C03 | Crítica | `app/api/submission.ts`, `app/db/schema.ts` | Duplicação verificada fora de transação, sem unicidade por dupla e parada. | Confirmado; envio transacional com bloqueios de sessão e dupla na mesma ordem, índice único aplicado pela migração e testado com envios simultâneos. |
| C04 | Crítica | `app/api/submission.ts` | Reenvio podia retornar caminho calculado da nova escolha. | Confirmado; reenvios recuperam identificador e próximo destino congelados no registro original. Testado com reenvio de escolha diferente. |
| C05 | Importante | `app/api/session-control.ts` | Sem capacidade, controle de inscrições ou proteção de entrada simultânea. | Confirmado; entrada transacionada e repetível pela credencial, capacidade padrão de 40 duplas, estados lobby/closed/active/finished com transições verificadas. Testado. |
| C06 | Importante | `app/api/submission.ts` | Servidor não bloqueava envios fora de estado válido ou sem avatar. | Confirmado; verificações de estado e avatar no serviço de envio; pulo restrito às paradas marcadas como sensíveis no conteúdo. Testado. |
| C07 | Importante | `app/api/kimi/auth.ts`, `app/src/pages/Login.tsx` | State OAuth sem vinculação ao navegador. | Confirmado; state aleatório com cookie de curta duração e callback fixado à origem configurada. A validação com o provedor real segue pendente. |
| C08 | Importante | `app/api/kimi/session.ts` | Segredo vazio possível; sessão de um ano. | Confirmado; segredo mínimo de 32 caracteres, validação de aplicação e sessão de sete dias. |
| I01 | Importante | `app/api/routes/events.ts`, `app/src/hooks/useRealtime.ts` | Replay incompleto, eventos em memória, reconexão abandonada. | Confirmado; replay persistido em lotes com cursor deduplicado, nova credencial a cada reconexão e espera progressiva. |
| I02 | Importante | `app/src/lib/offline.ts` | IndexedDB marcado como salvo antes da transação confirmar. | Confirmado; resolução apenas em `oncomplete`, com tratamento de abortos. |
| I03 | Importante | `app/src/pages/TeamPage.tsx`, `app/src/lib/offline.ts` | Chave nova por clique e sem retrato local do percurso. | Confirmado; fila gravada antes do envio, chave estável por rascunho, deduplicação local e isolamento por credencial. Sem avanço otimista. |
| I04 | Importante | `app/api/content.ts`, `app/api/research-router.ts` | Exportações sem preservar a versão do vocabulário da sessão. | Confirmado; snapshot imutável com hash SHA-256 referenciado por sessão; exportações carregam a proveniência. Testado. |
| I05 | Importante | `app/api/submission.ts` | Termos arbitrários passavam pela validação de comprimento. | Confirmado; classificações confrontadas com o snapshot da sessão no servidor. Testado com identificadores inexistentes. |
| I06 | Importante | `app/api/game-router.ts`, `app/api/research-router.ts` | Decisões de moderação e curadoria sem histórico. | Confirmado; `review_decisions` transacionado com autor, decisão, estado anterior e justificativa. Testado. |
| I07 | Importante | `app/api/game-utils.ts` | Sinalização confundida com interpretação. | Confirmado; sinais separados, triagem sempre humana, denúncias não rejeitadas automaticamente. Coberto por testes de domínio. |
| I08 | Importante | `app/api/game-router.ts` | Projeção com denominador incorreto e vínculo à dupla. | Confirmado; contagem sobre respostas autorizadas e remoção do identificador da dupla. Testado. |
| I09 | Importante | `app/api/boot.ts` | Sem limitação de tentativas; credenciais de consulta na URL. | Confirmado; limitação por endereço, limites de corpo e lote, validação de origem, no-store e consultas tRPC via POST. Limitador local ao processo. |
| I10 | Importante | `app/api/research-router.ts` | Escape de CSV e Turtle incompleto. | Confirmado; funções de escape isoladas com testes de fórmulas, aspas e controles, inclusive com espaço antes do prefixo de fórmula. |
| E01 | Experiência | Home, TeamPage, MediatorPage, ResearchPage | Entrada e estados pouco explicados. | Confirmado; controles de inscrições, recuperação por credencial, administração de papéis e indicação honesta de atividade recente. |
| E02 | Experiência | TeamPage | Concordância, contestação e proposição sem distinção explícita. | Confirmado; contribuição facultativa separada das classificações; registros antigos sem indicação presumida. |

## Problemas encontrados nesta rodada e correções

A execução do pipeline completo e a inspeção contínua revelaram problemas não listados na rodada anterior. Todos foram corrigidos e verificados.

| ID | Gravidade | Localização | Causa e impacto | Solução |
| --- | --- | --- | --- | --- |
| N01 | Estrutural | `app/api/research-router.ts`, overview; `app/src/pages/ResearchPage.tsx` | O observatório carregava todas as respostas de uma vez; acervos grandes degradariam a consulta e a página. | Nova consulta paginada `responsesPage` com cursor e limite; overview passa a trazer apenas contagens, agregados por fonte e por parada e a lista de versões preservadas por sessão; página carrega respostas sob demanda. Coberto por testes de integração de paginação e agregados. |
| N02 | Importante | `app/api/research-router.ts`, consulta de respostas | Listagem sem ordenação determinística, o que quebra paginação e reprodutibilidade de exportações futuras. | Ordenação fixa por identificador descendente e teste de determinismo entre páginas. |
| N03 | Importante | 7 arquivos de interface e suporte (detalhe abaixo) | 14 erros e 2 avisos de lint herdados, incluindo violações das regras de pureza do React: `Math.random` em renderização (`ui/sidebar.tsx`), `Date.now()` em renderização (`MediatorPage.tsx`), ajuste de estado em efeito (`AuthLayout.tsx`, `AdminPermissions.tsx`), exportações mistas que impediam atualização a quente confiável (`providers/trpc.tsx`, variantes de `ui/`), expressão regular com caracteres de controle (`api/game-utils.ts`) e variável sem uso (`db/seed.ts`). | Largura do esqueleto derivada de identificador estável; relógio com intervalo próprio; padrão de ajuste durante a renderização no lugar de efeitos; cliente tRPC isolado em `src/lib/trpc.ts`; exceção documentada do lint para os componentes visuais do template; limpeza de texto sem classe de controle; lint final com zero erros e zero avisos. |
| N04 | Experiência | `src/App.tsx`, páginas do jogo, `src/index.css` | Ausência de link para saltar ao conteúdo, marcos principais sem identificador de destino e rolagem suave incondicional, contrária à preferência de redução de movimento. | Link "Saltar para o conteúdo principal" visível ao foco; `id="conteudo"` em todos os dezesseis estados de tela com elemento `main`; rolagens suaves condicionadas a `prefers-reduced-motion`. |

## Etapas executadas nesta rodada

### Estabilidade

Pipeline completo executado: instalação limpa das dependências, verificação de tipos (`tsc -b`), lint, quinze testes de domínio, dezessete testes de integração contra MariaDB e build de produção. Os erros de lint foram corrigidos no código, sem desativar regras de segurança do React; a única exceção de lint é documentada e limitada aos componentes visuais do template, que exportam auxiliares por desenho.

### Segurança

A migração `001_hardening` foi exercitada de ponta a ponta em base legada simulada: preflight aprovado, estrutura conferida após aplicação, respostas antigas preservadas com referência de versão nula e suíte de integração executada contra o banco migrado. O bloqueio seguro do preflight foi demonstrado em base com duplicidades históricas: a execução parou, listou os conflitos e não alterou dados. A suíte de cobertura nova verifica no servidor estados de sessão, capacidade, entrada repetida, recuperação de dupla, idempotência, pulo de paradas sensíveis, papéis de pesquisa, concessões por sessão, exportações com escape e histórico de curadoria.

### Pesquisa e arquitetura

O observatório deixou de depender de varredura completa das respostas: overview agregado, consulta paginada com cursor, filtro por trilha e listagem das versões de conteúdo preservadas por sessão, com indicação explícita de legado sem versão comprovada. Não foram criadas classes ontológicas nem alterados os vocabulários; o versionamento continua content-addressed e sem reescrita retroativa.

### Experiência

As cinco fases, os avatares, os textos e as alternativas foram preservados. Foram corrigidos os pontos de acessibilidade objetivos encontrados (N04), sem alterar a identidade visual e sem criar rankings competitivos. O feedback pedagógico continua sem atribuir certo ou errado.

## Validação efetivamente realizada

Todos os números abaixo foram obtidos por execução real neste ambiente, com Node.js 24.11.1 e MariaDB 10.11; o arquivo `validacao.json` registra os comandos e o detalhe, e `testes-dominio.tap` contém a saída dos testes de domínio.

- Instalação limpa das dependências: aprovada.
- Verificação de tipos (`npm run check`): aprovada, sem erros.
- Lint (`npm run lint`): aprovado, zero erros e zero avisos (a rodada começou com 14 erros e 2 avisos).
- Testes de domínio (`npm run test:domain`): 15 aprovados, nenhuma falha.
- Testes de integração (`TEST_DATABASE_URL` em banco descartável terminado em `_test`): 17 aprovados em 2 arquivos, nenhuma falha.
- Build de produção (`npm run build`): aprovado, gerando `dist/public` e `dist/boot.js`.
- Migração em base legada simulada: preflight, aplicação e verificação estrutural aprovados; preflight com duplicidades bloqueou sem alterar dados.

Não foram executados: login e callback com o provedor Kimi real, testes automatizados de navegador, ensaio de carga do SSE, medição formal de contraste e teste com leitor de tela. Nada disso é apresentado como validado.

## Pendências e riscos residuais

Homologar o login Kimi com credenciais reais, o SSE através do proxy de produção, duas ou mais abas concorrentes e quedas de rede no navegador, conforme o roteiro em `INSTALACAO.md`. Os testes de integração devem sempre rodar em banco descartável com nome terminado em `_test`.

O comando solicitar ajuste registra a necessidade de revisão e impede publicação; não implementa um editor de alterações de respostas já confirmadas. Esse fluxo precisa de desenho de histórico metodológico antes de ser ampliado. A moderação identifica o mediador pela sessão e sua chave, não por identidade pessoal individual.

Política de retenção, prazos de descarte, consentimento, fundamento de tratamento, anonimização de exportações e procedimentos institucionais dependem do responsável pela pesquisa. Não foi estabelecido prazo arbitrário nem apagamento automático de dados. Há armazenamento local no aparelho da dupla; dispositivos compartilhados exigem procedimento de limpeza após confirmação dos envios.

A detecção de conteúdo sensível é uma triagem por regras, sujeita a falsos positivos e omissões. Não é classificador confiável de discurso de ódio nem garantia de anonimização. As notas de revisão também podem conter dados pessoais se o responsável os digitar.

Faltam teste formal de contraste, leitor de tela, navegação completa por teclado, ampliação e interface móvel; os pontos objetivos de acessibilidade corrigidos nesta rodada não substituem essa avaliação. O tratamento offline e o service worker precisam ser testados em HTTPS real. O SSE consulta a persistência a cada dois segundos por conexão, o que precisa de ensaio de carga antes de ampliar turmas. O limitador de tentativas é local ao processo e pede proteção compartilhada no gateway em instalações com réplicas.

Atualizações dos conteúdos usam novo snapshot nas novas sessões. Os recursos originais continuam em um módulo de contratos; foram separados serviços de autorização, conteúdo, envio, sessões e exportação textual, mas não foi criado CMS ou importador de ontologias. Os namespaces RDF herdados do protótipo continuam sendo mapeamentos didáticos provisórios, sem garantia de equivalência com classes canônicas. A referência a OntoHate 1.0.2 já existia no conteúdo e não foi tratada como comprovação externa.

Referência de implementação do transporte: https://trpc.io/docs/client/links/httpBatchLink e https://trpc.io/docs/server/adapters .
