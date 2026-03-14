# Motorista Gestor

Aplicativo web local-first para controle de ganhos, despesas e manutencoes de motoristas. O projeto roda no navegador, grava os dados no dispositivo do usuario e continua leve porque nao depende de backend, build complexo ou bibliotecas grandes.

## O que mudou

O app foi reorganizado para usar uma camada de servicos locais em `src/services/` e uma persistencia centralizada. A interface continua simples em HTML, CSS e JavaScript puro, mas agora a logica esta separada por responsabilidade.

## Por que essa arquitetura foi usada

- `IndexedDB` foi adotado como armazenamento principal porque guarda mais dados que `localStorage`, funciona no dispositivo do usuario e e mais adequado para crescimento do app sem precisar de servidor.
- `localStorage` foi mantido como fallback para compatibilidade e migracao dos dados antigos ja existentes no navegador.
- Uma camada de servicos foi criada para separar persistencia, regras de negocio, relatorios e renderizacao do grafico. Isso deixa o codigo mais facil de manter e reduz risco de bugs por logica duplicada.
- O grafico foi refeito em `canvas` local, removendo a dependencia de `Chart.js` via CDN. Com isso o app fica mais leve e funciona melhor sem internet.
- A interface principal continua em arquivos estaticos para manter o carregamento rapido e a distribuicao simples.

## Estrutura do Projeto

```text
index.html
styles.css
app.js
src/
  services/
    storage-service.js
    settings-service.js
    session-service.js
    expense-service.js
    maintenance-service.js
    report-service.js
    chart-service.js
    backup-service.js
```

## Responsabilidade de Cada Arquivo

- `index.html`: estrutura das telas, formularios, tabelas e navegacao.
- `styles.css`: tema escuro, responsividade e componentes visuais.
- `app.js`: camada de interface, eventos, preenchimento dos formularios e atualizacao da tela.
- `src/services/storage-service.js`: persistencia local com `IndexedDB` e fallback para `localStorage`.
- `src/services/settings-service.js`: leitura, saneamento e gravacao das configuracoes financeiras.
- `src/services/session-service.js`: CRUD e calculos das sessoes.
- `src/services/expense-service.js`: CRUD das despesas.
- `src/services/maintenance-service.js`: CRUD das manutencoes.
- `src/services/report-service.js`: regras do dashboard, relatorios, filtros, metas e alertas.
- `src/services/chart-service.js`: desenho do grafico semanal direto em `canvas`.
- `src/services/backup-service.js`: exportacao e importacao de backup local em JSON.

## Funcionalidades Atuais

- Dashboard com saldo do dia, horas trabalhadas, total de corridas, ganho por hora, ganho semanal, ganho mensal, despesas e lucro liquido.
- Metas mensais e semanais com barras de progresso.
- Grafico local de ganhos por dia da semana.
- Cadastro, edicao e exclusao de sessoes.
- Cadastro, edicao e exclusao de despesas.
- Cadastro, edicao e exclusao de manutencoes.
- Relatorios com filtro por ano e mes.
- Resumo por plataforma e por categoria.
- Configuracoes de metas e custo de combustivel.
- Alertas de manutencao vencida e proxima.
- Exportacao de backup local em JSON.
- Importacao de backup local em JSON com restauracao completa dos dados.

## Persistencia

Armazenamento principal:

- `IndexedDB`, banco `motorista-gestor`

Stores usadas:

- `sessoes`
- `despesas`
- `manutencoes`
- `settings`

Fallback legado:

- `localStorage` com as chaves `sessoes`, `despesas`, `manutencoes` e `appSettings`

O app tenta carregar do `IndexedDB` primeiro. Se o navegador nao suportar ou ocorrer erro na abertura, ele usa `localStorage`. Se existirem dados antigos no `localStorage`, eles sao migrados para o `IndexedDB` quando possivel.

## Backup Local em JSON

O backup foi implementado em JSON por quatro motivos:

- continua 100% local, sem enviar dados para nenhum servidor
- e um formato simples de ler, validar e restaurar
- permite ao usuario guardar uma copia dos dados em qualquer pasta ou dispositivo
- facilita manutencao futura porque a estrutura exportada e a mesma que o app usa internamente

O fluxo atual funciona assim:

- `Exportar Backup JSON`: gera um arquivo com sessoes, despesas, manutencoes, configuracoes e metadados do backup
- `Importar Backup JSON`: le um arquivo local e substitui o estado salvo no dispositivo apos confirmacao do usuario

Essa escolha foi usada no lugar de sincronizacao online porque o objetivo do projeto continua sendo leveza, simplicidade e funcionamento direto no dispositivo do usuario.

## Configuracoes Padrao

- Meta mensal bruta: `6000`
- Meta mensal liquida: `4500`
- Meta semanal bruta: `1500`
- Meta semanal liquida: `1000`
- Preco medio do combustivel: `5.79`
- Consumo do carro: `11 km/l`

## Como Executar

1. Abra `index.html` no navegador.
2. Preencha sessoes, despesas, manutencoes e configuracoes.

Nao existe etapa de build obrigatoria.

## Dependencias

O projeto nao usa dependencias externas carregadas por CDN nem gerenciador de pacotes. Tudo necessario para a execucao esta no repositorio.

## Vantagens Dessa Implementacao

- Funciona no dispositivo do usuario.
- Mantem os dados locais, sem servidor.
- Continua leve e rapido para abrir.
- Fica mais facil evoluir o app sem acoplar a interface a persistencia.
- Permite crescer de forma segura sem trocar toda a base.

## Limpeza de Dados

Para limpar todos os dados locais do app no navegador:

```javascript
localStorage.removeItem('sessoes')
localStorage.removeItem('despesas')
localStorage.removeItem('manutencoes')
localStorage.removeItem('appSettings')
indexedDB.deleteDatabase('motorista-gestor')
```

## Observacoes

- O projeto continua sem backend e sem testes automatizados.
- A pasta `src/services` agora faz parte da execucao real do app.
- O `app.js` virou uma camada de interface, enquanto as regras principais foram movidas para os servicos.
