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
            preferCanvas: false
        }).setView([43.78, 11.2], 11); // Centrato su Firenza

        this.svgRenderer = L.svg().addTo(this.map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        this.layers = [];
        this.clickHandler = null;
        this.lastMarker = null;
        this.coordsDisplay = document.getElementById('coords-display');
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
        if (options.popup) {
            marker.bindPopup(options.popup);
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
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
        });
        const marker = L.marker([lat, lon], { icon });
        if (options.popup) {
            marker.bindPopup(options.popup);
        }
        if (options.tooltip) {
            marker.bindTooltip(options.tooltip, {
                permanent: options.permanentTooltip,
                direction: 'top',
                className: options.className || '',
                opacity: 0.9
            });
        }
        marker.addTo(this.map);
        this.layers.push(marker);
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
            radius: isNaN(radius) ? 0 : radius,
            renderer: this.svgRenderer
        }).addTo(this.map);
        if (settings.popup) {
            circle.bindPopup(settings.popup);
        }
        this.layers.push(circle);
        return circle;
    }

    addPolygon(latlngs, options = {}) {
        const polygon = L.polygon(latlngs, {
            color: options.color || 'black',
            weight: options.weight || 2,
            fillColor: options.fillColor || '#000',
            fillOpacity: options.fillOpacity || 0.1,
        });
        if (options.popup) {
            polygon.bindPopup(options.popup);
        }
        polygon.addTo(this.map);
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
}
