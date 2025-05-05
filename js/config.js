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
window.POSITION_TOLERANCE = 1e-8;
// Costanti per lo slider temporale
window.ANNO_MIN_SLIDER       = 1968;
window.ANNO_MAX_SLIDER       = 2005;
window.ANNO_INIZIALE_SLIDER  = 1985;
// Costanti CPR
window.JOURNEY_RADIUS = 5000; // Soglia raggio 5km
window.TIME_DECAY_RATE = 0.25;
// Pesi per il calcolo della media ponderata delle tre componenti
window.JW_COMPONENT_WEIGHT = 0.333;
window.DT_COMPONENT_WEIGHT = 0.333;
window.PB_COMPONENT_WEIGHT = 0.333;
