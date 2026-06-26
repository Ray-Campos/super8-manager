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

    let tournamentData = null;
    let playersCache = [];
    let viewingRoundIndex = 0; 

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
                    headerTitle.textContent = `🎾 ${tournamentData.name}`;
                    
                    // Automatically find the first round that is NOT completed
                    let activeIndex = tournamentData.rounds.findIndex(r => r.completed === false);
                    if (activeIndex === -1) activeIndex = tournamentData.rounds.length - 1; // Default to last if all done
                    
                    viewingRoundIndex = activeIndex;
                    renderInterface();
                } else {
                    alert("Torneio não encontrado.");
                    window.location.href = "tournament.html";
                }
            })
            .catch(err => console.error("Error:", err));
    }

    function getPlayerName(id) {
        const p = playersCache.find(player => player.id == id);
        if (!p) return `Atleta ${id}`;
        if (p.nickname) return p.nickname;
        return p.name.split(' ')[0]; // Just the first name to save space
    }

    // 2. RENDER UI
    function renderInterface() {
        renderTabs();
        renderMatches(viewingRoundIndex);
    }

    function renderTabs() {
        roundNavTabs.innerHTML = '';
        
        let activeRoundIndex = tournamentData.rounds.findIndex(r => r.completed === false);
        if (activeRoundIndex === -1) activeRoundIndex = 99; // All unlocked if finished

        tournamentData.rounds.forEach((round, index) => {
            const btn = document.createElement('button');
            btn.classList.add('tab');
            
            if (index === viewingRoundIndex) btn.classList.add('active');

            if (index > activeRoundIndex) {
                btn.classList.add('locked');
                btn.innerHTML = `🔒 Rd ${round.number}`;
                btn.disabled = true;
            } else {
                btn.innerHTML = `Rodada ${round.number}`;
                btn.addEventListener('click', () => {
                    viewingRoundIndex = index;
                    renderInterface();
                });
            }
            roundNavTabs.appendChild(btn);
        });
    }

    function renderMatches(roundIndex) {
        const round = tournamentData.rounds[roundIndex];
        currentRoundTitle.textContent = `Rodada ${round.number} de 7`;
        
        if (round.completed) {
            currentRoundStatus.textContent = "Rodada finalizada! Exibindo resultados.";
            currentRoundStatus.style.color = "var(--success)";
            btnSaveRound.style.display = "none"; 
        } else {
            currentRoundStatus.textContent = "Preencha os resultados para avançar.";
            currentRoundStatus.style.color = "var(--text-muted)";
            btnSaveRound.style.display = "block";
        }

        matchesContainer.innerHTML = '';

        round.matches.forEach((match, matchIndex) => {
            const teamANames = `${getPlayerName(match.teamA[0])} / ${getPlayerName(match.teamA[1])}`;
            const teamBNames = `${getPlayerName(match.teamB[0])} / ${getPlayerName(match.teamB[1])}`;

            const valA = match.scoreA !== null ? match.scoreA : '';
            const valB = match.scoreB !== null ? match.scoreB : '';
            const isReadonly = round.completed ? 'readonly' : '';

            const card = document.createElement('div');
            card.classList.add('card', 'match-card');
            
            card.innerHTML = `
                <div class="court-badge">Quadra ${match.court}</div>
                
                <div class="match-team">
                    <span>${teamANames}</span>
                    <input type="number" min="0" max="9" class="input-score input-score-a" data-match-index="${matchIndex}" placeholder="0" value="${valA}" ${isReadonly}>
                </div>
                
                <div class="vs-divider">VS</div>
                
                <div class="match-team">
                    <span>${teamBNames}</span>
                    <input type="number" min="0" max="9" class="input-score input-score-b" data-match-index="${matchIndex}" placeholder="0" value="${valB}" ${isReadonly}>
                </div>
            `;
            matchesContainer.appendChild(card);
        });
    }

    // 3. VALIDATE AND SAVE
    btnSaveRound.addEventListener('click', () => {
        const scoresA = document.querySelectorAll('.input-score-a');
        const scoresB = document.querySelectorAll('.input-score-b');
        
        let allFilled = true;
        let roundResults = [];

        scoresA.forEach((input, i) => {
            const valA = input.value.trim();
            const valB = scoresB[i].value.trim();

            if (valA === '' || valB === '') {
                allFilled = false;
            } else {
                roundResults.push({
                    matchIndex: parseInt(input.getAttribute('data-match-index')),
                    scoreA: parseInt(valA),
                    scoreB: parseInt(valB)
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
                alert("Torneio finalizado com sucesso! Indo para os resultados.");
                window.location.href = "statistics.html?id=" + tournamentData.id;
            } else {
                loadTournamentData(); 
            }
        })
        .catch(err => {
            console.error(err);
            alert(`Erro: ${err.message}`);
        });
    });

});