// assets/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    const btnQuickAdd = document.getElementById('btn-quick-add');
    const btnCancelAdd = document.getElementById('btn-cancel-add');
    const quickAddFormContainer = document.getElementById('quick-add-form');
    const formNewPlayer = document.getElementById('form-new-player');

    // 1. Toggle Form - Use direct style.display instead of classList
    btnQuickAdd.addEventListener('click', () => {
        quickAddFormContainer.style.display = 'block'; // Force visible
        btnQuickAdd.style.display = 'none';            // Hide button
    });

    // 2. Cancel Action - Use direct style.display instead of classList
    btnCancelAdd.addEventListener('click', () => {
        quickAddFormContainer.style.display = 'none';  // Force hidden
        btnQuickAdd.style.display = 'block';           // Show button
        formNewPlayer.reset();
    });

    // 3. Handle Form Submission
    formNewPlayer.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('new-name').value.trim();
        const nickname = document.getElementById('new-nickname').value.trim();

        const payload = { name, nickname };

        fetch('api/players.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            return response.json().then(data => {
                if (!response.ok) {
                    throw new Error(data.error || 'Erro desconhecido no servidor.');
                }
                return data;
            });
        })
        .then(result => {
            alert(`${name} cadastrado com sucesso!`);
            // Update submission success to also use style.display
            quickAddFormContainer.style.display = 'none';
            btnQuickAdd.style.display = 'block';
            formNewPlayer.reset();
        })
        .catch(error => {
            console.error('API Error:', error);
            alert(`Falha ao cadastrar jogador: ${error.message}`);
        });
    });

});

// 4. BFCache Override
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const quickAddFormContainer = document.getElementById('quick-add-form');
        const btnQuickAdd = document.getElementById('btn-quick-add');
        const formNewPlayer = document.getElementById('form-new-player');

        // Reset visibility directly
        if (quickAddFormContainer) quickAddFormContainer.style.display = 'none';
        if (btnQuickAdd) btnQuickAdd.style.display = 'block';
        if (formNewPlayer) formNewPlayer.reset();
    }
});