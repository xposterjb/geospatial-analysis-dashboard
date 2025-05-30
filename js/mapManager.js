/**
 * MAP MANAGER - Controller visualizzazione cartografica
 * 
 * Responsabilità principali:
 * 1. Gestione della mappa Leaflet
 * 2. Creazione di marker personalizzati
 * 3. Disegno di cerchi e aree circolari sulla mappa
 * 4. Sistema di selezione coordinate con conversione UTM/WGS84
 * 5. Gestione di popup e tooltip interattivi
 * 
 * Configurazione iniziale:
 * - Centrata sull'area di Firenze (43.78, 11.2)
 */
class MapManager {
    constructor() {
        this.map = L.map('map', {
            preferCanvas: false,
            zoomDelta: 0.5,     // Permette livelli di zoom intermedi
            zoomSnap: 0.5,      // Aggancia lo zoom a incrementi di 0.5
            wheelPxPerZoomLevel: 120
        }).setView([43.78, 11.2], 11);

        this.svgRenderer = L.svg().addTo(this.map);

        this.baseMaps = {
            chiaro: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),
            /* Mappa scura temporaneamente rimossa
            /*scuro: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }),*/
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri'
            }),
            topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
            })
        };

        this.baseMaps.chiaro.addTo(this.map);

        this.creaPannelliContainer();
        this.inizializzaStrumentiDisegno();
        this.creaSelettoreMappa();
        this.applicaTemaCorretto();

        this.layers = [];
        this.clickHandler = null;
        this.lastMarker = null;
        this.coordsDisplay = document.getElementById('coords-display');

        // Flag per la modalità disegno
        this.isDrawingMode = false;
        this.markers = [];

        // Event listener per il tasto ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDrawingMode) {
                this.disattivaHandlerAttivi();
                document.querySelectorAll('.map-tool-btn').forEach(btn => btn.classList.remove('active'));
            }
        });
        
        this.onPointAdded = null;
    }


    creaPannelliContainer() {
        // Crea il container principale per i pannelli
        const pannelliContainer = document.createElement('div');
        pannelliContainer.className = 'map-panels-container';
        document.getElementById('map').appendChild(pannelliContainer);
        this.pannelliContainer = pannelliContainer;
    }

    creaSelettoreMappa() {
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'map-selector';

        const opzioni = [
            { id: 'chiaro', label: 'Standard', icon: 'map' },
            //{ id: 'scuro', label: 'Scura', icon: 'dark_mode' },
            { id: 'satellite', label: 'Satellite', icon: 'satellite' },
            { id: 'topo', label: 'Topografica', icon: 'terrain' }
        ];

        opzioni.forEach(opzione => {
            const option = document.createElement('div');
            option.className = 'map-selector-option';
            option.dataset.mapType = opzione.id;
            option.innerHTML = `<span class="material-icons">${opzione.icon}</span>`;
            option.setAttribute('title', opzione.label);

            // Aggiungi event listener per cambiare la mappa
            option.addEventListener('click', () => {
                this.cambiaTipoMappa(opzione.id);

                document.querySelectorAll('.map-selector-option').forEach(el => {
                    el.classList.remove('active');
                });
                option.classList.add('active');
            });

            selectorContainer.appendChild(option);
        });

        this.pannelliContainer.appendChild(selectorContainer);

        const mappaIniziale = document.documentElement.getAttribute('data-theme') === 'dark' ? 'scuro' : 'chiaro';
        const opzioneAttiva = document.querySelector(`.map-selector-option[data-map-type="${mappaIniziale}"]`);
        if (opzioneAttiva) {
            opzioneAttiva.classList.add('active');
        } else {
            // Se la mappa scura non è disponibile, attiva la mappa standard
            const opzioneDefault = document.querySelector('.map-selector-option[data-map-type="chiaro"]');
            if (opzioneDefault) {
                opzioneDefault.classList.add('active');
            }
        }
    }

    cambiaTipoMappa(tipo) {
        Object.values(this.baseMaps).forEach(mappa => {
            if (this.map.hasLayer(mappa)) {
                this.map.removeLayer(mappa);
            }
        });

        if (this.baseMaps[tipo]) {
            this.baseMaps[tipo].addTo(this.map);
        }
        localStorage.setItem('tipomappa', tipo);
    }

    applicaTemaCorretto() {
        const isDarkTheme = document.body.classList.contains('dark-theme') ||
            document.documentElement.getAttribute('data-theme') === 'dark';

        const tipoMappaSalvato = localStorage.getItem('tipomappa');

        if (tipoMappaSalvato && this.baseMaps[tipoMappaSalvato]) {
            this.cambiaTipoMappa(tipoMappaSalvato);

            document.querySelectorAll('.map-selector-option').forEach(el => {
                el.classList.remove('active');
            });
            const opzioneAttiva = document.querySelector(`.map-selector-option[data-map-type="${tipoMappaSalvato}"]`);
            if (opzioneAttiva) opzioneAttiva.classList.add('active');

            return;
        }

        this.cambiaTipoMappa('chiaro');

        document.querySelectorAll('.map-selector-option').forEach(el => {
            el.classList.remove('active');
        });
        const opzioneChiara = document.querySelector('.map-selector-option[data-map-type="chiaro"]');
        if (opzioneChiara) opzioneChiara.classList.add('active');
        
        // Aggiorno le dimensioni della mappa
        this.map.invalidateSize();
    }
    updateMapSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
    clear() {
        this.layers.forEach(layer => this.map.removeLayer(layer));
        this.layers = [];
    }
    addPoint(lat, lon, options = {}) {
        const defaults = {
            color: '#ff4444',
            strokeColor: '#aa0000',
            radius: 6,
            strokeWidth: 2,
            fillOpacity: 0.8,
            weight: 1
        };
        const settings = { ...defaults, ...options };
        const iconSize = Math.max(24, settings.radius * 2 + settings.strokeWidth * 2);
        const svgContent = `
            <svg width="${iconSize}" height="${iconSize}">
                <circle cx="${iconSize / 2}" cy="${iconSize / 2}" 
                        r="${settings.radius}" 
                        fill="${settings.color}"
                        stroke="${settings.strokeColor}"
                        stroke-width="${settings.strokeWidth}"
                        opacity="${settings.fillOpacity}"/>
            </svg>
        `;
        const icon = L.divIcon({
            className: 'custom-marker' + (options.className ? ` ${options.className}` : ''),
            html: svgContent,
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize / 2, iconSize / 2]
        });

        const marker = L.marker([lat, lon], { icon }).addTo(this.map);

        this.markers.push(marker);

        // Imposta l'interattività in base alla modalità corrente
        if (this.isDrawingMode) {
            marker.getElement().style.pointerEvents = 'none';
            marker.getElement().style.cursor = 'default';
        }
        if (options.popup) {
            const popupOriginal = options.popup;
            marker.bindPopup(popupOriginal);

            marker.off('click');
            marker.on('click', (e) => {
                if (!this.isDrawingMode) {
                    marker.openPopup();
                }
            });
        }
        if (options.tooltip) {
            marker.bindTooltip(options.tooltip, {
                permanent: options.permanentTooltip || false,
                direction: 'auto',
                opacity: 0.9,
                className: options.className || '',
                offset: [0, -5]
            });
        }
        this.layers.push(marker);
        return marker;
    }

    addIcon(lat, lon, options = {}) {
        const icon = L.divIcon({
            html: options.html || '',
            className: options.className || '',
            iconSize: [30, 30],
            iconAnchor: options.iconAnchor || [15, 30],
        });
        const marker = L.marker([lat, lon], { icon });

        this.markers.push(marker);

        if (this.isDrawingMode) {
            marker.addTo(this.map);
            try {
                const element = marker.getElement();
                if (element) {
                    element.style.pointerEvents = 'none';
                    element.style.cursor = 'default';
                }
            } catch (error) {
                console.warn('Impossibile modificare lo stile del marker in modalità disegno', error);
            }
        } else {
            marker.addTo(this.map);            
            if (options.className && options.className.includes('centro-geometrico-icon')) {
                try {
                    const element = marker.getElement();
                    if (element) {
                        element.classList.add('centro-geometrico-icon');
                    }
                } catch (error) {
                    console.warn('Impossibile applicare la classe al marker', error);
                }
            }
        }

        if (options.popup) {
            const popupOriginal = options.popup;
            marker.bindPopup(popupOriginal);

            marker.off('click');
            marker.on('click', (e) => {
                if (!this.isDrawingMode) {
                    marker.openPopup();
                }
            });
        }
        if (options.tooltip) {
            marker.bindTooltip(options.tooltip, {
                permanent: options.permanentTooltip,
                direction: 'top',
                className: options.className || '',
                opacity: 0.9
            });
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
            interactive: false,
            zIndex: 1
        };
        const settings = { ...defaults, ...options };
        const circle = L.circle([lat, lon], {
            ...settings,
            radius: isNaN(radius) ? 0 : radius,
            renderer: this.svgRenderer
        }).addTo(this.map);
        
        if (settings.zIndex) {
            circle.setStyle({ zIndex: settings.zIndex });
        }
        
        if (settings.popup) {
            circle.bindPopup(settings.popup);
        }
        this.layers.push(circle);
        return circle;
    }

    addLine(coord1, coord2, options = {}) {
        const defaults = {
            color: '#000000',
            weight: 2,
            dashArray: null,
            opacity: 1,
            popup: null
        };
        const settings = { ...defaults, ...options };

        const line = L.polyline([coord1, coord2], {
            color: settings.color,
            weight: settings.weight,
            dashArray: settings.dashArray,
            opacity: settings.opacity,
            renderer: this.svgRenderer
        }).addTo(this.map);

        if (settings.popup) {
            line.bindPopup(settings.popup);
        }
        this.layers.push(line);
        return line;
    }

    addArrow(coord1, coord2, options = {}) {
        const defaults = {
            color: '#000000',
            weight: 2,
            opacity: 1,
            popup: null,
            arrowSize: 8,
            label: null,
            labelColor: '#ffffff',
            labelBgColor: '#000000'
        };
        const settings = { ...defaults, ...options };
        
        const line = L.polyline([coord1, coord2], {
            color: settings.color,
            weight: settings.weight,
            opacity: settings.opacity,
            renderer: this.svgRenderer
        }).addTo(this.map);
        
        const midPoint = L.latLng(
            (coord1[0] + coord2[0]) / 2,
            (coord1[1] + coord2[1]) / 2
        );    

        const angle = Math.atan2(coord2[1] - coord1[1], coord2[0] - coord1[0]) * 180 / Math.PI;        
        // La freccia è orientata nella direzione della linea
        const arrowIcon = L.divIcon({
            html: `<svg width="${settings.arrowSize * 2}" height="${settings.arrowSize * 2}" style="transform: rotate(${angle + 90}deg)">
                     <polygon points="${settings.arrowSize},0 0,${settings.arrowSize * 2} ${settings.arrowSize * 2},${settings.arrowSize * 2}" 
                              fill="${settings.color}" />
                   </svg>`,
            className: 'arrow-marker',
            iconSize: [settings.arrowSize * 2, settings.arrowSize * 2],
            iconAnchor: [settings.arrowSize, settings.arrowSize]
        });
        
        const arrowPosition = L.latLng(coord2[0], coord2[1]);
        
        const arrowMarker = L.marker(arrowPosition, { icon: arrowIcon }).addTo(this.map);
        this.layers.push(arrowMarker);
        
        if (settings.label !== null) {
            const labelIcon = L.divIcon({
                html: `<div style="
                         background-color: ${settings.labelBgColor}; 
                         color: ${settings.labelColor};
                         border-radius: 50%;
                         width: 20px;
                         height: 20px;
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         font-weight: bold;
                         font-size: 12px;
                         border: 2px solid ${settings.color};">${settings.label}</div>`,
                className: 'segment-label',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            
            const labelMarker = L.marker(midPoint, { icon: labelIcon }).addTo(this.map);
            this.layers.push(labelMarker);
            
            if (settings.popup) {
                labelMarker.bindPopup(settings.popup);
            }
        } else if (settings.popup) {
            line.bindPopup(settings.popup);
        }        
        this.layers.push(line);
        return line;
    }

    addLegend(content, options = {}) {
        const { position = 'topright' } = options;

        if (this.legend) {
            this.map.removeControl(this.legend);
        }

        this.legend = L.control({ position });
        this.legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = content;
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        this.legend.addTo(this.map);
    }

    addPolygon(latlngs, options = {}) {
        if (latlngs && latlngs.length > 0) {
            latlngs.forEach((coord, index) => {
                if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number' || isNaN(coord[0]) || isNaN(coord[1])) {
                    console.error(`[DEBUG-POLYGON] Coordinata non valida all'indice ${index}:`, coord);
                }
            });
        } else {
            console.warn("[DEBUG-POLYGON] latlngs è vuoto o non definito.");
            return null;
        }

        const defaults = {
            color: '#3388ff',
            weight: 3,
            opacity: 0.5,
            fillOpacity: 0.2
        };
        
        if (options.weight && typeof options.weight === 'string') {
            options.weight = parseFloat(options.weight);
        }
        if (options.weight && isNaN(options.weight)) {
            console.warn(`[DEBUG-POLYGON] Opzione weight non valida (${options.weight}), usando default: ${defaults.weight}`);
            options.weight = defaults.weight;
        }
        
        const settings = { ...defaults, ...options };

        try {
            const polygon = L.polygon(latlngs, settings).addTo(this.map);
            const bounds = polygon.getBounds();

            if (options.popup) {
                polygon.bindPopup(options.popup);            
                polygon.off('click');
                
                polygon.on('click', (e) => {
                    if (!this.isDrawingMode) {
                        polygon.openPopup();
                    }
                    if (this.isDrawingMode) {
                        L.DomEvent.stopPropagation(e);
                    }
                });
            }        
            this.layers.push(polygon);
            return polygon;
        } catch (error) {
            console.error("[DEBUG-POLYGON] Errore nella creazione del poligono:", error);
            return null;
        }
    }

    abilitaCoordinateButton() {
        const btn = document.getElementById('get-coords-btn');
        if (btn) {
            btn.addEventListener('click', () => this.attivaModalitaCoordinate());
        }
    }
   
    attivaPannelloAggiungiPunto() {
        this.disattivaHandlerAttivi();
        this.isDrawingMode = true;
        this.aggiornaInterattivitaMarker();
        
        // Mostra la barra di tipo punti e imposta il bottone come attivo
        this.aggiungiPuntoTypeBar.style.display = 'flex';
        document.querySelector('#tool-add-point').classList.add('active');
        
        this.mostraMessaggioIstruzioni('Seleziona il tipo di punto da aggiungere dalla barra superiore.');
    }
    
    attivaModalitaAggiungiPunto(tipo) {
        if (this._aggiungiPuntoCleanup) {
            this._aggiungiPuntoCleanup();
            this._aggiungiPuntoCleanup = null;
        }
        
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        mapContainer.style.cursor = 'crosshair';
        let tempMarker = null;
        let popupDiv = null;

        this._aggiungiPuntoCleanup = () => {
            mapContainer.style.cursor = '';
            if (tempMarker) {
                this.removeMarker(tempMarker);
                tempMarker = null;
            }
            if (popupDiv && popupDiv.parentNode) {
                popupDiv.parentNode.removeChild(popupDiv);
                popupDiv = null;
            }
        };

        this.onceClick((e) => {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            let markerHtml = '';
            switch (tipo) {
                case 'delitto': markerHtml = MapElementsRenderer.creaMarkerDelitto(false); break;
                case 'collaterale': markerHtml = MapElementsRenderer.creaMarkerDelitto(true); break;
                case 'poi': markerHtml = MapElementsRenderer.creaMarkerPuntoInteresse(); break;
                case 'abitazioneVittima': markerHtml = MapElementsRenderer.creaMarkerAbitazioneVittima(); break;
                case 'abitazioneSospettato': markerHtml = MapElementsRenderer.creaMarkerAbitazioneSospettato(); break;
                default: markerHtml = MapElementsRenderer.creaMarkerPuntoInteresse();
            }
            
            tempMarker = this.addIcon(lat, lon, {
                html: markerHtml,
                className: 'temp-marker',
                iconAnchor: [15, 30]
            });

            popupDiv = document.createElement('div');
            popupDiv.className = 'custom-add-point-popup';
            let annoField = '';
            if (tipo === 'delitto' || tipo === 'collaterale') {
                annoField = `
                    <label for="popup-anno-punto" class="popup-label">Anno <span style='color:var(--color-danger)'>*</span></label>
                    <input type="number" class="popup-input" id="popup-anno-punto" placeholder="Anno" min="1800" max="2100" required style="margin-bottom: var(--sp-xs);" />
                `;
            } else {
                annoField = `
                    <label for="popup-anno-punto" class="popup-label">Anno</label>
                    <input type="number" class="popup-input" id="popup-anno-punto" placeholder="Anno (opzionale)" min="1800" max="2100" style="margin-bottom: var(--sp-xs);" />
                `;
            }
            
            popupDiv.innerHTML = `
                <div class="popup-title" style="font-size:1.1rem;font-weight:600;margin-bottom:var(--sp-sm);color:var(--color-primary)">Aggiungi punto</div>
                <label for="popup-nome-punto" class="popup-label">Nome <span style='color:var(--color-danger)'>*</span></label>
                <input type="text" class="popup-input" id="popup-nome-punto" placeholder="Nome del punto" autocomplete="off" required style="margin-bottom: var(--sp-xs);" />
                ${annoField}
                <label for="popup-fonte-punto" class="popup-label">Fonte</label>
                <input type="text" class="popup-input" id="popup-fonte-punto" placeholder="Fonte (opzionale)" autocomplete="off" style="margin-bottom: var(--sp-xs);" />
                <div class="popup-actions" style="display:flex;gap:var(--sp-md);margin-top:var(--sp-sm);justify-content:flex-end;">
                    <button class="btn btn-primary" id="popup-salva-punto">Salva</button>
                    <button class="btn btn-secondary" id="popup-annulla-punto">Annulla</button>
                </div>
            `;
            
            const markerLatLng = L.latLng(lat, lon);
            const markerPoint = this.map.latLngToContainerPoint(markerLatLng);
            popupDiv.style.position = 'absolute';
            popupDiv.style.left = `${markerPoint.x + 20}px`;
            popupDiv.style.top = `${markerPoint.y - 10}px`;
            popupDiv.style.zIndex = 3000;
            popupDiv.style.minWidth = '240px';
            popupDiv.style.background = 'var(--color-white)';
            popupDiv.style.boxShadow = 'var(--shadow-md)';
            popupDiv.style.borderRadius = 'var(--radius-md)';
            popupDiv.style.padding = 'var(--sp-lg)';
            popupDiv.style.display = 'flex';
            popupDiv.style.flexDirection = 'column';
            popupDiv.style.gap = 'var(--sp-xs)';

            mapContainer.appendChild(popupDiv);

            setTimeout(() => {
                const nomeInput = document.getElementById('popup-nome-punto');
                if (nomeInput) nomeInput.focus();
            }, 100);

            // Handler Salva
            popupDiv.querySelector('#popup-salva-punto').addEventListener('click', () => {
                const nome = MapElementsRenderer.escapeHtml(popupDiv.querySelector('#popup-nome-punto').value.trim());
                const fonte = popupDiv.querySelector('#popup-fonte-punto').value.trim();
                const annoVal = popupDiv.querySelector('#popup-anno-punto').value.trim();
                let year = annoVal ? parseInt(annoVal, 10) : null;
                
                if (!nome) {
                    popupDiv.querySelector('#popup-nome-punto').focus();
                    popupDiv.querySelector('#popup-nome-punto').style.borderColor = 'var(--color-danger)';
                    return;
                } else {
                    popupDiv.querySelector('#popup-nome-punto').style.borderColor = '';
                }
                
                if ((tipo === 'delitto' || tipo === 'collaterale')) {
                    if (!year || isNaN(year) || year < 1800 || year > 2100) {
                        popupDiv.querySelector('#popup-anno-punto').focus();
                        popupDiv.querySelector('#popup-anno-punto').style.borderColor = 'var(--color-danger)';
                        return;
                    } else {
                        popupDiv.querySelector('#popup-anno-punto').style.borderColor = '';
                    }
                }
                
                // Chiama il callback se è stato definito
                if (this.onPointAdded) {
                    this.onPointAdded({
                        tipo,
                        nome,
                        lat,
                        lon, 
                        fonte: fonte || null,
                        year
                    });
                }
                
                this._aggiungiPuntoCleanup();
                this._aggiungiPuntoCleanup = null;
            });
            
            // Handler Annulla
            popupDiv.querySelector('#popup-annulla-punto').addEventListener('click', () => {
                this._aggiungiPuntoCleanup();
                this._aggiungiPuntoCleanup = null;
            });
        });
    }

    attivaModalitaCoordinate() {
        if (this.clickHandler) {
            this.map.off('click', this.clickHandler);
            this.clickHandler = null;
            if (this.lastMarker) this.map.removeLayer(this.lastMarker);
            this.coordsDisplay.textContent = '';
            return;
        }
        this.clickHandler = (e) => {
            if (this.lastMarker) {
                this.map.removeLayer(this.lastMarker);
            }
            const coord = e.latlng;
            const utm = proj4('EPSG:4326', 'EPSG:32632', [coord.lng, coord.lat]);
            const coordText =
                `WGS84 (gradi):
            Lat: ${coord.lat.toFixed(6)}
            Lon: ${coord.lng.toFixed(6)}
            UTM 32N:
            E: ${utm[0].toFixed(2)}
            N: ${utm[1].toFixed(2)}`;
            this.coordsDisplay.textContent = coordText;
            this.lastMarker = L.marker(coord, {
                icon: L.divIcon({
                    className: 'coord-marker',
                    html: '<div class="coord-pin"></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 24]
                }),
                zIndexOffset: 1000
            })
                .bindPopup(coordText.replace(/\n/g, '<br>'))
                .addTo(this.map)
                .openPopup();
        };
        this.map.on('click', this.clickHandler);
    }

    attivaModalitaImportaKML() {
        this.disattivaHandlerAttivi();
        
        // Crea la finestra di dialogo per il caricamento KML
        const mapContainer = document.querySelector('.leaflet-container');
        const popupDiv = document.createElement('div');
        popupDiv.className = 'custom-kml-upload-popup';
        
        popupDiv.innerHTML = `
            <div class="popup-title" style="font-size:1.1rem;font-weight:600;margin-bottom:var(--sp-sm);color:var(--color-primary)">Carica file KML</div>
            <p style="margin-bottom:var(--sp-md);font-size:0.9rem;color:var(--color-gray-700)">Seleziona un file KML per importare i punti sulla mappa.</p>
            <input type="file" id="kml-file-input" accept=".kml" style="margin-bottom:var(--sp-md);" />
            <div class="popup-actions" style="display:flex;gap:var(--sp-md);margin-top:var(--sp-sm);justify-content:flex-end;">
                <button class="btn btn-primary" id="popup-carica-kml">Carica</button>
                <button class="btn btn-secondary" id="popup-annulla-kml">Annulla</button>
            </div>
        `;
        
        popupDiv.style.position = 'absolute';
        popupDiv.style.left = '50%';
        popupDiv.style.top = '50%';
        popupDiv.style.transform = 'translate(-50%, -50%)';
        popupDiv.style.zIndex = 3000;
        popupDiv.style.minWidth = '320px';
        popupDiv.style.background = 'var(--color-white)';
        popupDiv.style.boxShadow = 'var(--shadow-md)';
        popupDiv.style.borderRadius = 'var(--radius-md)';
        popupDiv.style.padding = 'var(--sp-lg)';
        popupDiv.style.display = 'flex';
        popupDiv.style.flexDirection = 'column';
        
        mapContainer.appendChild(popupDiv);
        
        // Funzione di pulizia
        const cleanup = () => {
            if (popupDiv && popupDiv.parentNode) {
                popupDiv.parentNode.removeChild(popupDiv);
            }
            this.disattivaHandlerAttivi();
        };
        
        // Handler Annulla
        popupDiv.querySelector('#popup-annulla-kml').addEventListener('click', cleanup);
        
        // Handler Carica
        popupDiv.querySelector('#popup-carica-kml').addEventListener('click', () => {
            const fileInput = document.getElementById('kml-file-input');
            if (fileInput.files.length === 0) {
                alert('Seleziona un file KML.');
                return;
            }
            
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const kmlContent = e.target.result;
                    const parser = new DOMParser();
                    const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
                    
                    // Estrai i punti dal file KML
                    const placemarks = kmlDoc.getElementsByTagName('Placemark');
                    const points = [];
                    
                    for (let i = 0; i < placemarks.length; i++) {
                        const placemark = placemarks[i];
                        const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Punto KML';
                        const point = placemark.getElementsByTagName('Point')[0];
                        
                        if (point) {
                            const coordinates = point.getElementsByTagName('coordinates')[0]?.textContent;
                            if (coordinates) {
                                const [lon, lat] = coordinates.trim().split(',').map(parseFloat);
                                if (!isNaN(lat) && !isNaN(lon)) {
                                    points.push({ name, lat, lon });
                                }
                            }
                        }
                    }
                    
                    if (points.length === 0) {
                        alert('Nessun punto trovato nel file KML.');
                        return;
                    }
                    
                    // Mostra il popup per la configurazione dei punti
                    this.mostraConfigurazioneKML(points, cleanup);
                    
                } catch (error) {
                    console.error('Errore nel parsing del file KML:', error);
                    alert('Errore nel parsing del file KML. Assicurati che il file sia valido.');
                }
            };
            
            reader.readAsText(file);
        });
    }
    
    mostraConfigurazioneKML(points, cleanupKmlUpload) {
        const mapContainer = document.querySelector('.leaflet-container');
        const popupDiv = document.createElement('div');
        popupDiv.className = 'custom-kml-config-popup';
        
        // Determine il caso attivo per selezionare gli ID gruppo corretti
        const casoAttivo = window.casoAttivo || 'mdf';
        const groupLabelsObj = casoAttivo === 'zodiac' ? window.zodiacGroupLabels : window.groupLabels;
        
        // Crea array di opzioni per gruppi
        const groupOptions = Object.entries(groupLabelsObj).map(([id, label]) => {
            // Per gruppo 0, mostra "Non specificato" ma mantieni l'etichetta originale intatta
            return { 
                id, 
                label: id === '0' ? 'Non specificato' : (label || `Gruppo ${id}`)
            };
        });
        
        popupDiv.innerHTML = `
            <div class="popup-title" style="font-size:1.1rem;font-weight:600;margin-bottom:var(--sp-sm);color:var(--color-primary)">
                Configura punti KML
            </div>
            <p style="margin-bottom:var(--sp-md);font-size:0.9rem;color:var(--color-gray-700)">
                Configura i ${points.length} punti trovati nel file KML.
            </p>
            <div class="kml-points-container" style="max-height:400px;overflow-y:auto;margin-bottom:var(--sp-md);">
                <table class="kml-points-table">
                    <thead>
                        <tr>
                            <th style="width:30px;"><input type="checkbox" id="select-all-points" checked></th>
                            <th>Nome</th>
                            <th>Anno</th>
                            <th>Gruppo</th>
                            <th>Fonte</th>
                            <th style="text-align:center;">
                                <div class="tipo-icons-header">
                                    <div class="tipo-icon" data-tipo="delitto" title="Delitto principale">${MapElementsRenderer.creaMarkerDelitto(false)}</div>
                                    <div class="tipo-icon" data-tipo="collaterale" title="Delitto collaterale">${MapElementsRenderer.creaMarkerDelitto(true)}</div>
                                    <div class="tipo-icon" data-tipo="poi" title="Punto di interesse">${MapElementsRenderer.creaMarkerPuntoInteresse()}</div>
                                    <div class="tipo-icon" data-tipo="abitazioneVittima" title="Abitazione vittima">${MapElementsRenderer.creaMarkerAbitazioneVittima()}</div>
                                    <div class="tipo-icon" data-tipo="abitazioneSospettato" title="Abitazione sospettato">${MapElementsRenderer.creaMarkerAbitazioneSospettato()}</div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${points.map((point, index) => `
                            <tr class="kml-point-row" data-index="${index}">
                                <td><input type="checkbox" class="punto-selezionato" checked></td>
                                <td><input type="text" class="popup-input punto-nome" value="${MapElementsRenderer.escapeHtml(point.name)}"></td>
                                <td><input type="number" class="popup-input punto-anno" placeholder="Anno" min="1800" max="2100"></td>
                                <td>
                                    <select class="popup-input punto-gruppo">
                                        ${groupOptions.map(group => 
                                            `<option value="${group.id}">${group.label}</option>`
                                        ).join('')}
                                    </select>
                                </td>
                                <td><input type="text" class="popup-input punto-fonte" placeholder="URL fonte"></td>
                                <td style="text-align:center;">
                                    <div class="tipo-selector">
                                        ${['delitto', 'collaterale', 'poi', 'abitazioneVittima', 'abitazioneSospettato'].map(tipo => `
                                            <label class="tipo-radio-label" title="${tipo === 'delitto' ? 'Delitto principale' : 
                                                tipo === 'collaterale' ? 'Delitto collaterale' : 
                                                tipo === 'poi' ? 'Punto di interesse' : 
                                                tipo === 'abitazioneVittima' ? 'Abitazione vittima' : 'Abitazione sospettato'}">
                                                <input type="radio" name="tipo-${index}" class="punto-tipo" value="${tipo}" ${tipo === 'poi' ? 'checked' : ''}>
                                                <span class="tipo-radio-icon"></span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="popup-actions" style="display:flex;gap:var(--sp-md);margin-top:var(--sp-sm);justify-content:flex-end;">
                <button class="btn btn-primary" id="popup-salva-kml-punti">Salva punti selezionati</button>
                <button class="btn btn-secondary" id="popup-annulla-kml-punti">Annulla</button>
            </div>
        `;
        
        popupDiv.style.position = 'absolute';
        popupDiv.style.left = '50%';
        popupDiv.style.top = '50%';
        popupDiv.style.transform = 'translate(-50%, -50%)';
        popupDiv.style.zIndex = 3000;
        popupDiv.style.width = '800px';
        popupDiv.style.maxWidth = '95vw';
        popupDiv.style.maxHeight = '90vh';
        popupDiv.style.background = 'var(--color-white)';
        popupDiv.style.boxShadow = 'var(--shadow-md)';
        popupDiv.style.borderRadius = 'var(--radius-md)';
        popupDiv.style.padding = 'var(--sp-lg)';
        popupDiv.style.display = 'flex';
        popupDiv.style.flexDirection = 'column';
        popupDiv.style.overflow = 'hidden';
        
        mapContainer.appendChild(popupDiv);
        
        // Funzione di pulizia
        const cleanup = () => {
            if (cleanupKmlUpload) cleanupKmlUpload();
            if (popupDiv && popupDiv.parentNode) {
                popupDiv.parentNode.removeChild(popupDiv);
            }
            this.disattivaHandlerAttivi();
        };
        
        // Seleziona/deseleziona tutti i punti
        const selectAllCheckbox = popupDiv.querySelector('#select-all-points');
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = popupDiv.querySelectorAll('.punto-selezionato');
            checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        });
        
        // Resetta la selezione "Seleziona tutti" se un checkbox viene deselezionato
        popupDiv.querySelectorAll('.punto-selezionato').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(popupDiv.querySelectorAll('.punto-selezionato')).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            });
        });
        
        // Gestisci clic sulla intestazione delle icone
        popupDiv.querySelectorAll('.tipo-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const tipo = icon.getAttribute('data-tipo');
                const checked = popupDiv.querySelectorAll('.punto-selezionato:checked');
                
                checked.forEach(checkbox => {
                    const row = checkbox.closest('.kml-point-row');
                    const radio = row.querySelector(`.punto-tipo[value="${tipo}"]`);
                    if (radio) radio.checked = true;
                });
            });
        });
        
        // Handler Annulla
        popupDiv.querySelector('#popup-annulla-kml-punti').addEventListener('click', cleanup);
        
        // Handler Salva
        popupDiv.querySelector('#popup-salva-kml-punti').addEventListener('click', () => {
            const rows = popupDiv.querySelectorAll('.kml-point-row');
            const puntiConfigurati = [];
            let errori = false;
            let duplicatiSaltati = 0;
            
            rows.forEach(row => {
                row.classList.remove('error'); // Rimuovi errori precedenti
                const isSelected = row.querySelector('.punto-selezionato').checked;
                if (!isSelected) return;
                
                const index = parseInt(row.getAttribute('data-index'));
                const nome = row.querySelector('.punto-nome').value.trim();
                const anno = row.querySelector('.punto-anno').value;
                const gruppo = row.querySelector('.punto-gruppo').value;
                const fonte = row.querySelector('.punto-fonte').value.trim();
                const tipoEl = row.querySelector('.punto-tipo:checked');
                const tipo = tipoEl ? tipoEl.value : 'poi'; // Default a 'poi' se non selezionato
                
                // Verifica se nome è compilato
                if (!nome) {
                    errori = true;
                    row.classList.add('error');
                    return;
                }
                
                // Verifica se anno è compilato per i delitti
                if ((tipo === 'delitto' || tipo === 'collaterale') && !anno) {
                    errori = true;
                    row.classList.add('error');
                    return;
                }
                
                const point = points[index]; // Contiene lat/lon originali

                // Controllo duplicati prima di aggiungere
                if (this.isDuplicatePoint && this.isDuplicatePoint(point.lat, point.lon)) {
                    duplicatiSaltati++;
                    // Fornisce un feedback visivo sulla riga, ma non blocca il salvataggio degli altri punti
                    row.classList.add('warning-duplicate'); 
                    // Potremmo voler informare l'utente in modo più aggregato alla fine,
                    // invece di un alert per ogni duplicato.
                    // Per ora, continuiamo senza alert individuale qui per non interrompere il flusso.
                    return; // Salta questo punto duplicato
                }
                
                puntiConfigurati.push({
                    nome,
                    year: anno ? parseInt(anno) : null,
                    groupId: gruppo ? parseInt(gruppo) : null, // Assicurati che il gruppo sia gestito correttamente
                    tipo,
                    lat: point.lat,
                    lon: point.lon,
                    fonte: fonte || "Importato da KML"
                });
            });
            
            if (errori) {
                alert('Completa tutti i campi obbligatori per i punti selezionati (marcati in rosso).');
                return;
            }
            
            if (puntiConfigurati.length === 0 && duplicatiSaltati === 0) {
                alert('Seleziona almeno un punto valido da importare.');
                return;
            }
            if (puntiConfigurati.length === 0 && duplicatiSaltati > 0) {
                alert(`Nessun nuovo punto da importare. ${duplicatiSaltati} punt${duplicatiSaltati === 1 ? 'o era' : 'i erano'} duplicat${duplicatiSaltati === 1 ? 'o' : 'i'} e ${duplicatiSaltati === 1 ? 'è stato saltato' : 'sono stati saltati'}.`);
                return;
            }
            
            // Aggiungi tutti i punti non duplicati e validi
            puntiConfigurati.forEach(punto => {
                if (this.onPointAdded) { // Assicurati che onPointAdded sia definito
                    this.onPointAdded(punto);
                }
            });
            
            cleanup(); // Chiude il popup di configurazione KML
            
            let messaggioConferma = `${puntiConfigurati.length} punt${puntiConfigurati.length === 1 ? 'o importato' : 'i importati'} con successo.`;
            if (duplicatiSaltati > 0) {
                messaggioConferma += `\n${duplicatiSaltati} punt${duplicatiSaltati === 1 ? 'o era' : 'i erano'} duplicat${duplicatiSaltati === 1 ? 'o' : 'i'} e ${duplicatiSaltati === 1 ? 'è stato saltato' : 'sono stati saltati'}.`;
            }
            alert(messaggioConferma);
        });
    }

    inizializzaStrumentiDisegno() {
        const drawControlContainer = document.createElement('div');
        drawControlContainer.className = 'map-tools-container';
        
        this.pannelliContainer.appendChild(drawControlContainer);

        const toolsGroup = document.createElement('div');
        toolsGroup.className = 'map-tools-group';
        drawControlContainer.appendChild(toolsGroup);

        const tools = [
            { id: 'measure', label: 'Misura Distanza', icon: 'straighten', action: () => this.attivaMisuraDistanza() },
            { id: 'draw-line', label: 'Disegna Linea', icon: 'timeline', action: () => this.attivaDisegnoLinea() },
            { id: 'draw-polygon', label: 'Disegna Area', icon: 'category', action: () => this.attivaDisegnoPoligono() },
            { id: 'add-point', label: 'Aggiungi punto', icon: 'add_location_alt', action: () => this.toggleAggiungiPuntoUI() },
            { id: 'clear-draw', label: 'Cancella Disegni', icon: 'layers_clear', action: () => this.clearCustomLayers() }
        ];

        tools.forEach(tool => {
            const button = document.createElement('button');
            button.className = 'map-tool-btn';
            button.id = `tool-${tool.id}`;
            button.setAttribute('title', tool.label);
            button.innerHTML = `<span class="material-icons">${tool.icon}</span>`;
            button.addEventListener('click', () => {
                if (button.classList.contains('active') && tool.id !== 'clear-draw') {
                    button.classList.remove('active');
                    this.disattivaHandlerAttivi();
                    if (tool.id === 'add-point') this.hideAggiungiPuntoUI();
                    return;
                }
                
                document.querySelectorAll('.map-tool-btn').forEach(btn => btn.classList.remove('active'));

                if (tool.id !== 'clear-draw') {
                    button.classList.add('active');
                }
                tool.action();
            });
            toolsGroup.appendChild(button);
        });

         // UI espansa per selezione tipo punto
        this.aggiungiPuntoTypeBar = document.createElement('div');
        this.aggiungiPuntoTypeBar.className = 'aggiungi-punto-type-bar floating-type-bar';
        this.aggiungiPuntoTypeBar.style.display = 'none';
        this.aggiungiPuntoTypeBar.innerHTML = `
            <button class="map-tool-btn aggiungi-punto-type-btn" data-type="delitto" title="Delitto principale">${MapElementsRenderer.creaMarkerDelitto(false)}</button>
            <button class="map-tool-btn aggiungi-punto-type-btn" data-type="collaterale" title="Delitto collaterale">${MapElementsRenderer.creaMarkerDelitto(true)}</button>
            <button class="map-tool-btn aggiungi-punto-type-btn" data-type="poi" title="Punto di interesse">${MapElementsRenderer.creaMarkerPuntoInteresse()}</button>
            <button class="map-tool-btn aggiungi-punto-type-btn" data-type="abitazioneVittima" title="Abitazione vittima">${MapElementsRenderer.creaMarkerAbitazioneVittima()}</button>
            <button class="map-tool-btn aggiungi-punto-type-btn" data-type="abitazioneSospettato" title="Abitazione sospettato">${MapElementsRenderer.creaMarkerAbitazioneSospettato()}</button>
            <button class="map-tool-btn aggiungi-punto-type-btn" data-type="kml" title="Carica KML"><span class="material-icons">upload_file</span></button>
            <button class="map-tool-btn aggiungi-punto-type-btn" data-type="delete-user-points" title="Cancella Punti Utente"><span class="material-icons">delete_forever</span></button>
        `;
        drawControlContainer.appendChild(this.aggiungiPuntoTypeBar);

        // Handler selezione tipo punto
        this.aggiungiPuntoTypeBar.addEventListener('click', (e) => {
            const btn = e.target.closest('.aggiungi-punto-type-btn');
            if (!btn) return;
            const tipo = btn.getAttribute('data-type');
            this.onAggiungiPuntoTypeSelected && this.onAggiungiPuntoTypeSelected(tipo);
        });

        this.drawLayer = new L.FeatureGroup().addTo(this.map);
        this.measureLayer = new L.FeatureGroup().addTo(this.map);
    }

    attivaMisuraDistanza() {
        this.disattivaHandlerAttivi();
        this.isDrawingMode = true;
        this.aggiornaInterattivitaMarker();

        let points = [];
        let polyline = null;
        let markers = [];
        let tooltips = [];
        let lineaTemporanea = null;

        const aggiornaMisura = () => {
            if (polyline) {
                this.measureLayer.removeLayer(polyline);
            }

            polyline = L.polyline(points, {
                color: '#e74c3c',
                weight: 3,
                dashArray: '5, 5',
                opacity: 0.7
            }).addTo(this.measureLayer);

            let distanzaTotale = 0;
            for (let i = 1; i < points.length; i++) {
                const segmentDistance = this.map.distance(points[i - 1], points[i]);
                distanzaTotale += segmentDistance;

                const midPoint = L.latLng(
                    (points[i - 1].lat + points[i].lat) / 2,
                    (points[i - 1].lng + points[i].lng) / 2
                );

                const tooltip = L.tooltip({
                    permanent: true,
                    direction: 'top',
                    className: 'measure-tooltip'
                })
                    .setLatLng(midPoint)
                    .setContent(this.formattaDistanza(segmentDistance))
                    .addTo(this.measureLayer);

                tooltips.push(tooltip);
            }

            if (points.length > 2) {
                const lastPoint = points[points.length - 1];
                const totalTooltip = L.tooltip({
                    permanent: true,
                    direction: 'right',
                    className: 'measure-tooltip-total'
                })
                    .setLatLng(lastPoint)
                    .setContent(`Totale: ${this.formattaDistanza(distanzaTotale)}`)
                    .addTo(this.measureLayer);

                tooltips.push(totalTooltip);
            }
        };

        this.measureMouseMoveHandler = (e) => {
            if (points.length > 0) {
                if (lineaTemporanea) {
                    this.measureLayer.removeLayer(lineaTemporanea);
                }
                // Crea una linea temporanea dall'ultimo punto alla posizione attuale del mouse
                lineaTemporanea = L.polyline([
                    points[points.length - 1],
                    e.latlng
                ], {
                    color: '#e74c3c',
                    weight: 2,
                    dashArray: '3, 6',
                    opacity: 0.5
                }).addTo(this.measureLayer);
            }
        };

        this.measureClickHandler = (e) => {
            if (e.originalEvent.target.closest('.map-tools-container') ||
                e.originalEvent.target.closest('.map-selector') ||
                e.originalEvent.target.closest('.leaflet-control')) {
                return;
            }

            const point = e.latlng;
            points.push(point);

            const marker = L.marker(point, {
                icon: L.divIcon({
                    className: 'measure-point',
                    html: '<div class="measure-point-icon"></div>',
                    iconSize: [10, 10],
                    iconAnchor: [5, 5]
                })
            }).addTo(this.measureLayer);

            markers.push(marker);

            if (points.length > 1) {
                aggiornaMisura();
            }
        };

        // Handler per il click destro sulla mappa (per terminare la misura corrente senza uscire dalla modalità)
        this.measureRightClickHandler = (e) => {
            L.DomEvent.preventDefault(e);
            
            if (lineaTemporanea) {
                this.measureLayer.removeLayer(lineaTemporanea);
                lineaTemporanea = null;
            }            
            points = [];
            markers = [];
            polyline = null;
            tooltips = [];
        };

        this.map.on('click', this.measureClickHandler);
        this.map.on('contextmenu', this.measureRightClickHandler);
        this.map.on('mousemove', this.measureMouseMoveHandler);
        this.mostraMessaggioIstruzioni('Clicca sulla mappa per aggiungere punti di misurazione. Tasto destro per terminare la misura corrente.');
    }

    attivaDisegnoLinea() {
        this.disattivaHandlerAttivi();
        this.isDrawingMode = true;
        this.aggiornaInterattivitaMarker();

        let points = [];
        let line = null;
        let lineaTemporanea = null;

        this.drawLineMouseMoveHandler = (e) => {
            if (points.length > 0) {
                if (lineaTemporanea) {
                    this.drawLayer.removeLayer(lineaTemporanea);
                }

                lineaTemporanea = L.polyline([
                    points[points.length - 1],
                    e.latlng
                ], {
                    color: '#3498db',
                    weight: 2,
                    dashArray: '3, 6',
                    opacity: 0.5
                }).addTo(this.drawLayer);
            }
        };

        this.drawLineHandler = (e) => {
            if (e.originalEvent.target.closest('.map-tools-container') ||
                e.originalEvent.target.closest('.map-selector') ||
                e.originalEvent.target.closest('.leaflet-control')) {
                return;
            }

            const point = e.latlng;
            points.push(point);

            if (points.length === 1) {
                L.marker(point, {
                    icon: L.divIcon({
                        className: 'draw-point',
                        html: '<div class="draw-point-icon"></div>',
                        iconSize: [8, 8],
                        iconAnchor: [4, 4]
                    })
                }).addTo(this.drawLayer);
            }

            if (points.length >= 2) {
                if (line) {
                    this.drawLayer.removeLayer(line);
                }

                line = L.polyline(points, {
                    color: '#3498db',
                    weight: 3,
                    opacity: 0.8
                }).addTo(this.drawLayer);

                L.marker(point, {
                    icon: L.divIcon({
                        className: 'draw-point',
                        html: '<div class="draw-point-icon"></div>',
                        iconSize: [8, 8],
                        iconAnchor: [4, 4]
                    })
                }).addTo(this.drawLayer);
            }
        };

        this.drawLineRightClickHandler = (e) => {
            L.DomEvent.preventDefault(e);

            if (points.length >= 2) {
                if (lineaTemporanea) {
                    this.drawLayer.removeLayer(lineaTemporanea);
                    lineaTemporanea = null;
                }
                
                points = [];
                line = null;
            }
        };

        this.map.on('click', this.drawLineHandler);
        this.map.on('contextmenu', this.drawLineRightClickHandler);
        this.map.on('mousemove', this.drawLineMouseMoveHandler);

        this.mostraMessaggioIstruzioni('Clicca sulla mappa per disegnare una linea. Tasto destro per terminare la linea e iniziarne una nuova.');
    }

    attivaDisegnoPoligono() {
        this.disattivaHandlerAttivi();
        this.isDrawingMode = true;
        this.aggiornaInterattivitaMarker();

        // Selettori di elementi UI interattivi da ignorare ai click di disegno poligono
        const selettoriIgnoraClick = [
            '.map-tool-btn',       // pulsanti strumenti
            '.map-selector-option', // opzioni selettore
            '.leaflet-control',     // controlli Leaflet
            '.map-legend',          // legenda
            '.map-instruction-message' // messaggi istruzioni
        ];

        let points = [];            // Tutti i punti inseriti
        let polygon = null;         // Riferimento al poligono visualizzato
        let lineaTemporanea = null; // Linea che segue il mouse
        let hullPoligono = null;    // Anteprima del poligono durante il movimento
        let markers = [];           
        let tooltipArea = null;     // Tooltip che mostra l'area
        let puntiHull = [];         // Punti che formano il convex hull

        const EPSILON = 1e-10;

        const puntiUguali = (p1, p2) => {
            return Math.abs(p1.lat - p2.lat) < EPSILON &&
                Math.abs(p1.lng - p2.lng) < EPSILON;
        };

        const prodottoVettoriale = (p1, p2, p3) => {
            return (p2.lng - p1.lng) * (p3.lat - p1.lat) -
                (p2.lat - p1.lat) * (p3.lng - p1.lng);
        };

        const calcolaConvexHull = (puntiOriginali) => {
            if (puntiOriginali.length < 3) return puntiOriginali;
        
            const punti = [...puntiOriginali].sort((a, b) => 
                a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat
            );
        
            // Algoritmo di Andrew's monotone chain
            const lower = [];
            for (const p of punti) {
                while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
                    lower.pop();
                }
                lower.push(p);
            }
        
            const upper = [];
            for (const p of punti.reverse()) {
                while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
                    upper.pop();
                }
                upper.push(p);
            }
        
            return [...lower.slice(0, -1), ...upper.slice(0, -1)];
        };
        const cross = (o, a, b) => {
            return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
        };
        
        const puntoInternoAHull = (punto, hull) => {
            if (hull.length < 3) return false;

            // Punto esattamente uguale a uno dei vertici
            if (hull.some(p => puntiUguali(p, punto))) {
                return true;
            }

            for (let i = 0; i < hull.length; i++) {
                const nextIndex = (i + 1) % hull.length;
                if (prodottoVettoriale(hull[i], hull[nextIndex], punto) < -EPSILON) {
                    return false;
                }
            }
            return true;
        };
        
        const aggiornaStileMarker = (hull) => {
            if (hull.length < 3 || points.length === 0) return;

            for (let i = 0; i < points.length; i++) {
                const punto = points[i];
                const marker = markers[i];

                const element = marker.getElement();
                if (element) {
                    const isVertice = hull.some(p => puntiUguali(p, punto));

                    const isInterno = !isVertice && puntoInternoAHull(punto, hull);

                    const iconElement = element.querySelector('.draw-point-icon');
                    if (iconElement) {
                        if (isVertice) {
                            // Marker di un vertice: colore principale, pieno
                            iconElement.style.backgroundColor = '#2ecc71';
                            iconElement.style.border = '1px solid #27ae60';
                            iconElement.style.opacity = '1';
                        } else if (isInterno) {
                            // Marker interno: colore più chiaro
                            iconElement.style.backgroundColor = 'rgba(46, 204, 113, 0.3)';
                            iconElement.style.border = '1px solid rgba(39, 174, 96, 0.3)';
                            iconElement.style.opacity = '0.5';
                        } else {
                            // Marker esterno: colore normale
                            iconElement.style.backgroundColor = '#2ecc71';
                            iconElement.style.border = '1px solid #27ae60';
                            iconElement.style.opacity = '0.8';
                        }
                    }
                }
            }
        };

        const aggiornaPoligono = (finale = false, forzaAggiornamento = false) => {
            // Gestione casi particolari
            if (points.length < 3 && !forzaAggiornamento) {

                if (points.length === 2) {
                    if (polygon) {
                        this.drawLayer.removeLayer(polygon);
                        polygon = null;
                    }
                    if (tooltipArea) {
                        this.drawLayer.removeLayer(tooltipArea);
                        tooltipArea = null;
                    }
                    const line = L.polyline(points, {
                        color: '#2ecc71',
                        weight: 2,
                        opacity: 0.8
                    }).addTo(this.drawLayer);

                    polygon = line;
                }
                return;
            }

            if (polygon) {
                this.drawLayer.removeLayer(polygon);
                polygon = null;
            }
            const hull = calcolaConvexHull(points);

            if (hull.length < 3) {
                puntiHull = hull;
                return;
            }
            puntiHull = hull;

            polygon = L.polygon(hull, {
                color: '#2ecc71',
                weight: finale ? 3 : 2,
                fillOpacity: finale ? 0.2 : 0.1,
                dashArray: finale ? null : '3, 6'
            }).addTo(this.drawLayer);

            // Calcola e mostra l'area
            let area;
            try {
                if (typeof L.GeometryUtil !== 'undefined' && typeof L.GeometryUtil.geodesicArea === 'function') {
                    area = L.GeometryUtil.geodesicArea(hull);
                } else {
                    area = this.calcolaAreaPoligono(hull);
                }
            } catch (error) {
                area = this.calcolaAreaPoligono(hull);
            }

            const areaText = this.formattaArea(area);
            const centroide = polygon.getBounds().getCenter();

            if (tooltipArea) {
                this.drawLayer.removeLayer(tooltipArea);
            }

            tooltipArea = L.tooltip({
                permanent: true,
                direction: 'center',
                className: 'area-tooltip'
            })
                .setLatLng(centroide)
                .setContent(`Area: ${areaText}`)
                .addTo(this.drawLayer);

            aggiornaStileMarker(hull);

            return hull;
        };

        const puntoTroppoVicino = (punto, threshold = 1e-6) => {
            return points.some(p => {
                const dist = Math.hypot(p.lat - punto.lat, p.lng - punto.lng);
                return dist < threshold;
            });
        };

        this.drawPolygonMouseMoveHandler = (e) => {
            if (points.length === 0) return;

            if (hullPoligono) {
                this.drawLayer.removeLayer(hullPoligono);
                hullPoligono = null;
            }

            if (lineaTemporanea) {
                this.drawLayer.removeLayer(lineaTemporanea);
                lineaTemporanea = null;
            }

            if (points.length === 1) {
                lineaTemporanea = L.polyline([
                    points[0],
                    e.latlng
                ], {
                    color: '#2ecc71',
                    weight: 2,
                    dashArray: '3, 6',
                    opacity: 0.5
                }).addTo(this.drawLayer);
                return;
            }

            // Se ci sono almeno 2 punti, mostra un'anteprima del convex hull
            if (points.length >= 2) {
                const puntiConMouse = [...points, e.latlng];
                const hull = calcolaConvexHull(puntiConMouse);

                // Crea poligono temporaneo
                if (hull.length >= 3) {
                    hullPoligono = L.polygon(hull, {
                        color: '#2ecc71',
                        weight: 2,
                        fillOpacity: 0.1,
                        dashArray: '3, 6'
                    }).addTo(this.drawLayer);
                } else if (hull.length === 2) {
                    lineaTemporanea = L.polyline(hull, {
                        color: '#2ecc71',
                        weight: 2,
                        dashArray: '3, 6',
                        opacity: 0.5
                    }).addTo(this.drawLayer);
                }
            }
        };

        this.drawPolygonHandler = (e) => {
            if (selettoriIgnoraClick.some(sel => e.originalEvent.target.closest(sel))) {
                return;
            }
            const point = e.latlng;
            if (puntoTroppoVicino(point, 1e-6)) {
                return;
            }
            points.push(point);
            const marker = L.marker(point, {
                icon: L.divIcon({
                    className: 'draw-point',
                    html: '<div class="draw-point-icon"></div>',
                    iconSize: [8, 8],
                    iconAnchor: [4, 4]
                })
            }).addTo(this.drawLayer);

            markers.push(marker);
            aggiornaPoligono(false, true);
        };

        this.drawPolygonRightClickHandler = (e) => {
            L.DomEvent.preventDefault(e);

            if (points.length >= 3) {
                aggiornaPoligono(true);
                
                if (lineaTemporanea) {
                    this.drawLayer.removeLayer(lineaTemporanea);
                    lineaTemporanea = null;
                }                
                if (hullPoligono) {
                    this.drawLayer.removeLayer(hullPoligono);
                    hullPoligono = null;
                }
                
                points = [];
                markers = [];
                polygon = null;
                tooltipArea = null;
                puntiHull = [];
            }
        };

        this.map.on('click', this.drawPolygonHandler);
        this.map.on('contextmenu', this.drawPolygonRightClickHandler);
        this.map.on('mousemove', this.drawPolygonMouseMoveHandler);
        this.mostraMessaggioIstruzioni('Clicca sulla mappa per aggiungere punti al poligono. Tasto destro per terminare il poligono corrente e iniziarne uno nuovo.');
    }

    clearCustomLayers() {
        // Pulisce tutti i layer di disegno e misurazione
        if (this.drawLayer) {
            this.drawLayer.clearLayers();
        }
        if (this.measureLayer) {
            this.measureLayer.clearLayers();
        }

        this.disattivaHandlerAttivi();
        this.isDrawingMode = false;
        this.aggiornaInterattivitaMarker();
        document.querySelectorAll('.map-tool-btn').forEach(btn => btn.classList.remove('active'));
    }

    disattivaHandlerAttivi() {
        this.isDrawingMode = false;
        this.aggiornaInterattivitaMarker();
        if (this.measureClickHandler) {
            this.map.off('click', this.measureClickHandler);
            this.measureClickHandler = null;
        }

        if (this.measureRightClickHandler) {
            this.map.off('contextmenu', this.measureRightClickHandler);
            this.measureRightClickHandler = null;
        }

        if (this.measureMouseMoveHandler) {
            this.map.off('mousemove', this.measureMouseMoveHandler);
            this.measureMouseMoveHandler = null;
        }

        if (this.drawLineHandler) {
            this.map.off('click', this.drawLineHandler);
            this.drawLineHandler = null;
        }

        if (this.drawLineCompleteHandler) {
            this.map.off('dblclick', this.drawLineCompleteHandler);
            this.drawLineCompleteHandler = null;
        }

        if (this.drawLineRightClickHandler) {
            this.map.off('contextmenu', this.drawLineRightClickHandler);
            this.drawLineRightClickHandler = null;
        }

        if (this.drawLineMouseMoveHandler) {
            this.map.off('mousemove', this.drawLineMouseMoveHandler);
            this.drawLineMouseMoveHandler = null;
        }

        if (this.drawPolygonHandler) {
            this.map.off('click', this.drawPolygonHandler);
            this.drawPolygonHandler = null;
        }

        if (this.drawPolygonCompleteHandler) {
            this.map.off('dblclick', this.drawPolygonCompleteHandler);
            this.drawPolygonCompleteHandler = null;
        }

        if (this.drawPolygonRightClickHandler) {
            this.map.off('contextmenu', this.drawPolygonRightClickHandler);
            this.drawPolygonRightClickHandler = null;
        }

        if (this.drawPolygonMouseMoveHandler) {
            this.map.off('mousemove', this.drawPolygonMouseMoveHandler);
            this.drawPolygonMouseMoveHandler = null;
        }

        this.rimuoviMessaggioIstruzioni();
    }

    mostraMessaggioIstruzioni(messaggio) {
        this.rimuoviMessaggioIstruzioni();

        const msgContainer = document.createElement('div');
        msgContainer.className = 'map-instruction-message';
        msgContainer.textContent = messaggio;
        msgContainer.id = 'map-instruction';

        document.getElementById('map').appendChild(msgContainer);

        setTimeout(() => {
            msgContainer.classList.add('visible');
        }, 10);
    }

    rimuoviMessaggioIstruzioni() {
        const msgElement = document.getElementById('map-instruction');
        if (msgElement) {
            msgElement.classList.remove('visible');
            setTimeout(() => {
                msgElement.remove();
            }, 300);
        }
    }

    formattaDistanza(distanzaMetri) {
        if (distanzaMetri < 1000) {
            return `${Math.round(distanzaMetri)} m`;
        } else {
            return `${(distanzaMetri / 1000).toFixed(2)} km`;
        }
    }

    formattaArea(areaMetri) {
        if (areaMetri < 10000) {
            return `${Math.round(areaMetri)} m²`;
        } else {
            return `${(areaMetri / 1000000).toFixed(2)} km²`;
        }
    }

    aggiornaInterattivitaMarker() {
        this.markers.forEach(marker => {
            // Verifica che il marker abbia un elemento DOM
            if (marker && marker.getElement) {
                const element = marker.getElement();
                if (element) {
                    if (this.isDrawingMode) {
                        element.style.pointerEvents = 'none';
                        element.style.cursor = 'default';
                    } else {
                        element.style.pointerEvents = 'auto';
                        element.style.cursor = 'pointer';
                    }
                }
            }
        });
        
        this.layers.forEach(layer => {
            if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                if (this.isDrawingMode) {
                    layer.options.interactive = false;
                } else {
                    layer.options.interactive = true;
                }
            }
        });
    }

    // Metodo alternativo per calcolare l'area di un poligono
    calcolaAreaPoligono(points) {
        let area = 0;

        if (points.length < 3) {
            return 0;
        }

        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].lat * points[j].lng;
            area -= points[j].lat * points[i].lng;
        }

        area = Math.abs(area) / 2;

        const latMedia = points.reduce((sum, p) => sum + p.lat, 0) / points.length;

        // Conversione approssimativa in metri quadrati
        // La distanza tra due gradi di latitudine è circa 111.32 km (costante)
        // La distanza tra due gradi di longitudine dipende dalla latitudine: 111.32 * cos(lat) km
        const metrPerLatDegree = 111320; // 111.32 km in metri
        const metrPerLngDegree = 111320 * Math.cos(latMedia * Math.PI / 180);
        return area * metrPerLatDegree * metrPerLngDegree;
    }

    removeMarker(marker) {
        if (!marker) return;
        this.map.removeLayer(marker);
        const layerIndex = this.layers.indexOf(marker);
        if (layerIndex !== -1) {
            this.layers.splice(layerIndex, 1);
        }
        const markerIndex = this.markers.indexOf(marker);
        if (markerIndex !== -1) {
            this.markers.splice(markerIndex, 1);
        }
    }

    onceClick(callback) {
        if (this.singleClickHandler) {
            this.map.off('click', this.singleClickHandler);
            this.singleClickHandler = null;
        }
        
        this.singleClickHandler = (e) => {
            if (e.originalEvent.target.closest('.map-tools-container') ||
                e.originalEvent.target.closest('.map-selector') ||
                e.originalEvent.target.closest('.leaflet-control')) {
                return;
            }            
            this.map.off('click', this.singleClickHandler);
            this.singleClickHandler = null;
            
            callback(e);
        };        
        this.map.on('click', this.singleClickHandler);
    }

    toggleAggiungiPuntoUI() {
        if (this.aggiungiPuntoTypeBar.style.display === 'none') {
            this.aggiungiPuntoTypeBar.style.display = 'flex';
        } else {
            this.hideAggiungiPuntoUI();
        }
    }

    hideAggiungiPuntoUI() {
        this.aggiungiPuntoTypeBar.style.display = 'none';
        this.rimuoviMessaggioIstruzioni();
    }
    
    resetUserPoints() {
        if (window.confirm("Sei sicuro di voler cancellare tutti i punti utente salvati?\nQuesta azione non può essere annullata.")) {
            const geoApp = window.geoAnalysisApp;
            if (geoApp && typeof geoApp.resetPuntiUtente === 'function') {
                geoApp.resetPuntiUtente();
            }
        }
    }
}

function edit_file(geoAnalysis_js) {
  const geoAnalysisSenzaGetColori = geoAnalysis_js.replace(/function getColoriAnalisi\(\) \{[\s\S]*?return \{ \.\.\.coloriPredefiniti, \.\.\.coloriSalvati \};[\s\S]*?\}/, "");  
  return geoAnalysisSenzaGetColori;
}
