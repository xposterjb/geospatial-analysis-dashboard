/**
 * geoAnalysis.js
 *
 * Gestisce l'interazione tra l'interfaccia utente, i dati e la visualizzazione sulla mappa. *
 *
 * Funzionalità principali:
 * - Inizializzazione e configurazione dell'interfaccia utente e della mappa.
 * - Caricamento e gestione del dataset.
 * - Filtro dinamico dei dati basato sulla timeline e sulle selezioni dell'utente.
 * - Calcolo e visualizzazione di diverse analisi geospaziali.
 * - Gestione dell'Infobox per visualizzare i risultati delle analisi.
 * - Configurazione avanzata dei parametri per il CPR.
 *
 * Dipendenze:
 * - MapManager per le operazioni sulla mappa.
 * - algoritmiGeometrici per i calcoli.
 * - data per il dataset.
 * - config per le variabili di configurazione globali.
 * - Librerie esterne: Leaflet, Proj4js, Numericjs.
 */

class GeoAnalysisApp {
    constructor() {
        this.mapManager = new MapManager();
        this.casoAttivo = this.getCasoAttivoFromURL();

        // Rendi disponibile globalmente il caso attivo
        window.casoAttivo = this.casoAttivo;

        this.caricaDataset();
        this.centraMappa();

        this.defaultConfig = {
            JOURNEY_RADIUS: 5000,
            TIME_DECAY_RATE: 0.25,
            BASE_WEIGHT: 1.0,
            COLLATERAL_WEIGHT: 0.3,
            POI_WEIGHT: 0.3,
            JW_COMPONENT_WEIGHT: 0.333,
            DT_COMPONENT_WEIGHT: 0.333,
            PB_COMPONENT_WEIGHT: 0.333,
            CPR_RADIUS_LIMIT: 50000
        };

        this.configSliders = {};
        this.manualSelections = new Set();
        this.infoboxContent = null;

        this.configurazione = {
            mostraCerchiStandardCenter: true,
            mostraCerchioCanter: true,
            opacitaCerchi: 0.15
        };

        this.inizializzaControlliCheckboxLinks();
        this.inizializzaControlli();
        this.aggiornaVisualizzazione();
    }

    chiudiCheckboxLinksAperto() {
        if (window._checkboxLinksOpened) {
            window._checkboxLinksOpened.classList.remove('expanded');
            window._checkboxLinksOpened = null;
        }
    }
    inizializzaControlliCheckboxLinks() {
        if (!window._checkboxLinksGlobalListener) {
            window._checkboxLinksOpened = null;

            document.addEventListener('click', (e) => {
                if (!e.target.classList.contains('checkbox-text-label') && !e.target.closest('.checkbox-links-container')) {
                    this.chiudiCheckboxLinksAperto();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.chiudiCheckboxLinksAperto();
                }
            });
            window._checkboxLinksGlobalListener = true;
        }
    }

    inizializzaControlli() {
        this.mapManager.abilitaCoordinateButton();
        this.configuraCheckboxes();
        this.configuraListenerGlobale();
        this.configuraSliderAnno();
        this.configuraAggiungiPunto();
        this.configuraSliderCPR();
        this.configuraSelezionaDeseleziona();
        this.configuraElementiCollassabili();
        this.configuraInclusionePOI();
        this.configuraSwitchCaso();
    }

    configuraCheckboxes() {
        const configurazioni = [
            ['delitti-checkbox', this.datasets.delitti, true, 'delitti'],
            ['punti-interesse-checkbox', this.datasets.puntiInteresse, false, 'puntiInteresse'],
            ['omicidi-collaterali-checkbox', this.datasets.omicidiCollaterali, false, 'omicidiCollaterali'],
            ['abitazioni-sospettati-checkbox', this.datasets.abitazioniSospettati, true, 'abitazioniSospettati'],
            ['abitazioni-vittime-checkbox', this.datasets.abitazioniVittime, false, 'abitazioniVittime']
        ];
        configurazioni.forEach(([id, items, checked, datasetKey]) =>
            this.popolaCheckbox(id, items, checked, datasetKey)
        );
    }

