/**
 * GEOANALYSIS - Applicazione principale per l'analisi geospaziale
 * 
 * Funzionalità principali:
 * 1. Gestione dei dataset
 * 2. Controlli UI interattivi
 * 3. Visualizzazione dati sulla mappa con MapManager
 * 4. Calcolo e visualizzazione di baricentro e punto di Fermat
 * 5. Gestione dinamica della timeline e filtri temporali
 */

class GeoAnalysisApp {
    constructor() {
        this.mapManager = new MapManager();

        // Importa dataset MoF        
        this.datasets = {
            delitti: convertiInUTM(rawData.delitti),
            puntiInteresse: convertiInUTM(rawData.puntiInteresse),
            abitazioniSospettati: convertiInUTM(rawData.abitazioniSospettati),
            abitazioniVittime: convertiInUTM(rawData.abitazioniVittime),
            omicidiCollaterali: convertiInUTM(rawData.omicidiCollaterali)
        };

        this.manualSelections = new Set();
        this.inizializzaControlli();
        this.aggiornaVisualizzazione();
    }

    inizializzaControlli() {
        this.mapManager.abilitaCoordinateButton();
        this.configuraCheckboxes();
        this.configuraListenerGlobale();
        this.configuraSliderAnno();
        this.configuraAggiungiPunto();
        this.aggiornaVisualizzazione();
    }

    configuraCheckboxes() {
        const configurazioni = [
            ['delitti-checkbox', this.datasets.delitti, true],
            ['punti-interesse-checkbox', this.datasets.puntiInteresse, false],
            ['omicidi-collaterali-checkbox', this.datasets.omicidiCollaterali, false],
            ['abitazioni-sospettati-checkbox', this.datasets.abitazioniSospettati, true],
            ['abitazioni-vittime-checkbox', this.datasets.abitazioniVittime, false]
        ];
        configurazioni.forEach(([id, items, checked]) =>
            this.popolaCheckbox(id, items, checked)
        );
    }

    configuraListenerGlobale() {
        const selettori = [
            '#delitti-checkbox input',
            '#punti-interesse-checkbox input',
            '#abitazioni-sospettati-checkbox input',
            '#abitazioni-vittime-checkbox input',
            '#omicidi-collaterali-checkbox input',
            '#analisi-baricentro',
            '#analisi-fermat',
            '#analisi-canter-center',
            '#analisi-cpr',
            '#analisi-chp',
            '#mostra-etichette'
        ].join(', ');

        aggiungiListenerModifica(selettori, e => {
            if (e.target.closest('#omicidi-collaterali-checkbox')) {
                const label = e.target.dataset.label;
                const isChecked = e.target.checked;

                if (isChecked) {
                    this.manualSelections.add(label);

                    const m = label.match(/\d{4}/);
                    if (m) {
                        const annoDelitto = parseInt(m[0], 10);
                        const annoCorrente = parseInt(this.slider.value, 10);
                        if (annoDelitto > annoCorrente) {
                            this.slider.value = annoDelitto;
                            this.sliderDisplay.textContent = annoDelitto;
                            this.aggiornaCheckboxAutomatici(annoDelitto);
                        }
                    }
                } else {
                    this.manualSelections.delete(label);
                }
            }
            this.aggiornaVisualizzazione();
        });
    }

    configuraSliderAnno() {
        this.slider = document.getElementById('anno-slider');
        this.sliderDisplay = document.getElementById('anno-corrente');
        const minLabel = document.getElementById('min-anno');
        const maxLabel = document.getElementById('max-anno');

        const minAnno = window.ANNO_MIN_SLIDER;
        const maxAnno = window.ANNO_MAX_SLIDER;
        const initAnno = window.ANNO_INIZIALE_SLIDER;

        this.slider.min = minAnno;
        this.slider.max = maxAnno;
        this.slider.value = initAnno;
        this.sliderDisplay.textContent = initAnno;
        minLabel.textContent = minAnno;
        maxLabel.textContent = maxAnno;

        this.slider.addEventListener('input', () => {
            const anno = parseInt(this.slider.value, 10);
            this.sliderDisplay.textContent = anno;
            this.aggiornaCheckboxAutomatici(anno);
            this.aggiornaVisualizzazione();
        });
    }

