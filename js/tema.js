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
                
                if (window.geoAnalisi.mapManager.clear) {
                    window.geoAnalisi.mapManager.clear();
                }
                
                const temaAttuale = document.documentElement.getAttribute('data-theme');                
                map.invalidateSize();
                
                setTimeout(() => {
                    if (window.geoAnalisi.aggiornaVisualizzazione) {
                        window.geoAnalisi.aggiornaVisualizzazione();
                    }
                }, 150);
            }
        }, 200);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gestoreTema = new GestoreTema();
    
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const dashboard = document.querySelector('.dashboard');
    const toggleSidebarIcon = toggleSidebarBtn.querySelector('.material-icons');

    function updateSidebarIcon() {
        const isCollapsed = dashboard.classList.contains('sidebar-collapsed');
        toggleSidebarIcon.textContent = isCollapsed ? 'chevron_right' : 'chevron_left';
    }

    function toggleSidebar() {
        dashboard.classList.toggle('sidebar-collapsed');
        
        const isCollapsed = dashboard.classList.contains('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        updateSidebarIcon();
        
        const mapElement = document.getElementById('map');
        const controlsElement = dashboard.querySelector('.controls');

        let transitionEventsFired = 0;
        const expectedTransitions = 2;

        const invalidateMapOnTransitionEnd = (event) => {
            const isMapTransition = event.target === mapElement && event.propertyName === 'left';
            const isControlsTransition = event.target === controlsElement && event.propertyName === 'width';

            if (isMapTransition || isControlsTransition) {
                transitionEventsFired++;
            }

            if (transitionEventsFired >= expectedTransitions) {
                if (window.geoAnalisi && window.geoAnalisi.mapManager && window.geoAnalisi.mapManager.map) {
                    window.geoAnalisi.mapManager.map.invalidateSize({ debounceMoveend: true });
                }
                if (mapElement) mapElement.removeEventListener('transitionend', invalidateMapOnTransitionEnd);
                if (controlsElement) controlsElement.removeEventListener('transitionend', invalidateMapOnTransitionEnd);
            }
        };
        
        if (mapElement) mapElement.addEventListener('transitionend', invalidateMapOnTransitionEnd);
        if (controlsElement) controlsElement.addEventListener('transitionend', invalidateMapOnTransitionEnd);

        setTimeout(() => {
            if (window.geoAnalisi && window.geoAnalisi.mapManager && window.geoAnalisi.mapManager.map) {
                window.geoAnalisi.mapManager.map.invalidateSize({ debounceMoveend: true });
            }
            if (mapElement) mapElement.removeEventListener('transitionend', invalidateMapOnTransitionEnd);
            if (controlsElement) controlsElement.removeEventListener('transitionend', invalidateMapOnTransitionEnd);
        }, 350);
    }
    
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsedState === 'true') {
        dashboard.classList.add('sidebar-collapsed');
        setTimeout(() => {
            if (window.geoAnalisi && window.geoAnalisi.mapManager && window.geoAnalisi.mapManager.map) {
                window.geoAnalisi.mapManager.map.invalidateSize({debounceMoveend: true});
            }
        }, 500); 
    }
    updateSidebarIcon();
}); 

function adjustSidebarPadding() {
  const sidebar = document.querySelector('.controls');
  if (!sidebar) return;
  const hasScrollbar = sidebar.scrollHeight > sidebar.clientHeight;
  sidebar.style.paddingRight = hasScrollbar
    ? `calc(var(--sp-lg) + 16px)`
    : `var(--sp-lg)`;
}

window.addEventListener('resize', adjustSidebarPadding);
window.addEventListener('DOMContentLoaded', adjustSidebarPadding);