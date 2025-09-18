// Espera a página HTML carregar completamente antes de rodar QUALQUER script.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- PARTE 1: LÓGICA DO MAPA MODAL (POP-UP) ---
    const mapModalOverlay = document.querySelector('.map-modal-overlay');
    if (mapModalOverlay && mapModalOverlay.innerHTML.trim() !== '') {
        const pageId = document.body.getAttribute('data-page-id');
        let DEFAULT_EMBED_URL = "";
        let DEFAULT_TITLE = "";
        if (pageId === 'pontos-turisticos') {
            DEFAULT_EMBED_URL = "https://www.google.com/maps/d/u/0/embed?mid=1ik6C1K6StANmTeuBqgxgQaBfX-MMM8E&ehbc=2E312F&noprof=1";
            DEFAULT_TITLE = "Pontos Turísticos";
        } else if (pageId === 'restaurantes') {
            DEFAULT_EMBED_URL = "link do mapa de restaurantes!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!";
            DEFAULT_TITLE = "Restaurantes";
        }
        const mapCloseBtn = document.querySelector('.map-close-btn');
        const mapIconToggle = document.querySelector('.map-icon-toggle');
        const iframe = mapModalOverlay.querySelector('iframe');
        const googleMapsButton = mapModalOverlay.querySelector('.map-button');
        const mapModalTitle = document.querySelector('#map-modal-title');
        
        function openMapModal() { mapModalOverlay.classList.add('is-visible'); }
        function closeMapModal() { mapModalOverlay.classList.remove('is-visible'); }

        mapCloseBtn.addEventListener('click', closeMapModal);
        mapModalOverlay.addEventListener('click', (event) => { if (event.target === mapModalOverlay) closeMapModal(); });
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && mapModalOverlay.classList.contains('is-visible')) closeMapModal(); });
        
        mapIconToggle.addEventListener('click', function() {
            iframe.src = DEFAULT_EMBED_URL;
            mapModalTitle.textContent = DEFAULT_TITLE;
            googleMapsButton.style.display = 'none';
            openMapModal();
        });
        
        // O event listener antigo que só funcionava na lista principal foi removido daqui.
    }

    // --- PARTE 2: LÓGICA DOS FAVORITOS, VISITADOS E IGNORADOS ---
    const favoritesKey = 'turismoVitoriaFavorites';
    const visitedKey = 'turismoVitoriaVisited';
    const dismissedKey = 'turismoVitoriaDismissed';
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    let visited = JSON.parse(localStorage.getItem(visitedKey) || '[]');
    let dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
    let selectedForRoute = []; // Guarda os IDs dos locais selecionados para a rota

    function saveFavorites() { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); }
    function saveVisited() { localStorage.setItem(visitedKey, JSON.stringify(visited)); }
    function saveDismissed() { localStorage.setItem(dismissedKey, JSON.stringify(dismissed)); }
    
    function displayFavoritesList() {
        const favoritesList = document.querySelector('#favorites-list');
        if (!favoritesList) return;
        favoritesList.innerHTML = '';
        const allOriginalItems = document.querySelectorAll('main li[data-id]');
        const favoritedItems = Array.from(allOriginalItems).filter(item => favorites.includes(item.getAttribute('data-id')));

        if (favoritedItems.length === 0) {
            favoritesList.innerHTML = '<li class="empty-message">Você ainda não favoritou nenhum local.</li>';
        } else {
            const favoritesByCity = {};
            favoritedItems.forEach(item => {
                const cityH3 = item.closest('ul').previousElementSibling;
                const cityName = cityH3 ? cityH3.textContent : 'Outros';
                if (!favoritesByCity[cityName]) {
                    favoritesByCity[cityName] = [];
                }
                favoritesByCity[cityName].push(item);
            });
            for (const city in favoritesByCity) {
                const cityTitle = document.createElement('h3');
                cityTitle.textContent = city;
                favoritesList.appendChild(cityTitle);
                favoritesByCity[city].forEach(itemNode => {
                    const clone = itemNode.cloneNode(true);
                    favoritesList.appendChild(clone);
                });
            }
        }
    }

    function updateUI() {
        const allLocations = document.querySelectorAll('li[data-id]');
        allLocations.forEach(location => {
            const locationId = location.getAttribute('data-id');
            location.classList.toggle('is-favorited', favorites.includes(locationId));
            location.classList.toggle('is-visited', visited.includes(locationId));
            location.classList.toggle('is-dismissed', dismissed.includes(locationId));
        });
        displayFavoritesList();
    }

    function updateSelectionUI() {
        const allListItems = document.querySelectorAll('li[data-id]');
        allListItems.forEach(item => {
            const itemId = item.getAttribute('data-id');
            if (selectedForRoute.includes(itemId)) {
                item.classList.add('is-selected');
            } else {
                item.classList.remove('is-selected');
            }
        });
    }

    // Este único "ouvinte" agora gere os cliques nos botões de ação E nos links de localização.
    // --- OUVINTE DE CLIQUES PRINCIPAL E UNIFICADO ---
