// Configurazione UTM 32N
proj4.defs("EPSG:32632", "+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
// Dataset originale
const rawData = {
    delitti: [
        [43.7944, 11.0820, 'Signa 1968'],
        [43.9389, 11.4163, 'Borgo 1974'],
        [43.7331, 11.1688, 'Scandicci 1981'],
        [43.8716, 11.1589, 'Calenzano 1981'],
        [43.6545, 11.0907, 'Baccaiano 1982'],
        [43.7325, 11.2063, 'Giogoli 1983'],
        [43.9189, 11.4979, 'Vicchio 1984'],
        [43.6946, 11.202, 'Scopeti 1985']
    ],
    puntiPersonalizzati: [
        [43.6932, 11.2070, 'Cust cim Falciani'],
        [43.6347, 11.2328, 'Casa Pacciani'],
        [43.6546, 11.18356, 'Casa Vanni'],
        [43.6558, 11.18414, 'Casa Lotti 71']
    ]
};
const convertiInUTM = data => data.map(([lat, lon, label]) => {
    const [x, y] = proj4('EPSG:4326', 'EPSG:32632', [lon, lat]);
    const yearMatch = label.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    return { x, y, label, lat, lon, year };
});
const calcolaRaggioMassimo = (points, center) => Math.max(...points.map(p =>
    Math.hypot(p.x - center.x, p.y - center.y)
));
const algoritmiGeometrici = {
    centroide: punti => {
        const somma = punti.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y
        }), { x: 0, y: 0 });
        const centro = {
            x: somma.x / punti.length,
            y: somma.y / punti.length
        };
        return {
            ...centro,
            raggio: calcolaRaggioMassimo(punti, centro)
        };
    },
    fermat: punti => {
        if (punti.length === 0) return { x: 0, y: 0, raggio: 0 };
        const iniziale = algoritmiGeometrici.centroide(punti);
        try {
            const funzionePerdita = ([px, py]) =>
                punti.reduce((somma, p) => somma + Math.hypot(px - p.x, py - p.y), 0);
            const risultato = numeric.uncmin(funzionePerdita, [iniziale.x, iniziale.y], 1e-8);
            if (!risultato?.solution || risultato.solution.some(isNaN)) {
                return iniziale;
            }
            const centroFer = {
                x: risultato.solution[0],
                y: risultato.solution[1]
            };
            return {
                ...centroFer,
                raggio: calcolaRaggioMassimo(punti, centroFer)
            };
        } catch (e) {
            return iniziale;
        }
    },
    canter: punti => {
        let maxDist = 0;
        let coppia = null;
        for (let i = 0; i < punti.length; i++) {
            for (let j = i + 1; j < punti.length; j++) {
                const dist = Math.hypot(
                    punti[i].x - punti[j].x,
                    punti[i].y - punti[j].y
                );
                if (dist > maxDist) {
                    maxDist = dist;
                    coppia = [i, j];
                }
            }
        }
        if (coppia) {
            const p1 = punti[coppia[0]];
            const p2 = punti[coppia[1]];
            return {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
                raggio: maxDist / 2
            };
        }
        return { x: 0, y: 0, raggio: 0 };
    }
};
// Gestione mappa
class MapManager {
    constructor() {
        this.map = L.map('map').setView([43.78, 11.2], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        this.layers = [];
    }
    clear() {
        this.layers.forEach(layer => this.map.removeLayer(layer));
        this.layers = [];
    }
    addPoint(lat, lon, options = {}) {
        const defaults = {
            color: '#ff4444',
            radius: 6,
            fillOpacity: 0.8,
            weight: 1
        };
        const settings = { ...defaults, ...options };
        const iconSize = 20;
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
            <svg width="${iconSize}" height="${iconSize}" style="position:absolute">
                <circle cx="${iconSize / 2}" cy="${iconSize / 2}" 
                        r="${settings.radius}" 
                        fill="${settings.color}"
                        opacity="${settings.fillOpacity}"
                        stroke="${settings.color}"
                        stroke-width="${settings.weight}"/>
            </svg>
        `,
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize / 2, iconSize / 2]
        });
        const marker = L.marker([lat, lon], { icon })
            .addTo(this.map);
        if (options.popup) {
            marker.bindPopup(options.popup);
        }
        if (options.tooltip) {
            const tooltipOptions = {
                permanent: options.permanentTooltip || false,
                direction: 'auto',
                opacity: 0.9,
                className: options.className || '',
                offset: [0, -5],
                interactive: true
            };
            marker.bindTooltip(options.tooltip, tooltipOptions);
        }
        this.layers.push(marker);
        return marker;
    }
    addCircle(lat, lon, radius, options = {}) {
        const defaults = {
            color: '#3388ff',
            fillColor: '#3388ff44',
            opacity: 0.7,
            fillOpacity: 0.2,
            interactive: false
        };
        const settings = { ...defaults, ...options };
        const circle = L.circle([lat, lon], {
            ...settings,
            radius: isNaN(radius) ? 0 : radius
        }).addTo(this.map);
        if (options.popup) circle.bindPopup(options.popup);
        this.layers.push(circle);
    }
}
// Controller principale
class GeoAnalysisApp {
    constructor() {
        this.mapManager = new MapManager();
        this.datasets = {
            delitti: convertiInUTM(rawData.delitti),
            puntiPersonalizzati: convertiInUTM(rawData.puntiPersonalizzati)
        };
        this.inizializzaControlli();
        this.aggiornaVisualizzazione();
    }
    inizializzaControlli() {
        this.popolaCheckbox('delitti-controls', this.datasets.delitti);
        this.popolaCheckbox('punti-interesse-controls', this.datasets.puntiPersonalizzati);
        const slider = document.getElementById('anno-slider');
        const sliderValue = document.getElementById('anno-corrente');
        slider.addEventListener('input', () => {
            sliderValue.textContent = slider.value;
            this.aggiornaCheckboxAutomatici(slider.value);
            this.aggiornaVisualizzazione();
        });
        document.querySelectorAll('input, select').forEach(el =>
            el.addEventListener('change', () => this.aggiornaVisualizzazione())
        );
    }
    aggiornaCheckboxAutomatici(anno) {
        document.querySelectorAll('#delitti-controls input').forEach(checkbox => {
            const yearMatch = checkbox.dataset.label.match(/\d{4}/);
            const itemYear = yearMatch ? parseInt(yearMatch[0]) : null;
            checkbox.checked = itemYear <= anno;
        });
    }
    popolaCheckbox(containerId, items) {
        const container = document.getElementById(containerId);
        container.innerHTML = items.map(item => `
            <label>
                <input type="checkbox" checked data-label="${item.label}">
                ${item.label}
            </label>
        `).join('');
    }
    getDelittiAttivi() {
        const slider = document.getElementById('anno-slider');
        const delittiSelezionati = Array.from(document.querySelectorAll('#delitti-controls input:checked'))
            .map(el => this.datasets.delitti.find(d => d.label === el.dataset.label))
            .filter(Boolean);
        const anniSelezionati = delittiSelezionati.map(d => d.year).filter(y => !isNaN(y));
        const maxAnnoSelezionato = anniSelezionati.length > 0 ? Math.max(...anniSelezionati) : 1968;
        const anniDisponibili = this.datasets.delitti.map(d => d.year).filter(y => !isNaN(y));
        const maxAnnoAssoluto = Math.max(...anniDisponibili);
        if (maxAnnoSelezionato !== parseInt(slider.max)) {
            slider.max = maxAnnoAssoluto;
            document.getElementById('max-anno').textContent = maxAnnoAssoluto;
        }
        const newValue = Math.min(Math.max(maxAnnoSelezionato, 1968), maxAnnoAssoluto);
        if (newValue !== parseInt(slider.value)) {
            slider.value = newValue;
            document.getElementById('anno-corrente').textContent = newValue;
        }
        return delittiSelezionati.filter(delitto => delitto.year <= parseInt(slider.value));
    }
    getPuntiInteresseAttivi() {
        return Array.from(document.querySelectorAll('#punti-interesse-controls input:checked'))
            .map(el => this.datasets.puntiPersonalizzati.find(p => p.label === el.dataset.label))
            .filter(Boolean);
    }
    aggiornaVisualizzazione() {
        this.mapManager.clear();
        const delittiAttivi = this.getDelittiAttivi();
        const puntiInteresse = this.getPuntiInteresseAttivi();
        const tipoAnalisi = document.getElementById('tipo-analisi').value;
        const mostraEtichette = document.getElementById('mostra-etichette').checked;
        delittiAttivi.forEach(punto => {
            this.mapManager.addPoint(punto.lat, punto.lon, {
                color: '#ff4444',
                radius: 6,
                popup: punto.label,
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });
        puntiInteresse.forEach(punto => {
            this.mapManager.addPoint(punto.lat, punto.lon, {
                color: '#3388ff',
                radius: 6,
                popup: punto.label,
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });
        if (delittiAttivi.length > 0) {
            const puntiUTM = delittiAttivi.map(p => ({ x: p.x, y: p.y }));
            const centro = algoritmiGeometrici[tipoAnalisi](puntiUTM);
            const [lonCentro, latCentro] = proj4('EPSG:32632', 'EPSG:4326', [centro.x, centro.y]);
            const canter = algoritmiGeometrici.canter(puntiUTM);
            const [lonCanter, latCanter] = proj4('EPSG:32632', 'EPSG:4326', [canter.x, canter.y]);
            this.mapManager.addPoint(latCentro, lonCentro, {
                color: tipoAnalisi === 'centroide' ? '#00cc00' : '#ff9900',
                radius: 8,
                popup: `
                    <strong>${tipoAnalisi === 'centroide' ? 'Centroide' : 'Punto di Fermat'}</strong>
                    <div class="coordinate">${latCentro.toFixed(4)}°N, ${lonCentro.toFixed(4)}°E</div>
                    <em>${delittiAttivi.length} delitti considerati</em>
                `,
                tooltip: `${tipoAnalisi === 'centroide' ? 'Centroide' : 'Punto di Fermat'}<br>
                    ${latCentro.toFixed(4)}°N, ${lonCentro.toFixed(4)}°E`,
                permanentTooltip: document.getElementById('mostra-etichette').checked
            });
            this.mapManager.addCircle(latCanter, lonCanter, canter.raggio, {
                color: '#ff00ff',
                fillColor: '#ff00ff44',
                fillOpacity: 0.1,
                weight: 2,
                popup: `
                    <strong>Cerchio di Canter</strong>
                    <div class="coordinate">Centro: ${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</div>
                    <div class="coordinate">Raggio: ${(canter.raggio / 1000).toFixed(1)} km</div>
                    <em>${delittiAttivi.length} delitti considerati</em>
                `
            });
        }
    }
}
window.addEventListener('DOMContentLoaded', () => new GeoAnalysisApp());
