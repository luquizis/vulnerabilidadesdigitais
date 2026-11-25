# Entre Mundos Digitais

## Entrega de revisão técnica para homologação

O diretório `app` contém o código revisado. O material original em Downloads foi preservado. Esta entrega implementa correções e adiciona testes, mas ainda não é uma versão homologada para produção.

Comece por `documentacao/RELATORIO.md` e `documentacao/INSTALACAO.md`. Os resultados efetivamente obtidos estão em `documentacao/validacao.json` e `documentacao/testes-dominio.tap`. A relação exata de arquivos e hashes está em `documentacao/arquivos-alterados.json`.

Foram executados 15 testes de domínio, todos aprovados, além da verificação nativa de sintaxe dos arquivos TypeScript sem JSX e dos arquivos JavaScript. Essa verificação não equivale à checagem de tipos nem ao teste da aplicação completa.

Build, TypeScript completo, lint, migração MySQL, testes de integração e utilização no navegador continuam pendentes. O ambiente usado nesta revisão não tinha as dependências instaladas, conexão ao registro de pacotes, banco de homologação ou configuração de login Kimi. O pacote inclui os testes de integração e os procedimentos para executá-los.

Antes de utilizar com estudantes, instale em homologação e execute os comandos documentados. Não aplique a migração em uma aula em andamento. Registros antigos não recebem versões inventadas; permanecem disponíveis para pesquisa autorizada, identificados como sem versão histórica comprovada.

Não é necessário juntar o ZIP original a esta entrega. Guarde o original como cópia de segurança.