// --- OUVINTE DE CLIQUES PRINCIPAL E UNIFICADO ---
    document.querySelector('main').addEventListener('click', function(event) {
        
        // PRIMEIRO, verifica se estamos no modo de planejamento
        if (document.body.classList.contains('route-planning-mode')) {
            const targetLi = event.target.closest('li[data-id]');
            
            if (targetLi) {
                // Apenas atualiza a "memória"
                const locationId = targetLi.getAttribute('data-id');
                const index = selectedForRoute.indexOf(locationId);

                if (index > -1) {
                    selectedForRoute.splice(index, 1);
                } else {
                    selectedForRoute.push(locationId);
                }
                
                // Agora chama as funções para atualizar TODA a interface
                updateSelectionUI(); 
                updateRouteFab();
                return;
            }
        }

        // SE NÃO ESTIVER no modo de planejamento, a lógica normal continua...
        const favoriteBtn = event.target.closest('.favorite-btn');
        const visitedBtn = event.target.closest('.visited-btn');
        const dismissBtn = event.target.closest('.dismiss-btn');
        const locationLink = event.target.closest('.location-link');

        if (favoriteBtn) {
            const targetLi = favoriteBtn.closest('li');
            const locationId = targetLi.getAttribute('data-id');
            const index = favorites.indexOf(locationId);
            if (index > -1) { favorites.splice(index, 1); } else { favorites.push(locationId); }
            saveFavorites();
            updateUI();
        } else if (visitedBtn) {
            const targetLi = visitedBtn.closest('li');
            const locationId = targetLi.getAttribute('data-id');
            const index = visited.indexOf(locationId);
            if (index > -1) { visited.splice(index, 1); } else { visited.push(locationId); }
            saveVisited();
            updateUI();
        } else if (dismissBtn) {
            const targetLi = dismissBtn.closest('li');
            const locationId = targetLi.getAttribute('data-id');
            const index = dismissed.indexOf(locationId);
            if (index > -1) { dismissed.splice(index, 1); } else { dismissed.push(locationId); }
            saveDismissed();
            updateUI();
        } 
        else if (locationLink) {
            event.preventDefault();
            const iframe = document.querySelector('.map-modal-overlay iframe');
            const mapModalTitle = document.querySelector('#map-modal-title');
            const googleMapsButton = document.querySelector('.map-modal-overlay .map-button');
            const openMapModal = () => document.querySelector('.map-modal-overlay').classList.add('is-visible');

            const shareUrl = locationLink.getAttribute('href');
            const embedUrl = locationLink.getAttribute('data-embed-url');
            const locationName = locationLink.getAttribute('data-location-name');

            if (embedUrl && locationName && iframe) {
                iframe.src = embedUrl;
                mapModalTitle.textContent = "Mapa: " + locationName;
                if (shareUrl) {
                    googleMapsButton.style.display = 'block';
                    googleMapsButton.href = shareUrl;
                } else {
                    googleMapsButton.style.display = 'none';
                }
                openMapModal();
            }
        }
    });
    
    // (O resto do código para os botões de toggle, criar rota e voltar ao topo continua igual)
    const toggleBtn = document.querySelector('#toggle-favorites-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const favoritesSection = document.querySelector('#favorites-section');
            const isVisible = favoritesSection.classList.toggle('is-visible');
            toggleBtn.textContent = isVisible ? 'Ocultar Meus Favoritos' : 'Mostrar Meus Favoritos';
            if (isVisible) {
                displayFavoritesList();
            }
        });
    }
// --- LÓGICA DO BOTÃO FLUTUANTE DE ROTA ---
    const routeFab = document.getElementById('generate-route-fab');
    const routeItemCountSpan = document.getElementById('route-item-count');

    // Função para atualizar o contador do botão
    function updateRouteFab() {
        if (routeItemCountSpan) {
            routeItemCountSpan.textContent = selectedForRoute.length;
        }
    }

    // Lógica do clique no botão para gerar a rota
    if (routeFab) {
        routeFab.addEventListener('click', function() {
            if (selectedForRoute.length < 2) {
                alert("Por favor, selecione pelo menos dois locais para criar uma rota.");
                return;
            }
            // Pega os endereços dos locais selecionados
            const addresses = selectedForRoute.map(id => {
                const li = document.querySelector(`li[data-id="${id}"]`);
                return li ? li.getAttribute('data-address') : null;
            }).filter(addr => addr); // Filtra para remover qualquer nulo

            const urlPath = addresses.map(addr => encodeURIComponent(addr)).join('/');
            const googleMapsUrl = `https://www.google.com/maps/dir/$$${urlPath}`;
            window.open(googleMapsUrl, '_blank');
        });
    }

    // --- CONEXÃO FINAL ---
    // Agora, precisamos chamar a função de atualização nos lugares certos.

    // 1. Atualize o ouvinte do botão "Planejar Rota" para chamar a função
    const toggleRouteBtn = document.querySelector('#toggle-route-mode-btn');
    if (toggleRouteBtn) {
        toggleRouteBtn.addEventListener('click', function() {
            const isActive = document.body.classList.toggle('route-planning-mode');
            if (isActive) {
                toggleRouteBtn.innerHTML = ' Sair do Planejamento';
            } else {
                toggleRouteBtn.innerHTML = '🗺️ Planejar Rota';
                selectedForRoute = [];
                updateSelectionUI(); // Limpa o visual de todos os itens selecionados
            }
            updateRouteFab(); // Atualiza o contador
        });
    }

    
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            const scrollableDistance = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (scrollableDistance > 0 && window.scrollY > scrollableDistance / 2) {
                backToTopButton.style.display = 'block';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }    
    
    updateUI(); // Inicia o sistema
});
