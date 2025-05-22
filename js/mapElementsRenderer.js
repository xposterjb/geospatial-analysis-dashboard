/**
 * mapElementsRenderer.js
 * 
 * Libreria di funzioni per generare elementi HTML e configurazioni di stile
 * per i vari tipi di segnalini, centri, linee sulla mappa.
 */
const MapElementsRenderer = {    
    creaIconaCerchio: (carattere, coloreBordoVar, coloreSfondoVar, dimensionePx = 20, fontSizePx = 14) => {
        const coloreBordo = MapElementsRenderer.getCSSVar(coloreBordoVar);
        const coloreSfondo = MapElementsRenderer.getCSSVar(coloreSfondoVar);
        const coloreTesto = MapElementsRenderer.getCSSVar(coloreBordoVar);

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
                font-weight: 500;
                font-size: ${fontSizePx}px;
                color: ${coloreTesto};
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">
                ${carattere}
            </div>`;
    },

    creaIconaRegressione: () => {
        const coloreBordo = MapElementsRenderer.getCSSVar('--color-danger');
        const coloreSfondo = MapElementsRenderer.getCSSVar('--bg-danger');
        const coloreTesto = MapElementsRenderer.getCSSVar('--color-danger');
        const ombra = MapElementsRenderer.getCSSVar('--shadow-sm');

        return `
            <div style="
                width: 24px;
                height: 24px;
                border: 2px solid ${coloreBordo};
                border-radius: 50%;
                background: ${coloreSfondo};
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                font-size: 12px;
                color: ${coloreTesto};
                box-shadow: ${ombra};
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
                transition: transform 0.2s ease;
                transform-origin: center;">R²</div>
        `;
    },
    creaIconaVoronoi: () => {
        return `
            <div style="
                width: 24px;
                height: 24px;
                border: 2px solid ${MapElementsRenderer.getCSSVar('--color-primary-dark')};
                border-radius: 50%;
                background: ${MapElementsRenderer.getCSSVar('--bg-primary')};
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                font-size: 12px;
                color: ${MapElementsRenderer.getCSSVar('--color-primary-dark')};
                box-shadow: ${MapElementsRenderer.getCSSVar('--shadow-sm')};
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">VR</div>
        `;
    },
    creaIconaDelaunay: () => {
        return `
            <div style="
                width: 24px;
                height: 24px;
                border: 2px solid ${MapElementsRenderer.getCSSVar('--color-danger')};
                border-radius: 50%;
                background: ${MapElementsRenderer.getCSSVar('--color-btn-danger-bg')};
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                font-size: 12px;
                color: ${MapElementsRenderer.getCSSVar('--color-danger')};
                box-shadow: ${MapElementsRenderer.getCSSVar('--shadow-sm')};
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">DT</div>
        `;
    },
    creaIconaConvexHull: () => {
        return `
            <div style="
                width: 24px;
                height: 24px;
                border: 2px solid ${MapElementsRenderer.getCSSVar('--color-neutral')};
                border-radius: 50%;
                background: ${MapElementsRenderer.getCSSVar('--bg-muted')};
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                font-size: 12px;
                color: ${MapElementsRenderer.getCSSVar('--color-neutral')};
                box-shadow: ${MapElementsRenderer.getCSSVar('--shadow-sm')};
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">CHP</div>
        `;
    },
    creaIconaPercorso: () => {
        return `
            <div style="
                width: 24px;
                height: 24px;
                border: 2px solid ${MapElementsRenderer.getCSSVar('--color-secondary')};
                border-radius: 50%;
                background: ${MapElementsRenderer.getCSSVar('--bg-warning')};
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                font-size: 18px;
                color: ${MapElementsRenderer.getCSSVar('--color-secondary')};
                box-shadow: ${MapElementsRenderer.getCSSVar('--shadow-sm')};
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);">→</div>`;
    },    
    creaMarkerDelitto: (isCollaterale = false, numeroDelitto) => {
        const iconClass = isCollaterale ? 'delitto-collaterale-icon' : 'delitto-icon';
        let numeroHtml = '';
        if (numeroDelitto !== undefined) {
            numeroHtml = `<span class="numero-delitto-marker">${numeroDelitto}</span>`;
        }
        return `
            <span class="map-marker-delitto-wrapper">
                ${numeroHtml}
                <span class="material-icons map-marker-icon ${iconClass}">warning</span>
            </span>
        `;
    },
    creaMarkerPuntoInteresse: () => {
        return `<span class="material-icons map-marker-icon interesse-icon">location_on</span>`;
    },
    creaMarkerAbitazioneSospettato: () => {
        return `<span class="material-icons map-marker-icon sospettato-icon">home</span>`;
    },
    creaMarkerAbitazioneVittima: () => {
        return `<span class="material-icons map-marker-icon vittima-icon">home</span>`;
    },
    
    /**
     * Determina il colore del testo in base al tipo di centro
     * @param {string} label - Nome/etichetta del centro
     * @returns {string} - Colore CSS
     */
    determinaColoreCentro: (label) => {
        if (label.includes('Baricentro')) {
            return MapElementsRenderer.getCSSVar('--color-success');
        } else if (label.includes('Mediana')) {
            return MapElementsRenderer.getCSSVar('--color-danger');
        } else if (label.includes('Fermat') || label.includes('Minima Distanza')) {
            return MapElementsRenderer.getCSSVar('--color-warning');
        } else if (label.includes('Canter')) {
            return MapElementsRenderer.getCSSVar('--color-accent');
        } else if (label.includes('Residenza') || label.includes('CPR')) {
            return MapElementsRenderer.getCSSVar('--color-neutral');
        } else if (label.includes('Voronoi') || label.includes('intersezioni') || label.includes('VD')) {
            return MapElementsRenderer.getCSSVar('--color-bordeaux');
        }
        return MapElementsRenderer.getCSSVar('--color-text-secondary');
    },
    
    generaPopupHtml: (punto, centers, caso) => {
        const [lon, lat] = convertiUTMtoWGS84(punto.x, punto.y, caso);
        const tableId = `distanze-table-${Math.random().toString(36).substring(2, 10)}`;

        let popupHtml = `
            <div class="popup-container">
                <div class="popup-header">
                    <span class="popup-title">${MapElementsRenderer.escapeHtml(punto.label)}</span>
                    <span class="coordinate">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</span>
                    <span class="coordinate">UTM: ${Math.round(punto.x)}E, ${Math.round(punto.y)}N</span>
                </div>
        `;

        // Se sono presenti fonti/link, li aggiungiamo al popup
        if (punto.fonti && Array.isArray(punto.fonti) && punto.fonti.length > 0) {
            popupHtml += `<div style="margin-top: var(--sp-sm); font-size: var(--fs-xs);">`;
            popupHtml += `<span style="font-weight: 500; color: var(--color-text);">Fonti:</span><br>`;
            
            punto.fonti.forEach(fonte => {
                if (typeof fonte === 'string') {
                    popupHtml += `<a href="${MapElementsRenderer.escapeHtml(fonte)}" target="_blank" rel="noopener noreferrer" 
                                    style="color: var(--color-primary); text-decoration: underline; display: inline-block; margin-top: var(--sp-xxs);">
                                    ${MapElementsRenderer.escapeHtml(fonte.substring(0, 40))}${fonte.length > 40 ? '...' : ''}
                                 </a><br>`;
                }
            });
            
            popupHtml += `</div>`;
        }

        // Se ci sono centri, aggiungiamo le distanze
        if (centers && centers.length > 0) {
            popupHtml += `
                <table class="popup-table sortable-table" id="${tableId}">
                    <thead>
                        <tr>
                            <th>Centro</th>
                            <th class="popup-sortable-header" data-sort-column="distanza" style="cursor: pointer;">Distanza <span class="sort-icon">▼</span></th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            centers.forEach(center => {
                const centerX = center.x || (center.punto ? center.punto.x : null);
                const centerY = center.y || (center.punto ? center.punto.y : null);
                
                if (centerX !== null && centerY !== null) {
                    const distanza = Math.hypot(punto.x - centerX, punto.y - centerY);
                    const label = center.label || center.nome || '';
                    const coloreTesto = MapElementsRenderer.determinaColoreCentro(label);
                    
                    popupHtml += `
                        <tr>
                            <td style="font-weight: 500;" data-label="${MapElementsRenderer.escapeHtml(label)}">${MapElementsRenderer.escapeHtml(label)}</td>
                            <td data-distanza="${distanza}">${MapElementsRenderer.formattaDistanzaKm(distanza)}</td>
                        </tr>
                    `;
                }
            });

            popupHtml += `</tbody></table>`;
        }

        popupHtml += `</div>`;
        return popupHtml;
    },
    
    /**
     * Genera le statistiche di distanza per i punti
     * @param {Object} centerPoint - Punto centrale
     * @param {Array} puntiUTM - Array di punti UTM
     * @returns {Object} - Oggetto con le statistiche
     */
    calcolaStatisticheDistanze: (centerPoint, puntiUTM) => {
        let minDist = Infinity;
        let maxDist = 0;
        let sommaDistanze = 0;

        if (puntiUTM && puntiUTM.length > 0) {
            puntiUTM.forEach(p => {
                const dist = Math.hypot(p.x - centerPoint.x, p.y - centerPoint.y);
                if (dist < minDist) minDist = dist;
                if (dist > maxDist) maxDist = dist;
                sommaDistanze += dist;
            });
            
            const distanzaMedia = sommaDistanze / puntiUTM.length;
            const deviazioneStandard = algoritmiGeometrici.calcolaDeviazioneStandardDistanze(puntiUTM, centerPoint);
            
            return {
                minDist,
                maxDist,
                distanzaMedia,
                deviazioneStandard
            };
        }
        
        return {
            minDist: 0,
            maxDist: 0,
            distanzaMedia: 0,
            deviazioneStandard: 0
        };
    },
    
    creaContenutoInfobox: (titolo, iconHtml, color, centerPoint, puntiUTM, riepilogoPunti, caso) => {
        const [lon, lat] = convertiUTMtoWGS84(centerPoint.x, centerPoint.y, caso);        
        const stats = MapElementsRenderer.calcolaStatisticheDistanze(centerPoint, puntiUTM);

        const riepilogoHtml = riepilogoPunti
            ? `<p class="punti-riepilogo" style="margin-bottom: var(--sp-sm);">${riepilogoPunti}</p>`
            : '';

        return `
            <p class="coordinate" style="font-weight: 500; margin-bottom: var(--sp-xs);">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</p>
            <p class="coordinate" style="margin-bottom: var(--sp-sm);">UTM: ${Math.round(centerPoint.x)}E, ${Math.round(centerPoint.y)}N</p>
            ${riepilogoHtml}
            ${puntiUTM && puntiUTM.length > 0 ? `
                <table class="nni-table" style="width: 100%; border-collapse: collapse; margin-top: var(--sp-xs);">
                    <tr>
                        <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin); font-weight: 500; color: var(--color-table-header);">Distanza media</td>
                        <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin);">${MapElementsRenderer.formattaDistanzaKm(stats.distanzaMedia)}</td>
                    </tr>
                    <tr>
                        <td style="padding: var(--sp-xs) 0; font-weight: 500; color: var(--color-table-header);">Deviazione standard</td>
                        <td style="padding: var(--sp-xs) 0;">${MapElementsRenderer.formattaDistanzaKm(stats.deviazioneStandard)}</td>
                    </tr>
                </table>
            ` : '<p style="margin: var(--sp-xs) 0; color: var(--color-text-secondary);">Nessun punto attivo per l\'analisi.</p>'}
        `;
    },
    
    creaInfoboxCanter: (canter, puntiCalcolo, riepilogoPunti, caso) => {
        const [lonCanter, latCanter] = convertiUTMtoWGS84(canter.x, canter.y, caso);
        
        // Calcola i dati personalizzati per l'infobox
        const raggioCanter = canter.raggio;
        const areaCerchioCanter = Math.PI * Math.pow(raggioCanter, 2);
        let puntiDentro = 0;

        puntiCalcolo.forEach(p => {
            const distFromCenter = Math.hypot(p.x - canter.x, p.y - canter.y);
            const TOLERANCE = 1e-9;
            if (distFromCenter <= (raggioCanter + TOLERANCE)) {
                puntiDentro++;
            }
        });
        
        const puntiUsati = puntiCalcolo.length;
        const percentualeDentro = puntiUsati > 0 ? (puntiDentro / puntiUsati) * 100 : 0;

        return `
            <p class="coordinate" style="font-weight: 500; margin-bottom: var(--sp-xs);">${latCanter.toFixed(4)}°N, ${lonCanter.toFixed(4)}°E</p>
            <p class="coordinate" style="margin-bottom: var(--sp-sm);">UTM: ${Math.round(canter.x)}E, ${Math.round(canter.y)}N</p>
            <p class="punti-riepilogo" style="margin-bottom: var(--sp-sm);">${riepilogoPunti}</p>
            <table class="nni-table" style="width: 100%; border-collapse: collapse; margin-top: var(--sp-xs);">
                <tr>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin); font-weight: 500; color: var(--color-table-header);">Punti nel cerchio</td>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin);">${puntiDentro} (${percentualeDentro.toFixed(1)}%)</td>
                </tr>
                <tr>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin); font-weight: 500; color: var(--color-table-header);">Raggio del cerchio</td>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin);">${MapElementsRenderer.formattaDistanzaKm(raggioCanter, 1)}</td>
                </tr>
                <tr>
                    <td style="padding: var(--sp-xs) 0; font-weight: 500; color: var(--color-table-header);">Area del cerchio</td>
                    <td style="padding: var(--sp-xs) 0;">${(areaCerchioCanter / 1000000).toFixed(2)} km²</td>
                </tr>
            </table>
        `;
    },
    
    creaInfoboxNNI: (indice, distanzaMedia, distanzaCasuale, densita, areaTotale, riepilogoPunti) => {
        const gradientStops = [
            { value: 0, color: 'rgba(255, 0, 0, 0.9)', label: 'Cluster Forte' },
            { value: 0.5, color: 'rgba(255, 100, 0, 0.9)', label: 'Cluster Moderato' },
            { value: 1.0, color: 'rgba(0, 255, 0, 0.9)', label: 'Distribuzione Casuale' },
            { value: 1.5, color: 'rgba(0, 100, 255, 0.9)', label: 'Dispersione Moderata' },
            { value: 2.5, color: 'rgba(0, 0, 200, 0.9)', label: 'Dispersione Forte' }
        ];

        const gradientCSS = gradientStops.map(stop => `${stop.color} ${(stop.value / 2.5) * 100}%`).join(', ');
        const indicatorPosition = Math.min(100, Math.max(0, (indice / 2.5) * 100));
        
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
        
        const nniColor = getNNIColor(indice);
        const densitaPerKmq = densita * 1000000; // Conversione da m² a km²
        const densitaFormattata = densitaPerKmq < 0.1 ?
            densitaPerKmq.toExponential(2) :
            densitaPerKmq.toFixed(2);

        return `
            <p class="punti-riepilogo" style="margin-bottom: var(--sp-sm);">${riepilogoPunti}</p>
            <div class="nni-bar-container" style="display: flex; align-items: center; gap: var(--sp-xs); margin: var(--sp-sm) 0;">
                <div class="nni-gradient-bar" style="
                    width: 20px;
                    height: 150px;
                    margin-right: var(--sp-sm);
                    margin-left: var(--sp-sm);
                    position: relative;
                    border-radius: var(--sp-sm);
                    background: linear-gradient(to bottom, ${gradientCSS});
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--nni-gradient-border-color);">
                    <div class="nni-value-indicator" style="
                        position: absolute;
                        left: -4px;
                        right: -4px;
                        height: 3px;
                        background-color: var(--nni-indicator-bg);
                        box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
                        top: ${indicatorPosition}%;"></div>
                </div>
                <table class="nni-table" style="border-collapse: collapse;">
                    ${gradientStops.map(stop => `
                    <tr class="${Math.abs(stop.value - indice) < 0.25 ? 'highlight' : ''}">
                        <td class="nni-table-cell" style="padding: 2px; ${Math.abs(stop.value - indice) < 0.25 ? 'font-weight: 500;' : ''}">${stop.label}</td>
                    </tr>
                    `).join('')}
                </table>
            </div>
            <table class="nni-table" style="width: 100%; border-collapse: collapse; margin-top: var(--sp-xs);">
                <tr>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin); font-weight: 500; color: var(--color-table-header);">Valore NNI</td>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin);"><span style="color: ${nniColor}; font-weight: 700;">${indice.toFixed(2)}</span></td>
                </tr>
                <tr>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin); font-weight: 500; color: var(--color-table-header);">Distanza media osservata</td>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin);">${(distanzaMedia / 1000).toFixed(2)} km</td>
                </tr>
                <tr>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin); font-weight: 500; color: var(--color-table-header);">Distanza attesa casuale</td>
                    <td style="padding: var(--sp-xs) 0; border-bottom: var(--border-thin);">${(distanzaCasuale / 1000).toFixed(2)} km</td>
                </tr>
                <tr>
                    <td style="padding: var(--sp-xs) 0; font-weight: 500; color: var(--color-table-header);">Area analizzata</td>
                    <td style="padding: var(--sp-xs) 0;">${(areaTotale / 1000000).toFixed(2)} km²</td>
                </tr>
            </table>
        `;
    },
    escapeHtml: (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    formattaDistanzaKm: (distanzaMetri, decimali = 1) => {
        return `${(distanzaMetri / 1000).toFixed(decimali)} km`;
    },
    getCSSVar: (name) => {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },
    getConfigCerchio: (tipoCentro, opacita = 0.2) => {
        let config = {
            weight: 2.5,
            opacity: 0.7,
            fillOpacity: opacita,
            interactive: true,
            zIndex: 900,
            dashArray: null,
            bubblingMouseEvents: false,
            renderer: L.svg({ padding: 0.5 }),
            className: 'cerchio-centro',
        };
        
        switch (tipoCentro.toLowerCase()) {
            case 'baricentro':
                config.color = MapElementsRenderer.getCSSVar('--color-primary-dark');
                config.fillColor = MapElementsRenderer.getCSSVar('--bg-primary');
                break;
            case 'mediana':
                config.color = MapElementsRenderer.getCSSVar('--color-danger');
                config.fillColor = MapElementsRenderer.getCSSVar('--bg-danger');
                break;
            case 'fermat':
                config.color = MapElementsRenderer.getCSSVar('--color-purple');
                config.fillColor = MapElementsRenderer.getCSSVar('--bg-purple-light');
                break;
            case 'canter':
                config.color = MapElementsRenderer.getCSSVar('--color-accent');
                config.fillColor = MapElementsRenderer.getCSSVar('--bg-accent');
                break;
            case 'regressione':
                config.color = MapElementsRenderer.getCSSVar('--color-danger');
                config.fillColor = MapElementsRenderer.getCSSVar('--bg-warning');
                config.dashArray = '5, 5';
                config.weight = 2;
                break;
            default:
                config.color = MapElementsRenderer.getCSSVar('--color-neutral');
                config.fillColor = MapElementsRenderer.getCSSVar('--bg-muted');
        }
        
        return config;
    }
};

function gestisciOrdinamentoTabellaPopup(headerElement) {
    const table = headerElement.closest('table');
    if (!table) {
        console.error("[OrdinamentoTabella] Tabella non trovata per l'header:", headerElement);
        return;    }

    const sortColumnName = headerElement.dataset.sortColumn;
    if (!sortColumnName) {
        console.error("[OrdinamentoTabella] Attributo 'data-sort-column' mancante sull'header:", headerElement);
        return;
    }
    // Determina la direzione di ordinamento corrente e la nuova direzione
    let currentSortDirection = headerElement.dataset.sortDirection || 'desc';
    let newSortDirection;

    if (headerElement.dataset.initialClick === undefined) {
        newSortDirection = 'asc';
        headerElement.dataset.initialClick = 'false';
    } else {
        newSortDirection = (currentSortDirection === 'asc') ? 'desc' : 'asc';
    }
    headerElement.dataset.sortDirection = newSortDirection;

    const allRows = Array.from(table.rows);    
    // Prendi tutte le righe tranne la prima (che è l'header)
    const rows = allRows.slice(1);
    
    if (rows.length === 0) return;
    rows.forEach((row, idx) => {
        const cell = row.querySelector(`td[data-${sortColumnName}]`);
    });

    // Creiamo una copia delle righe prima dell'ordinamento
    const rowsCopy = [...rows];
    
    const sortedRows = [...rows].sort((a, b) => {
        const aCell = a.querySelector(`td[data-${sortColumnName}]`);
        const bCell = b.querySelector(`td[data-${sortColumnName}]`);

        let aValue = NaN;
        let bValue = NaN;

        if (aCell && aCell.dataset[sortColumnName] !== undefined) {
            aValue = parseFloat(aCell.dataset[sortColumnName]);
        }
        if (bCell && bCell.dataset[sortColumnName] !== undefined) {
            bValue = parseFloat(bCell.dataset[sortColumnName]);
        }        
        
        if (isNaN(aValue) && isNaN(bValue)) return 0;
        if (isNaN(aValue)) return 1; 
        if (isNaN(bValue)) return -1; 
        
        return newSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });    
    sortedRows.forEach((row, idx) => {
        const cell = row.querySelector(`td[data-${sortColumnName}]`);
    });

    // METODO ALTERNATIVO
    const fragment = document.createDocumentFragment();    
    // Clona tutte le righe ordinate in profondità
    sortedRows.forEach(row => {
        const clonedRow = row.cloneNode(true);
        fragment.appendChild(clonedRow);
    }); 

    while (table.rows.length > 1) {
        table.deleteRow(1);
    }    
    const tbody = table.querySelector('tbody') || table;
    tbody.appendChild(fragment);    

    const finalRows = Array.from(table.rows).slice(1);
    finalRows.forEach((row, idx) => {
        const cell = row.querySelector(`td[data-${sortColumnName}]`);
    });
    // Aggiorna l'icona di ordinamento
    const sortIcon = headerElement.querySelector('.sort-icon');
    if (sortIcon) {
        sortIcon.textContent = newSortDirection === 'asc' ? '▲' : '▼';
    }
}
// Event listener globale per gestire i click sugli header ordinabili dei popup
document.addEventListener('click', function(event) {
    const header = event.target.closest('.popup-sortable-header');
    if (header) {
        gestisciOrdinamentoTabellaPopup(header);
    }
});