    configuraAggiungiPunto() {
        const btnAggiungi = document.getElementById('aggiungi-punto-btn');
        const infoBox = document.getElementById('aggiungi-info');
        const inputNome = document.getElementById('nome-punto');
        const btnSalva = document.getElementById('salva-punto-btn');
        let nuovoPunto = null;

        btnAggiungi.addEventListener('click', () => {
            btnAggiungi.disabled = true;
            btnAggiungi.classList.add('disabled');
            infoBox.style.display = 'block';
            inputNome.style.display = 'none';
            btnSalva.style.display = 'none';
            inputNome.value = '';
            nuovoPunto = null;

            this.mapManager.map.once('click', ({ latlng: { lat, lng } }) => {
                nuovoPunto = { lat, lon: lng };
                this.mapManager.addPoint(lat, lng, {
                    color: '#3182ce', radius: 8,
                    strokeColor: '#2b6cb0', strokeWidth: 2,
                    popup: 'Nuovo punto'
                });
                inputNome.style.display = 'block';
                btnSalva.style.display = 'inline-block';
                inputNome.focus();
            });
        });

        btnSalva.addEventListener('click', () => {
            const nome = escapeHtml(inputNome.value.trim());
            if (!nome || !nuovoPunto) return;
            const [x, y] = proj4('EPSG:4326', 'EPSG:32632', [nuovoPunto.lon, nuovoPunto.lat]);
            const nuovo = { ...nuovoPunto, x, y, label: nome };
            this.datasets.puntiInteresse.push(nuovo);

            const container = document.getElementById('punti-interesse-checkbox');
            container.insertAdjacentHTML('beforeend', creaCheckbox(nuovo.label, /* true o false a piacere */ true));

            // aggancio il listener al solo input appena creato
            const newCheckbox = container.querySelector(
                `input[data-label="${nuovo.label}"]`
            );
            newCheckbox.addEventListener('change', () => {
                this.aggiornaVisualizzazione();
            });

            btnAggiungi.disabled = false;
            btnAggiungi.classList.remove('disabled');
            infoBox.style.display = 'none';
            inputNome.style.display = 'none';
            btnSalva.style.display = 'none';
            inputNome.value = '';

            this.aggiornaVisualizzazione();
        });
    }

    popolaCheckbox(containerId, items, checked = true) {
        const container = document.getElementById(containerId);
        container.innerHTML = items.map(item => creaCheckbox(item.label, checked)).join('');
    }

