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
            if (selectedForRoute.includes(itemId)) {
                item.classList.add('is-selected');
            } else {
                item.classList.remove('is-selected');
            }
        });
    }

    // Ouvinte unificado
// ...existing code...

    // Evita dupla execução no click após tratarmos o pointerdown (mouse ou toque)
    document.querySelector('main').addEventListener('click', function(e){
        const liPtr = e.target.closest('li[data-id][data-ptr-handled="1"]');
        if (liPtr && document.body.classList.contains('route-planning-mode')) {
            liPtr.removeAttribute('data-ptr-handled');
            e.stopPropagation();
            e.preventDefault();
            return;
        }
    }, true); // captura antes do listener principal

    (function enableTouchRouteSelection(){
        const main = document.querySelector('main');
        if (!main) return;

        const TAP_MAX_MOVEMENT = 10; // px
        let tracking = false;
        let startX = 0;
        let startY = 0;
        let moved = false;
        let targetLi = null;

        function pointerDown(e){
            if (!document.body.classList.contains('route-planning-mode')) return;
            const li = e.target.closest('li[data-id]');
            if (!li) return;
            // Ignora toques/cliques em botões internos
            if (e.target.closest('.favorite-btn, .visited-btn, .dismiss-btn, .location-link')) return;

            tracking = true;
            startX = e.clientX;
            startY = e.clientY;
            moved = false;
            targetLi = li;

            // Feedback imediato: alterna já no pointerdown
            toggleRouteSelection(targetLi);
            // Marca para ignorar o click subsequente do mesmo gesto
            targetLi.setAttribute('data-ptr-handled','1');
        }

        function pointerMove(e){
            if (!tracking) return;
            if (Math.abs(e.clientX - startX) > TAP_MAX_MOVEMENT ||
                Math.abs(e.clientY - startY) > TAP_MAX_MOVEMENT) {
                moved = true; // virou scroll/arrasto
            }
        }

        function endInteraction(){
            // Nada a fazer aqui pois alternamos no pointerdown
            tracking = false;
            targetLi = null;
        }

        main.addEventListener('pointerdown', pointerDown, { passive:true });
        main.addEventListener('pointermove', pointerMove, { passive:true });
        main.addEventListener('pointerup', endInteraction, { passive:true });
        main.addEventListener('pointercancel', endInteraction, { passive:true });
    })();

// ...existing code...

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

    // Suporte a toque: seleciona no pointerdown (touch) sem precisar “tocar duas vezes”
    // ...existing code (coloque após a função toggleRouteSelection e antes de updateUI) ...

    // Evita dupla execução no click após tratarmos o tap
    document.querySelector('main').addEventListener('click', function(e){
        const liTap = e.target.closest('li[data-id][data-tap-handled="1"]');
        if (liTap && document.body.classList.contains('route-planning-mode')) {
            liTap.removeAttribute('data-tap-handled');
            e.stopPropagation();
            e.preventDefault();
            return;
        }
    }, true); // captura antes do listener principal

    (function enableTouchRouteSelection(){
        const main = document.querySelector('main');
        if (!main) return;

        const TAP_MAX_MOVEMENT = 10; // px
        let tracking = false;
        let startX = 0;
        let startY = 0;
        let moved = false;
        let targetLi = null;

        function pointerDown(e){
            if (!document.body.classList.contains('route-planning-mode')) return;
            if (e.pointerType !== 'touch') return;
            const li = e.target.closest('li[data-id]');
            if (!li) return;
            // Ignora toques em botões internos
            if (e.target.closest('.favorite-btn, .visited-btn, .dismiss-btn, .location-link')) return;

            tracking = true;
            startX = e.clientX;
            startY = e.clientY;
            moved = false;
            targetLi = li;
        }

        function pointerMove(e){
            if (!tracking) return;
            if (Math.abs(e.clientX - startX) > TAP_MAX_MOVEMENT ||
                Math.abs(e.clientY - startY) > TAP_MAX_MOVEMENT) {
                moved = true; // virou scroll/arrasto
            }
        }

        function endInteraction(e){
            if (!tracking) return;
            if (!moved && targetLi && document.body.classList.contains('route-planning-mode')) {
                // Tap válido: alterna seleção
                toggleRouteSelection(targetLi);
                // Marcar para impedir duplicação no click subsequente
                targetLi.setAttribute('data-tap-handled','1');
                e.preventDefault();
            }
            tracking = false;
            targetLi = null;
        }

        main.addEventListener('pointerdown', pointerDown, { passive:true });
        main.addEventListener('pointermove', pointerMove, { passive:true });
        main.addEventListener('pointerup', endInteraction, { passive:false });
        main.addEventListener('pointercancel', endInteraction, { passive:false });
    })();

    // (opcional) Melhor destaque visual se ainda não tiver
    // Adicione no CSS se precisar:
    // li.is-selected { outline:3px solid var(--accent); outline-offset:2px; }


    updateUI(); // Inicia o sistema
});