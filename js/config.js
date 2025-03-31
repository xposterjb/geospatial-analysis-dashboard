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
const SQRT_EPSILON = 1e-6;
const COLLINEARITY_THRESHOLD = 1e6;
const MAX_ITERATIONS = 64;
const POSITION_TOLERANCE = 1e-10;
