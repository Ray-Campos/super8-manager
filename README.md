# Super 8 Manager

Este é um sistema web leve desenvolvido para gerenciar torneios, acompanhar estatísticas de desempenho dos atletas e visualizar o histórico de competições. O foco do projeto é simplicidade, rapidez no acesso aos dados e facilidade para organizar os resultados.

## Funcionalidades
* **Dashboard Global:** Visão geral com ranking consolidado de todos os torneios concluídos.
* **Detalhes do Torneio:** Visualização específica por torneio, contendo a classificação detalhada de cada atleta.
* **Exportação para Impressão:** Botão para exportar o ranking final de qualquer torneio em um formato HTML limpo e pronto para imprimir ou salvar em PDF.
* **Gráfico de Evolução:** Visualização gráfica da pontuação dos jogadores ao longo das rodadas, permitindo identificar o crescimento de cada um no torneio.
* **Histórico:** Lista cronológica de todos os torneios realizados.

## Mecânica de Pontuação
O sistema utiliza uma métrica acumulativa para calcular o ranking, premiando a consistência dos atletas:
* **Vitória:** +2 pontos.
* **Games:** Cada game vencido soma +1 ponto ao total do jogador.
* **Critérios de Desempate:** Em caso de igualdade na pontuação total, o número de vitórias é utilizado como critério de desempate.

## Organização do Código
O projeto segue uma estrutura baseada em separação de responsabilidades:
* `/api`: Scripts PHP responsáveis pela comunicação com o banco de dados e retorno dos dados em formato JSON.
* `/assets/js`: Arquivo principal `statistics.js` que contém toda a lógica de processamento de dados (crunching), renderização do DOM e a manipulação do gráfico (utilizando Chart.js).
* `/views`: Estrutura HTML onde as seções (global e específica) são alternadas dinamicamente via JavaScript para oferecer uma experiência de navegação fluida.