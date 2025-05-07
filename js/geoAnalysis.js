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

        this.datasets = {
            delitti: convertiInUTM(rawData.delitti),
            puntiInteresse: convertiInUTM(rawData.puntiInteresse),
            abitazioniSospettati: convertiInUTM(rawData.abitazioniSospettati),
            abitazioniVittime: convertiInUTM(rawData.abitazioniVittime),
            omicidiCollaterali: convertiInUTM(rawData.omicidiCollaterali)
        };

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

        this.inizializzaControlli();
        this.aggiornaVisualizzazione();
    }
    // Inizializzazione e Configurazione UI
    inizializzaControlli() {
        this.mapManager.abilitaCoordinateButton();
        this.configuraCheckboxes();
        this.configuraListenerGlobale();
        this.configuraSliderAnno();
        this.configuraAggiungiPunto();
        this.configuraSliderCPR();
        this.configuraSelezionaDeseleziona();
        this.configuraElementiCollassabili();

        //this.aggiornaVisualizzazione();
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

    popolaCheckbox(containerId, items, checked = true) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Contenitore checkbox non trovato: ${containerId}`);
            return;
        }
        container.innerHTML = items.map(item => creaCheckbox(item.label, checked)).join('');
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
            // Aggiorna la visualizzazione per qualsiasi cambio di stato dei controlli
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
        const infoBox = document.getElementById('aggiungi-info');
        const inputNome = document.getElementById('nome-punto');
        const btnSalva = document.getElementById('salva-punto-btn');
        const btnAnnulla = document.getElementById('annulla-punto-btn');
        let nuovoPunto = null; // Variabile temporanea per il punto da aggiungere
        let markerTemporaneo = null; // Riferimento al marker temporaneo

        const resetUIPuntoInteresse = () => {
            btnAggiungi.disabled = false;
            btnAggiungi.classList.remove('disabled');
            infoBox.style.display = 'none';
            inputNome.style.display = 'none';
            btnSalva.parentElement.style.display = 'none';
            inputNome.value = '';
            nuovoPunto = null;
            if (markerTemporaneo) {
                this.mapManager.removeMarker(markerTemporaneo);
                markerTemporaneo = null;
            }
        };

        const verificaSalvabile = () => {
            // Disabilita il pulsante salva se non c'è un nome o non è stato selezionato un punto
            const nomeValido = inputNome.value.trim().length > 0;
            btnSalva.disabled = !nomeValido || !nuovoPunto;
            btnSalva.classList.toggle('disabled', !nomeValido || !nuovoPunto);
        };

        btnAggiungi.addEventListener('click', () => {
            btnAggiungi.disabled = true;
            btnAggiungi.classList.add('disabled');
            infoBox.style.display = 'block';
            inputNome.style.display = 'none';
            btnSalva.parentElement.style.display = 'none';
            inputNome.value = '';
            nuovoPunto = null;
            btnSalva.disabled = true;
            btnSalva.classList.add('disabled');

            // Attiva il listener per il click sulla mappa
            this.mapManager.map.once('click', ({ latlng: { lat, lng } }) => {
                nuovoPunto = { lat, lon: lng };
                // Aggiungi un marker temporaneo sulla mappa
                markerTemporaneo = this.mapManager.addPoint(lat, lng, {
                    color: getCSSVar('--color-warning'), radius: 8,
                    strokeColor: getCSSVar('--color-warning'), strokeWidth: 2,
                    popup: 'Nuovo punto'
                });
                inputNome.style.display = 'block';
                btnSalva.parentElement.style.display = 'flex';
                inputNome.focus();
                verificaSalvabile();
            });
        });

        // Aggiungi un listener all'input del nome per abilitare/disabilitare il pulsante salva
        inputNome.addEventListener('input', verificaSalvabile);

        btnAnnulla.addEventListener('click', resetUIPuntoInteresse);

        // Aggiungi evento per tasto ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && btnAggiungi.disabled) {
                resetUIPuntoInteresse();
            }
        });

        btnSalva.addEventListener('click', () => {
            const nome = escapeHtml(inputNome.value.trim());
            // Verifica che un nome sia stato inserito e un punto selezionato
            if (!nome || !nuovoPunto) return;

            // Converte il punto in UTM e lo aggiunge al dataset dei Punti di Interesse
            const [x, y] = proj4('EPSG:4326', 'EPSG:32632', [nuovoPunto.lon, nuovoPunto.lat]);
            const nuovo = { ...nuovoPunto, x, y, label: nome };
            this.datasets.puntiInteresse.push(nuovo);

            // Aggiunge un nuovo checkbox per il punto
            const container = document.getElementById('punti-interesse-checkbox');
            if (container) {
                container.insertAdjacentHTML('beforeend', creaCheckbox(nuovo.label, true));

                // Aggiungi un listener al nuovo checkbox
                const newCheckbox = container.querySelector(`input[data-label="${nuovo.label}"]`);
                if (newCheckbox) {
                    newCheckbox.addEventListener('change', () => {
                        this.aggiornaVisualizzazione();
                    });
                }
            }

            // Resetta l'UI
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

            // Usa il valore globale se esiste, altrimenti il default
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

                // Aggiorna la variabile globale (in metri se è una distanza)
                let newValueForWindow = sliderVal;
                if (config.isKm) {
                    newValueForWindow *= 1000;
                }

                window[config.variable] = newValueForWindow;
                this.aggiornaVisualizzazione();
            });
        });

        // Configura il pulsante reset
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
                <h4 class="legend-title">Risultati Analisi Geospaziale</h4>
                <div class="legend-content"></div>
            </div>
        `;
        // Aggiungi infobox alla mappa tramite MapManager
        this.mapManager.addLegend(legendaHTML, { position: 'bottomright' });

        // Ottieni il riferimento all'elemento content per aggiornamenti futuri
        this.infoboxContent = document.querySelector('.map-legend-unified .legend-content');
    }

    aggiornaInfoboxBase(titolo, contenuto) {
        if (!this.infoboxContent) this.creaInfoboxBase();

        const nuovaSezione = document.createElement('div');
        nuovaSezione.className = 'legend-section';
        
        // Rendere la sezione collassabile
        const sezioneHTML = `
            <div class="legend-section-header">
                <h5>${titolo}</h5>
                <span class="collapse-icon material-icons">expand_less</span>
            </div>
            <div class="legend-data">${contenuto}</div>
        `;
        
        nuovaSezione.innerHTML = sezioneHTML;
        
        // Aggiungi evento per collassare/espandere
        const headerElement = nuovaSezione.querySelector('.legend-section-header');
        headerElement.addEventListener('click', () => {
            nuovaSezione.classList.toggle('collapsed');
        });

        this.infoboxContent.appendChild(nuovaSezione);
    }

    // Funzione helper per generare il contenuto HTML di una infobox standard per i centri
    // completa di informazioni aggiuntive (distanze, medie, ecc.)
    creaContenutoInfobox(titolo, iconHtml, color, centerPoint, puntiUTM) {
        const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [centerPoint.x, centerPoint.y]);
        let minDist = Infinity;
        let maxDist = 0;
        let sommaDistanze = 0;

        // Calcola statistiche sulle distanze
        if (puntiUTM && puntiUTM.length > 0) {
            puntiUTM.forEach(p => {
                const dist = Math.hypot(p.x - centerPoint.x, p.y - centerPoint.y);
                if (dist < minDist) minDist = dist;
                if (dist > maxDist) maxDist = dist;
                sommaDistanze += dist;
            });
        }
        else {
            minDist = 0;
            maxDist = 0;
        }

        const deviazioneStandard = algoritmiGeometrici.calcolaDeviazioneStandardDistanze(puntiUTM, centerPoint);
        const distanzaMedia = puntiUTM && puntiUTM.length > 0 ? sommaDistanze / puntiUTM.length : 0;

        return `
            <div style="display: flex; align-items: center; margin-bottom: var(--sp-sm)">
                <div class="legend-icon-wrapper" style="margin-right: var(--sp-sm);">${iconHtml}</div>
                <p class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</p>
            </div>
            ${puntiUTM && puntiUTM.length > 0 ? `
                <table class="nni-table">
                    <tr><td>Punti considerati</td><td>${puntiUTM.length}</td></tr>
                    <tr><td>Distanza minima</td><td>${formattaDistanzaKm(minDist)}</td></tr>
                    <tr><td>Distanza massima</td><td>${formattaDistanzaKm(maxDist)}</td></tr>
                    <tr><td>Distanza media</td><td>${formattaDistanzaKm(distanzaMedia)}</td></tr>
                    <tr><td>Deviazione standard</td><td>${formattaDistanzaKm(deviazioneStandard)}</td></tr>
                </table>
            ` : '<p>Nessun punto attivo per l\'analisi.</p>'}
        `;
    }

    // Recupero Dati Attivi

    // Metodo helper per recuperare elementi attivi da un dataset in base allo stato dei checkbox
    getCheckboxSelezionati(dataset, selector) {
        return Array.from(document.querySelectorAll(selector + ' input:checked'))
            .map(el => dataset.find(d => d.label === el.dataset.label))
            .filter(Boolean);
    }

    getDelittiAttivi() {
        const originali = this.getCheckboxSelezionati(this.datasets.delitti, '#delitti-checkbox');
        const collaterali = this.getCheckboxSelezionati(this.datasets.omicidiCollaterali, '#omicidi-collaterali-checkbox');

        // Aggiorna il display dell'anno corrente
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

        const centers = [];

        if (delittiAttivi.length > 0) {
            const puntiUTM = delittiAttivi.map(p => ({ x: p.x, y: p.y }));

            if (mostraCentroide) {
                this.visualizzaCentroGeometrico(
                    puntiUTM,
                    'baricentro',
                    'B',
                    '--color-success',
                    '--bg-success',
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
                    '--bg-success',
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
                    '--bg-warning',
                    'Centro di Minima Distanza',
                    centers,
                    mostraEtichette
                );
            }

            // Cerchio di Canter
            if (mostraCanter) {
                const canter = algoritmiGeometrici.canter(puntiUTM);

                const [lonCanter, latCanter] = proj4('EPSG:32632', 'EPSG:4326', [canter.x, canter.y]);
                centers.push({ label: 'Centro Cerchio di Canter', x: canter.x, y: canter.y });
                const iconHtml = creaIconaCerchio('C', '--color-accent', '--bg-accent');

                // Aggiungi l'icona del centro alla mappa
                this.mapManager.addIcon(latCanter, lonCanter, {
                    html: iconHtml,
                    popup: `<strong>Centro del cerchio di Canter</strong><div class="coordinate">${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</div>`,
                    tooltip: `Centro Cerchio di Canter\n${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E`,
                    permanentTooltip: mostraEtichette
                });

                this.mapManager.addCircle(latCanter, lonCanter, canter.raggio, {
                    color: getCSSVar('--color-accent'),
                    fillColor: getCSSVar('--color-accent'),
                    fillOpacity: 0.1,
                    weight: 2,
                    popup: `<strong>Cerchio di Canter</strong><div class="coordinate">Centro: ${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</div><div class="coordinate">Raggio: ${formattaDistanzaKm(canter.raggio, 1)} km</div><em>${delittiAttivi.length} delitti considerati</em>`
                });

                // Calcola i dati personalizzati per l'infobox
                const raggioCanter = canter.raggio;

                let puntiDentro = 0;

                puntiUTM.forEach(p => {
                    const distFromCenter = Math.hypot(p.x - canter.x, p.y - canter.y);
                    if (distFromCenter <= raggioCanter) {
                        puntiDentro++;
                    }
                });
                const puntiUsati = puntiUTM.length;
                const percentualeDentro = puntiUsati > 0 ? (puntiDentro / puntiUsati) * 100 : 0;

                // Usa il formato standard dell'infobox
                const contenutoInfoboxCanter = `
                    <div style="display: flex; align-items: center; margin-bottom: var(--sp-sm)">
                        <div class="legend-icon-wrapper" style="margin-right: var(--sp-sm);">${iconHtml}</div>
                        <p class="coordinate">${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</p>
                    </div>
                    <table class="nni-table">
                        <tr><td>Punti considerati</td><td>${puntiUsati}</td></tr>
                        <tr><td>Raggio del cerchio</td><td>${formattaDistanzaKm(raggioCanter, 1)}</td></tr>
                        <tr><td>Punti nel cerchio</td><td>${puntiDentro} (${percentualeDentro.toFixed(1)}%)</td></tr>
                    </table>
                `;
                this.aggiornaInfoboxBase('Cerchio di Canter', contenutoInfoboxCanter);
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
                    const centroCPR = algoritmiGeometrici.centroProbabileResidenza(tuttiPunti);
                    const [lonCPR, latCPR] = proj4('EPSG:32632', 'EPSG:4326', [centroCPR.x, centroCPR.y]);

                    centers.push({ label: 'Centro Probabile Residenza', x: centroCPR.x, y: centroCPR.y });

                    const iconHtml = creaIconaCerchio('CPR', '--color-neutral', '--bg-muted', 20, 8)

                    this.mapManager.addIcon(latCPR, lonCPR, {
                        html: iconHtml,
                        popup: `<strong>Centro Probabile Residenza</strong><div class="coordinate">${latCPR.toFixed(4)}°N, ${lonCPR.toFixed(4)}°E</div><em>${tuttiPunti.length} eventi considerati</em>`,
                        tooltip: `Centro Probabile Residenza\n${latCPR.toFixed(4)}°N, ${lonCPR.toFixed(4)}°E`,
                        permanentTooltip: mostraEtichette
                    });

                    // Calcola e aggiungi il cerchio di deviazione standard
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
                    this.aggiornaInfoboxBase('Centro Probabile Residenza', this.creaContenutoInfobox('Centro Probabile Residenza', iconHtml, getCSSVar('--color-neutral'), centroCPR, tuttiPunti));
                }
            }

            // Convex Hull
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
                    fillOpacity: 0.1,
                    popup: `Convex Hull (${hull.length} vertici)`
                });

                // Infobox CHP da implementare
            }

            // Mean Interpoint Distance (MID)
            if (mostraMID && delittiAttivi.length >= 2) {
                const midValue = algoritmiGeometrici.meanInterpointDistance(puntiUTM);

                // Il cerchio MID è centrato sul baricentro
                const baricentro = algoritmiGeometrici.baricentro(puntiUTM);
                const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [baricentro.x, baricentro.y]);

                // Aggiungi cerchio MID alla mappa
                this.mapManager.addCircle(lat, lon, midValue, {
                    color: getCSSVar('--color-primary-dark'),
                    fillColor: getCSSVar('--color-primary'),
                    fillOpacity: 0.2,
                    weight: 2,
                    popup: `
                        <strong>MID (Distanza Media)</strong>
                        <div class="coordinate">Raggio: ${formattaDistanzaKm(midValue, 1)} km</div>
                        <em>Basato su ${delittiAttivi.length} punti</em>
                    `
                });

                const iconHtml = creaIconaCerchio('MID', '--color-primary-dark', '--bg-primary', 20, 10);

                // Usa il formato personalizzato dell'infobox
                const infoboxMID = `
                    <div style="display: flex; align-items: center; margin-bottom: var(--sp-sm)">
                        <div class="legend-icon-wrapper" style="margin-right: var(--sp-sm);">${iconHtml}</div>
                        <p class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</p>
                    </div>
                    <table class="nni-table">
                        <tr>
                            <td>Punti considerati</td>
                            <td>${delittiAttivi.length}</td>
                        </tr>
                        <tr>
                            <td>Valore MID</td>
                            <td>${formattaDistanzaKm(midValue, 1)}</td>
                        </tr>
                    </table>
                `;
                this.aggiornaInfoboxBase('Mean Interpoint Distance', infoboxMID);
            }

            // Nearest Neighbor Index (NNI)
            if (mostraNNI && delittiAttivi.length >= 2) {
                const risultatoNNI = algoritmiGeometrici.nearestNeighborIndex(delittiAttivi);

                // Colore specifico per NNI
                const nniColor = getCSSVar('--color-purple');
                const nniColorLight = getCSSVar('--color-purple-light');

                // Linee ai punti più vicini
                delittiAttivi.forEach(p1 => {
                    let vicino = null;
                    let distanzaMinima = Infinity;

                    delittiAttivi.forEach(p2 => {
                        if (p1 === p2) return;
                        const distanza = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                        if (distanza < distanzaMinima) {
                            distanzaMinima = distanza;
                            vicino = p2;
                        }
                    });

                    // Disegna la linea se è stato trovato un vicino
                    if (vicino) {
                        const [lon1, lat1] = proj4('EPSG:32632', 'EPSG:4326', [p1.x, p1.y]);
                        const [lon2, lat2] = proj4('EPSG:32632', 'EPSG:4326', [vicino.x, vicino.y]);

                        this.mapManager.addLine([lat1, lon1], [lat2, lon2], {
                            color: nniColor,
                            weight: 3,
                            opacity: 0.8,
                            popup: `Distanza vicino più prossimo: ${formattaDistanzaKm(distanzaMinima, 1)} km`
                        });
                    }
                });

                const iconHtml = creaIconaCerchio('NNI', '--color-purple', '--bg-purple-light', 20, 8);

                // Usa il formato personalizzato dell'infobox
                const baricentro = algoritmiGeometrici.baricentro(delittiAttivi);
                const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [baricentro.x, baricentro.y]);
                
                const infoboxNNI = `
                    <div style="display: flex; align-items: center; margin-bottom: var(--sp-sm)">
                        <div class="legend-icon-wrapper" style="margin-right: var(--sp-sm);">${iconHtml}</div>
                        <p class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</p>
                    </div>
                    <table class="nni-table">
                        <tr>
                            <td>Valore NNI</td>
                            <td><span style="color: ${risultatoNNI.indice < 0.8 ? getCSSVar('--color-danger') : risultatoNNI.indice > 1.2 ? getCSSVar('--color-primary') : getCSSVar('--color-success')}">${risultatoNNI.indice.toFixed(2)}</span></td>
                        </tr>
                        <tr>
                            <td>Distanza media osservata</td>
                            <td>${(risultatoNNI.distanzaMedia / 1000).toFixed(2)} km</td>
                        </tr>
                        <tr>
                            <td>Distanza attesa casuale</td>
                            <td>${(risultatoNNI.distanzaCasuale / 1000).toFixed(2)} km</td>
                        </tr>
                        <tr>
                            <td>Densità punti</td>
                            <td>${(risultatoNNI.densita * 1000000).toFixed(2)}/km²</td>
                        </tr>
                        <tr>
                            <td>Area analizzata</td>
                            <td>${(risultatoNNI.areaTotale / 1000000).toFixed(2)} km²</td>
                        </tr>
                    </table>
                `;
                this.aggiornaInfoboxBase('Nearest Neighbour Index', infoboxNNI);

                // Cerchio con raggio pari alla distanza media osservata
                this.mapManager.addCircle(lat, lon, risultatoNNI.distanzaMedia, {
                    fillColor: nniColorLight,
                    fillOpacity: 0.2,
                    color: nniColor,
                    weight: 2,
                    popup: `Distanza media tra vicini: ${(risultatoNNI.distanzaMedia / 1000).toFixed(2)} km`
                });
            }
        }

        delittiAttivi.forEach(punto => {
            const isCollaterale = this.datasets.omicidiCollaterali.some(d => d.label === punto.label);
            const colore = isCollaterale ? getCSSVar('--color-warning') : getCSSVar('--color-danger');

            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${colore};">warning</span>`,
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });

        puntiInteresse.forEach(punto => {
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${getCSSVar('--color-primary')};">location_on</span>`,
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });

        abitazioniSospettati.forEach(punto => {
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${getCSSVar('--color-neutral')};">home</span>`,
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });

        abitazioniVittime.forEach(punto => {
            this.mapManager.addIcon(punto.lat, punto.lon, {
                html: `<span class="material-icons" style="font-size:24px;color:${getCSSVar('--color-primary-dark')};">home</span>`,
                popup: generaPopupHtml(punto, centers),
                tooltip: punto.label,
                permanentTooltip: mostraEtichette,
                className: mostraEtichette ? 'permanent-tooltip' : ''
            });
        });
    }

    visualizzaCentroGeometrico(puntiUTM, tipoAnalisi, iconaChar, coloreVar, coloreSfondoVar, titolo, centri, mostraEtichette) {
        let puntoCentro;
        let nomeAlgoritmo;

        switch (tipoAnalisi) {
            case 'baricentro':
                puntoCentro = algoritmiGeometrici.baricentro(puntiUTM);
                nomeAlgoritmo = 'Baricentro';
                break;
            case 'mediana':
                puntoCentro = algoritmiGeometrici.mediana(puntiUTM);
                nomeAlgoritmo = 'Mediana';
                break;
            case 'fermat':
                puntoCentro = algoritmiGeometrici.fermat(puntiUTM);
                nomeAlgoritmo = 'Centro di Minima Distanza';
                break;
            default:
                console.error(`Tipo di analisi non supportato: ${tipoAnalisi}`);
                return;
        }

        if (!puntoCentro) {
            console.warn(`Impossibile calcolare ${nomeAlgoritmo}. Numero di punti: ${puntiUTM.length}`);
            return;
        }

        const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [puntoCentro.x, puntoCentro.y]);
        centri.push({ label: titolo, x: puntoCentro.x, y: puntoCentro.y });

        const htmlIcona = creaIconaCerchio(iconaChar, coloreVar, coloreSfondoVar);

        this.mapManager.addIcon(lat, lon, {
            html: htmlIcona,
            popup: `<strong>${titolo}</strong><div class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div><em>${puntiUTM.length} delitti considerati</em>`,
            tooltip: `${titolo}\n${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
            permanentTooltip: mostraEtichette
        });

        this.aggiornaInfoboxBase(titolo, this.creaContenutoInfobox(titolo, htmlIcona, getCSSVar(coloreVar), puntoCentro, puntiUTM));
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
                    
                    // Gestione manuale per i morti collaterali
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
        // Configura le sezioni collassabili nella legenda
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
function creaIconaCerchio(carattere, coloreBordoVar, coloreSfondoVar, dimensionePx = 20, fontSizePx = 14) {
    const coloreBordo = getCSSVar(coloreBordoVar);
    const coloreSfondo = getCSSVar(coloreSfondoVar);
    const coloreTesto = getCSSVar(coloreBordoVar);

    return `
        <div style="
            width: ${dimensionePx}px;
            height: ${dimensionePx}px;
            border: 2px solid ${coloreBordo};
            border-radius: 50%;
            background: ${coloreSfondo};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSizePx}px;
            color: ${coloreTesto};">
            ${carattere}
        </div>`;
}
function generaPopupHtml(punto, centers) {
    const [lon, lat] = proj4('EPSG:32632', 'EPSG:4326', [punto.x, punto.y]);

    let popupHtml = `
        <div class="popup-container">
            <div class="popup-header">
                <span class="popup-title">${escapeHtml(punto.label)}</span>
                <span class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</span>
            </div>
    `;
    if (centers.length > 0) {
        popupHtml += `
            <table class="popup-table">
                <thead>
                    <tr>
                        <th>Centro</th>
                        <th>Distanza</th>
                    </tr>
                </thead>
                <tbody>
                    ${centers
                .map(c => {
                    const distanza = Math.hypot(punto.x - c.x, punto.y - c.y);
                    return `
                                <tr>
                                    <td>${escapeHtml(c.label)}</td>
                                    <td>${formattaDistanzaKm(distanza, 1)}</td>
                                </tr>
                            `;
                })
                .join('')}
                </tbody>
            </table>
        `;
    }

    popupHtml += `</div>`;
    return popupHtml;
}
function formattaDistanzaKm(distanzaMetri, decimali = 1) {
    return `${(distanzaMetri / 1000).toFixed(decimali)} km`;
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
window.addEventListener('DOMContentLoaded', () => new GeoAnalysisApp());
