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
        return p ? (p.nickname || p.name) : `Desconhecido (${id})`;
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

                // Determine match winner (+2 points)
                let winA = 0, winB = 0;
                if (scoreA > scoreB) winA = 1;
                if (scoreB > scoreA) winB = 1;

                const pointsA = (winA * 2) + scoreA;
                const pointsB = (winB * 2) + scoreB;

                // Process Team A Players
                match.teamA.forEach(playerId => {
                    if (!statsObject[playerId]) initPlayerStat(statsObject, playerId);
                    statsObject[playerId].matches += 1;
                    statsObject[playerId].wins += winA;
                    statsObject[playerId].gamesWon += scoreA;
                    statsObject[playerId].totalPoints += pointsA;
                });

                // Process Team B Players
                match.teamB.forEach(playerId => {
                    if (!statsObject[playerId]) initPlayerStat(statsObject, playerId);
                    statsObject[playerId].matches += 1;
                    statsObject[playerId].wins += winB;
                    statsObject[playerId].gamesWon += scoreB;
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
            gamesWon: 0,
            totalPoints: 0
        };
    }

    // ==========================================
    // SPECIFIC TOURNAMENT VIEW
    // ==========================================
    function initSpecificView() {
        viewSpecific.style.display = 'block';
        btnBack.href = "statistics.html"; // Back goes to global stats
        btnBack.textContent = "Voltar aos Rankings";

        fetch(`../api/tournament.php?id=${tournamentId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    const tour = res.data;
                    document.getElementById('specific-tour-name').textContent = tour.name;
                    pageTitle.textContent = "Classificacao";
                    
                    let stats = {};
                    processTournamentStats(tour, stats);
                    renderSpecificRanking(stats);
                }
            });
    }

    function renderSpecificRanking(statsObject) {
        const tbody = document.getElementById('specific-ranking-body');
        tbody.innerHTML = '';

        // Convert object to array and sort by Total Points (descending), then Wins
        let ranking = Object.values(statsObject).sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            return b.wins - a.wins; // Tie-breaker: most wins
        });

        ranking.forEach((stat, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td>${getPlayerName(stat.id)}</td>
                <td>${stat.wins}</td>
                <td>${stat.gamesWon}</td>
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
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Nenhum dado disponivel ainda.</td></tr>`;
            return;
        }

        ranking.forEach(stat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${getPlayerName(stat.id)}</strong></td>
                <td>${stat.matches}</td>
                <td>${stat.wins}</td>
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

        // Show newest first
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

});