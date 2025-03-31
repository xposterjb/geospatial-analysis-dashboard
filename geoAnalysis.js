/**
 * GEOANALYSISAPP - Applicazione principale per l'analisi geospaziale
 * 
 * Funzionalità principali:
 * 1. Gestione dei dataset
 * 2. Controlli UI interattivi
 * 3. Visualizzazione dati sulla mappa con MapManager
 * 4. Calcolo e visualizzazione di centroidi e punti di Fermat
 * 5. Gestione dinamica della timeline e filtri temporali
 * 
 * Metodi chiave:
 * - inizializzaControlli(): Setup interfaccia utente
 * - aggiornaVisualizzazione(): Ridisegna la mappa in base ai filtri
 */

class GeoAnalysisApp {
    constructor() {
        this.mapManager = new MapManager();
        this.datasets = {
            delitti: convertiInUTM(rawData.delitti),
            puntiPersonalizzati: convertiInUTM(rawData.puntiPersonalizzati),
            omicidiCollaterali: convertiInUTM(rawData.omicidiCollaterali)
        };
        this.manualSelections = new Set();
        this.inizializzaControlli();
        this.aggiornaVisualizzazione();
    }

    inizializzaControlli() {
        this.popolaCheckbox('delitti-controls', this.datasets.delitti);
        this.popolaCheckbox('punti-interesse-controls', this.datasets.puntiPersonalizzati);
        this.popolaCheckbox('omicidi-collaterali-controls', this.datasets.omicidiCollaterali, false);

        const slider = document.getElementById('anno-slider');
        const sliderValue = document.getElementById('anno-corrente');

        slider.addEventListener('input', () => {
            sliderValue.textContent = slider.value;
            this.aggiornaCheckboxAutomatici(slider.value);
            this.aggiornaVisualizzazione();
        });

        document.getElementById('tipo-analisi').addEventListener('change', () => {
            this.aggiornaVisualizzazione();
        });

        document.querySelectorAll('#omicidi-collaterali-controls input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const label = e.target.dataset.label;
                if (e.target.checked) {
                    this.manualSelections.add(label);
                } else {
                    this.manualSelections.delete(label);
                }
                this.aggiornaVisualizzazione();
            });
        });

        document.querySelectorAll('#delitti-controls input, #punti-interesse-controls input').forEach(el => {
            el.addEventListener('change', () => this.aggiornaVisualizzazione());
        });
    }

    aggiornaCheckboxAutomatici(anno) {
        document.querySelectorAll('#delitti-controls input').forEach(checkbox => {
            const yearMatch = checkbox.dataset.label.match(/\d{4}/);
            if (yearMatch) {
                checkbox.checked = parseInt(yearMatch[0]) <= anno;
            }
        });

        document.querySelectorAll('#omicidi-collaterali-controls input').forEach(checkbox => {
            const label = checkbox.dataset.label;
            const yearMatch = label.match(/\d{4}/);
            if (!yearMatch) return;

            const itemYear = parseInt(yearMatch[0]);
            const isManuallySelected = this.manualSelections.has(label);

            if (anno < itemYear) {
                checkbox.checked = false;
            } else if (isManuallySelected) {
                checkbox.checked = true;
            }
        });
    }

    popolaCheckbox(containerId, items, checked = true) {
        const container = document.getElementById(containerId);
        container.innerHTML = items.map(item => `
            <label>
                <input type="checkbox" ${checked ? 'checked' : ''} data-label="${item.label}">
                ${item.label}
            </label>
        `).join('');
    }

    getDelittiAttivi() {
        const delittiOriginali = Array.from(document.querySelectorAll('#delitti-controls input:checked'))
            .map(el => this.datasets.delitti.find(d => d.label === el.dataset.label))
            .filter(Boolean);

        const delittiCollaterali = Array.from(document.querySelectorAll('#omicidi-collaterali-controls input:checked'))
            .map(el => this.datasets.omicidiCollaterali.find(d => d.label === el.dataset.label))
            .filter(Boolean);

        const tuttiGliAnni = [
            ...this.datasets.delitti.map(d => d.year),
            ...this.datasets.omicidiCollaterali.map(d => d.year)
        ].filter(y => !isNaN(y));

        const slider = document.getElementById('anno-slider');
        const anniSelezionati = [
            ...delittiOriginali.map(d => d.year),
            ...delittiCollaterali.map(d => d.year)
        ].filter(y => !isNaN(y));

        const minAnno = Math.min(...tuttiGliAnni);
        const maxAnno = Math.max(...tuttiGliAnni);

        slider.min = minAnno;
        slider.max = maxAnno;
        document.getElementById('min-anno').textContent = minAnno;
        document.getElementById('max-anno').textContent = maxAnno;

        const maxAnnoSelezionato = anniSelezionati.length > 0 ? Math.max(...anniSelezionati) : minAnno;
        const newValue = Math.min(Math.max(maxAnnoSelezionato, minAnno), maxAnno);

        if (newValue !== parseInt(slider.value)) {
            slider.value = newValue;
            document.getElementById('anno-corrente').textContent = newValue;
        }

        return [
            ...delittiOriginali.filter(d => d.year <= newValue),
            ...delittiCollaterali.filter(d => d.year <= newValue)
        ];
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
        const formattaDistanza = (d) => `${(d / 1000).toFixed(1)} km`;

        let centroUTM = null;
        if (delittiAttivi.length > 0) {
            const puntiUTM = delittiAttivi.map(p => ({ x: p.x, y: p.y }));
            centroUTM = algoritmiGeometrici[tipoAnalisi](puntiUTM);

            const [lonCentro, latCentro] = proj4('EPSG:32632', 'EPSG:4326', [centroUTM.x, centroUTM.y]);

            // Calcola Canter
            const canter = algoritmiGeometrici.canter(puntiUTM);
            const [lonCanter, latCanter] = proj4('EPSG:32632', 'EPSG:4326', [canter.x, canter.y]);

            // Punto speciale (centroide/fermat) senza contorno
            this.mapManager.addPoint(latCentro, lonCentro, {
                color: tipoAnalisi === 'centroide' ? '#00cc00' : '#ff9900',
                strokeColor: 'transparent', // Nessun contorno
                strokeWidth: 0, // Nessun contorno
                radius: 10,
                fillOpacity: 0.8,
                isGradient: true,
                popup: `
                            <strong>${tipoAnalisi === 'centroide' ? 'Centroide' : 'Punto di Fermat'}</strong>
                            <div class="coordinate">${latCentro.toFixed(4)}°N, ${lonCentro.toFixed(4)}°E</div>
                            <em>${delittiAttivi.length} delitti considerati</em>
                        `,
                tooltip: `${tipoAnalisi === 'centroide' ? 'Centroide' : 'Punto di Fermat'}<br>
                            ${latCentro.toFixed(4)}°N, ${lonCentro.toFixed(4)}°E`,
                permanentTooltip: mostraEtichette
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

        delittiAttivi.forEach(punto => {
            this.mapManager.addPoint(punto.lat, punto.lon, {
                color: '#ff4444',
                strokeColor: '#aa0000',
                strokeWidth: 2,
                radius: 6,
                popup: punto.label,
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });

        puntiInteresse.forEach(punto => {
            let tooltipExtra = '';
            let popupExtra = '';

            if (centroUTM) {
                const distanza = Math.hypot(punto.x - centroUTM.x, punto.y - centroUTM.y);
                tooltipExtra = `<br>Distanza: ${formattaDistanza(distanza)}`;
                popupExtra = `<div class="coordinate">Distanza: ${formattaDistanza(distanza)}</div>`;
            }

            this.mapManager.addPoint(punto.lat, punto.lon, {
                color: '#3388ff',
                strokeColor: '#2a6fcc',
                strokeWidth: 2,
                radius: 6,
                popup: `${punto.label}${popupExtra}`,
                tooltip: `${punto.label}${tooltipExtra}`,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });
    }
}

window.addEventListener('DOMContentLoaded', () => new GeoAnalysisApp());