    popolaCheckbox(containerId, items, checked = true, datasetKey) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`[popolaCheckbox] Contenitore checkbox non trovato: ${containerId}`);
            return;
        }
        container.innerHTML = items.map((item, index) => {
            const originalItem = rawData[datasetKey] ? rawData[datasetKey].find(rawItem => rawItem.label === item.label) : item;
            return creaCheckbox(originalItem || item, checked, `${containerId}-${index}`);
        }).join('');

        container.querySelectorAll('.checkbox-text-label').forEach(labelElement => {
            labelElement.addEventListener('click', (event) => {
                event.stopPropagation();
                const controlDiv = event.target.closest('.checkbox-control');
                if (!controlDiv) {
                    console.warn("[Label Click] controlDiv non trovato.");
                    return;
                }
                const parentCheckboxContainer = controlDiv.parentElement;
                const linksContainer = parentCheckboxContainer.querySelector('.checkbox-links-container');

                if (!linksContainer) {
                    this.chiudiCheckboxLinksAperto();
                    return;
                }

                if (linksContainer.classList.contains('expanded')) {
                    linksContainer.classList.remove('expanded');
                    window._checkboxLinksOpened = null;
                } else {
                    this.chiudiCheckboxLinksAperto();
                    linksContainer.classList.add('expanded');
                    window._checkboxLinksOpened = linksContainer;
                }
            });
        });
    }

    configuraListenerGlobale() {
        // Selettore unificato per i controlli che richiedono un aggiornamento al cambio stato
        const selettori = [
            '#delitti-checkbox input',
            '#punti-interesse-checkbox input',
            '#abitazioni-sospettati-checkbox input',
            '#abitazioni-vittime-checkbox input',
            '#omicidi-collaterali-checkbox input',
            '#analisi-baricentro',
            '#analisi-mediana',
            '#analisi-fermat',
            '#analisi-canter-center',
            '#analisi-cpr',
            '#analisi-chp',
            '#analisi-mid',
            '#analisi-nni',
            '#analisi-voronoi',
            '#analisi-delaunay',
            '#analisi-voronoi-delaunay',
            '#analisi-kde',
            '#analisi-regressione',
            '#analisi-percorso-cronologico',
            '#mostra-etichette'
        ].join(', ');

        // Listener per tutti i controlli specificati
        aggiungiListenerModifica(selettori, e => {
            // Caso specifico per forzare morti collaterali indipendentemente dal filtro temporale
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
                }
                else {
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

        if (!this.slider || !this.sliderDisplay || !minLabel || !maxLabel || minAnno === undefined || maxAnno === undefined || initAnno === undefined) {
            console.error("Elementi UI o variabili globali per lo slider anno non definiti.");
            return;
        }

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

    aggiornaCheckboxAutomatici(anno) {
        // Gestisce lo stato dei checkbox che dipendono dall'anno dello slider
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
            }
            else if (isManuallySelected) {
                checkbox.checked = true;
            }
        });
    }

    configuraAggiungiPunto() {
        const btnAggiungi = document.getElementById('aggiungi-punto-btn');
        const modal = document.getElementById('aggiungi-punto-modal');
        const inputNome = document.getElementById('nuovo-punto-nome');
        const inputLat = document.getElementById('nuovo-punto-lat');
        const inputLon = document.getElementById('nuovo-punto-lon');
        const btnSalva = document.getElementById('salva-punto-btn');
        const btnAnnulla = document.getElementById('annulla-punto-btn');
        const mapContainer = document.getElementById('map-container');
        const mapElement = document.getElementById('map');

        let nuovoPunto = null;
        let tempMarker = null;

        const resetUIPuntoInteresse = () => {
            modal.style.display = 'none';
            inputNome.value = '';
            inputLat.value = '';
            inputLon.value = '';
            nuovoPunto = null;
            // Rimuove il marker temporaneo se presente
            if (tempMarker) {
                this.mapManager.removeMarker(tempMarker);
                tempMarker = null;
            }
            mapContainer.style.cursor = '';
        };

        // Handler per la selezione del punto sulla mappa
        const handleMapClick = (e) => {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            // Aggiorna il form con le coordinate
            inputLat.value = lat.toFixed(6);
            inputLon.value = lon.toFixed(6);

            nuovoPunto = { lat, lon };
            // Aggiunge un marker temporaneo
            if (tempMarker) {
                this.mapManager.removeMarker(tempMarker);
            }
            tempMarker = this.mapManager.addIcon(lat, lon, {
                html: MapElementsRenderer.creaMarkerPuntoInteresse(),
                className: 'temp-marker'
            });
        };

        btnAggiungi.addEventListener('click', () => {
            modal.style.display = 'block';
            mapContainer.style.cursor = 'crosshair';
            this.mapManager.onceClick(handleMapClick);
        });

        btnAnnulla.addEventListener('click', resetUIPuntoInteresse);

        btnSalva.addEventListener('click', () => {
            const nome = MapElementsRenderer.escapeHtml(inputNome.value.trim());
            if (!nome || !nuovoPunto) return;
            // Converte il punto in UTM e lo aggiunge al dataset dei Punti di Interesse
            const [x, y] = convertiWGS84toUTM(nuovoPunto.lon, nuovoPunto.lat, this.casoAttivo);
            const [lonWGS, latWGS] = convertiUTMtoWGS84(x, y, this.casoAttivo);

            const nuovo = {
                ...nuovoPunto,
                x,
                y,
                label: nome
            };

            this.datasets.puntiInteresse.push(nuovo);

            const container = document.getElementById('punti-interesse-checkbox');
            if (container) {
                container.insertAdjacentHTML('beforeend', creaCheckbox(nuovo, true, `pi-${Date.now()}`));

                const newCheckbox = container.querySelector(`input[data-label="${nome}"]`);
                if (newCheckbox) {
                    newCheckbox.addEventListener('change', () => {
                        this.aggiornaVisualizzazione();
                    });
                }
            }
            resetUIPuntoInteresse();
            this.aggiornaVisualizzazione();
        });
    }

    configuraSliderCPR() {
        const sliders = [
            { id: 'journey-radius-slider', valueId: 'journey-radius-value', variable: 'JOURNEY_RADIUS', isKm: true },
            { id: 'time-decay-slider', valueId: 'time-decay-value', variable: 'TIME_DECAY_RATE', decimals: 2 },
            { id: 'base-weight-slider', valueId: 'base-weight-value', variable: 'BASE_WEIGHT', decimals: 1 },
            { id: 'collateral-weight-slider', valueId: 'collateral-weight-value', variable: 'COLLATERAL_WEIGHT', decimals: 1 },
            { id: 'poi-weight-slider', valueId: 'poi-weight-value', variable: 'POI_WEIGHT', decimals: 1 },
            { id: 'jw-weight-slider', valueId: 'jw-weight-value', variable: 'JW_COMPONENT_WEIGHT', decimals: 3 },
            { id: 'dt-weight-slider', valueId: 'dt-weight-value', variable: 'DT_COMPONENT_WEIGHT', decimals: 3 },
            { id: 'pb-weight-slider', valueId: 'pb-weight-value', variable: 'PB_COMPONENT_WEIGHT', decimals: 3 },
            { id: 'cpr-limit-slider', valueId: 'cpr-limit-value', variable: 'CPR_RADIUS_LIMIT', isKm: true }
        ];

        sliders.forEach(config => {
            const sliderElement = document.getElementById(config.id);
            const valueElement = document.getElementById(config.valueId);

            if (!sliderElement || !valueElement) {
                console.warn(`Elementi slider/valore non trovati per la configurazione: ${config.variable}`);
                return;
            }

            this.configSliders[config.variable] = { slider: sliderElement, value: valueElement, config };

            let initialValue = window[config.variable] ?? this.defaultConfig[config.variable];
            let displayValue = initialValue;

            if (config.isKm) {
                displayValue /= 1000; // Conversione da metri a km
            }

            sliderElement.value = displayValue;
            valueElement.textContent = parseFloat(displayValue).toFixed(config.decimals ?? (config.isKm ? 1 : 2));

            sliderElement.addEventListener('input', () => {
                let sliderVal = parseFloat(sliderElement.value);
                valueElement.textContent = sliderVal.toFixed(config.decimals ?? (config.isKm ? 1 : 2));

                // Aggiorna la variabile globale
                let newValueForWindow = sliderVal;
                if (config.isKm) {
                    newValueForWindow *= 1000;
                }

                window[config.variable] = newValueForWindow;
                this.aggiornaVisualizzazione();
            });
        });

        const resetButton = document.getElementById('reset-config-btn');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetCPRDefaults();
            });
        }
        else {
            console.warn("Pulsante Reset CPR non trovato (ID: reset-config-btn)");
        }
    }

    resetCPRDefaults() {
        Object.keys(this.defaultConfig).forEach(variableName => {
            const defaultValue = this.defaultConfig[variableName];
            window[variableName] = defaultValue;

            if (this.configSliders[variableName]) {
                const { slider, value: valueElement, config } = this.configSliders[variableName];
                let sliderDisplayValue = defaultValue;
                if (config.isKm) {
                    sliderDisplayValue /= 1000;
                }
                slider.value = sliderDisplayValue;
                valueElement.textContent = parseFloat(sliderDisplayValue).toFixed(config.decimals ?? (config.isKm ? 1 : 2));
            }
            else {
                console.warn(`Slider/Value non trovato per ${variableName} durante il reset.`);
            }
        });
        this.aggiornaVisualizzazione();
    }

    // Gestione InfoBox
    creaInfoboxBase() {
        if (this.infoboxContent) return;

        const legendaHTML = `
            <div class="map-legend-unified">
                <div class="analisi-header">
                    <h3>Analisi</h3>
                    <button class="toggle-analisi-btn" aria-label="Chiudi pannello analisi">
                        <span class="material-icons">remove</span>
                    </button>
                </div>
                <div class="legend-content"></div>
            </div>
        `;
        this.mapManager.addLegend(legendaHTML, { position: 'bottomright' });
        this.infoboxContent = document.querySelector('.map-legend-unified .legend-content');

        // Aggiungi il pulsante che appare quando il pannello è collassato
        const infoboxContainer = document.querySelector('.map-legend-unified').parentNode;
        const expandBtnHTML = `
            <button class="expand-analisi-btn" aria-label="Apri pannello analisi" style="display: none;">
                <span class="material-icons">analytics</span>
            </button>
        `;
        infoboxContainer.insertAdjacentHTML('beforeend', expandBtnHTML);

        // Aggiungi i listener per i pulsanti di chiusura/apertura
        const toggleBtn = document.querySelector('.toggle-analisi-btn');
        const expandBtn = document.querySelector('.expand-analisi-btn');
        const infobox = document.querySelector('.map-legend-unified');

        toggleBtn.addEventListener('click', () => {
            infobox.classList.add('collapsed');
            expandBtn.style.display = 'flex';
        });

        expandBtn.addEventListener('click', () => {
            infobox.classList.remove('collapsed');
            expandBtn.style.display = 'none';
        });
    }

    aggiornaInfoboxBase(titolo, contenuto, iconaHtml) {
        if (!this.infoboxContent) this.creaInfoboxBase();

        const nuovaSezione = document.createElement('div');
        nuovaSezione.className = 'legend-section';

        const sezioneHTML = `
            <div class="legend-section-header">
                <div style="display: flex; align-items: center;">
                    ${iconaHtml ? `<div class="legend-icon-wrapper" style="margin-right: var(--sp-xs);">${iconaHtml}</div>` : ''}
                    <div class="infobox-analisi-title">${titolo}</div>
                </div>
                <span class="collapse-icon material-icons">expand_less</span>
            </div>
            <div class="legend-data">${contenuto}</div>
        `;

        nuovaSezione.innerHTML = sezioneHTML;

        const headerElement = nuovaSezione.querySelector('.legend-section-header');
        headerElement.addEventListener('click', () => {
            nuovaSezione.classList.toggle('collapsed');
        });
        this.infoboxContent.appendChild(nuovaSezione);
    }

    // Funzione helper per generare il contenuto HTML di una infobox standard per i centri
    creaContenutoInfobox(titolo, iconHtml, color, centerPoint, puntiUTM, riepilogoPunti) {
        return MapElementsRenderer.creaContenutoInfobox(
            titolo,
            iconHtml,
            color,
            centerPoint,
            puntiUTM,
            riepilogoPunti,
            this.casoAttivo
        );
    }

    // Metodo helper per recuperare elementi attivi da un dataset in base allo stato dei checkbox
    getCheckboxSelezionati(dataset, selector) {
        return Array.from(document.querySelectorAll(selector + ' input:checked'))
            .map(el => dataset.find(d => d.label === el.dataset.label))
            .filter(Boolean);
    }

    getDelittiAttivi() {
        const originali = this.getCheckboxSelezionati(this.datasets.delitti, '#delitti-checkbox');
        const collaterali = this.getCheckboxSelezionati(this.datasets.omicidiCollaterali, '#omicidi-collaterali-checkbox');

        const annoCorrente = parseInt(document.getElementById('anno-slider').value, 10);
        document.getElementById('anno-corrente').textContent = annoCorrente;
        // Filtra per l'anno corrente dello slider
        return [...originali, ...collaterali].filter(d => d.year <= annoCorrente);
    }
    getAbitazioniSospettatiAttivi() {
        return this.getCheckboxSelezionati(this.datasets.abitazioniSospettati, '#abitazioni-sospettati-checkbox');
    }
    getAbitazioniVittimeAttivi() {
        return this.getCheckboxSelezionati(this.datasets.abitazioniVittime, '#abitazioni-vittime-checkbox');
    }
    getPuntiInteresseAttivi() {
        return this.getCheckboxSelezionati(this.datasets.puntiInteresse, '#punti-interesse-checkbox');
    }
    otteniPuntiExtra(puntiBase) {
        const puntiInteresse = this.getPuntiInteresseAttivi();
        const abitazioniSospettati = this.getAbitazioniSospettatiAttivi();
        const abitazioniVittime = this.getAbitazioniVittimeAttivi();

        let puntiCalcolo = [...puntiBase];
        let puntiExtra = {
            poi: [],
            abitSosp: [],
            abitVitt: []
        };
        // Verifica se includere i punti nei calcoli
        const includiPOI = document.getElementById('includi-poi-switch')?.checked;
        if (includiPOI) {
            puntiExtra.poi = puntiInteresse.map(p => ({ x: p.x, y: p.y, tipo: 'POI' }));
            puntiCalcolo = [...puntiCalcolo, ...puntiExtra.poi];
        }

        const includiAbitSosp = document.getElementById('includi-abit-sosp-switch')?.checked;
        if (includiAbitSosp) {
            puntiExtra.abitSosp = abitazioniSospettati.map(p => ({ x: p.x, y: p.y, tipo: 'AbitSosp' }));
            puntiCalcolo = [...puntiCalcolo, ...puntiExtra.abitSosp];
        }

        const includiAbitVitt = document.getElementById('includi-abit-vitt-switch')?.checked;
        if (includiAbitVitt) {
            puntiExtra.abitVitt = abitazioniVittime.map(p => ({ x: p.x, y: p.y, tipo: 'AbitVitt' }));
            puntiCalcolo = [...puntiCalcolo, ...puntiExtra.abitVitt];
        }
        return { puntiCalcolo, puntiExtra };
    }

    // Metodo per generare il riepilogo testuale dei punti
    generaRiepilogoPunti(basePunti, puntiExtra) {
        let riepilogo = `${basePunti.length} Delitti`;

        if (puntiExtra.poi.length > 0) {
            riepilogo += ` ${puntiExtra.poi.length} P.ti d'Interesse`;
        }

        if (puntiExtra.abitSosp.length > 0) {
            riepilogo += ` ${puntiExtra.abitSosp.length} Abit.Sospettati`;
        }

        if (puntiExtra.abitVitt.length > 0) {
            riepilogo += ` ${puntiExtra.abitVitt.length} Abit.Vittime`;
        }
        return riepilogo;
    }

    // Visualizzazione sulla Mappa
    aggiornaVisualizzazione() {
        this.mapManager.clear();

        if (!this.infoboxContent) {
            this.creaInfoboxBase();
        }
        else {
            this.infoboxContent.innerHTML = '';
        }
        // Recupera i dati attivi basati sullo stato dei checkbox e dello slider temporale
        const delittiAttivi = this.getDelittiAttivi();
        const puntiInteresse = this.getPuntiInteresseAttivi();
        const abitazioniSospettati = this.getAbitazioniSospettatiAttivi();
        const abitazioniVittime = this.getAbitazioniVittimeAttivi();

        let puntiUTM = [];

        // Controlla quali analisi sono richieste
        const mostraCentroide = document.getElementById('analisi-baricentro').checked;
        const mostraMediana = document.getElementById('analisi-mediana').checked;
        const mostraFermat = document.getElementById('analisi-fermat').checked;
        const mostraCanter = document.getElementById('analisi-canter-center').checked;
        const mostraCPR = document.getElementById('analisi-cpr').checked;
        const mostraEtichette = document.getElementById('mostra-etichette').checked;
        const mostraCHP = document.getElementById('analisi-chp')?.checked;
        const mostraMID = document.getElementById('analisi-mid').checked;
        const mostraNNI = document.getElementById('analisi-nni').checked;
        const mostraVoronoi = document.getElementById('analisi-voronoi').checked;
        const mostraDelaunay = document.getElementById('analisi-delaunay').checked;
        const mostraVoronoiDelaunay = document.getElementById('analisi-voronoi-delaunay').checked;
        const mostraRegressione = document.getElementById('analisi-regressione')?.checked;
        const mostraPercorsoCronologico = document.getElementById('analisi-percorso-cronologico')?.checked;
        const centers = [];

        if (delittiAttivi.length > 0) {
            puntiUTM = delittiAttivi.map(p => ({ x: p.x, y: p.y }));

            if (mostraCentroide) {
                this.visualizzaCentroGeometrico(
                    puntiUTM,
                    'baricentro',
                    'B',
                    '--color-success',
                    '--color-white',
                    'Baricentro',
                    centers,
                    mostraEtichette
                );
            }
            if (mostraMediana) {
                this.visualizzaCentroGeometrico(
                    puntiUTM,
                    'mediana',
                    'M',
                    '--color-danger',
                    '--color-white',
                    'Mediana',
                    centers,
                    mostraEtichette
                );
            }
            if (mostraFermat) {
                this.visualizzaCentroGeometrico(
                    puntiUTM,
                    'fermat',
                    'F',
                    '--color-warning',
                    '--color-white',
                    'Centro di Minima Distanza',
                    centers,
                    mostraEtichette
                );
            }
            if (mostraVoronoi && delittiAttivi.length >= 2) {

                const { puntiCalcolo: puntiVoronoiCalcolo, puntiExtra: puntiVoronoiExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiVoronoi = this.generaRiepilogoPunti(puntiUTM, puntiVoronoiExtra);

                try {
                    const poligoni = algoritmiGeometrici.voronoi(puntiVoronoiCalcolo);

                    if (poligoni.length > 0) {
                        poligoni.forEach(p => {
                            const latlngs = p.polygon.map(([x, y]) => {
                                const [lon, lat] = convertiUTMtoWGS84(x, y, this.casoAttivo);
                                return [lat, lon];
                            });
                            this.mapManager.addPolygon(latlngs, {
                                color: getCSSVar('--color-primary-dark'),
                                weight: getCSSVar('--line-draw-weight-lg'),
                                opacity: 0.8,
                                fillOpacity: 0.1
                            });
                        });

                        const iconaHtmlVoronoi = `
                            <div style="
                                width: 20px;
                                height: 20px;
                                border: 2px solid ${getCSSVar('--color-primary-dark')};
                                background: rgba(0, 0, 255, 0.1);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 500;
                                font-size: 8px;
                                color: ${getCSSVar('--color-primary-dark')};">VR</div>
                        `;
                        const contenutoInfoboxVoronoi = `
                            <p class="punti-riepilogo">${riepilogoPuntiVoronoi}</p>
                            <table class="nni-table">
                                <tr>
                                    <td>Poligoni generati</td>
                                    <td>${poligoni.length}</td>
                                </tr>
                            </table>
                        `;
                        this.aggiornaInfoboxBase('Diagramma di Voronoi', contenutoInfoboxVoronoi, iconaHtmlVoronoi);
                    }
                } catch (error) {
                    console.error("Errore nel calcolo dei poligoni di Voronoi:", error);
                }
            }

            if (mostraDelaunay) {
                const { puntiCalcolo: puntiDelaunayCalcolo, puntiExtra: puntiDelaunayExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiDelaunay = this.generaRiepilogoPunti(puntiUTM, puntiDelaunayExtra);

                try {
                    const triangolazione = algoritmiGeometrici.delaunay(puntiDelaunayCalcolo);

                    if (triangolazione && triangolazione.triangoli) {
                        triangolazione.triangoli.forEach(triangolo => {
                            const puntoA = triangolo.punti[0];
                            const puntoB = triangolo.punti[1];
                            const puntoC = triangolo.punti[2];

                            const [lon1, lat1] = convertiUTMtoWGS84(puntoA.x, puntoA.y, this.casoAttivo);
                            const [lon2, lat2] = convertiUTMtoWGS84(puntoB.x, puntoB.y, this.casoAttivo);
                            const [lon3, lat3] = convertiUTMtoWGS84(puntoC.x, puntoC.y, this.casoAttivo);

                            const latlngs = [
                                [lat1, lon1],
                                [lat2, lon2],
                                [lat3, lon3],
                                [lat1, lon1]
                            ];
                            this.mapManager.addPolygon(latlngs, {
                                color: getCSSVar('--color-danger'),
                                weight: getCSSVar('--line-draw-weight-lg'),
                                opacity: 0.8,
                                fillOpacity: 0.1
                            });
                        });

                        const iconaHtmlDelaunay = `
                            <div style="
                                width: 20px;
                                height: 20px;
                                border: 2px solid red;
                                background: rgba(255, 0, 0, 0.1);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 500;
                                font-size: 8px;
                                color: red;">DT</div>
                        `;
                        const contenutoInfoboxDelaunay = `
                            <p class="punti-riepilogo">${riepilogoPuntiDelaunay}</p>
                            <table class="nni-table">
                                <tr>
                                    <td>Triangoli generati</td>
                                    <td>${triangolazione.statistiche.numeroTriangoli}</td>
                                </tr>
                            </table>
                        `;
                        this.aggiornaInfoboxBase('Triangolazione di Delaunay', contenutoInfoboxDelaunay, iconaHtmlDelaunay);
                    }
                } catch (error) {
                    console.error("Errore nel calcolo della triangolazione di Delaunay:", error);
                }
            }

            if (mostraVoronoiDelaunay) {
                const { puntiCalcolo: puntiVoronoiCalcolo, puntiExtra: puntiVoronoiExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiVD = this.generaRiepilogoPunti(puntiUTM, puntiVoronoiExtra);

                try {
                    const risultatoVD = algoritmiGeometrici.voronoiDelaunay(puntiVoronoiCalcolo);
                    const intersezioni = risultatoVD.intersezioni;

                    if (intersezioni && intersezioni.length > 0) {
                        const baricentro = algoritmiGeometrici.baricentro(intersezioni);
                        const [lonBaricentro, latBaricentro] = convertiUTMtoWGS84(baricentro.x, baricentro.y, this.casoAttivo);
                        centers.push({ label: 'Baricentro Intersezioni Voronoi-Delaunay', x: baricentro.x, y: baricentro.y });

                        const dimensioneInternaIconaVD = 20;
                        const spessoreBordoIconaVD = 2;
                        const dimensioneEffettivaIconaVD = dimensioneInternaIconaVD + (spessoreBordoIconaVD * 2);
                        const iconBaricentro = creaIconaCerchio('VD', '--color-bordeaux', '--bg-accent', dimensioneInternaIconaVD);

                        this.mapManager.addIcon(latBaricentro, lonBaricentro, {
                            html: iconBaricentro,
                            popup: `<div class="popup-title">Baricentro delle intersezioni</div>`,
                            tooltip: `Baricentro delle intersezioni`,
                            permanentTooltip: mostraEtichette,
                            iconSize: [dimensioneEffettivaIconaVD, dimensioneEffettivaIconaVD],
                            iconAnchor: [dimensioneEffettivaIconaVD / 2, dimensioneEffettivaIconaVD / 2],
                            className: 'centro-geometrico-icon'
                        });

                        // trova il punto di intersezione più vicino al baricentro
                        const raggioMinimo = algoritmiGeometrici.calcolaRaggioMinimo(intersezioni, baricentro);

                        // disegna il cerchio di raggio minimo
                        this.mapManager.addCircle(latBaricentro, lonBaricentro, raggioMinimo, {
                            color: getCSSVar('--color-bordeaux'),
                            fillColor: getCSSVar('--color-bordeaux'),
                            fillOpacity: 0.1,
                            weight: 2
                        });

                        const contenutoInfoboxVD = `
                            <p class="coordinate">${latBaricentro.toFixed(4)}°N, ${lonBaricentro.toFixed(4)}°E</p>
                            <p class="coordinate">UTM: ${Math.round(baricentro.x)}E, ${Math.round(baricentro.y)}N</p>
                            <p class="punti-riepilogo">${riepilogoPuntiVD}</p>
                            <table class="nni-table">
                                <tr>
                                    <td>Intersezioni trovate</td>
                                    <td>${intersezioni.length}</td>
                                </tr>
                                <tr>
                                    <td>Raggio minimo</td>
                                    <td>${formattaDistanzaKm(raggioMinimo, 1)}</td>
                                </tr>
                            </table>
                        `;
                        this.aggiornaInfoboxBase('Intersezioni Voronoi-Delaunay', contenutoInfoboxVD, iconBaricentro);
                    }
                    else
                    {
                        const iconAlert = creaIconaCerchio('VD', '--color-bordeaux', '--bg-accent');
                        const contenutoInfoboxVD = `
                            <p class="punti-riepilogo">${riepilogoPuntiVD}</p>
                            <table class="nni-table">
                                <tr>
                                    <td>Intersezioni trovate</td>
                                    <td>0</td>
                                </tr>
                                <tr>
                                    <td>Messaggio</td>
                                    <td>Punti insufficienti per generare intersezioni</td>
                                </tr>
                            </table>
                        `;
                        this.aggiornaInfoboxBase('Intersezioni Voronoi-Delaunay', contenutoInfoboxVD, iconAlert);
                    }
                } catch (error) {
                    console.error("Errore nel calcolo delle intersezioni Voronoi-Delaunay:", error);
                }
            }

            // Cerchio di Canter
            if (mostraCanter) {
                const { puntiCalcolo: puntiCanterCalcolo, puntiExtra: puntiCanterExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiCanter = this.generaRiepilogoPunti(puntiUTM, puntiCanterExtra);

                const canter = algoritmiGeometrici.canter(puntiCanterCalcolo);
                const [lonCanter, latCanter] = convertiUTMtoWGS84(canter.x, canter.y, this.casoAttivo);
                centers.push({ label: 'Centro Cerchio di Canter', x: canter.x, y: canter.y });
                
                        const dimensioneInternaIconaCanter = 20;
                        const spessoreBordoIconaCanter = 2;
                        const dimensioneEffettivaIconaCanter = dimensioneInternaIconaCanter + (spessoreBordoIconaCanter * 2); 
                        const iconHtml = creaIconaCerchio('C', '--color-accent', '--bg-accent', dimensioneInternaIconaCanter);

                this.mapManager.addIcon(latCanter, lonCanter, {
                    html: iconHtml,
                    popup: `<div class="popup-title">Centro del cerchio di Canter</div><div class="coordinate">${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</div><div class="coordinate">UTM: ${Math.round(canter.x)}E, ${Math.round(canter.y)}N</div>`,
                    tooltip: `Centro Cerchio di Canter`,
                    permanentTooltip: mostraEtichette,
                    iconSize: [dimensioneEffettivaIconaCanter, dimensioneEffettivaIconaCanter],
                    iconAnchor: [dimensioneEffettivaIconaCanter / 2, dimensioneEffettivaIconaCanter / 2],
                    className: 'centro-geometrico-icon'
                });
                this.mapManager.addCircle(latCanter, lonCanter, canter.raggio, {
                    color: getCSSVar('--color-accent'),
                    fillColor: getCSSVar('--color-accent'),
                    fillOpacity: 0.1,
                    weight: 2,
                    popup: `<strong>Cerchio di Canter</strong><div class="coordinate">Centro: ${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</div><div class="coordinate">UTM: ${Math.round(canter.x)}E, ${Math.round(canter.y)}N</div><div class="coordinate">Raggio: ${formattaDistanzaKm(canter.raggio, 1)} km</div>`
                });

                // Calcola i dati personalizzati per l'infobox
                const raggioCanter = canter.raggio;
                const areaCerchioCanter = Math.PI * Math.pow(raggioCanter, 2);
                let puntiDentro = 0;

                puntiCanterCalcolo.forEach(p => {
                    const distFromCenter = Math.hypot(p.x - canter.x, p.y - canter.y);
                    const TOLERANCE = 1e-9;
                    if (distFromCenter <= (raggioCanter + TOLERANCE)) {
                        puntiDentro++;
                    }
                });
                const puntiUsati = puntiCanterCalcolo.length;
                const percentualeDentro = puntiUsati > 0 ? (puntiDentro / puntiUsati) * 100 : 0;

                // Usa il formato standard dell'infobox
                const contenutoInfoboxCanter = `
                    <p class="coordinate">${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</p>
                    <p class="coordinate">UTM: ${Math.round(canter.x)}E, ${Math.round(canter.y)}N</p>
                    <p class="punti-riepilogo">${riepilogoPuntiCanter}</p>
                    <table class="nni-table">
                        <tr><td>Punti nel cerchio</td><td>${puntiDentro} (${percentualeDentro.toFixed(1)}%)</td></tr>
                        <tr><td>Raggio del cerchio</td><td>${formattaDistanzaKm(raggioCanter, 1)}</td></tr>
                        <tr><td>Area del cerchio</td><td>${(areaCerchioCanter / 1000000).toFixed(2)} km²</td></tr>
                    </table>
                `;
                this.aggiornaInfoboxBase('Cerchio di Canter', contenutoInfoboxCanter, iconHtml);
            }

            // Centro Probabile Residenza (CPR)
            if (mostraCPR) {
                // Dati da usare: delitti principali + omicidi collaterali attivi + punti di interesse attivi                
                const tuttiPunti = [
                    ...delittiAttivi.map(p => ({ ...p, pesoBase: window.BASE_WEIGHT })),
                    ...puntiInteresse.map(p => ({ ...p, pesoBase: window.POI_WEIGHT })),
                    ...this.datasets.omicidiCollaterali
                        .filter(c => delittiAttivi.find(d => d.label === c.label))
                        .map(c => ({ ...c, pesoBase: window.COLLATERAL_WEIGHT }))
                ];

                if (tuttiPunti.length > 0) {
                    try {
                        const centroCPR = algoritmiGeometrici.centroProbabileResidenza(tuttiPunti);

                        const [lonCPR, latCPR] = convertiUTMtoWGS84(centroCPR.x, centroCPR.y, this.casoAttivo);
                        centers.push({ label: 'Centro Probabile Residenza', x: centroCPR.x, y: centroCPR.y });
                        
                        const dimensioneInternaIconaCPR = 20;
                        const spessoreBordoIconaCPR = 2;
                        const dimensioneEffettivaIconaCPR = dimensioneInternaIconaCPR + (spessoreBordoIconaCPR * 2);
                        const iconHtml = creaIconaCerchio('CPR', '--color-neutral', '--bg-muted', dimensioneInternaIconaCPR, 8);

                        this.mapManager.addIcon(latCPR, lonCPR, {
                            html: iconHtml,
                            popup: `<strong>Centro Probabile Residenza</strong><div class="coordinate">${latCPR.toFixed(4)}°N, ${lonCPR.toFixed(4)}°E</div><div class="coordinate">UTM: ${Math.round(centroCPR.x)}E, ${Math.round(centroCPR.y)}N</div><em>${tuttiPunti.length} Eventi considerati</em>`,
                            tooltip: `Centro Probabile Residenza`,
                            permanentTooltip: mostraEtichette,
                            iconSize: [dimensioneEffettivaIconaCPR, dimensioneEffettivaIconaCPR],
                            iconAnchor: [dimensioneEffettivaIconaCPR / 2, dimensioneEffettivaIconaCPR / 2],
                            className: 'centro-geometrico-icon'
                        });

                        // Calcola il cerchio di deviazione standard
                        if (tuttiPunti.length > 1) {
                            const deviazione = algoritmiGeometrici.calcolaDeviazioneStandardDistanze(tuttiPunti, centroCPR);
                            const raggio = Math.min(deviazione, window.CPR_RADIUS_LIMIT);

                            this.mapManager.addCircle(latCPR, lonCPR, raggio, {
                                color: getCSSVar('--color-neutral'),
                                fillColor: getCSSVar('--color-neutral'),
                                fillOpacity: 0.1,
                                weight: 2,
                                popup: `<strong>Circonferenza CPR</strong><div class="coordinate">Raggio: ${formattaDistanzaKm(raggio, 1)} km</div>`
                            });
                        }
                        this.aggiornaInfoboxBase('Centro Probabile Residenza', this.creaContenutoInfobox('Centro Probabile Residenza', iconHtml, getCSSVar('--color-neutral'), centroCPR, tuttiPunti, `${tuttiPunti.length} Eventi considerati`), iconHtml);
                    } catch (error) {
                        console.error("Errore nel calcolo del CPR:", error);
                    }
                }
            }

            // Convex Hull
            if (mostraCHP && delittiAttivi.length >= 3) {
                const { puntiCalcolo: puntiCHPCalcolo, puntiExtra: puntiCHPExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiCHP = this.generaRiepilogoPunti(puntiUTM, puntiCHPExtra);

                try {
                    const { punti: hull, area, perimetro } = algoritmiGeometrici.convexHull(puntiCHPCalcolo);

                    const latlngs = hull.map(({ x, y }) => {
                        const [lon, lat] = convertiUTMtoWGS84(x, y, this.casoAttivo);
                        return [lat, lon];
                    });

                    this.mapManager.addPolygon(latlngs, {
                        color: 'black',
                        weight: getCSSVar('--line-draw-weight-lg'),
                        fillOpacity: 0.1,
                        opacity: 0.8,
                        popup: `Convex Hull (${hull.length} vertici)<br><em>${riepilogoPuntiCHP}</em>`
                    });

                    const iconaHtmlCHP = `
                        <div style="
                            width: 20px;
                            height: 20px;
                            border: 2px solid black;
                            background: rgba(0, 0, 0, 0.1);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 500;
                            font-size: 8px;
                            color: black;">CHP</div>
                    `;
                    const contenutoInfoboxCHP = `
                        <p class="punti-riepilogo">${riepilogoPuntiCHP}</p>
                        <table class="nni-table">
                            <tr>
                                <td>Vertici poligono</td>
                                <td>${hull.length}</td>
                            </tr>
                            <tr>
                                <td>Area</td>
                                <td>${(area / 1000000).toFixed(2)} km²</td>
                            </tr>
                            <tr>
                                <td>Perimetro</td>
                                <td>${formattaDistanzaKm(perimetro, 2)}</td>
                            </tr>
                        </table>
                    `;
                    this.aggiornaInfoboxBase('Convex Hull', contenutoInfoboxCHP, iconaHtmlCHP);
                } catch (error) {
                    console.error("Errore nel calcolo del Convex Hull:", error);
                }
            }

            // Mean Interpoint Distance (MID)
            if (mostraMID && delittiAttivi.length >= 2) {
                const { puntiCalcolo: puntiMIDCalcolo, puntiExtra: puntiMIDExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiMID = this.generaRiepilogoPunti(puntiUTM, puntiMIDExtra);

                try {
                    const midValue = algoritmiGeometrici.meanInterpointDistance(puntiMIDCalcolo);

                    const baricentro = algoritmiGeometrici.baricentro(puntiMIDCalcolo);
                    const [lon, lat] = convertiUTMtoWGS84(baricentro.x, baricentro.y, this.casoAttivo);

                    this.mapManager.addCircle(lat, lon, midValue, {
                        color: getCSSVar('--color-primary-dark'),
                        fillColor: getCSSVar('--color-primary'),
                        fillOpacity: 0.2,
                        weight: 2,
                        popup: `
                            <strong>MID (Distanza Media)</strong>
                            <div class="coordinate">Raggio: ${formattaDistanzaKm(midValue, 1)} km</div>
                            <em>${riepilogoPuntiMID}</em>
                        `
                    });

                    const iconHtml = creaIconaCerchio('MID', '--color-primary-dark', '--bg-primary', 20, 10);

                    const infoboxMID = `
                        <p class="punti-riepilogo">${riepilogoPuntiMID}</p>
                        <table class="nni-table">
                            <tr>
                                <td>Valore MID</td>
                                <td>${formattaDistanzaKm(midValue, 1)}</td>
                            </tr>
                        </table>
                    `;
                    this.aggiornaInfoboxBase('Mean Interpoint Distance', infoboxMID, iconHtml);
                } catch (error) {
                    console.error("Errore nel calcolo del MID:", error);
                }
            }

            // Nearest Neighbor Index (NNI)
            if (mostraNNI && delittiAttivi.length >= 2) {
                const { puntiCalcolo: puntiNNICalcolo, puntiExtra: puntiNNIExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiNNI = this.generaRiepilogoPunti(puntiUTM, puntiNNIExtra);
                const risultatoNNI = algoritmiGeometrici.nearestNeighborIndex(puntiNNICalcolo);

                // Funzione per determinare il colore in base al valore NNI
                // Gradiente di colori: rosso (clustering) -> verde (casuale) -> blu (dispersione)
                const getNNIColor = (nniValue) => {
                    if (nniValue < 0.5) {
                        const intensita = Math.max(0, nniValue) / 0.5;
                        return `rgba(255, ${Math.round(intensita * 100)}, 0, 0.8)`;
                    } else if (nniValue < 1.0) {
                        const intensita = (nniValue - 0.5) / 0.5;
                        return `rgba(${Math.round(255 * (1 - intensita))}, ${Math.round(100 + intensita * 155)}, 0, 0.8)`;
                    } else if (nniValue < 1.5) {
                        const intensita = (nniValue - 1.0) / 0.5;
                        return `rgba(0, ${Math.round(255 * (1 - intensita))}, ${Math.round(intensita * 255)}, 0.8)`;
                    } else {
                        const intensita = Math.min(1, (nniValue - 1.5) / 0.5);
                        return `rgba(0, 0, ${Math.round(200 + intensita * 55)}, 0.8)`;
                    }
                };

                const nniColor = getNNIColor(risultatoNNI.indice);
                const nniColorLight = nniColor.replace('0.8', '0.2');

                // Linee ai punti più vicini
                puntiNNICalcolo.forEach(p1 => {
                    let vicino = null;
                    let distanzaMinima = Infinity;

                    puntiNNICalcolo.forEach(p2 => {
                        if (p1 === p2) return;
                        const distanza = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                        if (distanza < distanzaMinima) {
                            distanzaMinima = distanza;
                            vicino = p2;
                        }
                    });
                    // Disegna la linea se è stato trovato un vicino
                    if (vicino) {
                        const [lon1, lat1] = convertiUTMtoWGS84(p1.x, p1.y, this.casoAttivo);
                        const [lon2, lat2] = convertiUTMtoWGS84(vicino.x, vicino.y, this.casoAttivo);

                        this.mapManager.addLine([lat1, lon1], [lat2, lon2], {
                            color: 'black',
                            weight: 2,
                            opacity: 0.7,
                            popup: `Distanza vicino più prossimo: ${formattaDistanzaKm(distanzaMinima, 1)} km`
                        });
                    }
                });

                // Creazione gradiente per la legenda
                const gradientStops = [
                    { value: 0, color: 'rgba(255, 0, 0, 0.9)', label: 'Cluster Forte' },
                    { value: 0.5, color: 'rgba(255, 100, 0, 0.9)', label: 'Cluster Moderato' },
                    { value: 1.0, color: 'rgba(0, 255, 0, 0.9)', label: 'Distribuzione Casuale' },
                    { value: 1.5, color: 'rgba(0, 100, 255, 0.9)', label: 'Dispersione Moderata' },
                    { value: 2.0, color: 'rgba(0, 0, 255, 0.9)', label: 'Dispersione Forte' }
                ];

                const gradientCSS = gradientStops.map(stop => `${stop.color} ${(stop.value / 2.5) * 100}%`).join(', ');
                const indicatorPosition = Math.min(100, Math.max(0, (risultatoNNI.indice / 2.5) * 100));

                const iconHtml = creaIconaCerchio('NNI', '--color-purple', '--bg-purple-light', 20, 8);

                const baricentro = algoritmiGeometrici.baricentro(puntiNNICalcolo);
                const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [baricentro.x, baricentro.y]);

                const densitaPerKmq = risultatoNNI.densita * 1000000; // Conversione da m² a km²
                const densitaFormattata = densitaPerKmq < 0.1 ?
                    densitaPerKmq.toExponential(2) :
                    densitaPerKmq.toFixed(2);

                const infoboxNNI = `
                    <p class="punti-riepilogo">${riepilogoPuntiNNI}</p>
                    <div class="nni-bar-container">
                        <div class="nni-gradient-bar" style="--gradient-bg: linear-gradient(to bottom, ${gradientCSS});">
                            <div class="nni-value-indicator" style="--indicator-top: ${100 - indicatorPosition}%;"></div>
                        </div>
                        <table class="nni-table">
                            ${gradientStops.map(stop => `
                            <tr class="${Math.abs(stop.value - risultatoNNI.indice) < 0.25 ? 'highlight' : ''}">
                                <td class="nni-table-cell">${stop.label}</td>
                                <td class="nni-table-cell">${stop.value.toFixed(1)}</td>
                            </tr>
                            `).join('')}
                        </table>
                    </div>
                    <table class="nni-table">
                        <tr>
                            <td>Valore NNI</td>
                            <td><span style="color: ${nniColor}; font-weight: 500;">${risultatoNNI.indice.toFixed(2)}</span></td>
                        </tr>
                        <tr>
                            <td>Distanza media osservata</td>
                            <td>${(risultatoNNI.distanzaMedia / 1000).toFixed(2)} km</td>
                        </tr>
                        <tr>
                            <td>Distanza attesa casuale</td>
                            <td>${(risultatoNNI.distanzaCasuale / 1000).toFixed(2)} km</td>
                        </tr>
                        <!-- Parte commentata relativa alla densità dei punti
                        <tr>
                            <td>Densità punti</td>
                            <td>${densitaFormattata} punti/km²</td>
                        </tr>
                        -->
                        <tr>
                            <td>Area analizzata</td>
                            <td>${(risultatoNNI.areaTotale / 1000000).toFixed(2)} km²</td>
                        </tr>
                    </table>
                `;
                this.aggiornaInfoboxBase('Nearest Neighbour Index', infoboxNNI, iconHtml);
            }

            // Regressione Lineare
            if (mostraRegressione && delittiAttivi.length >= 2) {
                const { puntiCalcolo: puntiRegCalcolo, puntiExtra: puntiRegExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiReg = this.generaRiepilogoPunti(puntiUTM, puntiRegExtra);

                const risultatoReg = algoritmiGeometrici.regressioneLineare(puntiRegCalcolo);

                if (risultatoReg && !isNaN(risultatoReg.m)) { // Controlla se il risultato è valido
                    const { minX, minY, maxX, maxY } = algoritmiGeometrici.trovaEstremi(puntiRegCalcolo);

                    // Fattore di estensione: 15% in più su entrambi i lati
                    const estensione = 0.2;
                    const lunghezzaX = maxX - minX;

                    const x1 = minX - (lunghezzaX * estensione);
                    const y1 = risultatoReg.m * x1 + risultatoReg.q;

                    const x2 = maxX + (lunghezzaX * estensione);
                    const y2 = risultatoReg.m * x2 + risultatoReg.q;

                    // Punti della retta base (senza estensione)
                    const xBase1 = minX;
                    const yBase1 = risultatoReg.m * xBase1 + risultatoReg.q;

                    const xBase2 = maxX;
                    const yBase2 = risultatoReg.m * xBase2 + risultatoReg.q;

                    const [lon1, lat1] = convertiUTMtoWGS84(x1, y1, this.casoAttivo);
                    const [lon2, lat2] = convertiUTMtoWGS84(x2, y2, this.casoAttivo);
                    const [lonBase1, latBase1] = convertiUTMtoWGS84(xBase1, yBase1, this.casoAttivo);
                    const [lonBase2, latBase2] = convertiUTMtoWGS84(xBase2, yBase2, this.casoAttivo);

                    // Aggiungi la parte principale della retta (senza tratteggio)
                    const configLineaPrincipale = {
                        color: MapElementsRenderer.getCSSVar('--color-danger'),
                        weight: 3,
                        opacity: 0.9,
                        className: 'retta-regressione'
                    };
                    this.mapManager.addLine([latBase1, lonBase1], [latBase2, lonBase2], configLineaPrincipale);
                    // Aggiungi la parte estesa della retta (tratteggiata)
                    if (x1 < xBase1) {
                        const configLineaEstesa = {
                            color: MapElementsRenderer.getCSSVar('--color-danger'),
                            weight: 3,
                            opacity: 0.7,
                            dashArray: '5, 5',
                            className: 'retta-regressione-estesa'
                        };
                        this.mapManager.addLine([lat1, lon1], [latBase1, lonBase1], configLineaEstesa);
                    }

                    // Seconda parte (dal punto maxX al punto maxX esteso)
                    if (x2 > xBase2) {
                        const configLineaEstesa = {
                            color: MapElementsRenderer.getCSSVar('--color-danger'),
                            weight: 3,
                            opacity: 0.7,
                            dashArray: '5, 5',
                            className: 'retta-regressione-estesa'
                        };
                        this.mapManager.addLine([latBase2, lonBase2], [lat2, lon2], configLineaEstesa);
                    }
                    // Calcola il punto medio della retta per posizionare l'icona
                    const xMedio = (x1 + x2) / 2;
                    const yMedio = risultatoReg.m * xMedio + risultatoReg.q;
                    const [lonMedio, latMedio] = convertiUTMtoWGS84(xMedio, yMedio, this.casoAttivo);
                    // Aggiunge un marker con R²
                    const iconaHTML = MapElementsRenderer.creaIconaRegressione();
                    const dimensioneInternaIconaReg = 24;
                    const spessoreBordoIconaReg = 2;
                    const dimensioneEffettivaIconaReg = dimensioneInternaIconaReg + (spessoreBordoIconaReg * 2);

                    const popupText = `
                        <div class="popup-container">
                            <strong>Regressione Lineare</strong><br>
                            R²: ${risultatoReg.r2.toFixed(3)}<br>
                            Equazione: y = ${risultatoReg.m.toFixed(2)}x ${risultatoReg.q >= 0 ? '+' : '-'} ${Math.abs(risultatoReg.q).toFixed(2)}
                        </div>
                    `;
                    this.mapManager.addIcon(latMedio, lonMedio, {
                        html: iconaHTML,
                        popup: popupText,
                        iconSize: [dimensioneEffettivaIconaReg, dimensioneEffettivaIconaReg],
                        iconAnchor: [dimensioneEffettivaIconaReg / 2, dimensioneEffettivaIconaReg / 2],
                        className: 'centro-geometrico-icon'
                    });
                }
            }

            // Percorso Cronologico Delitti
            if (mostraPercorsoCronologico && delittiAttivi.length >= 2) {
                const { puntiCalcolo: puntiPercorsoCalcolo, puntiExtra: puntiPercorsoExtra } = this.otteniPuntiExtra(puntiUTM);
                const riepilogoPuntiPercorso = this.generaRiepilogoPunti(puntiUTM, puntiPercorsoExtra);

                try {
                    // Ordina i punti in base all'anno
                    const delittiOrdinati = [...delittiAttivi]
                        .filter(d => puntiPercorsoCalcolo.some(pc => pc.x === d.x && pc.y === d.y))
                        .sort((a, b) => a.year - b.year);

                    if (delittiOrdinati.length >= 2) {
                        const latLngsPercorso = delittiOrdinati.map(d => {
                            const [lon, lat] = convertiUTMtoWGS84(d.x, d.y, this.casoAttivo);
                            return [lat, lon];
                        });

                        const distanze = [];
                        let lunghezzaTotale = 0;

                        for (let i = 0; i < delittiOrdinati.length - 1; i++) {
                            const distanza = algoritmiGeometrici.distanzaTraPunti(delittiOrdinati[i], delittiOrdinati[i + 1]);
                            distanze.push(distanza);
                            lunghezzaTotale += distanza;
                        }

                        const distanzaMedia = lunghezzaTotale / distanze.length;
                        const distanzaMinima = Math.min(...distanze);
                        const distanzaMassima = Math.max(...distanze);

                        for (let i = 0; i < latLngsPercorso.length - 1; i++) {
                            this.mapManager.addArrow(
                                latLngsPercorso[i],
                                latLngsPercorso[i + 1],
                                {
                                    color: 'black',
                                    weight: getCSSVar('--line-draw-weight-lg'),
                                    opacity: 0.8,
                                    label: (i + 1).toString(),
                                    labelColor: '#ffffff',
                                    labelBgColor: '#000000',
                                    popup: `
                                        <strong>Segmento ${i + 1} del Percorso Cronologico</strong>
                                        <div>Distanza: ${formattaDistanzaKm(distanze[i], 1)}</div>
                                        <div>Da: ${delittiOrdinati[i].label}</div>
                                        <div>A: ${delittiOrdinati[i + 1].label}</div>
                                    `
                                }
                            );
                        }
                        const iconaHtmlPercorso = `
                            <div style="
                                width: 20px;
                                height: 20px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 500;
                                font-size: 18px;
                                color: ${getCSSVar('--color-black')};">
                                →
                                </div>`;

                        const contenutoInfoboxPercorso = `
                            <p class="punti-riepilogo">${riepilogoPuntiPercorso}</p>
                            <table class="nni-table">
                                <tr><td>Tappe</td><td>${delittiOrdinati.length}</td></tr>
                                <tr><td>Lunghezza totale</td><td>${formattaDistanzaKm(lunghezzaTotale, 1)}</td></tr>
                                <tr><td>Distanza media</td><td>${formattaDistanzaKm(distanzaMedia, 1)}</td></tr>
                                <tr><td>Distanza minima</td><td>${formattaDistanzaKm(distanzaMinima, 1)}</td></tr>
                                <tr><td>Distanza massima</td><td>${formattaDistanzaKm(distanzaMassima, 1)}</td></tr>
                            </table>
                        `;
                        this.aggiornaInfoboxBase('Percorso Cronologico Delitti', contenutoInfoboxPercorso, iconaHtmlPercorso);
                    }
                } catch (error) {
                    console.error("Errore nel calcolo del percorso cronologico:", error);
                }
            }
        }
        this.visualizzaPunti(centers, mostraEtichette);
        this.visualizzaCerchi(centers, puntiUTM);
    }

    visualizzaCentroGeometrico(puntiUTM, tipoAnalisi, iconaChar, coloreVar, coloreSfondoVar, titolo, centri, mostraEtichette) {
        let puntoCentro;
        let nomeAlgoritmo;

        const { puntiCalcolo, puntiExtra } = this.otteniPuntiExtra(puntiUTM);

        switch (tipoAnalisi) {
            case 'baricentro':
                puntoCentro = algoritmiGeometrici.baricentro(puntiCalcolo);
                nomeAlgoritmo = 'Baricentro';
                break;
            case 'mediana':
                puntoCentro = algoritmiGeometrici.mediana(puntiCalcolo);
                nomeAlgoritmo = 'Mediana';
                break;
            case 'fermat':
                puntoCentro = algoritmiGeometrici.fermat(puntiCalcolo);
                nomeAlgoritmo = 'Centro di Minima Distanza';
                break;
            default:
                console.error(`Tipo di analisi non supportato: ${tipoAnalisi}`);
                return;
        }
        if (!puntoCentro) {
            console.warn(`Impossibile calcolare ${nomeAlgoritmo}. Numero di punti: ${puntiCalcolo.length}`);
            return;
        }
        const [lon, lat] = convertiUTMtoWGS84(puntoCentro.x, puntoCentro.y, this.casoAttivo);
        centri.push({ label: titolo, x: puntoCentro.x, y: puntoCentro.y });

        const dimensioneInternaIcona = 20;
        const spessoreBordoIcona = 2;
        const dimensioneEffettivaIcona = dimensioneInternaIcona + (spessoreBordoIcona * 2);

        const htmlIcona = creaIconaCerchio(iconaChar, coloreVar, coloreSfondoVar, dimensioneInternaIcona);
        const riepilogoPunti = this.generaRiepilogoPunti(puntiUTM, puntiExtra);
        const tooltipText = `${titolo}`;
        const popupContent = `<div class="popup-title">${titolo}</div><div class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div><div class="coordinate">UTM: ${Math.round(puntoCentro.x)}E, ${Math.round(puntoCentro.y)}N</div>`;

        this.mapManager.addIcon(lat, lon, {
            html: htmlIcona,
            popup: popupContent,
            tooltip: tooltipText,
            permanentTooltip: mostraEtichette,
            iconSize: [dimensioneEffettivaIcona, dimensioneEffettivaIcona],
            iconAnchor: [dimensioneEffettivaIcona / 2, dimensioneEffettivaIcona / 2],
            className: 'centro-geometrico-icon'
        });
        const contenutoInfobox = this.creaContenutoInfobox(titolo, htmlIcona, getCSSVar(coloreVar), puntoCentro, puntiCalcolo, riepilogoPunti);
        this.aggiornaInfoboxBase(titolo, contenutoInfobox, htmlIcona);
    }

    configuraSelezionaDeseleziona() {
        document.querySelectorAll('.select-all').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const checkboxes = document.querySelectorAll(`#${targetId} input[type="checkbox"]`);
                checkboxes.forEach(checkbox => {
                    checkbox.checked = true;

                    // Gestione manuale per i morti collaterali
                    if (targetId === 'omicidi-collaterali-checkbox') {
                        const label = checkbox.dataset.label;
                        this.manualSelections.add(label);
                    }
                });
                this.aggiornaVisualizzazione();
            });
        });
        document.querySelectorAll('.deselect-all').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const checkboxes = document.querySelectorAll(`#${targetId} input[type="checkbox"]`);
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;

                    if (targetId === 'omicidi-collaterali-checkbox') {
                        const label = checkbox.dataset.label;
                        this.manualSelections.delete(label);
                    }
                });
                this.aggiornaVisualizzazione();
            });
        });
    }

    configuraElementiCollassabili() {
        document.querySelectorAll('.section-header.collapsible').forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('collapsed');
                const content = header.nextElementSibling;
                if (content) {
                    content.classList.toggle('collapsed', header.classList.contains('collapsed'));
                }
            });
        });
    }

    configuraInclusionePOI() {
        const includiPOISwitch = document.getElementById('includi-poi-switch');
        const includiAbitSospSwitch = document.getElementById('includi-abit-sosp-switch');
        const includiAbitVittSwitch = document.getElementById('includi-abit-vitt-switch');

        // Aggiorna la visualizzazione quando cambia lo stato degli switch
        includiPOISwitch.addEventListener('change', () => {
            this.aggiornaVisualizzazione();
        });

        includiAbitSospSwitch.addEventListener('change', () => {
            this.aggiornaVisualizzazione();
        });

        includiAbitVittSwitch.addEventListener('change', () => {
            this.aggiornaVisualizzazione();
        });
    }

    getCasoAttivoFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('caso') || 'mdf';
    }
    configuraSwitchCaso() {
        const btnMdf = document.getElementById('select-case-mdf');
        const btnZodiac = document.getElementById('select-case-zodiac');

        if (this.casoAttivo === 'mdf') {
            btnMdf.classList.add('active');
            btnZodiac.classList.remove('active');
        } else {
            btnMdf.classList.remove('active');
            btnZodiac.classList.add('active');
        }
        // Aggiungi i listener per il cambio di caso
        btnMdf.addEventListener('click', () => {
            if (this.casoAttivo !== 'mdf') {
                window.location.href = window.location.pathname + '?caso=mdf';
            }
        });
        btnZodiac.addEventListener('click', () => {
            if (this.casoAttivo !== 'zodiac') {
                window.location.href = window.location.pathname + '?caso=zodiac';
            }
        });
    }

    caricaDataset() {
        if (this.casoAttivo === 'zodiac' && typeof zodiacData !== 'undefined') {
            this.datasets = {
                delitti: window.convertiInUTM(zodiacData.delitti),
                puntiInteresse: window.convertiInUTM(zodiacData.puntiInteresse),
                abitazioniSospettati: window.convertiInUTM(zodiacData.abitazioniSospettati),
                abitazioniVittime: window.convertiInUTM(zodiacData.abitazioniVittime),
                omicidiCollaterali: window.convertiInUTM(zodiacData.omicidiCollaterali)
            };
        } else {
            this.datasets = {
                delitti: convertiInUTM(rawData.delitti),
                puntiInteresse: convertiInUTM(rawData.puntiInteresse),
                abitazioniSospettati: convertiInUTM(rawData.abitazioniSospettati),
                abitazioniVittime: convertiInUTM(rawData.abitazioniVittime),
                omicidiCollaterali: convertiInUTM(rawData.omicidiCollaterali)
            };
        }
    }
    // Centra la mappa sulla posizione appropriata in base al caso
    centraMappa() {
        if (this.casoAttivo === 'zodiac') {
            // Coordinate per San Francisco
            this.mapManager.map.setView([37.7749, -122.4194], 10);
        } else {
            // Coordinate per Firenze
            this.mapManager.map.setView([43.7696, 11.2558], 10);
        }
    }
    visualizzaPunti(centers, mostraEtichette = false) {
        const delittiAttivi = this.getDelittiAttivi();
        const abitazioniSospettati = this.getAbitazioniSospettatiAttivi();
        const abitazioniVittime = this.getAbitazioniVittimeAttivi();
        const puntiInteresse = this.getPuntiInteresseAttivi();

        // Funzione locale per generare i popup
        const generaPopupHtml = (punto, centers) => {
            return MapElementsRenderer.generaPopupHtml(punto, centers, this.casoAttivo);
        };

        delittiAttivi.forEach(punto => {
            const isCollaterale = this.datasets.omicidiCollaterali.some(d => d.label === punto.label);

            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: MapElementsRenderer.creaMarkerDelitto(isCollaterale),
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : '',
                iconAnchor: [12, 12]
            });
        });
        puntiInteresse.forEach(punto => {
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: MapElementsRenderer.creaMarkerPuntoInteresse(),
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : '',
                iconAnchor: [12, 24]
            });
        });
        abitazioniSospettati.forEach(punto => {
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: MapElementsRenderer.creaMarkerAbitazioneSospettato(),
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : '',
                iconAnchor: [12, 12]
            });
        });
        abitazioniVittime.forEach(punto => {
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: MapElementsRenderer.creaMarkerAbitazioneVittima(),
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : '',
                iconAnchor: [12, 12]
            });
        });
    }

    visualizzaCerchi(centers, puntiUTM) {
        const delittiAttivi = this.getDelittiAttivi();
        const mostraCerchiStandardCenter = this.configurazione.mostraCerchiStandardCenter;

        if (!puntiUTM || puntiUTM.length === 0) {
            puntiUTM = [];
        }

        Object.values(centers).forEach(center => {
            if (!center.visible || !center.punto) return;

            let tipoCentro;
            switch (center.tipo) {
                case 'baricentro': tipoCentro = 'baricentro'; break;
                case 'mediana': tipoCentro = 'mediana'; break;
                case 'fermat': tipoCentro = 'fermat'; break;
                case 'canter': tipoCentro = 'canter'; break;
                default: tipoCentro = 'default';
            }

            // Usa la funzione per ottenere la configurazione del cerchio
            const opacitaCerchio = this.configurazione.opacitaCerchi || 0.15;
            const configCerchio = MapElementsRenderer.getConfigCerchio(tipoCentro, opacitaCerchio);

            if (center.tipo === 'canter' && center.cerchio && center.punto && this.configurazione.mostraCerchioCanter) {
                const [lat, lon] = convertiUTMtoWGS84(center.punto.x, center.punto.y, this.casoAttivo);
                const cerchioConfig = {
                    ...configCerchio,
                    popup: `<strong>Cerchio di Canter</strong><br>
                    Raggio: ${MapElementsRenderer.formattaDistanzaKm(center.cerchio.raggio, 1)}<br>
                    Area: ${(Math.PI * Math.pow(center.cerchio.raggio / 1000, 2)).toFixed(2)} km²`
                };
                this.mapManager.addCircle(lat, lon, center.cerchio.raggio, cerchioConfig);
            }

            if (mostraCerchiStandardCenter && center.punto && puntiUTM.length >= 2) {
                const [lat, lon] = convertiUTMtoWGS84(center.punto.x, center.punto.y, this.casoAttivo);

                const distanze = [];

                puntiUTM.forEach(punto => {
                    const distanza = Math.hypot(punto.x - center.punto.x, punto.y - center.punto.y);
                    distanze.push(distanza);
                });

                distanze.sort((a, b) => a - b);
                const distanzaMedia = distanze.reduce((sum, dist) => sum + dist, 0) / distanze.length;
                const distanzaMinima = distanze[0];
                const distanzaMassima = distanze[distanze.length - 1];

                const cerchioMediaConfig = {
                    ...configCerchio,
                    fillOpacity: opacitaCerchio * 0.8,
                    dashArray: '5, 5',
                    popup: `<strong>Distanza media</strong><br>${MapElementsRenderer.formattaDistanzaKm(distanzaMedia, 1)}`
                };
                const cerchioMinimoConfig = {
                    ...configCerchio,
                    fillOpacity: opacitaCerchio * 0.6,
                    dashArray: '5, 10',
                    popup: `<strong>Distanza minima</strong><br>${MapElementsRenderer.formattaDistanzaKm(distanzaMinima, 1)}`
                };
                const cerchioMassimoConfig = {
                    ...configCerchio,
                    fillOpacity: opacitaCerchio * 0.4,
                    dashArray: '10, 5',
                    popup: `<strong>Distanza massima</strong><br>${MapElementsRenderer.formattaDistanzaKm(distanzaMassima, 1)}`
                };
                this.mapManager.addCircle(lat, lon, distanzaMedia, cerchioMediaConfig);
                this.mapManager.addCircle(lat, lon, distanzaMinima, cerchioMinimoConfig);
                this.mapManager.addCircle(lat, lon, distanzaMassima, cerchioMassimoConfig);
            }
        });
    }
}

