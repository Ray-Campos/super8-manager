// assets/js/tournaments.js
document.addEventListener('DOMContentLoaded', () => {

    const tableBody = document.getElementById('tournament-table-body');
    const tourCounter = document.getElementById('tournament-counter');
    const tourForm = document.getElementById('tournament-form');
    const inputName = document.getElementById('tour-name');
    const inputFormat = document.getElementById('tour-format');
    const selectedCountText = document.getElementById('selected-count');
    const btnSubmit = document.getElementById('btn-submit-form');
    
    // View Toggles
    const rotatingSelection = document.getElementById('rotating-selection');
    const fixedSelection = document.getElementById('fixed-selection');
    const playerGrid = document.getElementById('player-selection-grid');
    const fixedPairsContainer = document.getElementById('fixed-pairs-container');

    // ==========================================
    // 1. LOAD AND RENDER TOURNAMENTS
    // ==========================================
    function loadTournaments() {
        fetch('../api/tournament.php')
            .then(res => res.json())
            .then(response => {
                if (response.success || response.sucesso) {
                    renderTournamentTable(response.data || response.dados);
                }
            })
            .catch(err => console.error('Error fetching tournaments:', err));
    }

    function renderTournamentTable(tournaments) {
        tourCounter.textContent = tournaments.length;

        if (tournaments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        Nenhum torneio criado. Configure o primeiro ao lado!
                    </td>
                </tr>`;
            return;
        }

        const sortedTournaments = [...tournaments].reverse();
        tableBody.innerHTML = '';

        sortedTournaments.forEach(tour => {
            const formatText = tour.format === 'rotating' ? 'Rotativas' : 'Fixas';
            const statusBadge = tour.status === 'in_progress' 
                ? '<span class="badge-status status-active">Em Andamento</span>'
                : '<span class="badge-status status-completed">Concluido</span>';

            // Changed the completed button to "Editar" pointing back to the active-tournament view
            const actionButton = tour.status === 'in_progress'
                ? `<a href="active-tournament.html?id=${tour.id}" class="btn-action" style="text-decoration: none; display: inline-block;">Continuar</a>`
                : `<a href="active-tournament.html?id=${tour.id}" class="btn-secondary" style="text-decoration: none; display: inline-block; padding: 0.4rem 0.8rem; font-size: 0.85rem; width: auto;">Editar</a>`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${tour.name}</strong></td>
                <td>${formatText}</td>
                <td>${statusBadge}</td>
                <td>${actionButton}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // ==========================================
    // 2. LOAD PLAYERS AND HANDLE SELECTION
    // ==========================================
    function loadPlayers() {
        fetch('../api/players.php')
            .then(res => res.json())
            .then(response => {
                if (response.success || response.sucesso) {
                    renderPlayerSelectors(response.data || response.dados);
                }
            })
            .catch(err => console.error('Error fetching players:', err));
    }

    function renderPlayerSelectors(players) {
        if (players.length < 8) {
            playerGrid.innerHTML = `<span style="color: var(--danger); grid-column: span 2;">
                Voce precisa de pelo menos 8 jogadores cadastrados. (Atual: ${players.length})
            </span>`;
            return;
        }

        // 2A. Render Checkboxes (Rotating)
        playerGrid.innerHTML = '';
        players.forEach(player => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" class="player-checkbox" value="${player.id}">
                ${player.name} ${player.nickname ? `(${player.nickname})` : ''}
            `;
            playerGrid.appendChild(label);
        });

        // 2B. Render Dropdowns (Fixed Pairs)
        fixedPairsContainer.innerHTML = '';
        for (let i = 1; i <= 4; i++) {
            const pairDiv = document.createElement('div');
            pairDiv.style.border = "1px solid var(--border-color)";
            pairDiv.style.padding = "0.8rem";
            pairDiv.style.borderRadius = "6px";
            pairDiv.style.background = "var(--bg-color)";

            pairDiv.innerHTML = `
                <strong style="font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">Dupla ${i}</strong>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <select class="fixed-player-select" style="margin:0; padding:0.4rem; font-size: 0.9rem;">
                        <option value="">Selecione o Atleta 1...</option>
                        ${players.map(p => `<option value="${p.id}">${p.name} ${p.nickname ? `(${p.nickname})` : ''}</option>`).join('')}
                    </select>
                    <select class="fixed-player-select" style="margin:0; padding:0.4rem; font-size: 0.9rem;">
                        <option value="">Selecione o Atleta 2...</option>
                        ${players.map(p => `<option value="${p.id}">${p.name} ${p.nickname ? `(${p.nickname})` : ''}</option>`).join('')}
                    </select>
                </div>
            `;
            fixedPairsContainer.appendChild(pairDiv);
        }

        // Attach Event Listeners
        document.querySelectorAll('.player-checkbox').forEach(cb => cb.addEventListener('change', validateSelection));
        document.querySelectorAll('.fixed-player-select').forEach(sel => sel.addEventListener('change', validateSelection));
    }

    // Toggle View based on Format
    inputFormat.addEventListener('change', (e) => {
        if (e.target.value === 'fixed') {
            rotatingSelection.style.display = 'none';
            fixedSelection.style.display = 'block';
        } else {
            rotatingSelection.style.display = 'block';
            fixedSelection.style.display = 'none';
        }
        validateSelection();
    });

    function validateSelection() {
        const isFixed = inputFormat.value === 'fixed';
        let isValid = false;

        if (!isFixed) {
            const count = document.querySelectorAll('.player-checkbox:checked').length;
            selectedCountText.textContent = count;
            if (count === 8) {
                selectedCountText.style.color = "var(--success)";
                selectedCountText.style.fontWeight = "bold";
                isValid = true;
            } else {
                selectedCountText.style.color = count > 8 ? "var(--danger)" : "var(--text-main)";
            }
        } else {
            const selects = document.querySelectorAll('.fixed-player-select');
            const selectedIds = new Set();
            let validCount = 0;

            selects.forEach(s => {
                if (s.value !== "") {
                    selectedIds.add(s.value);
                    validCount++;
                }
            });

            selectedCountText.textContent = selectedIds.size;

            if (validCount === 8 && selectedIds.size === 8) {
                selectedCountText.style.color = "var(--success)";
                selectedCountText.style.fontWeight = "bold";
                isValid = true;
            } else {
                selectedCountText.style.color = validCount > 0 ? "var(--danger)" : "var(--text-main)";
            }
        }

        btnSubmit.disabled = !isValid;
    }

    // ==========================================
    // 3. HANDLE TOURNAMENT CREATION (POST)
    // ==========================================
    tourForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let playerIds = [];
        if (inputFormat.value === 'rotating') {
            const selectedCheckboxes = document.querySelectorAll('.player-checkbox:checked');
            playerIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        } else {
            const selects = document.querySelectorAll('.fixed-player-select');
            playerIds = Array.from(selects).map(s => parseInt(s.value));
        }

        const payload = {
            name: inputName.value.trim(),
            format: inputFormat.value,
            player_ids: playerIds
        };

        fetch('../api/tournament.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json().then(data => {
            if (!res.ok) throw new Error(data.error || 'Erro no servidor.');
            return data;
        }))
        .then(result => {
            alert(`Torneio "${payload.name}" gerado com sucesso!`);
            tourForm.reset();
            validateSelection(); 
            loadTournaments(); 
        })
        .catch(err => alert(`Falha ao criar torneio: ${err.message}`));
    });

    loadTournaments();
    loadPlayers();
});