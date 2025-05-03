/**
 * Configurazione del sistema di coordinate UTM 32N e costanti
 * per i calcoli geospaziali dell'applicazione.
 * 
 * Definisce:
 * - La proiezione UTM per l'Italia centro-nord (zona 32)
 * - Parametri per gli algoritmi (precisione, tolleranze, iterazioni)
 */

proj4.defs("EPSG:32632", "+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");

// Costanti
window.SQRT_EPSILON = 1e-6;
window.COLLINEARITY_THRESHOLD = 1e6;
window.MAX_ITERATIONS = 64;
window.POSITION_TOLERANCE = 1e-10;
// Costanti per lo slider temporale
window.ANNO_MIN_SLIDER       = 1968;
window.ANNO_MAX_SLIDER       = 2005;
window.ANNO_INIZIALE_SLIDER  = 1985;
