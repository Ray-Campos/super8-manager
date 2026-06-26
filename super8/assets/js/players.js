// assets/js/players.js
document.addEventListener('DOMContentLoaded', () => {
    
    // DOM Selectors
    const tableBody = document.getElementById('player-table-body');
    const playerCounter = document.getElementById('player-counter');
    const playerForm = document.getElementById('player-form');
    
    // Form control elements for dynamic context switching
    const inputId = document.getElementById('player-id');
    const inputName = document.getElementById('player-name');
    const inputNickname = document.getElementById('player-nickname');
    const formTitle = document.getElementById('form-title');
    const formDescription = document.getElementById('form-description');
    const btnResetForm = document.getElementById('btn-reset-form');

    // State cache to hold player records locally after fetching
    let localPlayersCache = [];

    /**
     * READ: Fetches the entire directory of players from players.php
     */
    function loadPlayers() {
        fetch('../api/players.php')
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    localPlayersCache = response.data;
                    renderTable(localPlayersCache);
                } else {
                    alert('Erro ao carregar os dados.');
                }
            })
            .catch(err => console.error('Error fetching data:', err));
    }

    /**
     * Renders array of records cleanly to HTML table
     */
    function renderTable(players) {
        playerCounter.textContent = players.length;

        if (players.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        Nenhum jogador cadastrado ainda. Use o formulário ao lado!
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = '';
        players.forEach(player => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${player.name}</strong></td>
                <td>${player.nickname || '<span style="color:var(--text-muted); font-style:italic;">Nenhum</span>'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-small btn-edit" data-id="${player.id}">Editar</button>
                        <button class="btn-small btn-delete" data-id="${player.id}">Excluir</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Attach Event Listeners to freshly rendered action items
        document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', handleEditClick));
        document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', handleDeleteClick));
    }

    /**
     * PRE-POPULATE STATE: Triggered on clicking "Editar"
     */
    function handleEditClick(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        const targetPlayer = localPlayersCache.find(p => p.id === id);

        if (targetPlayer) {
            // Fill target controls
            inputId.value = targetPlayer.id;
            inputName.value = targetPlayer.name;
            inputNickname.value = targetPlayer.nickname;

            // Mutate context to Update Mode
            formTitle.textContent = "Editar Jogador";
            formDescription.textContent = `Alterando dados cadastrais de ID #${targetPlayer.id}.`;
            btnResetForm.style.display = 'block';
            inputName.focus();
        }
    }

    /**
     * RESET STATE: Return form to default Create Mode
     */
    function clearFormState() {
        playerForm.reset();
        inputId.value = '';
        formTitle.textContent = "Novo Jogador";
        formDescription.textContent = "Preencha os dados abaixo para inserir um atleta.";
        btnResetForm.style.display = 'none';
    }

    btnResetForm.addEventListener('click', clearFormState);

    /**
     * CREATE / UPDATE: Handles dispatching routing on execution
     */
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const idValue = inputId.value;
        const payload = {
            name: inputName.value.trim(),
            nickname: inputNickname.value.trim()
        };

        // Determine method style: if an ID is active, it's a PUT request
        const isEditMode = idValue !== "";
        const endpoint = '../api/players.php';
        
        const fetchOptions = {
            method: isEditMode ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(isEditMode ? { id: parseInt(idValue), ...payload } : payload)
        };

        fetch(endpoint, fetchOptions)
            .then(res => {
                return res.json().then(data => {
                    if (!res.ok) throw new Error(data.error || 'Erro no servidor.');
                    return data;
                });
            })
            .then(result => {
                alert(isEditMode ? 'Atleta atualizado com sucesso!' : 'Atleta cadastrado com sucesso!');
                clearFormState();
                loadPlayers(); // Live refresh local registry
            })
            .catch(err => {
                alert(`Falha na operação: ${err.message}`);
            });
    });

    /**
     * DELETE ROUTINE: Sends targeted request using URL query variables
     */
    function handleDeleteClick(e) {
        const id = e.target.getAttribute('data-id');
        const targetPlayer = localPlayersCache.find(p => p.id === parseInt(id));

        if (confirm(`Tem certeza de que deseja remover o jogador "${targetPlayer.name}" da base de dados?`)) {
            fetch(`../api/players.php?id=${id}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    loadPlayers(); // Live refresh
                } else {
                    alert(result.error || 'Erro ao deletar jogador.');
                }
            })
            .catch(err => console.error('Error deleting player:', err));
        }
    }

    // Initial Execution sequence on boot
    loadPlayers();
});