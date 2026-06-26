// assets/js/active-tournament.js
document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');

    if (!tournamentId) {
        alert("Nenhum torneio selecionado!");
        window.location.href = "tournament.html";
        return;
    }

    const headerTitle = document.getElementById('header-title');
    const roundNavTabs = document.getElementById('round-nav-tabs');
    const currentRoundTitle = document.getElementById('current-round-title');
    const currentRoundStatus = document.getElementById('current-round-status');
    const matchesContainer = document.getElementById('matches-container');
    const btnSaveRound = document.getElementById('btn-save-round');

    // Intermission Elements
    const intermissionContainer = document.getElementById('intermission-container');
    const intermissionTableBody = document.getElementById('intermission-table-body');
    const btnStartNextRound = document.getElementById('btn-start-next-round');
    const nextRoundLabel = document.getElementById('next-round-label');

    let tournamentData = null;
    let playersCache = [];
    let viewingRoundIndex = 0; 
    let activeRoundIndex = 0;
    let isEditingCompletedTournament = false;
    let showIntermission = false;

    // 1. BOOTSTRAP
    fetch('../api/players.php')
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                playersCache = res.data;
                loadTournamentData(); 
            }
        });

    function loadTournamentData() {
        fetch(`../api/tournament.php?id=${tournamentId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    tournamentData = res.data;
                    
                    activeRoundIndex = tournamentData.rounds.findIndex(r => r.completed === false);

                    if (activeRoundIndex === -1) {
                        isEditingCompletedTournament = true;
                        activeRoundIndex = tournamentData.rounds.length - 1;
                        showIntermission = false;
                    } else {
                        isEditingCompletedTournament = false;
                        if (activeRoundIndex > 0) {
                            showIntermission = true;
                        }
                    }

                    headerTitle.textContent = isEditingCompletedTournament
                    ? `Editando - ${tournamentData.name}`
                    : `${tournamentData.name}`;

                    viewingRoundIndex = activeRoundIndex;
                    renderInterface();
                } else {
                    alert("Torneio nao encontrado.");
                    window.location.href = "tournament.html";
                }
            })
            .catch(err => console.error("Error:", err));
    }

    function getPlayerName(id) {
        const p = playersCache.find(player => player.id == id);
        if (!p) return `Atleta ${id}`;
        if (p.nickname) return p.nickname;
        return p.name.split(' ')[0]; 
    }

    // 2. RENDER UI
    function renderInterface() {
        renderTabs();

        const round = tournamentData.rounds[viewingRoundIndex];
        currentRoundTitle.textContent = `Rodada ${round.number} de ${tournamentData.rounds.length}`;

        // INTERMISSION LOGIC
        if (showIntermission && viewingRoundIndex === activeRoundIndex && viewingRoundIndex > 0) {
            
            currentRoundStatus.textContent = "Classificacao Parcial Atual";
            
            if (matchesContainer) matchesContainer.style.display = 'none';
            if (btnSaveRound) btnSaveRound.style.display = 'none';
            if (intermissionContainer) intermissionContainer.style.display = 'block';
            
            if (nextRoundLabel) nextRoundLabel.textContent = round.number;
            renderPartialStandings(viewingRoundIndex - 1);

        } else {
            // NORMAL MATCH LOGIC
            if (intermissionContainer) intermissionContainer.style.display = 'none';
            if (matchesContainer) matchesContainer.style.display = 'flex';
            
            if (round.completed && !isEditingCompletedTournament) {
                currentRoundStatus.textContent = "Rodada finalizada! Exibindo resultados.";
                currentRoundStatus.style.color = "var(--success)";
                if (btnSaveRound) btnSaveRound.style.display = "none";
            } else {
                if (isEditingCompletedTournament) {
                    currentRoundStatus.textContent = "Modo de edicao: altere os placares e salve as alteracoes.";
                    if (btnSaveRound) btnSaveRound.textContent = "Salvar Alteracoes";
                } else {
                    currentRoundStatus.textContent = "Preencha os resultados para avancar.";
                    if (btnSaveRound) btnSaveRound.textContent = "Salvar Rodada e Avancar";
                }
                currentRoundStatus.style.color = "var(--text-muted)";
                if (btnSaveRound) btnSaveRound.style.display = "block";
            }

            renderMatches(viewingRoundIndex);
        }
    }

    if (btnStartNextRound) {
        btnStartNextRound.addEventListener('click', () => {
            showIntermission = false;
            renderInterface();
        });
    }

    function renderTabs() {
        roundNavTabs.innerHTML = '';
        
        tournamentData.rounds.forEach((round, index) => {
            const btn = document.createElement('button');
            btn.classList.add('tab');
            
            if (index === viewingRoundIndex) btn.classList.add('active');

            if (!isEditingCompletedTournament && index > activeRoundIndex) {
                btn.classList.add('locked');
                btn.innerHTML = `🔒Rd ${round.number}`;
                btn.disabled = true;
            } else {
                btn.innerHTML = `Rodada ${round.number}`;
                btn.addEventListener('click', () => {
                    if (index !== activeRoundIndex) showIntermission = false;
                    viewingRoundIndex = index;
                    renderInterface();
                });
            }
            roundNavTabs.appendChild(btn);
        });
    }

    // ==========================================
    // PARTIAL STANDINGS LOGIC
    // ==========================================
    function renderPartialStandings(maxRoundIndex) {
        let statsObject = {};

        tournamentData.rounds.forEach((round, index) => {
            if (index > maxRoundIndex || !round.completed) return;

            round.matches.forEach(match => {
                const scoreA = match.scoreA || 0;
                const scoreB = match.scoreB || 0;

                let winA = 0, winB = 0, lossA = 0, lossB = 0;
                if (scoreA > scoreB) { winA = 1; lossB = 1; }
                if (scoreB > scoreA) { winB = 1; lossA = 1; }

                const pointsA = (winA * 2) + scoreA;
                const pointsB = (winB * 2) + scoreB;

                match.teamA.forEach(playerId => {
                    if (!statsObject[playerId]) initStat(statsObject, playerId);
                    statsObject[playerId].wins += winA;
                    statsObject[playerId].losses += lossA;
                    statsObject[playerId].gamesWon += scoreA;
                    statsObject[playerId].gamesLost += scoreB;
                    statsObject[playerId].totalPoints += pointsA;
                });

                match.teamB.forEach(playerId => {
                    if (!statsObject[playerId]) initStat(statsObject, playerId);
                    statsObject[playerId].wins += winB;
                    statsObject[playerId].losses += lossB;
                    statsObject[playerId].gamesWon += scoreB;
                    statsObject[playerId].gamesLost += scoreA;
                    statsObject[playerId].totalPoints += pointsB;
                });
            });
        });

        if (intermissionTableBody) {
            intermissionTableBody.innerHTML = '';
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
                intermissionTableBody.appendChild(tr);
            });
        }
    }

    function initStat(obj, id) {
        obj[id] = { id: id, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, totalPoints: 0 };
    }

    // ==========================================
    // MATCH RENDERING & SAVING
    // ==========================================
    function renderMatches(roundIndex) {
        const round = tournamentData.rounds[roundIndex];
        matchesContainer.innerHTML = '';

        round.matches.forEach((match, matchIndex) => {
            const teamANames = `${getPlayerName(match.teamA[0])} / ${getPlayerName(match.teamA[1])}`;
            const teamBNames = `${getPlayerName(match.teamB[0])} / ${getPlayerName(match.teamB[1])}`;

            const valA = match.scoreA !== null ? match.scoreA : '';
            const valB = match.scoreB !== null ? match.scoreB : '';
            const isReadonly =
                (round.completed && !isEditingCompletedTournament)
                    ? 'readonly'
                    : '';
            
            const isDisabled = 
                (round.completed && !isEditingCompletedTournament)
                    ? 'disabled'
                    : '';

            const card = document.createElement('div');
            card.classList.add('card', 'match-card');
            
            card.innerHTML = `
                <div class="court-badge">Quadra ${match.court}</div>
                
                <div class="match-team">
                    <span>${teamANames}</span>
                    <div class="score-stepper">
                        <button type="button" class="btn-stepper btn-minus" ${isDisabled}>-</button>
                        <input type="number" min="0" max="5" class="input-score input-score-a" data-match-index="${matchIndex}" placeholder="0" value="${valA}" ${isReadonly}>
                        <button type="button" class="btn-stepper btn-plus" ${isDisabled}>+</button>
                    </div>
                </div>
                
                <div class="vs-divider">VS</div>
                
                <div class="match-team">
                    <span>${teamBNames}</span>
                    <div class="score-stepper">
                        <button type="button" class="btn-stepper btn-minus" ${isDisabled}>-</button>
                        <input type="number" min="0" max="5" class="input-score input-score-b" data-match-index="${matchIndex}" placeholder="0" value="${valB}" ${isReadonly}>
                        <button type="button" class="btn-stepper btn-plus" ${isDisabled}>+</button>
                    </div>
                </div>
            `;
            matchesContainer.appendChild(card);
        });
    }

    // 3. VALIDATE AND SAVE
    if (btnSaveRound) {
        btnSaveRound.addEventListener('click', () => {
            const scoresA = document.querySelectorAll('.input-score-a');
            const scoresB = document.querySelectorAll('.input-score-b');
            
            let allFilled = true;
            let roundResults = [];

            scoresA.forEach((input, i) => {
                const valA = input.value.trim();
                const valB = scoresB[i].value.trim();

                const scoreA1 = parseInt(valA);
                const scoreB1 = parseInt(valB);
                if (scoreA1 > 5 || scoreB1 > 5) {
                    alert("O placar maximo permitido e 5.");
                    allFilled = false;
                    return;
                }

                if (valA === '' || valB === '') {
                    allFilled = false;
                } else {
                    roundResults.push({
                        matchIndex: parseInt(input.getAttribute('data-match-index')),
                        scoreA: scoreA1,
                        scoreB: scoreB1
                    });
                }
            });

            if (!allFilled) {
                alert("Por favor, preencha todos os placares antes de salvar.");
                return;
            }

            const payload = {
                tournament_id: tournamentData.id,
                round_number: parseInt(tournamentData.rounds[viewingRoundIndex].number),
                results: roundResults
            };

            fetch('../api/scores.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json().then(data => {
                if (!res.ok) throw new Error(data.error || 'Falha ao salvar rodada.');
                return data;
            }))
            .then(result => {
                if (result.tournament_status === 'completed') {
                    if (isEditingCompletedTournament) {
                        alert("Resultados atualizados com sucesso.");
                        loadTournamentData();
                    } else {
                        alert("Torneio finalizado com sucesso! Indo para os resultados.");
                        window.location.href = "statistics.html?id=" + tournamentData.id;
                    }
                } else {
                    loadTournamentData();
                }
            })
            .catch(err => {
                console.error(err);
                alert(`Erro: ${err.message}`);
            });
        });
    }

    // 4. HANDLE STEPPER BUTTONS (+ / -)
    if (matchesContainer) {
        matchesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-plus')) {
                const input = e.target.previousElementSibling;
                if (!input.readOnly) {
                    let val = parseInt(input.value) || 0;
                    if (val < 5) input.value = val + 1;
                }
            } 
            else if (e.target.classList.contains('btn-minus')) {
                const input = e.target.nextElementSibling;
                if (!input.readOnly) {
                    let val = parseInt(input.value) || 0;
                    if (val > 0) input.value = val - 1;
                }
            }
        });
    }
});