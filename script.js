// --- LÓGICA DO MAPA E DOS FAVORITOS ---

// Espera a página HTML carregar completamente antes de rodar QUALQUER script.
// Todo o nosso código deve ficar dentro deste bloco para evitar erros.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- PARTE 1: LÓGICA DO MAPA MODAL (POP-UP) ---
    
    // Pega a referência do elemento principal do modal (a janela pop-up inteira).
    const mapModalOverlay = document.querySelector('.map-modal-overlay');

    // SÓ EXECUTA O CÓDIGO DO MAPA MODAL SE ELE EXISTIR E TIVER CONTEÚDO NA PÁGINA.
    // Esta verificação de segurança impede que o script dê erro em páginas que não têm o mapa.
    if (mapModalOverlay && mapModalOverlay.innerHTML.trim() !== '') {
        // --- Configurações do Mapa Padrão ---
        // Variáveis para guardar os links do mapa que abre ao clicar no ícone flutuante.
        const DEFAULT_EMBED_URL = "https://www.google.com/maps/d/u/0/embed?mid=1ik6C1K6StANmTeuBqgxgQaBfX-MMM8E&ehbc=2E312F&noprof=1";
        const DEFAULT_SHARE_URL = ""; // Vazio para que o botão "Abrir no Google Maps" não apareça.
        const DEFAULT_TITLE = "Visão Geral da Grande Vitória";

        // --- Seletores dos Elementos do Mapa ---
        // Guarda a referência de cada parte interativa do mapa em uma variável para fácil acesso.
        const mapCloseBtn = document.querySelector('.map-close-btn');
        const mapIconToggle = document.querySelector('.map-icon-toggle');
        const iframe = mapModalOverlay.querySelector('iframe');
        const googleMapsButton = mapModalOverlay.querySelector('.map-button');
        const mapModalTitle = document.querySelector('#map-modal-title');

        // Funções reutilizáveis para mostrar e esconder o modal, adicionando/removendo uma classe CSS.
        function openMapModal() { mapModalOverlay.classList.add('is-visible'); }
        function closeMapModal() { mapModalOverlay.classList.remove('is-visible'); }

        // --- Eventos de Fechar o Modal ---
        mapCloseBtn.addEventListener('click', closeMapModal); // Fecha ao clicar no "X".
        mapModalOverlay.addEventListener('click', (event) => { if (event.target === mapModalOverlay) closeMapModal(); }); // Fecha ao clicar no fundo escuro.
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && mapModalOverlay.classList.contains('is-visible')) closeMapModal(); }); // Fecha ao pressionar a tecla "Esc".
        
        // --- Evento do Ícone Flutuante ---
        // Define o que acontece quando o ícone 🗺️ é clicado.
        mapIconToggle.addEventListener('click', function() {
            iframe.src = DEFAULT_EMBED_URL; // Carrega o mapa padrão.
            mapModalTitle.textContent = DEFAULT_TITLE; // Define o título padrão.
            googleMapsButton.style.display = 'none'; // Esconde o botão "Abrir no Google Maps".
            openMapModal(); // Abre o modal.
        });

        // --- Evento dos Links de Localização ---
        // Adiciona a funcionalidade de mapa dinâmico para cada link "📍 Localização".
        const locationLinks = document.querySelectorAll('.location-link');
        locationLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault(); // Impede que o link recarregue a página.
                // Pega os dados personalizados guardados no próprio link.
                const shareUrl = this.getAttribute('href');
                const embedUrl = this.getAttribute('data-embed-url');
                const locationName = this.getAttribute('data-location-name');
                
                // Se o link tiver os dados necessários...
                if (embedUrl && locationName) {
                    // ...atualiza o conteúdo do modal com os dados do local clicado.
                    iframe.src = embedUrl;
                    mapModalTitle.textContent = "Mapa: " + locationName;
                    // Mostra ou esconde o botão "Abrir no Google Maps" dependendo se o href está preenchido.
                    if (shareUrl) {
                        googleMapsButton.style.display = 'block';
                        googleMapsButton.href = shareUrl;
                    } else {
                        googleMapsButton.style.display = 'none';
                    }
                    openMapModal();
                }
            });
        });
    }

    // --- PARTE 2: LÓGICA DOS FAVORITOS ---

    // A "chave" ou "nome do arquivo" onde a lista de favoritos será salva na memória do navegador.
    const favoritesKey = 'turismoVitoriaFavorites';
    // Carrega a lista salva ou, se não houver nada, começa com uma lista vazia ('[]').
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    // Função que salva a lista atual de favoritos na memória do navegador.
    function saveFavorites() {
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }

    // Função que cria e exibe a lista de favoritos na seção "Meus Favoritos".
    function displayFavoritesList() {
        const favoritesList = document.querySelector('#favorites-list');
        // Verificação de segurança: só continua se a seção de favoritos existir na página.
        if (!favoritesList) return;

        favoritesList.innerHTML = ''; // Limpa a lista antes de recriá-la.
        const allOriginalItems = document.querySelectorAll('main li[data-id]');
        const favoritedItems = Array.from(allOriginalItems).filter(item => favorites.includes(item.getAttribute('data-id')));

        // Se não houver nenhum favorito, mostra uma mensagem.
        if (favoritedItems.length === 0) {
            favoritesList.innerHTML = '<li class="empty-message">Você ainda não favoritou nenhum local.</li>';
        } else {
            // Se houver favoritos, agrupa-os por cidade.
            const favoritesByCity = {};
            favoritedItems.forEach(item => {
                const cityH3 = item.closest('ul').previousElementSibling;
                const cityName = cityH3 ? cityH3.textContent : 'Outros';
                if (!favoritesByCity[cityName]) {
                    favoritesByCity[cityName] = [];
                }
                favoritesByCity[cityName].push(item);
            });
            // "Desenha" a lista agrupada na tela.
            for (const city in favoritesByCity) {
                const cityTitle = document.createElement('h3');
                cityTitle.textContent = city;
                favoritesList.appendChild(cityTitle);
                favoritesByCity[city].forEach(itemNode => {
                    const clone = itemNode.cloneNode(true); // Clona o item da lista principal.
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'favorite-route-checkbox';
                    checkbox.checked = true; // Começa marcado.
                    clone.prepend(checkbox); // Adiciona o checkbox no início do item.
                    favoritesList.appendChild(clone);
                });
            }
        }
    }

    // Função que "pinta" os corações dos itens favoritados.
    function updateFavoritesUI() {
        const allLocations = document.querySelectorAll('li[data-id]');
        allLocations.forEach(location => {
            // Adiciona/remove a classe .is-favorited dependendo se o ID do item está na lista de favoritos.
            location.classList.toggle('is-favorited', favorites.includes(location.getAttribute('data-id')));
        });
        displayFavoritesList(); // Atualiza a lista de favoritos visível.
    }

    // Adiciona um único "ouvinte" de clique na área <main> para os corações.
    // É mais eficiente e funciona para itens clonados.
    document.querySelector('main').addEventListener('click', function(event) {
        const favoriteBtn = event.target.closest('.favorite-btn');
        if (!favoriteBtn) return; // Se o clique não foi num coração, não faz nada.

        const parentLi = favoriteBtn.closest('li');
        const locationId = parentLi.getAttribute('data-id');
        const index = favorites.indexOf(locationId);

        if (index > -1) {
            favorites.splice(index, 1); // Remove se já existe.
        } else {
            favorites.push(locationId); // Adiciona se não existe.
        }
        saveFavorites();      // Salva a lista modificada.
        updateFavoritesUI();  // Atualiza a tela inteira para refletir a mudança.
    });

    // Adiciona o evento de clique para o botão "Mostrar/Ocultar Meus Favoritos".
    const toggleBtn = document.querySelector('#toggle-favorites-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const favoritesSection = document.querySelector('#favorites-section');
            const isVisible = favoritesSection.classList.toggle('is-visible');
            toggleBtn.textContent = isVisible ? 'Ocultar Meus Favoritos' : 'Mostrar Meus Favoritos';
            if (isVisible) {
                displayFavoritesList(); // Garante que a lista está atualizada ao ser exibida.
            }
        });
    }

    // Adiciona o evento de clique para o botão "Criar Rota com Selecionados".
    const createRouteBtn = document.querySelector('#create-route-btn');
    if (createRouteBtn) {
        createRouteBtn.addEventListener('click', function() {
            const checkedBoxes = document.querySelectorAll('#favorites-list .favorite-route-checkbox:checked');
            if (checkedBoxes.length < 2) {
                alert("Por favor, selecione pelo menos dois locais para criar uma rota.");
                return;
            }
            const addresses = Array.from(checkedBoxes).map(checkbox => checkbox.closest('li').getAttribute('data-address'));
            // Codifica cada endereço para ser seguro para URLs e junta todos com uma barra "/".
            const urlPath = addresses.map(addr => encodeURIComponent(addr)).join('/');
            const googleMapsUrl = `http://googleusercontent.com/maps/google.com/19${urlPath}`;
            window.open(googleMapsUrl, '_blank'); // Abre a rota numa nova aba.
        });
    }

    // Inicia o sistema de favoritos assim que a página carrega.
    updateFavoritesUI();
});