function aggiungiListenerModifica(selettore, callback) {
    document.querySelectorAll(selettore).forEach(el => el.addEventListener('change', callback));
}

function getCSSVar(name) {
    return MapElementsRenderer.getCSSVar(name);
}

function formattaDistanzaKm(distanzaMetri, decimali = 1) {
    return MapElementsRenderer.formattaDistanzaKm(distanzaMetri, decimali);
}

function creaCheckbox(item, checked = true, uniqueSuffix) {
    const safeLabel = MapElementsRenderer.escapeHtml(item.label);
    // Genera un ID univoco per l'input checkbox
    const checkboxId = `chk-${uniqueSuffix.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
    let linksHtml = '';
    const linkSources = item.fonti || [];

    if (linkSources && Array.isArray(linkSources) && linkSources.length > 0) {
        linksHtml = `<div style="margin-top: var(--sp-sm); font-size: var(--fs-xs);">
                      <span style="font-weight: 500; color: var(--color-text);">Fonti:</span><br>`;
        
        linkSources.forEach((fonte, idx) => {
            if (typeof fonte === 'string') { // Array di URL stringhe
                linksHtml += `<a href="${MapElementsRenderer.escapeHtml(fonte)}" target="_blank" rel="noopener noreferrer" 
                                style="color: var(--color-primary); text-decoration: underline; display: inline-block; margin-top: var(--sp-xxs);">
                                ${MapElementsRenderer.escapeHtml(fonte.substring(0, 40))}${fonte.length > 40 ? '...' : ''}
                             </a><br>`;
            }
            else if (fonte && typeof fonte.url === 'string') { // Array di oggetti {nome, url} o {text, url}
                const text = fonte.nome || fonte.text || fonte.url;
                linksHtml += `<a href="${MapElementsRenderer.escapeHtml(fonte.url)}" target="_blank" rel="noopener noreferrer"
                                style="color: var(--color-primary); text-decoration: underline; display: inline-block; margin-top: var(--sp-xxs);">
                                ${MapElementsRenderer.escapeHtml(text)}
                             </a><br>`;
            }
        });
        
        linksHtml += `</div>`;
    }

    return `
        <div class="checkbox-container">
            <div class="checkbox-control">
                <input type="checkbox" id="${checkboxId}" ${checked ? 'checked' : ''} data-label="${safeLabel}">
                <span class="checkbox-text-label" data-label="${safeLabel}">${safeLabel}</span>
            </div>
            ${linksHtml ? `<div class="checkbox-links-container">${linksHtml}</div>` : ''}
        </div>
    `;
}

function creaIconaCerchio(carattere, coloreBordoVar, coloreSfondoVar, dimensionePx = 20, fontSizePx = 14) {
    return MapElementsRenderer.creaIconaCerchio(carattere, coloreBordoVar, coloreSfondoVar, dimensionePx, fontSizePx);
}
function generaPopupHtml(punto, centers) {
    return MapElementsRenderer.generaPopupHtml(punto, centers, window.casoAttivo);
}
function convertiUTMtoWGS84(x, y, caso = 'mdf') {
    if (caso === 'mdf') {
        return proj4('EPSG:32632', 'EPSG:4326', [x, y]);
    } else { // caso zodiac
        return proj4('EPSG:32610', 'EPSG:4326', [x, y]);
    }
}
function convertiWGS84toUTM(lon, lat, caso = 'mdf') {
    if (caso === 'mdf') {
        return proj4('EPSG:4326', 'EPSG:32632', [lon, lat]);
    } else { // caso zodiac
        return proj4('EPSG:4326', 'EPSG:32610', [lon, lat]);
    }
}
function escapeHtml(str) {
    return MapElementsRenderer.escapeHtml(str);
}
window.addEventListener('DOMContentLoaded', () => new GeoAnalysisApp());