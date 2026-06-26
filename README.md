# Super 8 manager

Este é um sistema web leve desenvolvido para gerenciar torneios, acompanhar estatísticas de desempenho dos atletas e visualizar o histórico de competições. O projeto foi construído com foco em simplicidade, rapidez no acesso aos dados e facilidade de manutenção.

Link para a apresentação: [Presentation](https://drive.google.com/file/d/1T3DdN7m_IBwOGCNEDkp1xeLncuZHyLua/view?usp=drive_link)

## Funcionalidades
* **Dashboard Global:** Visão geral com ranking consolidado de todos os torneios concluídos.
* **Detalhes do Torneio:** Visualização específica por torneio, contendo a classificação detalhada de cada atleta.
* **Exportação para Impressão:** Botão para exportar o ranking final de qualquer torneio em um formato HTML limpo e pronto para imprimir ou salvar em PDF.
* **Gráfico de Evolução:** Visualização gráfica da pontuação dos jogadores ao longo das rodadas, utilizando Chart.js.
* **Histórico:** Lista cronológica de todos os torneios realizados.
* **Mobile-First:** Sistema pensado e desenvolvido para uso em telas mobile.

## Mecânica de Pontuação
O sistema utiliza uma métrica acumulativa para calcular o ranking, premiando a consistência dos atletas:
* **Vitória:** +2 pontos.
* **Games:** Cada game vencido soma +1 ponto ao total do jogador.
* **Critérios de Desempate:** Em caso de igualdade na pontuação total, o número de vitórias é utilizado como critério de desempate.

## Arquitetura e Organização do Código
O projeto adota uma abordagem minimalista, utilizando **PHP puro (Vanilla PHP)** no backend, sem dependências de frameworks, o que garante performance e facilidade de deploy:

* `/core`: Contém a lógica central e as funções utilitárias que sustentam o funcionamento do sistema, em PHP.
* `/api`: Camada de serviço escrita em PHP puro, responsável por processar as requisições, interagir com a camada de dados e retornar os dados em formato JSON para o frontend.
* `/assets/js`: Contém o `statistics.js`, responsável pelo processamento de dados (*data crunching*), renderização dinâmica do DOM e manipulação de gráficos.
* `/views`: Estrutura HTML que hospeda as seções (global e específica), alternadas via JavaScript para uma navegação fluida.
