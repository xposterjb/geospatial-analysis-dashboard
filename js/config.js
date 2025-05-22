/**
 * Configurazione del sistema di coordinate UTM 32N e costanti
 * per i calcoli geospaziali dell'applicazione.
 * 
 * Definisce:
 * - La proiezione UTM per l'Italia centro-nord (zona 32)
 * - La proiezione UTM per la California (zona 10)
 * - Parametri per gli algoritmi (precisione, tolleranze, iterazioni)
 */

proj4.defs("EPSG:32632", "+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:32610", "+proj=utm +zone=10 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");

// Costanti
window.SQRT_EPSILON = 1e-8;
window.COLLINEARITY_THRESHOLD = 1e6;  // Soglia per determinare se i punti sono collineari
window.MAX_ITERATIONS = 100;
window.POSITION_TOLERANCE = 1e-8;
window.DEBUG_CHP = true;  // Abilita/disabilita i messaggi di debug per il Convex Hull
// Costanti per lo slider temporale
window.ANNO_MIN_SLIDER       = 1968;
window.ANNO_MAX_SLIDER       = 2025;
window.ANNO_INIZIALE_SLIDER  = 1985;
// Costanti CPR
window.JOURNEY_RADIUS = 5000; // Soglia raggio 5km
window.TIME_DECAY_RATE = 0.25;

window.BASE_WEIGHT = 1.0; // delitti principali
window.COLLATERAL_WEIGHT = 0.3; // morti collaterali
window.POI_WEIGHT = 0.3; // punti interesse

// Pesi per il calcolo della media ponderata delle tre componenti
window.JW_COMPONENT_WEIGHT = 0.333;
window.DT_COMPONENT_WEIGHT = 0.333;
window.PB_COMPONENT_WEIGHT = 0.333;

window.CPR_RADIUS_LIMIT = 50000; // 50km raggio massimo circonferenza attorno a CPR

