/**
 * Gestione del tema chiaro/scuro per la dashboard di analisi.
 * Permette di cambiare l'aspetto dell'interfaccia e salvare la preferenza.
 */

class GestoreTema {
    constructor() {
        this.temaSwitch = document.getElementById('tema-switch');
        this.init();
    }

    init() {
        const temaSalvato = localStorage.getItem('tema');
        
        if (temaSalvato === 'scuro') {
            this.applicaTemaScuro();
        } else if (temaSalvato === 'chiaro') {
            this.applicaTemaChiaro();
        } else {
            this.controllaPreferenzaSistema();
        }        
        this.temaSwitch.addEventListener('change', () => this.cambiaTema());
    }
    
    controllaPreferenzaSistema() {
        const preferisceScuro = window.matchMedia && 
            window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (preferisceScuro) {
            this.applicaTemaScuro();
        }
    }

    applicaTemaScuro() {
        document.body.classList.add('dark-theme');
        this.temaSwitch.checked = true;
        
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    applicaTemaChiaro() {
        document.body.classList.remove('dark-theme');
        this.temaSwitch.checked = false;
        
        document.documentElement.setAttribute('data-theme', 'light');
    }

    cambiaTema() {
        if (this.temaSwitch.checked) {
            this.applicaTemaScuro();
            localStorage.setItem('tema', 'scuro');
        } else {
            this.applicaTemaChiaro();
            localStorage.setItem('tema', 'chiaro');
        }
        this.aggiornaComponentiMappa();
    }

    aggiornaComponentiMappa() {
        setTimeout(() => {
            if (window.geoAnalisi && window.geoAnalisi.mapManager) {
                if (window.geoAnalisi.mapManager.applicaTemaCorretto) {
                    window.geoAnalisi.mapManager.applicaTemaCorretto();
                }                
                const map = window.geoAnalisi.mapManager.map;
                
                document.querySelectorAll('svg polygon[stroke="black"]').forEach(el => {
                    el.setAttribute('stroke', 'currentColor');
                });
                const temaAttuale = document.documentElement.getAttribute('data-theme');                
                map.invalidateSize();
                
                if (window.geoAnalisi.aggiornaVisualizzazione) {
                    window.geoAnalisi.aggiornaVisualizzazione();
                }
            }
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gestoreTema = new GestoreTema();
}); 
