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
        // Salva la preferenza di mappa
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
        const defaults = {
            color: '#3388ff',
            weight: 3,
            opacity: 0.5,
            fillOpacity: 0.2
        };
        const settings = { ...defaults, ...options };
        
        const polygon = L.polygon(latlngs, settings).addTo(this.map);
        
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
    }

    abilitaCoordinateButton() {
        const btn = document.getElementById('get-coords-btn');
        if (btn) {
            btn.addEventListener('click', () => this.attivaModalitaCoordinate());
        }
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
}

function edit_file(geoAnalysis_js) {
  const geoAnalysisSenzaGetColori = geoAnalysis_js.replace(/function getColoriAnalisi\(\) \{[\s\S]*?return \{ \.\.\.coloriPredefiniti, \.\.\.coloriSalvati \};[\s\S]*?\}/, "");  
  return geoAnalysisSenzaGetColori;
}
