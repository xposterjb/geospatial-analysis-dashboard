/**
 * Dataset dei luoghi rilevanti e funzione di conversione
 * in coordinate UTM per l'analisi geospaziale.
 * 
 * Contiene:
 * - Delitti principali con anno di riferimento
 * - Omicidi collaterali
 * - Punti di interesse
 * - Funzione per la conversione in coordinate UTM
 */

const rawData = {
    delitti: [
        [43.79475, 11.08234, 'Signa 1968'],
        [43.938899, 11.416420, 'Fontanine di Rabatta 1974'],
        [43.733065, 11.168895, 'Scandicci 1981'],
        [43.871668, 11.158981, 'Calenzano 1981'],
        [43.654446, 11.090850, 'Baccaiano 1982'],
        [43.732077, 11.206387, 'Giogoli 1983'],
        [43.919017, 11.498061, 'Vicchio 1984'],
        [43.694202, 11.201946, 'Scopeti 1985']
    ],
    omicidiCollaterali: [
        [43.47351, 11.28957, 'Siena22 1997'],
        [43.80539, 11.26153, 'Escobar 1972'],
        [43.79946, 11.23883, 'Manfredi 1981'],
        [36.72118, 14.73763, 'Baia Saracena 1982']
    ],
    puntiPersonalizzati: [
        [43.6932, 11.2070, 'Cim Falciani'],
        [43.6347, 11.2328, 'Casa PP'],
        [43.6546, 11.18356, 'Casa MV'],
        [43.95909, 11.32101, 'Poste S.Piero a Sieve'],
        [43.6558, 11.18414, 'Casa GL 71']
    ]
};

const convertiInUTM = data => data.map(([lat, lon, label]) => {
    const [x, y] = proj4('EPSG:4326', 'EPSG:32632', [lon, lat]);
    const yearMatch = label.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    return { x, y, label, lat, lon, year };
});
