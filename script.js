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
        mapModalOverlay.addEventListener('click', (event) => {
            if (event.target === mapModalOverlay) closeMapModal();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && mapModalOverlay.classList.contains('is-visible')) closeMapModal();
        });
        
        if (mapIconToggle) {
            mapIconToggle.addEventListener('click', function() {
                iframe.src = DEFAULT_EMBED_URL;
                mapModalTitle.textContent = DEFAULT_TITLE;
                googleMapsButton.style.display = 'none';
                openMapModal();
            });
            // Acessibilidade teclado
            mapIconToggle.addEventListener('keydown', function(e){
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    mapIconToggle.click();
                }
            });
        }
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
                if (!favoritesByCity[cityName]) favoritesByCity[cityName] = [];
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
            if (selectedForRoute.includes(itemId)) item.classList.add('is-selected');
            else item.classList.remove('is-selected');
        });
    }

    // === Delegação de eventos da lista (funciona em mouse e toque) ===
    const mainEl = document.querySelector('main');
    function isRouteMode() { return document.body.classList.contains('route-planning-mode'); }

    // Seleciona para rota imediatamente no pointerdown
    if (mainEl) {
        mainEl.addEventListener('pointerdown', (e) => {
            if (!isRouteMode()) return;
            const li = e.target.closest('li[data-id]');
            if (!li) return;
            // Ignora controles internos
            if (e.target.closest('.favorite-btn, .visited-btn, .dismiss-btn, .location-link')) return;
            toggleRouteSelection(li);
        });

        // Clique nos controles (favoritar, visitado, ignorar, abrir mapa)
        mainEl.addEventListener('click', (event) => {
            const favoriteBtn  = event.target.closest('.favorite-btn');
            const visitedBtn   = event.target.closest('.visited-btn');
            const dismissBtn   = event.target.closest('.dismiss-btn');
            const locationLink = event.target.closest('.location-link');

            if (favoriteBtn) {
                const li = favoriteBtn.closest('li[data-id]');
                const id = li.getAttribute('data-id');
                const i = favorites.indexOf(id);
                if (i > -1) favorites.splice(i,1); else favorites.push(id);
                saveFavorites(); updateUI(); return;
            }
            if (visitedBtn) {
                const li = visitedBtn.closest('li[data-id]');
                const id = li.getAttribute('data-id');
                const i = visited.indexOf(id);
                if (i > -1) visited.splice(i,1); else visited.push(id);
                saveVisited(); updateUI(); return;
            }
            if (dismissBtn) {
                const li = dismissBtn.closest('li[data-id]');
                const id = li.getAttribute('data-id');
                const i = dismissed.indexOf(id);
                if (i > -1) dismissed.splice(i,1); else dismissed.push(id);
                saveDismissed(); updateUI(); return;
            }
            if (locationLink) {
                event.preventDefault();
                const overlay = document.querySelector('.map-modal-overlay');
                const iframe = overlay?.querySelector('iframe');
                const titleEl = document.querySelector('#map-modal-title');
                const gmBtn = overlay?.querySelector('.map-button');
                const shareUrl = locationLink.getAttribute('href');
                const embedUrl = locationLink.getAttribute('data-embed-url');
                const name = locationLink.getAttribute('data-location-name');
                if (overlay && iframe && embedUrl && name) {
                    iframe.src = embedUrl;
                    if (titleEl) titleEl.textContent = 'Mapa: ' + name;
                    if (gmBtn) {
                        if (shareUrl) { gmBtn.style.display = 'block'; gmBtn.href = shareUrl; }
                        else gmBtn.style.display = 'none';
                    }
                    overlay.classList.add('is-visible');
                }
            }
        });
    }


    // Toggle favoritos
    const toggleBtn = document.querySelector('#toggle-favorites-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const favoritesSection = document.querySelector('#favorites-section');
            const isVisible = favoritesSection.classList.toggle('is-visible');
            toggleBtn.textContent = isVisible ? 'Ocultar Meus Favoritos' : 'Mostrar Meus Favoritos';
            if (isVisible) displayFavoritesList();
        });
    }

    // --- LÓGICA DO BOTÃO FLUTUANTE DE ROTA ---
    const routeFab = document.getElementById('generate-route-fab');
    const routeItemCountSpan = document.getElementById('route-item-count');

    function updateRouteFab() {
        if (routeItemCountSpan) routeItemCountSpan.textContent = selectedForRoute.length;
    }
    updateRouteFab();

    // Função utilitária para montar URL de rota
    function buildRouteUrl(addresses) {
        const clean = addresses.filter(a => a && a.trim());
        if (clean.length < 2) return null;
        return 'https://www.google.com/maps/dir/' + clean.map(a => encodeURIComponent(a)).join('/');
    }

        // Helper para alternar seleção de um <li>
    function toggleRouteSelection(li) {
        const id = li.getAttribute('data-id');
        const i = selectedForRoute.indexOf(id);
        if (i > -1) selectedForRoute.splice(i, 1);
        else selectedForRoute.push(id);
        updateSelectionUI();
        updateRouteFab();
    }

    if (routeFab) {
        routeFab.addEventListener('click', function() {
            const addresses = selectedForRoute
                .map(id => {
                    const li = document.querySelector(`li[data-id="${id}"]`);
                    return li ? li.getAttribute('data-address') : null;
                })
                .filter(a => a && a.trim());

            const url = buildRouteUrl(addresses);
            if (!url) {
                alert('Selecione pelo menos dois locais com endereço válido.');
                return;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    }

    // Botão Planejar Rota
    const toggleRouteBtn = document.querySelector('#toggle-route-mode-btn');
    if (toggleRouteBtn) {
        toggleRouteBtn.addEventListener('click', function() {
            const isActive = document.body.classList.toggle('route-planning-mode');
            if (isActive) {
                toggleRouteBtn.innerHTML = 'Sair do Planejamento';
            } else {
                toggleRouteBtn.innerHTML = '🗺️ Planejar Rota';
                selectedForRoute = [];
                updateSelectionUI();
            }
            updateRouteFab();
        });
    }

    // Back to top
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            const scrollableDistance = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (scrollableDistance > 0 && window.scrollY > scrollableDistance / 4) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    // --- PARTE 3: LÓGICA DO TOGGLE DE TEMA (CLARO/ESCURO) ---
    (function initTheme(){
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        const stored = localStorage.getItem('themePref');
        if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
            btn.textContent = '☀️';
            btn.setAttribute('aria-pressed','true');
        }
        btn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            btn.textContent = isDark ? '☀️' : '🌙';
            btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            localStorage.setItem('themePref', isDark ? 'dark' : 'light');
        });
    })();


    updateUI(); // Inicia o sistema
});
