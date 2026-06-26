// assets/js/statistics.js
document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');

    const viewGlobal = document.getElementById('view-global');
    const viewSpecific = document.getElementById('view-specific');
    const pageTitle = document.getElementById('page-title');
    const btnBack = document.getElementById('btn-back');

    let playersCache = [];

    // Bootstrap: Load players first, then route the logic
    fetch('../api/players.php')
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                playersCache = res.data;
                if (tournamentId) {
                    initSpecificView();
                } else {
                    initGlobalView();
                }
            }
        });

    function getPlayerName(id) {
        const p = playersCache.find(player => player.id == id);
        return p ? (p.nickname || p.name.split(' ')[0]) : `Atleta ${id}`;
    }

    // ==========================================
    // DATA CRUNCHING LOGIC
    // ==========================================
    function processTournamentStats(tournament, statsObject) {
        if (!tournament.rounds) return;

        tournament.rounds.forEach(round => {
            if (!round.completed) return;

            round.matches.forEach(match => {
                const scoreA = match.scoreA || 0;
                const scoreB = match.scoreB || 0;

                // Determine match winner and loser
                let winA = 0, winB = 0;
                let lossA = 0, lossB = 0;
                
                if (scoreA > scoreB) { winA = 1; lossB = 1; }
                if (scoreB > scoreA) { winB = 1; lossA = 1; }

                // Points math: (+2 for win) + games won
                const pointsA = (winA * 2) + scoreA;
                const pointsB = (winB * 2) + scoreB;

                // Process Team A Players
                match.teamA.forEach(playerId => {
                    if (!statsObject[playerId]) initPlayerStat(statsObject, playerId);
                    statsObject[playerId].matches += 1;
                    statsObject[playerId].wins += winA;
                    statsObject[playerId].losses += lossA;
                    statsObject[playerId].gamesWon += scoreA;
                    statsObject[playerId].gamesLost += scoreB;
                    statsObject[playerId].totalPoints += pointsA;
                });

                // Process Team B Players
                match.teamB.forEach(playerId => {
                    if (!statsObject[playerId]) initPlayerStat(statsObject, playerId);
                    statsObject[playerId].matches += 1;
                    statsObject[playerId].wins += winB;
                    statsObject[playerId].losses += lossB;
                    statsObject[playerId].gamesWon += scoreB;
                    statsObject[playerId].gamesLost += scoreA;
                    statsObject[playerId].totalPoints += pointsB;
                });
            });
        });
    }

    function initPlayerStat(statsObject, playerId) {
        statsObject[playerId] = {
            id: playerId,
            matches: 0,
            wins: 0,
            losses: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalPoints: 0
        };
    }

    // ==========================================
    // SPECIFIC TOURNAMENT VIEW
    // ==========================================
    function initSpecificView() {
        viewSpecific.style.display = 'block';
        btnBack.href = "statistics.html"; 
        btnBack.textContent = "Voltar aos Rankings";

        fetch(`../api/tournament.php?id=${tournamentId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    const tour = res.data;
                    document.getElementById('specific-tour-name').textContent = tour.name;
                    pageTitle.textContent = "Classificação";
                    
                    let stats = {};
                    processTournamentStats(tour, stats);
                    renderSpecificRanking(stats);
                    renderEvolutionChart(tour); // <-- Add this call here

                    // ATTACH LISTENER HERE: Only after the table is populated
                    const btnExport = document.getElementById('btn-export-html');
                    
                    // Remove existing listeners to prevent duplication if called multiple times
                    btnExport.replaceWith(btnExport.cloneNode(true));
                    const newBtnExport = document.getElementById('btn-export-html');
                    
                    newBtnExport.addEventListener('click', () => {
                        const tournamentName = document.getElementById('specific-tour-name').textContent;
                        
                        // Target the specific body where the results actually live
                        const tbody = document.getElementById('specific-ranking-body');
                        
                        // Generate the full table HTML manually to ensure it's clean
                        const fullTableHTML = `
                            <table border="1" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th>Pos</th>
                                        <th>Atleta</th>
                                        <th>Vitorias</th>
                                        <th>Games</th>
                                        <th>TotalPts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tbody.innerHTML}
                                </tbody>
                            </table>
                        `;

                        const printWindow = window.open('', '_blank', 'width=800,height=600');
                        printWindow.document.write(`
                            <html>
                                <head>
                                    <title>Resultados - ${tournamentName}</title>
                                    <style>
                                        body { font-family: sans-serif; padding: 20px; }
                                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                    </style>
                                </head>
                                <body>
                                    <h2>${tournamentName}</h2>
                                    ${fullTableHTML}
                                </body>
                            </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                    });
                }
            });
    }

    function renderSpecificRanking(statsObject) {
        const tbody = document.getElementById('specific-ranking-body');
        tbody.innerHTML = '';

        // Sort by Total Points (descending), then Wins
        let ranking = Object.values(statsObject).sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            return b.wins - a.wins; 
        });

        ranking.forEach((stat, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td>${getPlayerName(stat.id)}</td>
                <td>${stat.wins}</td>
                <td>${stat.losses}</td>
                <td>${stat.gamesWon}</td>
                <td>${stat.gamesLost}</td>
                <td><strong>${stat.totalPoints}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // GLOBAL DASHBOARD VIEW
    // ==========================================
    function initGlobalView() {
        viewGlobal.style.display = 'block';

        fetch('../api/tournament.php')
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    let globalStats = {};
                    const completedTournaments = res.data.filter(t => t.status === 'completed');

                    completedTournaments.forEach(tour => {
                        processTournamentStats(tour, globalStats);
                    });

                    renderGlobalRanking(globalStats);
                    renderTournamentHistory(completedTournaments);
                }
            });
    }

    function renderGlobalRanking(statsObject) {
        const tbody = document.getElementById('global-ranking-body');
        tbody.innerHTML = '';

        let ranking = Object.values(statsObject).sort((a, b) => b.totalPoints - a.totalPoints);

        if (ranking.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhum dado disponivel ainda.</td></tr>`;
            return;
        }

        ranking.forEach(stat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${getPlayerName(stat.id)}</strong></td>
                <td>${stat.matches}</td>
                <td>${stat.wins}</td>
                <td>${stat.losses}</td>
                <td>${stat.gamesWon}</td>
                <td>${stat.gamesLost}</td>
                <td><strong>${stat.totalPoints}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderTournamentHistory(tournaments) {
        const tbody = document.getElementById('history-table-body');
        tbody.innerHTML = '';

        if (tournaments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nenhum torneio concluido.</td></tr>`;
            return;
        }

        const sorted = [...tournaments].reverse();

        sorted.forEach(tour => {
            const tr = document.createElement('tr');
            const formatText = tour.format === 'rotating' ? 'Rotativas' : 'Fixas';
            tr.innerHTML = `
                <td><strong>${tour.name}</strong></td>
                <td>${formatText}</td>
                <td>
                    <a href="statistics.html?id=${tour.id}" class="btn-action" style="text-decoration: none;">Ver Resultados</a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Add this helper to your statistics.js
    function renderEvolutionChart(tour) {
        const ctx = document.getElementById('evolutionChart').getContext('2d');
        
        // Labels for X-axis (Início + cada rodada)
        const labels = ['Início', ...tour.rounds.map(r => `Rd ${r.number}`)];
        
        // Process data per player
        const datasets = tour.player_ids.map(playerId => {
            let runningTotal = 0;
            let pointsHistory = [0]; // Starting at 0 points
            
            tour.rounds.forEach(round => {
                // Find points earned by this player in this specific round
                round.matches.forEach(match => {
                    const team = match.teamA.includes(playerId) ? 'A' : (match.teamB.includes(playerId) ? 'B' : null);
                    if (team) {
                        const score = team === 'A' ? match.scoreA : match.scoreB;
                        const opponentScore = team === 'A' ? match.scoreB : match.scoreA;
                        const won = score > opponentScore;
                        
                        // Add 2 for win, + score for points
                        runningTotal += (won ? 2 : 0) + (score || 0);
                    }
                });
                pointsHistory.push(runningTotal);
            });
            
            return {
                label: getPlayerName(playerId),
                data: pointsHistory,
                fill: false,
                tension: 0.3
            };
        });

        new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

});