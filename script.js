// Espera a página HTML carregar completamente antes de rodar QUALQUER script.
// Todo o nosso código deve ficar dentro deste bloco para evitar erros.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- PARTE 1: LÓGICA DO MAPA MODAL (POP-UP) ---
    const mapModalOverlay = document.querySelector('.map-modal-overlay');
    if (mapModalOverlay && mapModalOverlay.innerHTML.trim() !== '') {
        const DEFAULT_EMBED_URL = "https://www.google.com/maps/d/u/0/embed?mid=1ik6C1K6StANmTeuBqgxgQaBfX-MMM8E&ehbc=2E312F&noprof=1";
        const DEFAULT_SHARE_URL = "";
        const DEFAULT_TITLE = "Visão Geral da Grande Vitória";
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

        const locationLinks = document.querySelectorAll('.location-link');
        locationLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const shareUrl = this.getAttribute('href');
                const embedUrl = this.getAttribute('data-embed-url');
                const locationName = this.getAttribute('data-location-name');
                if (embedUrl && locationName) {
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
            });
        });
    }

    // --- PARTE 2: LÓGICA DOS FAVORITOS ---
    const favoritesKey = 'turismoVitoriaFavorites';
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    function saveFavorites() {
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }

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
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'favorite-route-checkbox';
                    checkbox.checked = true;
                    clone.prepend(checkbox);
                    favoritesList.appendChild(clone);
                });
            }
        }
    }

    function updateFavoritesUI() {
        const allLocations = document.querySelectorAll('li[data-id]');
        allLocations.forEach(location => {
            location.classList.toggle('is-favorited', favorites.includes(location.getAttribute('data-id')));
        });
        displayFavoritesList();
    }

    document.querySelector('main').addEventListener('click', function(event) {
        const favoriteBtn = event.target.closest('.favorite-btn');
        if (!favoriteBtn) return;
        const parentLi = favoriteBtn.closest('li');
        const locationId = parentLi.getAttribute('data-id');
        const index = favorites.indexOf(locationId);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(locationId);
        }
        saveFavorites();
        updateFavoritesUI();
    });

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
    
    const createRouteBtn = document.querySelector('#create-route-btn');
    if (createRouteBtn) {
        createRouteBtn.addEventListener('click', function() {
            const checkedBoxes = document.querySelectorAll('#favorites-list .favorite-route-checkbox:checked');
            if (checkedBoxes.length < 2) {
                alert("Por favor, selecione pelo menos dois locais para criar uma rota.");
                return;
            }
            const addresses = Array.from(checkedBoxes).map(checkbox => checkbox.closest('li').getAttribute('data-address'));
            const urlPath = addresses.map(addr => encodeURIComponent(addr)).join('/');
            const googleMapsUrl = `https://www.google.com/maps/dir/${urlPath}`;
            window.open(googleMapsUrl, '_blank');
        });
    }

    // Inicia o sistema de favoritos na página.
    updateFavoritesUI();
});
