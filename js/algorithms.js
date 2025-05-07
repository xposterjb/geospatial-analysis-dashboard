/**
 * algorithms.js
 *
 * Modulo contenente algoritmi geometrici per applicazioni criminologiche. *
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
const calcolaRaggioMassimo = (punti, centro) => Math.max(...punti.map(p =>
    // Calcola la distanza euclidea (ipotenusa) tra il punto corrente (p) e il centro
    Math.hypot(p.x - centro.x, p.y - centro.y)
));

const algoritmiGeometrici = {
    baricentro: punti => {
        // Verifica se l'array di punti è vuoto per evitare divisioni per zero
        if (!punti || punti.length === 0) {
            return { x: 0, y: 0, raggio: 0 };
        }

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

        const raggioMassimo = calcolaRaggioMassimo(punti, coordBaricentro);

        return {
            ...coordBaricentro,
            raggio: raggioMassimo
        };
    },

    mediana: function (punti) {

        if (!punti || punti.length === 0) {
            return { x: 0, y: 0, raggio: 0 };
        }

        // Funzione helper per il calcolo della mediana
        const calcolaMedianaCoordinata = asse => {
            const valori = punti.map(p => p[asse]).sort((a, b) => a - b);
            const indiceMediano = Math.floor(valori.length / 2);

            return valori.length % 2 === 0
                ? (valori[indiceMediano - 1] + valori[indiceMediano]) / 2
                : valori[indiceMediano];
        };

        // Calcola la mediana per le coordinate x e y separatamente
        const xMediana = calcolaMedianaCoordinata('x');
        const yMediana = calcolaMedianaCoordinata('y');

        return {
            x: xMediana,
            y: yMediana,
            raggio: calcolaRaggioMassimo(punti, { x: xMediana, y: yMediana })
        };
    },

    // Algoritmo per calcolare il punto di minima distanza
    // Utilizza l'algoritmo di Weiszfeld modificato
    fermat: punti => {
        if (!punti || punti.length === 0) {
            return { x: 0, y: 0, raggio: 0 };
        }

        // Calcola il baricentro iniziale come prima stima del punto di Fermat
        const baricentroIniziale = algoritmiGeometrici.baricentro(punti.map(p => ({ x: p.x, y: p.y })));

        // Per meno di 3 punti, il punto di Fermat coincide con il baricentro.
        if (punti.length < 3) {
            return baricentroIniziale;
        }

        // Valuta se i punti sono collineari (giacciono approssimativamente su una linea retta)
        let sonoCollineari = true;
        for (let i = 2; i < punti.length; i++) {

            // Calcola il doppio dell'area del triangolo formato da punti[0], punti[1] e punti[i]
            //  Se area doppia > tolleranza, i punti non sono allineati.            
            const areaDoppia = Math.abs(
                (punti[1].x - punti[0].x) * (punti[i].y - punti[0].y) -
                (punti[1].y - punti[0].y) * (punti[i].x - punti[0].x)
            );

            if (areaDoppia > window.COLLINEARITY_THRESHOLD) {
                sonoCollineari = false;
                break;
            }
        }

        // Se i punti sono collineari trova il punto medio tra gli estremi
        if (sonoCollineari) {
            const minX = Math.min(...punti.map(p => p.x));
            const maxX = Math.max(...punti.map(p => p.x));
            const minY = Math.min(...punti.map(p => p.y));
            const maxY = Math.max(...punti.map(p => p.y));

            const puntoMedio = {
                x: (minX + maxX) * 0.5,
                y: (minY + maxY) * 0.5
            };

            return {
                ...puntoMedio,
                raggio: calcolaRaggioMassimo(punti, puntoMedio)
            };
        }

        // Se i punti non sono collineari, si applica l'algoritmo iterativo di Weiszfeld
        // Parto dal baricentro calcolato in precedenza come stima iniziale
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

            // Verifica la condizione di convergenza
            if (spostamentoX * spostamentoX + spostamentoY * spostamentoY < window.POSITION_TOLERANCE) {
                break;
            }

            // Aggiorna la posizione del punto precedente con uno smorzamento
            xPrecedente += 0.67 * spostamentoX;
            yPrecedente += 0.67 * spostamentoY;
        }

        return {
            x: xPrecedente,
            y: yPrecedente,
            raggio: calcolaRaggioMassimo(punti, { x: xPrecedente, y: yPrecedente })
        };
    },

    canter: punti => {
        if (punti.length <= 1) {
            return { ...(punti[0] || { x: 0, y: 0 }), raggio: 0 };
        }

        let maxDist = 0;
        let coppia = null;
        // Itera su tutte le coppie uniche di punti (punti[i] e punti[j]) per trovare quella con la massima distanza.
        for (let i = 0; i < punti.length; i++) {
            for (let j = i + 1; j < punti.length; j++) {
                const dist = Math.hypot(
                    punti[i].x - punti[j].x,
                    punti[i].y - punti[j].y
                );
                
                // Se la distanza corrente è maggiore della massima distanza trovata finora...
                if (dist > maxDist) {
                    maxDist = dist;
                    coppia = [i, j];
                }
            }
        }
        return coppia ? {
            x: (punti[coppia[0]].x + punti[coppia[1]].x) / 2,
            y: (punti[coppia[0]].y + punti[coppia[1]].y) / 2,
            raggio: maxDist / 2
        } : { x: 0, y: 0, raggio: 0 };
    },

    // Implentare Minimum Enclosing Circle - MEC di un insieme di punti.

    centroProbabileResidenza: punti => {
        if (punti.length === 0) return { x: 0, y: 0 };

        // Parto dal baricentro
        const baricentroIniziale = algoritmiGeometrici.baricentro(punti.map(p => ({ x: p.x, y: p.y })));

        // Trovo l'anno più recente tra tutti i punti
        const annoMassimo = Math.max(...punti.map(p => p.year || 1985));

        const datasetPesi = punti.map(p => {

            // Peso relativo alla distanza dal centro iniziale. Più è lontano e meno pesa
            const dist = Math.hypot(p.x - baricentroIniziale.x, p.y - baricentroIniziale.y);
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
        let delta = Infinity;
        let iter = 0;

        while (delta > window.POSITION_TOLERANCE && iter < window.MAX_ITERATIONS) {
            let sumX = 0, sumY = 0, sumW = 0;
            datasetPesi.forEach(p => {
                const dist = Math.hypot(p.x - centro.x, p.y - centro.y) + window.SQRT_EPSILON;
                sumX += (p.peso * p.x) / dist;
                sumY += (p.peso * p.y) / dist;
                sumW += p.peso / dist;
            });
            const newX = sumX / sumW;
            const newY = sumY / sumW;

            const dx = newX - centro.x;
            const dy = newY - centro.y;

            centro.x += 0.67 * dx;
            centro.y += 0.67 * dy;

            iter++;
        }
        return centro;
    },

    // Calcola convex hull di un insieme di punti (algoritmo Monotone Chain)
    convexHull: function (punti) {

        // Gestisce casi con meno di 3 punti.
        if (!punti || punti.length <= 2) {
            return punti ? punti.slice().sort((a, b) => a.x - b.x || a.y - b.y) : [];
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

        return bordoInferiore.concat(bordoSuperiore);
    },

    // Calcola la distanza media tra tutte le coppie uniche di punti
    meanInterpointDistance: function (punti) {
        if (punti.length < 2) return 0;

        let sommaDistanze = 0;
        const numeroPunti = punti.length;

        for (let i = 0; i < numeroPunti; i++) {
            for (let j = i + 1; j < numeroPunti; j++) {
                const dx = punti[i].x - punti[j].x;
                const dy = punti[i].y - punti[j].y;
                sommaDistanze += Math.hypot(dx, dy);
            }
        }
        // Calcola il numero totale di coppie uniche di punti (n * (n-1) / 2)
        const numeroCoppie = numeroPunti * (numeroPunti - 1) / 2;

        return sommaDistanze / numeroCoppie;
    },

    // L'NNI misura il grado di raggruppamento o dispersione di un pattern di punti
    nearestNeighborIndex: function (punti) {
        if (!Array.isArray(punti)) return null;

        punti = punti.filter(p => typeof p.x === 'number' && typeof p.y === 'number');

        const numeroPunti = punti.length;
        if (numeroPunti < 2) return null;

        // Estrae le coordinate x e y per calcolare i limiti della bounding box    
        const coordinateX = punti.map(p => p.x);
        const coordinateY = punti.map(p => p.y);

        // Calcola l'area della bounding box che contiene tutti i punti
        // Garantisce un'area minima per evitare divisioni per zero
        const areaTotale = Math.max((Math.max(...coordinateX) - Math.min(...coordinateX)) * (Math.max(...coordinateY) - Math.min(...coordinateY)), 100);
        
        const sommaDistanze = punti.reduce((somma, p1, i) => {
            const distanzaVicino = Math.min(...punti.filter((_, j) => j !== i).map(p2 => {
                const deltaX = p1.x - p2.x;
                const deltaY = p1.y - p2.y;
                return Math.hypot(deltaX, deltaY);
            }));
            return somma + (isFinite(distanzaVicino) ? distanzaVicino : 0);
        }, 0);

        const distanzaMedia = sommaDistanze / numeroPunti;

        // Calcola la distanza media attesa in un pattern casuale per la stessa area e numero di punti
        const distanzaCasuale = 0.5 * Math.sqrt(areaTotale / numeroPunti);

        // Calcola NNI come rapporto tra la distanza media osservata e quella attesa casuale
        const indice = distanzaCasuale > 0 ? distanzaMedia / distanzaCasuale : 0;
        return {
            indice,
            distanzaMedia,
            distanzaCasuale,
            densita: numeroPunti / areaTotale,
            areaTotale,
            numeroPunti,
            interpretazione: this.interpretaNNI?.(indice) ?? null
        };
    },

    interpretaNNI: function (nni) {
        if (nni < 0.5) return "Cluster Forte";
        if (nni < 0.8) return "Cluster Moderato";
        if (nni < 1.2) return "Distribuzione Casuale";
        if (nni < 1.5) return "Dispersione Moderata";
        return "Dispersione Forte";
    },

    calcolaDeviazioneStandardDistanze: (punti, centro) => {
        if (punti.length === 0) return 0;
        const distanze = punti.map(p => Math.hypot(p.x - centro.x, p.y - centro.y));
        const media = distanze.reduce((acc, d) => acc + d, 0) / distanze.length;
        const varianza = distanze.reduce((acc, d) => acc + Math.pow(d - media, 2), 0) / distanze.length;
        return Math.sqrt(varianza);
    }
};
