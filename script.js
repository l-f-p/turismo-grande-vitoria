// --- CONFIGURAÇÃO DO MAPA PADRÃO ---
// Cole aqui os links para o mapa geral que deve abrir com o ícone flutuante
const DEFAULT_EMBED_URL = "https://www.google.com/maps/d/u/0/embed?mid=1ik6C1K6StANmTeuBqgxgQaBfX-MMM8E&ehbc=2E312F&noprof=1";
const DEFAULT_SHARE_URL = "google.com/maps"; // Link de compartilhar correspondente


// --- CONTROLES DO MODAL (JANELA DO MAPA) ---

// Seleciona os elementos principais do modal
const mapModalOverlay = document.querySelector('.map-modal-overlay');
const mapCloseBtn = document.querySelector('.map-close-btn');
const mapIconToggle = document.querySelector('.map-icon-toggle');

// Seleciona os elementos que serão atualizados dinamicamente
const iframe = mapModalOverlay.querySelector('iframe');
const googleMapsButton = mapModalOverlay.querySelector('.map-button');

// Função para abrir o modal
function openMapModal() {
    if (mapModalOverlay) {
        mapModalOverlay.classList.add('is-visible');
    }
}

// Função para fechar o modal
function closeMapModal() {
    if (mapModalOverlay) {
        mapModalOverlay.classList.remove('is-visible');
    }
}

// Evento de clique para o BOTÃO DE FECHAR
if (mapCloseBtn) {
    mapCloseBtn.addEventListener('click', closeMapModal);
}

// Evento de clique para o FUNDO DO MODAL
if (mapModalOverlay) {
    mapModalOverlay.addEventListener('click', function(event) {
        if (event.target === mapModalModalOverlay) {
            closeMapModal();
        }
    });
}

// --- LÓGICA DO MAPA DINÂMICO ---

// Evento de clique para o ÍCONE FLUTUANTE (agora com o mapa padrão)
if (mapIconToggle) {
    mapIconToggle.addEventListener('click', function() {
        // Atualiza o iframe e o botão para os URLs padrão
        if (iframe && googleMapsButton) {
            iframe.src = DEFAULT_EMBED_URL;
            googleMapsButton.href = DEFAULT_SHARE_URL;
        }
        // Abre o modal
        openMapModal();
    });
}

// Seleciona TODOS os links de localização da página
const locationLinks = document.querySelectorAll('.location-link');

// Para cada link de localização, adiciona um evento de clique
locationLinks.forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();

        const shareUrl = this.getAttribute('href');
        const embedUrl = this.getAttribute('data-embed-url');

        // Apenas continua se o embedUrl não estiver vazio
        if (embedUrl) {
            if (iframe && googleMapsButton) {
                iframe.src = embedUrl;
                googleMapsButton.href = shareUrl;
            }
            openMapModal();
        }
    });
});