    aggiornaCheckboxAutomatici(anno) {
        document.querySelectorAll('#delitti-checkbox input').forEach(checkbox => {
            const yearMatch = checkbox.dataset.label.match(/\d{4}/);
            if (yearMatch) {
                checkbox.checked = parseInt(yearMatch[0], 10) <= anno;
            }
        });

        document.querySelectorAll('#omicidi-collaterali-checkbox input').forEach(checkbox => {
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

    getDelittiAttivi() {
        const estraiSelezionati = (dataset, selector) =>
            [...document.querySelectorAll(selector + ' input:checked')]
                .map(el => dataset.find(d => d.label === el.dataset.label))
                .filter(Boolean);

        const originali = estraiSelezionati(this.datasets.delitti, '#delitti-checkbox');
        const collaterali = estraiSelezionati(this.datasets.omicidiCollaterali, '#omicidi-collaterali-checkbox');

        const annoCorrente = parseInt(document.getElementById('anno-slider').value, 10);
        document.getElementById('anno-corrente').textContent = annoCorrente;

        return [...originali, ...collaterali]
            .filter(d => d.year <= annoCorrente);
    }

    getAbitazioniSospettatiAttivi() {
        return Array.from(document.querySelectorAll('#abitazioni-sospettati-checkbox input:checked'))
            .map(el => this.datasets.abitazioniSospettati.find(p => p.label === el.dataset.label))
            .filter(Boolean);
    }
    getAbitazioniVittimeAttive() {
        return Array.from(
            document.querySelectorAll('#abitazioni-vittime-checkbox input:checked'))
            .map(el => this.datasets.abitazioniVittime.find(p => p.label === el.dataset.label))
            .filter(Boolean);
    }
    getPuntiInteresseAttivi() {
        return Array.from(document.querySelectorAll('#punti-interesse-checkbox input:checked'))
            .map(el => this.datasets.puntiInteresse.find(p => p.label === el.dataset.label))
            .filter(Boolean);
    }

    aggiornaVisualizzazione() {
        this.mapManager.clear();
        const delittiAttivi = this.getDelittiAttivi();
        const puntiInteresse = this.getPuntiInteresseAttivi();
        const abitazioniSospettati = this.getAbitazioniSospettatiAttivi();
        const abitazioniVittime = this.getAbitazioniVittimeAttive();

        const mostraCentroide = document.getElementById('analisi-baricentro').checked;
        const mostraFermat = document.getElementById('analisi-fermat').checked;
        const mostraCanterCenter = document.getElementById('analisi-canter-center').checked;
        const mostraCPR = document.getElementById('analisi-cpr').checked;
        const mostraEtichette = document.getElementById('mostra-etichette').checked;
        const mostraCHP = document.getElementById('analisi-chp')?.checked;

        const formattaDistanza = d => `${(d / 1000).toFixed(1)} km`;

        const centers = [];
        if (delittiAttivi.length > 0) {
            const puntiUTM = delittiAttivi.map(p => ({ x: p.x, y: p.y }));

            if (mostraCentroide) {
                const baricentro = algoritmiGeometrici.baricentro(puntiUTM);
                const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [baricentro.x, baricentro.y]);
                centers.push({ label: 'Centroide', x: baricentro.x, y: baricentro.y });
                this.mapManager.addIcon(lat, lon, {
                    html: `
                    <div style="
                        width: 20px;
                        height: 20px;
                        border: 2px solid ${getCSSVar('--color-success')};
                        border-radius: 50%;
                        background: ${getCSSVar('--bg-success')};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        color: ${getCSSVar('--color-success')};">
                        B
                    </div>`,

                    popup: `<strong>Centroide</strong><div class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div><em>${delittiAttivi.length} delitti considerati</em>`,
                    tooltip: `Centroide\n${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
                    permanentTooltip: mostraEtichette
                });
            }

            if (mostraFermat) {
                const fermat = algoritmiGeometrici.fermat(puntiUTM);
                const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [fermat.x, fermat.y]);
                centers.push({ label: 'Punto di Fermat', x: fermat.x, y: fermat.y });
                this.mapManager.addIcon(lat, lon, {
                    html: `
                    <div style="
                        width: 20px;
                        height: 20px;
                        border: 2px solid ${getCSSVar('--color-warning')};
                        border-radius: 50%;
                        background: ${getCSSVar('--bg-warning')};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        color: ${getCSSVar('--color-warning')};">
                        F
                    </div>`,

                    popup: `<strong>Punto di Fermat</strong><div class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div><em>${delittiAttivi.length} delitti considerati</em>`,
                    tooltip: `Punto di Fermat\n${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
                    permanentTooltip: mostraEtichette
                });
            }

            const canter = algoritmiGeometrici.canter(puntiUTM);
            const [lonCanter, latCanter] = proj4('EPSG:32632', 'EPSG:4326', [canter.x, canter.y]);

            if (mostraCanterCenter) {
                centers.push({ label: 'Canter', x: canter.x, y: canter.y });
                this.mapManager.addIcon(latCanter, lonCanter, {
                    html: `
                    <div style="
                        width: 20px;
                        height: 20px;
                        border: 2px solid ${getCSSVar('--color-accent')};
                        border-radius: 50%;
                        background: ${getCSSVar('--bg-accent')};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        color: ${getCSSVar('--color-accent')};">
                        C                        
                    </div>`,
                    popup: `<strong>Centro del cerchio di Canter</strong><div class="coordinate">${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</div>`,
                    tooltip: `Centro Canter\n${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E`,
                    permanentTooltip: mostraEtichette
                });
                this.mapManager.addCircle(latCanter, lonCanter, canter.raggio, {
                    color: getCSSVar('--color-accent'),
                    fillColor: getCSSVar('--color-accent'),
                    fillOpacity: 0.1,
                    weight: 2,
                    popup: `<strong>Cerchio di Canter</strong><div class="coordinate">Centro: ${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</div><div class="coordinate">Raggio: ${(canter.raggio / 1000).toFixed(1)} km</div><em>${delittiAttivi.length} delitti considerati</em>`
                });
            }

            if (mostraCPR) {
                // Dati da usare: delitti principali + omicidi collaterali attivi + punti di interesse attivi
                const tuttiPunti = [
                    ...delittiAttivi.map(p => ({ ...p, pesoBase: 1.0 })),
                    ...puntiInteresse.map(p => ({ ...p, pesoBase: 0.3 })),
                    ...this.datasets.omicidiCollaterali
                        .filter(c => delittiAttivi.find(d => d.label === c.label))
                        .map(c => ({ ...c, pesoBase: 0.3 }))
                ];

                if (tuttiPunti.length > 0) {
                    const centroCPR = algoritmiGeometrici.centroProbabileResidenza(tuttiPunti);
                    const [lonCPR, latCPR] = proj4('EPSG:32632', 'EPSG:4326', [centroCPR.x, centroCPR.y]);

                    centers.push({ label: 'Centro Probabile Residenza', x: centroCPR.x, y: centroCPR.y });

                    this.mapManager.addIcon(latCPR, lonCPR, {
                        html: `
                        <div style="
                            width: 22px;
                            height: 22px;
                            border: 2px solid ${getCSSVar('--border-strong')};
                            border-radius: 50%;
                            background: ${getCSSVar('--bg-muted')};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            font-size: 12px;
                            color: ${getCSSVar('--color-muted')};">
                            CPR
                        </div>`
                        ,
                        popup: `<strong>Centro di Probabile Residenza</strong><div class="coordinate">${latCPR.toFixed(4)}°N, ${lonCPR.toFixed(4)}°E</div><em>${tuttiPunti.length} eventi considerati</em>`,
                        tooltip: `Centro di Probabile Residenza\n${latCPR.toFixed(4)}°N, ${lonCPR.toFixed(4)}°E`,
                        permanentTooltip: mostraEtichette
                    });

                    if (tuttiPunti.length > 1) {
                        const deviazione = algoritmiGeometrici.calcolaDeviazioneStandardDistanze(tuttiPunti, centroCPR);
                        const raggio = Math.min(deviazione, 1000);

                        this.mapManager.addCircle(latCPR, lonCPR, raggio, {
                            color: getCSSVar('--color-neutral'),
                            fillColor: getCSSVar('--color-neutral'),
                            fillOpacity: 0.2,
                            weight: 2,
                            popup: `<strong>Buffer Zone CPR</strong><div class="coordinate">Raggio: ${(raggio / 1000).toFixed(2)} km</div>`
                        });
                    }
                }
            }

            if (mostraCHP && delittiAttivi.length >= 3) {
                const puntiUTM = delittiAttivi.map(p => ({ x: p.x, y: p.y }));
                const hull = algoritmiGeometrici.convexHull(puntiUTM);
                const latlngs = hull.map(({ x, y }) => {
                    const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [x, y]);
                    return [lat, lon];
                });

                this.mapManager.addPolygon(latlngs, {
                    color: 'black',
                    weight: 2,
                    fillOpacity: 0.05,
                    popup: `Convex Hull (${hull.length} vertici)`
                });
            }
        }

        delittiAttivi.forEach(punto => {
            let popupHtml = `<strong>${punto.label}</strong>`;
            centers.forEach(c => {
                const distanza = Math.hypot(punto.x - c.x, punto.y - c.y);
                popupHtml += `<div>Distanza da ${c.label}: ${formattaDistanza(distanza)}</div>`;
            });
            const isCollaterale = this.datasets.omicidiCollaterali.some(d => d.label === punto.label);
            const colore = isCollaterale ? getCSSVar('--color-warning') : getCSSVar('--color-danger');

            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${colore};">warning</span>`,
                popup: popupHtml,
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });

        puntiInteresse.forEach(punto => {
            let popupHtml = `<strong>${punto.label}</strong>`;
            centers.forEach(c => {
                const distanza = Math.hypot(punto.x - c.x, punto.y - c.y);
                popupHtml += `<div>Distanza da ${c.label}: ${formattaDistanza(distanza)}</div>`;
            });
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${getCSSVar('--color-primary')};">location_on</span>`,
                popup: popupHtml,
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });

        abitazioniSospettati.forEach(punto => {
            let popupHtml = `<strong>${punto.label}</strong>`;
            centers.forEach(c => {
                const distanza = Math.hypot(punto.x - c.x, punto.y - c.y);
                popupHtml += `<div>Distanza da ${c.label}: ${formattaDistanza(distanza)}</div>`;
            });
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${getCSSVar('--color-neutral')};">home</span>`,
                popup: popupHtml,
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });

        abitazioniVittime.forEach(punto => {
            let popupHtml = `<strong>${punto.label}</strong>`;
            centers.forEach(c => {
                const distanza = Math.hypot(punto.x - c.x, punto.y - c.y);
                popupHtml += `<div>Distanza da ${c.label}: ${formattaDistanza(distanza)}</div>`;
            });
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${getCSSVar('--color-primary-dark')};">home</span>`,
                popup: popupHtml,
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });
    }
}

function aggiungiListenerModifica(selettore, callback) {
    document.querySelectorAll(selettore).forEach(el => el.addEventListener('change', callback));
}

function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function creaCheckbox(label, checked = true) {
    const safeLabel = escapeHtml(label);
    return `
        <label>
            <input type="checkbox" ${checked ? 'checked' : ''} data-label="${safeLabel}">
            ${safeLabel}
        </label>
    `;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }  

window.addEventListener('DOMContentLoaded', () => new GeoAnalysisApp());
