// --- LÓGICA DO MAPA E DOS FAVORITOS ---

// Espera a página HTML carregar completamente antes de rodar QUALQUER script.
// Isto garante que todos os elementos (botões, listas, etc.) já existam quando o código tentar encontrá-los.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- PARTE 1: LÓGICA DO MAPA MODAL (POP-UP) ---
    
    // Pega a referência do elemento principal do modal (a janela pop-up inteira).
    const mapModalOverlay = document.querySelector('.map-modal-overlay');

    // SÓ EXECUTA O CÓDIGO DO MAPA MODAL SE ELE EXISTIR NA PÁGINA.
    // Esta verificação de segurança impede que o script dê erro em páginas que não têm o mapa modal (como a index.html).
    if (mapModalOverlay) {
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

        // Funções reutilizáveis para mostrar e esconder o modal.
        function openMapModal() { mapModalOverlay.classList.add('is-visible'); }
        function closeMapModal() { mapModalOverlay.classList.remove('is-visible'); }

        // --- Eventos de Fechar o Modal ---
        mapCloseBtn.addEventListener('click', closeMapModal); // Fecha ao clicar no "X".
        mapModalOverlay.addEventListener('click', (event) => { if (event.target === mapModalOverlay) closeMapModal(); }); // Fecha ao clicar no fundo escuro.
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && mapModalOverlay.classList.contains('is-visible')) closeMapModal(); }); // Fecha ao pressionar a tecla "Esc".

        // --- Evento do Ícone Flutuante ---
        // Define o que acontece quando o ícone 🗺️ é clicado.
        mapIconToggle.addEventListener('click', function() {
            iframe.src = DEFAULT_EMBED_URL;
            mapModalTitle.textContent = DEFAULT_TITLE;
            googleMapsButton.style.display = 'none'; // Sempre esconde o botão para o mapa padrão.
            openMapModal();
        });

        // --- Evento dos Links de Localização ---
        // Adiciona a funcionalidade de mapa dinâmico para cada link "📍 Localização".
        const locationLinks = document.querySelectorAll('.location-link');
        locationLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault(); // Impede que o link recarregue a página.
                // Pega os dados personalizados guardados no próprio link (href, data-embed-url, etc.).
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

    // --- PARTE 2: LÓGICA DO MAPA EXPANSÍVEL (GAVETA) ---
    
    // Encontra todos os botões de gaveta na página (pode ser um ou vários).
    const mapToggles = document.querySelectorAll('.map-toggle');
    // Para cada botão de gaveta encontrado...
    mapToggles.forEach(toggle => {
        // ...adiciona a funcionalidade de clique.
        toggle.addEventListener('click', function() {
            // Encontra a gaveta "pai" mais próxima do botão que foi clicado.
            const mapDrawer = this.closest('.map-drawer');
            // Adiciona ou remove a classe 'is-open' apenas naquela gaveta, fazendo-a abrir ou fechar.
            mapDrawer.classList.toggle('is-open');
        });
    });

    // --- PARTE 3: LÓGICA DOS FAVORITOS ---

    // A "chave" ou "nome do arquivo" onde a lista de favoritos será salva na memória do navegador.
    const favoritesKey = 'turismoVitoriaFavorites';
    // Carrega a lista salva ou, se não houver nada, começa com uma lista vazia.
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

    // --- Funções dos Favoritos ---

    // Função que "pinta" os corações dos itens favoritados e atualiza a lista de favoritos.
    function updateFavoritesUI() {
        const allLocations = document.querySelectorAll('li[data-id]');
        allLocations.forEach(location => {
            // Adiciona/remove a classe .is-favorited dependendo se o ID do item está na lista de favoritos.
            location.classList.toggle('is-favorited', favorites.includes(location.getAttribute('data-id')));
        });
        displayFavoritesList(); // Chama a função para atualizar a lista de favoritos visível.
    }

    // Função que salva a lista atual de favoritos na memória do navegador.
    function saveFavorites() {
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }

// Função que cria e exibe a lista de favoritos na seção "Meus Favoritos"
// Função que cria e exibe a lista de favoritos, agora AGRUPADA POR CIDADE
function displayFavoritesList() {
    const favoritesSection = document.querySelector('#favorites-section');
    const favoritesList = document.querySelector('#favorites-list');
    if (!favoritesSection || !favoritesList) return;

    favoritesList.innerHTML = ''; // Limpa a lista antes de recriá-la

    // Pega TODOS os itens da lista principal do site, na ordem em que aparecem
    const allOriginalItems = document.querySelectorAll('main li[data-id]');
    
    // Filtra apenas os itens cujo ID está na nossa lista de 'favorites'
    const favoritedItems = Array.from(allOriginalItems).filter(item => {
        return favorites.includes(item.getAttribute('data-id'));
    });

    // Se, após filtrar, não sobrar nenhum item, mostra a mensagem de lista vazia
    if (favoritedItems.length === 0) {
        favoritesList.innerHTML = '<li class="empty-message">Você ainda não favoritou nenhum local.</li>';
    } else {
        // --- NOVA LÓGICA DE AGRUPAMENTO ---
        const favoritesByCity = {}; // Cria um objeto para agrupar os locais por cidade

        // Para cada item favoritado...
        favoritedItems.forEach(item => {
            // ...encontra o título <h3> da cidade mais próximo acima dele no HTML
            const cityH3 = item.closest('ul').previousElementSibling;
            // Pega o nome da cidade (ex: "Vitória") ou define como "Outros" se não encontrar
            const cityName = cityH3 ? cityH3.textContent : 'Outros';

            // Se a cidade ainda não existe no nosso objeto, cria uma lista vazia para ela
            if (!favoritesByCity[cityName]) {
                favoritesByCity[cityName] = [];
            }

            // Adiciona o item (já clonado) à lista da sua cidade correspondente
            favoritesByCity[cityName].push(item.cloneNode(true));
        });

        // --- Agora, "desenha" a lista agrupada na tela ---
        // Para cada cidade encontrada no nosso objeto...
        for (const city in favoritesByCity) {
            // ...cria um elemento <h3> para o título da cidade
            const cityTitle = document.createElement('h3');
            cityTitle.textContent = city;
            favoritesList.appendChild(cityTitle); // Adiciona o título à lista

            // Adiciona cada item favoritado daquela cidade logo abaixo do título
            favoritesByCity[city].forEach(itemNode => {
                favoritesList.appendChild(itemNode);
});
        }
    }
}

// --- Eventos dos Favoritos (com Delegação de Eventos) ---

// Adiciona um único "ouvinte" de clique na área <main> do site.
document.querySelector('main').addEventListener('click', function(event) {
    // Verifica se o elemento que foi clicado é um botão de favorito.
    const favoriteBtn = event.target.closest('.favorite-btn');

    // Se o clique não foi em um botão de favorito, a função para aqui.
    if (!favoriteBtn) {
        return;
    }

    // Se o clique foi em um botão, a lógica continua...
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
    // (Esta parte continua igual à que você já tem)
    toggleBtn.addEventListener('click', function() {
        const favoritesSection = document.querySelector('#favorites-section');
        const isVisible = favoritesSection.classList.toggle('is-visible');
        toggleBtn.textContent = isVisible ? 'Ocultar Meus Favoritos' : 'Mostrar Meus Favoritos';
        if (isVisible) {
            displayFavoritesList();
        }
    });
}
    
    // --- Inicia o Sistema de Favoritos na Página ---
    // Esta função é chamada assim que o script carrega, para que os corações já apareçam pintados.
    updateFavoritesUI();
});
