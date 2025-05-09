/**
 * algorithms.js
 *
 * Modulo contenente algoritmi geometrici per applicazioni criminologiche.
 *
 * Contenuto:
 * - calcolaRaggioMassimo
 * - baricentro (media delle coordinate).
 * - centro di minima distanzae (algoritmo di Weiszfeld).
 * - cerchio di Canter, definito dalla coppia di punti più distanti.
 * - centroProbabileResidenza (CPR), stima pesata dell'area di residenza.
 * - convexHull, poligono convesso minimo che racchiude tutti i punti (Monotone Chain).
 * - meanInterpointDistance (MID), distanza media tra tutte le coppie di punti.
 * - nearestNeighborIndex (NNI), valuta raggruppamento/dispersione dei punti.
 * - calcolaDeviazioneStandardDistanze.
 *
 * Dipendenze interne:
 * - variabili globali di configurazione
 * Dipendenze esterne:
 * - Math
 *
 */

const algoritmiGeometrici = {

    // ALGORITMI PRINCIPALI

    baricentro: punti => {
        algoritmiGeometrici.validaArrayPunti(punti);
        // Calcolo la somma cumulativa delle coordinate x e y di tutti i punti
        // acc (accumulatore), p (punto corrente)
        const somma = punti.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y
        }), { x: 0, y: 0 });
        // Calcola le coordinate del baricentro come media delle coordinate totali
        const coordBaricentro = {
            x: somma.x / punti.length,
            y: somma.y / punti.length
        };
        const raggioMassimo = algoritmiGeometrici.calcolaRaggioMassimo(punti, coordBaricentro);
        return {
            ...coordBaricentro,
            raggio: raggioMassimo
        };
    },

    mediana: function (punti) {
        algoritmiGeometrici.validaArrayPunti(punti);
        const coordinateX = punti.map(p => p.x);
        const coordinateY = punti.map(p => p.y);
        const medianaX = algoritmiGeometrici.calcolaMediana(coordinateX);
        const medianaY = algoritmiGeometrici.calcolaMediana(coordinateY);
        const puntoMediano = { x: medianaX, y: medianaY };
        return {
            ...puntoMediano,
            raggio: algoritmiGeometrici.calcolaRaggioMassimo(punti, puntoMediano)
        };
    },

    // Algoritmo per calcolare il punto di minima distanza
    fermat: punti => {
        algoritmiGeometrici.validaArrayPunti(punti);
        if (punti.length < 3) {
            return algoritmiGeometrici.baricentro(punti);
        }
        // Se i punti sono collineari trova il punto medio tra gli estremi
        if (algoritmiGeometrici.puntiCollineari(punti)) {
            const { minX, minY, maxX, maxY } = algoritmiGeometrici.trovaEstremi(punti);
            const p1 = { x: minX, y: minY };
            const p2 = { x: maxX, y: maxY };
            const puntoMedio = algoritmiGeometrici.puntoMedio(p1, p2);
            return {
                ...puntoMedio,
                raggio: algoritmiGeometrici.calcolaRaggioMassimo(punti, puntoMedio)
            };
        }
        // Se i punti non sono collineari, si applica l'algoritmo iterativo di Weiszfeld
        // Parto dal baricentro calcolato in precedenza come stima iniziale
        const baricentroIniziale = algoritmiGeometrici.baricentro(punti);
        let puntoCorrente = { x: baricentroIniziale.x, y: baricentroIniziale.y };
        let xPrecedente = puntoCorrente.x;
        let yPrecedente = puntoCorrente.y;
        for (let indiceIterazione = 0; indiceIterazione < window.MAX_ITERATIONS; indiceIterazione++) {
            let sommaX = 0;
            let sommaY = 0;
            let sommaPesi = 0;
            for (const p of punti) {
                // Calcola la differenza nelle coordinate tra il punto corrente e il punto dato
                const deltaX = p.x - xPrecedente;
                const deltaY = p.y - yPrecedente;
                // Aggiungo un valore epsilon per evitare divisioni per zero
                const distanza = Math.sqrt(deltaX * deltaX + deltaY * deltaY + window.SQRT_EPSILON);
                // I punti più vicini hanno un peso maggiore
                const inversoDistanza = 1 / distanza;
                sommaX += p.x * inversoDistanza;
                sommaY += p.y * inversoDistanza;
                sommaPesi += inversoDistanza;
            }
            const nuovoX = sommaX / sommaPesi;
            const nuovoY = sommaY / sommaPesi;
            const spostamentoX = nuovoX - xPrecedente;
            const spostamentoY = nuovoY - yPrecedente;
            // Usa la funzione verificaConvergenza
            if (algoritmiGeometrici.verificaConvergenza(
                { x: nuovoX, y: nuovoY },
                { x: xPrecedente, y: yPrecedente }
            )) {
                break;
            }
            // Aggiorna la posizione del punto precedente con uno smorzamento
            xPrecedente += 0.67 * spostamentoX;
            yPrecedente += 0.67 * spostamentoY;
        }
        const puntoFinale = { x: xPrecedente, y: yPrecedente };
        return {
            ...puntoFinale,
            raggio: algoritmiGeometrici.calcolaRaggioMassimo(punti, puntoFinale)
        };
    },

    canter: punti => {
        try {
            algoritmiGeometrici.validaArrayPunti(punti);
            if (punti.length === 1) {
                return { ...punti[0], raggio: 0 };
            }
            let maxDist = 0;
            let coppia = null;
            // Itera su tutte le coppie uniche di punti
            algoritmiGeometrici.perOgniCoppia(punti, (p1, p2, idx1, idx2) => {
                const dist = algoritmiGeometrici.distanzaTraPunti(p1, p2);
                if (dist > maxDist) {
                    maxDist = dist;
                    coppia = [idx1, idx2];
                }
            });
            const puntoMedio = algoritmiGeometrici.puntoMedio(punti[coppia[0]], punti[coppia[1]]);
            return {
                ...puntoMedio,
                raggio: maxDist / 2
            };
        } catch (error) {
            return { x: 0, y: 0, raggio: 0 };
        }
    },

    // Implementare Minimum Enclosing Circle - MEC di un insieme di punti.

    centroProbabileResidenza: punti => {
        algoritmiGeometrici.validaArrayPunti(punti);
        // Parto dal baricentro
        const baricentroIniziale = algoritmiGeometrici.baricentro(punti);
        // Trovo l'anno più recente tra tutti i punti
        const annoMassimo = Math.max(...punti.map(p => p.year || 1985));
        const datasetPesi = punti.map(p => {
            // Peso relativo alla distanza dal centro iniziale. Più è lontano e meno pesa
            const dist = algoritmiGeometrici.distanzaTraPunti(p, baricentroIniziale);
            const journeyWeight = Math.exp(-0.5 * Math.pow(dist / window.JOURNEY_RADIUS, 2));
            // Peso relativo al tempo trascorso. Più è vecchio e meno conta
            const deltaAnni = annoMassimo - (p.year || annoMassimo);
            const decayTime = Math.exp(-window.TIME_DECAY_RATE * deltaAnni);
            // Ipotesi che le morti collaterali siano meno informnative (peso 0.3)
            const pesoTipo = (p.pesoBase !== undefined) ? p.pesoBase : 1.0;
            return {
                // restituisce il punto e il suo peso finale (media ponderata dei tre pesi calcolati)
                x: p.x,
                y: p.y,
                peso: window.PB_COMPONENT_WEIGHT * pesoTipo + window.JW_COMPONENT_WEIGHT * journeyWeight + window.DT_COMPONENT_WEIGHT * decayTime
            };
        });
        let centro = { ...baricentroIniziale };
        let iter = 0;
        while (iter < window.MAX_ITERATIONS) {
            let sumX = 0, sumY = 0, sumW = 0;
            datasetPesi.forEach(p => {
                const dist = algoritmiGeometrici.distanzaTraPunti(p, centro) + window.SQRT_EPSILON;
                sumX += (p.peso * p.x) / dist;
                sumY += (p.peso * p.y) / dist;
                sumW += p.peso / dist;
            });
            const nuovoCentro = {
                x: sumX / sumW,
                y: sumY / sumW
            };
            // Usa la funzione verificaConvergenza
            if (algoritmiGeometrici.verificaConvergenza(nuovoCentro, centro)) {
                break;
            }
            const dx = nuovoCentro.x - centro.x;
            const dy = nuovoCentro.y - centro.y;
            centro.x += 0.67 * dx;
            centro.y += 0.67 * dy;
            iter++;
        }
        return centro;
    },

    // Calcola convex hull di un insieme di punti (algoritmo Monotone Chain)
    convexHull: function (punti) {
        try {
            // Gestisce casi con meno di 3 punti.
            if (punti.length < 3) {
                return {
                    punti: punti.slice().sort((a, b) => a.x - b.x || a.y - b.y),
                    area: 0,
                    perimetro: punti.length === 2 ? algoritmiGeometrici.distanzaTraPunti(punti[0], punti[1]) : 0
                };
            }
            const puntiOrdinati = punti.slice().sort((a, b) => a.x - b.x || a.y - b.y);
            // Calcola l'orientamento di 3 punti (prodotto vettoriale 2D).
            const orientamento = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
            const bordoInferiore = [];
            for (const p of puntiOrdinati) {
                // Rimuove i punti che creano concavità
                while (bordoInferiore.length >= 2 && orientamento(bordoInferiore[bordoInferiore.length - 2], bordoInferiore[bordoInferiore.length - 1], p) <= 0) {
                    bordoInferiore.pop();
                }
                bordoInferiore.push(p);
            }
            const bordoSuperiore = [];
            for (let i = puntiOrdinati.length - 1; i >= 0; i--) {
                const p = puntiOrdinati[i];
                while (bordoSuperiore.length >= 2 && orientamento(bordoSuperiore[bordoSuperiore.length - 2], bordoSuperiore[bordoSuperiore.length - 1], p) <= 0) {
                    bordoSuperiore.pop();
                }
                bordoSuperiore.push(p);
            }
            // Rimuove i punti duplicati
            bordoSuperiore.pop();
            bordoInferiore.pop();
            const hull = bordoInferiore.concat(bordoSuperiore);
            // Calcola l'area del poligono
            const area = Math.abs(hull.reduce((acc, p, i) => {
                const nextP = hull[(i + 1) % hull.length];
                return acc + (p.x * nextP.y - nextP.x * p.y);
            }, 0)) / 2;
            const perimetro = algoritmiGeometrici.calcolaPerimetro(hull);
            return { punti: hull, area, perimetro };
        } catch (error) {
            return { punti: [], area: 0, perimetro: 0 };
        }
    },

    // Calcola la distanza media tra tutte le coppie uniche di punti
    meanInterpointDistance: function (punti) {
        try {
            algoritmiGeometrici.validaArrayPunti(punti);
            if (punti.length < 2) return 0;
            let sommaDistanze = 0;
            const numeroPunti = punti.length;
            // Versione con perOgniCoppia
            algoritmiGeometrici.perOgniCoppia(punti, (p1, p2) => {
                sommaDistanze += algoritmiGeometrici.distanzaTraPunti(p1, p2);
            });
            // Calcola il numero totale di coppie uniche (combinazioni senza ripetizione)
            const numeroCoppie = numeroPunti * (numeroPunti - 1) / 2;
            return sommaDistanze / numeroCoppie;
        } catch (error) {
            return 0;
        }
    },

    // L'NNI misura il grado di raggruppamento o dispersione di un pattern di punti
    nearestNeighborIndex: function (punti) {
        try {
            punti = algoritmiGeometrici.validaArrayPunti(punti);
            punti = punti.filter(p => typeof p.x === 'number' && typeof p.y === 'number');
            const numeroPunti = punti.length;
            if (numeroPunti < 2) throw new Error("Almeno due punti sono necessari per calcolare NNI");
            const areaTotale = algoritmiGeometrici.areaBoundingBox(punti, 100);
            const sommaDistanze = punti.reduce((somma, p1, i) => {
                const distanzaVicino = Math.min(...punti.filter((_, j) => j !== i).map(p2 => {
                    return algoritmiGeometrici.distanzaTraPunti(p1, p2);
                }));
                return somma + (isFinite(distanzaVicino) ? distanzaVicino : 0);
            }, 0);
            const distanzaMedia = sommaDistanze / numeroPunti;
            // Calcola la distanza media attesa in un pattern casuale per la stessa area e numero di punti
            const distanzaCasuale = 0.5 * Math.sqrt(areaTotale / numeroPunti);
            const indice = distanzaCasuale > 0 ? distanzaMedia / distanzaCasuale : 0;
            return {
                indice,
                distanzaMedia,
                distanzaCasuale,
                densita: numeroPunti / areaTotale,
                areaTotale,
                numeroPunti,
                interpretazione: algoritmiGeometrici.interpretaNNI(indice)
            };
        } catch (error) {
            return null;
        }
    },

    interpretaNNI: function (nni) {
        if (nni < 0.5) return "Cluster Forte";
        if (nni < 0.8) return "Cluster Moderato";
        if (nni < 1.2) return "Distribuzione Casuale";
        if (nni < 1.5) return "Dispersione Moderata";
        return "Dispersione Forte";
    },

    // FUNZIONI HELPER

    distanzaTraPunti: (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y),

    puntoMedio: (p1, p2) => ({
        x: (p1.x + p2.x) * 0.5,
        y: (p1.y + p2.y) * 0.5
    }),

    validaArrayPunti: (punti) => {
        if (!punti || punti.length === 0) {
            throw new Error("Array di punti vuoto o non valido");
        }
        return punti;
    },

    calcolaRaggioMassimo: (punti, centro) => {
        return Math.max(...punti.map(p => algoritmiGeometrici.distanzaTraPunti(p, centro)));
    },

    calcolaMediana: (punti) => {
        const valoriOrdinati = [...punti].sort((a, b) => a - b);
        const indiceMediano = Math.floor(valoriOrdinati.length / 2);
        return valoriOrdinati.length % 2 === 0
            ? (valoriOrdinati[indiceMediano - 1] + valoriOrdinati[indiceMediano]) / 2
            : valoriOrdinati[indiceMediano];
    },

    calcolaPerimetro: (punti) => {
        return punti.reduce((acc, p, i) => {
            const nextP = punti[(i + 1) % punti.length];
            return acc + algoritmiGeometrici.distanzaTraPunti(p, nextP);
        }, 0);
    },

    perOgniCoppia: (punti, callback) => {
        for (let i = 0; i < punti.length; i++) {
            for (let j = i + 1; j < punti.length; j++) {
                callback(punti[i], punti[j], i, j);
            }
        }
    },

    puntiCollineari: (punti) => {
        if (punti.length < 3) return true;
        for (let i = 2; i < punti.length; i++) {
            const areaDoppia = Math.abs(
                (punti[1].x - punti[0].x) * (punti[i].y - punti[0].y) -
                (punti[1].y - punti[0].y) * (punti[i].x - punti[0].x)
            );
            if (areaDoppia > window.COLLINEARITY_THRESHOLD) return false;
        }
        return true;
    },

    verificaConvergenza: (puntoCorrente, puntoPrecedente) => {
        const dx = puntoCorrente.x - puntoPrecedente.x;
        const dy = puntoCorrente.y - puntoPrecedente.y;
        return dx * dx + dy * dy < window.POSITION_TOLERANCE;
    },

    calcolaDeviazioneStandardDistanze: (punti, centro) => {
        if (punti.length === 0) return 0;
        const distanze = punti.map(p => algoritmiGeometrici.distanzaTraPunti(p, centro));
        const media = distanze.reduce((acc, d) => acc + d, 0) / distanze.length;
        const varianza = distanze.reduce((acc, d) => acc + Math.pow(d - media, 2), 0) / distanze.length;
        return Math.sqrt(varianza);
    },

    areaBoundingBox: (punti, minArea = 100) => {
        const coordinateX = punti.map(p => p.x);
        const coordinateY = punti.map(p => p.y);
        const areaTotale = Math.max((Math.max(...coordinateX) - Math.min(...coordinateX)) * (Math.max(...coordinateY) - Math.min(...coordinateY)), minArea);
        return areaTotale;
    },

    trovaEstremi: (punti) => {
        const minX = Math.min(...punti.map(p => p.x));
        const maxX = Math.max(...punti.map(p => p.x));
        const minY = Math.min(...punti.map(p => p.y));
        const maxY = Math.max(...punti.map(p => p.y));
        return { minX, minY, maxX, maxY };
    }
};
