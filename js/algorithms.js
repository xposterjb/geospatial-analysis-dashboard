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

        return algoritmiGeometrici.returnCoordRaggio(punti, coordBaricentro);
    },

    mediana: function (punti) {
        algoritmiGeometrici.validaArrayPunti(punti);
        const coordinateX = punti.map(p => p.x);
        const coordinateY = punti.map(p => p.y);
        const medianaX = algoritmiGeometrici.calcolaMediana(coordinateX);
        const medianaY = algoritmiGeometrici.calcolaMediana(coordinateY);
        const puntoMediano = { x: medianaX, y: medianaY };

        return algoritmiGeometrici.returnCoordRaggio(punti, puntoMediano);
    },

    // Algoritmo per calcolare il centro di minima distanza
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

            return algoritmiGeometrici.returnCoordRaggio(punti, puntoMedio);
        }
        // Se i punti non sono collineari, si applica l'algoritmo iterativo di Weiszfeld
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

        return algoritmiGeometrici.returnCoordRaggio(punti, puntoFinale);
    },

    canter: punti => {
        try {
            algoritmiGeometrici.validaArrayPunti(punti);
            if (punti.length === 1) {
                return algoritmiGeometrici.returnCoordRaggio(punti, punti[0]);
            }
            let maxDist = 0;
            let coppia = null;

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
            if (punti.length < 3) {
                return {
                    punti: punti.slice().sort((a, b) => a.x - b.x || a.y - b.y),
                    area: 0,
                    perimetro: punti.length === 2 ? algoritmiGeometrici.distanzaTraPunti(punti[0], punti[1]) : 0
                };
            }
            const puntiOrdinati = punti.slice().sort((a, b) => a.x - b.x || a.y - b.y);
            const bordoInferiore = [];
            for (const p of puntiOrdinati) {
                // Rimuove i punti che creano concavità
                while (bordoInferiore.length >= 2 && algoritmiGeometrici.orientamentoCrossProduct(bordoInferiore[bordoInferiore.length - 2], bordoInferiore[bordoInferiore.length - 1], p) <= 0) {
                    bordoInferiore.pop();
                }
                bordoInferiore.push(p);
            }
            const bordoSuperiore = [];
            for (let i = puntiOrdinati.length - 1; i >= 0; i--) {
                const p = puntiOrdinati[i];
                while (bordoSuperiore.length >= 2 && algoritmiGeometrici.orientamentoCrossProduct(bordoSuperiore[bordoSuperiore.length - 2], bordoSuperiore[bordoSuperiore.length - 1], p) <= 0) {
                    bordoSuperiore.pop();
                }
                bordoSuperiore.push(p);
            }
            // Rimuove i punti duplicati
            bordoSuperiore.pop();
            bordoInferiore.pop();

            const hull = bordoInferiore.concat(bordoSuperiore);
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

    voronoi: function (punti) {
        algoritmiGeometrici.validaArrayPunti(punti);
        const margine = 500;
        const estremi = algoritmiGeometrici.trovaEstremi(punti);
        const estremiConMargine = {
            minX: estremi.minX - margine,
            minY: estremi.minY - margine,
            maxX: estremi.maxX + margine,
            maxY: estremi.maxY + margine
        };

        const triangolazioneObj = algoritmiGeometrici.delaunay(punti)
        ;
        if (!triangolazioneObj.oggetto) {
            return [];
        }

        const voronoi = triangolazioneObj.oggetto.voronoi([
            estremiConMargine.minX,
            estremiConMargine.minY,
            estremiConMargine.maxX,
            estremiConMargine.maxY
        ]);

        // Genera un poligono per ogni punto del Voronoi
        const poligoni = [];
        for (let i = 0; i < punti.length; i++) {
            const poligono = voronoi.cellPolygon(i);

            if (poligono) {
                poligoni.push({
                    site: punti[i],
                    polygon: poligono  // Array di coordinate [x,y] che formano il poligono
                });
            }
        }
        return poligoni;
    },

    delaunay: function (punti) {
        algoritmiGeometrici.validaArrayPunti(punti);
        if (punti.length < 3) {
            return {
                triangoli: [],
                oggetto: null,
                statistiche: {
                    numeroPunti: punti.length,
                    numeroTriangoli: 0
                }
            };
        }

        const flatPoints = punti.flatMap(p => [p.x, p.y]);
        const triangolazione = new d3.Delaunay(flatPoints);
        const risultato = {
            triangoli: [],
            oggetto: triangolazione,
            statistiche: {
                numeroPunti: punti.length,
                numeroTriangoli: triangolazione.triangles.length / 3
            }
        };
        // triangles contiene gli indici dei punti [i0,j0,k0, i1,j1,k1, ...]
        const triangles = triangolazione.triangles;
        for (let i = 0; i < triangles.length; i += 3) {
            // Estrae gli indici dei 3 punti del triangolo corrente
            const [indice1, indice2, indice3] = triangolazione.triangles.slice(i, i + 3);
            risultato.triangoli.push({
                punti: [
                    punti[indice1],
                    punti[indice2],
                    punti[indice3]
                ],
                indici: [indice1, indice2, indice3]
            });
        }
        return risultato;
    },

    voronoiDelaunay: function (punti) {
        // Verifica preventiva se ci sono abbastanza punti
        if (!punti || punti.length < 3) {
            return {
                punti,
                voronoi: [],
                triangolazione: { triangoli: [] },
                intersezioni: [],
                estremiVoronoi: [],
                estremiDelaunay: [],
                stats: {
                    tempo: new Date().toISOString(),
                    numPuntiInput: punti ? punti.length : 0,
                    segmentiVoronoi: 0,
                    segmentiDelaunay: 0,
                    intersezioniTrovate: 0
                }
            };
        }

        const triangolazione = algoritmiGeometrici.delaunay(punti);
        const voronoi = algoritmiGeometrici.voronoi(punti);
        const {
            intersezioni,
            estremiVoronoi,
            estremiDelaunay,
            stats
        } = algoritmiGeometrici.trovaIntersezioniVoronoiDelaunay(voronoi, triangolazione);

        return {
            punti,
            voronoi,
            triangolazione,
            intersezioni,
            estremiVoronoi,
            estremiDelaunay,
            stats: {
                tempo: new Date().toISOString(),
                numPuntiInput: punti.length,
                ...stats
            }
        };
    },

    trovaIntersezioniVoronoiDelaunay: function (voronoi, delaunay) {
        const tuttiPunti = [
            ...voronoi.flatMap(p => p.polygon.map(v => ({ x: v[0], y: v[1] }))),
            ...delaunay.triangoli.flatMap(t => t.punti)
        ];
        const riferimento = algoritmiGeometrici.trovaPuntoRiferimento(tuttiPunti);

        const estremiVoronoi = new Set();
        const estremiDelaunay = new Set();
        const puntiIntersezioni = [];   

        // Estrazione e normalizzazione segmenti Voronoi
        const segmentiVoronoi = algoritmiGeometrici.estraiSegmentiDaPoligoni(voronoi).map(seg => ({
            id: seg.id,
            chiave: seg.chiave,
            p1: algoritmiGeometrici.normalizzaPunto(seg.p1, riferimento),
            p2: algoritmiGeometrici.normalizzaPunto(seg.p2, riferimento)
        }));

        // Estrazione e normalizzazione segmenti Delaunay
        const segmentiDelaunay = algoritmiGeometrici.estraiSegmentiDaTriangoli(delaunay.triangoli).map(seg => ({
            id: seg.id,
            chiave: seg.chiave,
            p1: algoritmiGeometrici.normalizzaPunto(seg.p1, riferimento),
            p2: algoritmiGeometrici.normalizzaPunto(seg.p2, riferimento)
        }));

        // Funzione helper per aggiungere estremi con chiavi
        const aggiungiEstremi = (segmenti, setEstremi) => {
            segmenti.forEach(seg => {
                const keyP1 = `${seg.p1.x.toFixed(8)},${seg.p1.y.toFixed(8)}`;
                const keyP2 = `${seg.p2.x.toFixed(8)},${seg.p2.y.toFixed(8)}`;
                setEstremi.add(keyP1);
                setEstremi.add(keyP2);
            });
        };

        aggiungiEstremi(segmentiVoronoi, estremiVoronoi);
        aggiungiEstremi(segmentiDelaunay, estremiDelaunay);

        const puntiProcessati = new Set();
        const segmentiDelaunayConBB = segmentiDelaunay.map(seg => ({
            ...seg,
            minX: Math.min(seg.p1.x, seg.p2.x),
            maxX: Math.max(seg.p1.x, seg.p2.x),
            minY: Math.min(seg.p1.y, seg.p2.y),
            maxY: Math.max(seg.p1.y, seg.p2.y)
        }));

        for (const segV of segmentiVoronoi) {
            const minXV = Math.min(segV.p1.x, segV.p2.x);
            const maxXV = Math.max(segV.p1.x, segV.p2.x);
            const minYV = Math.min(segV.p1.y, segV.p2.y);
            const maxYV = Math.max(segV.p1.y, segV.p2.y);

            for (const segD of segmentiDelaunayConBB) {
                if (segD.minX > maxXV || segD.maxX < minXV ||
                    segD.minY > maxYV || segD.maxY < minYV) {
                    continue;
                }
                
                const intersezione = algoritmiGeometrici.trovaIntersezioneSegmenti(segV, segD);
                if (intersezione) {
                    const key = `${intersezione.x.toFixed(8)},${intersezione.y.toFixed(8)}`;

                    // Escludi intersezioni che sono estremi
                    if (estremiVoronoi.has(key) || estremiDelaunay.has(key)) {
                        continue;
                    }

                    if (!puntiProcessati.has(key)) {
                        puntiProcessati.add(key);
                        puntiIntersezioni.push(intersezione);
                    }
                }
            }
        }

        const convertiSetInPunti = set =>
            Array.from(set).map(s => {
                const [x, y] = s.split(',').map(Number);
                return { x, y };
            });

        return {
            intersezioni: puntiIntersezioni.map(p => algoritmiGeometrici.denormalizzaPunto(p, riferimento)),
            estremiVoronoi: convertiSetInPunti(estremiVoronoi).map(p => algoritmiGeometrici.denormalizzaPunto(p, riferimento)),
            estremiDelaunay: convertiSetInPunti(estremiDelaunay).map(p => algoritmiGeometrici.denormalizzaPunto(p, riferimento)),
            stats: {
                segmentiVoronoi: segmentiVoronoi.length,
                segmentiDelaunay: segmentiDelaunay.length,
                intersezioniTrovate: puntiIntersezioni.length
            }
        };
    },

    // Estrae i segmenti da un array di poligoni di Voronoi
    estraiSegmentiDaPoligoni: function (poligoni) {
/*
        if (poligoni.length > 0) {
            const esempioPol = poligoni[0];
            console.log('Struttura poligono Voronoi:', {
                site: esempioPol.site ? { x: esempioPol.site.x, y: esempioPol.site.y } : 'mancante',
                polygon: esempioPol.polygon ? `Array con ${esempioPol.polygon.length} vertici` : 'mancante',
                primiVertici: esempioPol.polygon && esempioPol.polygon.length > 0 ?
                    esempioPol.polygon.slice(0, 2).map(v => `[${v}]`) : 'nessuno'
            });
        }
*/

        const segmentiUnici = new Set();
        const segmenti = [];
        let segmentoId = 1;

        poligoni.forEach((poligono, poligonoIdx) => {
            if (!poligono.polygon || !Array.isArray(poligono.polygon)) {
                console.error('Formato poligono non valido:', poligono);
                return;
            }

            // Converti i vertici del poligono in oggetti {x,y}
            const vertici = poligono.polygon.map(punto => {
                if (!Array.isArray(punto) || punto.length < 2) {
                    console.error('Formato punto non valido:', punto);
                    return null;
                }
                return { x: punto[0], y: punto[1] };
            }).filter(Boolean);

            // Crea i segmenti tra i vertici
            for (let i = 0; i < vertici.length; i++) {
                const p1 = vertici[i];
                const p2 = vertici[(i + 1) % vertici.length];

                // Crea una chiave univoca per ogni segmento, ordinando le coordinate
                const [minX, maxX] = p1.x <= p2.x ? [p1.x, p2.x] : [p2.x, p1.x];
                const [minY, maxY] = p1.y <= p2.y ? [p1.y, p2.y] : [p2.y, p1.y];
                const segKey = `${minX.toFixed(6)},${minY.toFixed(6)}-${maxX.toFixed(6)},${maxY.toFixed(6)}`;

                if (segmentiUnici.has(segKey)) {
                    continue;
                }
                segmentiUnici.add(segKey);
                segmenti.push({
                    id: `V${segmentoId}`,
                    p1: p1,
                    p2: p2,
                    poligono: poligonoIdx,
                    chiave: segKey
                });
                segmentoId++;
            }
        });
        return segmenti;
    },

    estraiSegmentiDaTriangoli: function (triangoli) {
        const segmenti = [];
        const segmentiUnici = new Map();
        let segmentoId = 1;

        triangoli.forEach((triangolo, triangoloIdx) => {
            const [p0, p1, p2] = triangolo.punti;
            const lati = [
                [p0, p1],
                [p1, p2],
                [p2, p0]
            ];

            lati.forEach(([pA, pB], latoIdx) => {
                const [first, second] = pA.x < pB.x || (pA.x === pB.x && pA.y < pB.y)
                    ? [pA, pB]
                    : [pB, pA];

                // Crea chiave univoca
                const key = `${first.x},${first.y}|${second.x},${second.y}`;

                if (!segmentiUnici.has(key)) {

                    const nuovoSegmento = {
                        id: `D${segmentoId}`,
                        p1: pA,
                        p2: pB,
                        triangolo: triangoloIdx,
                        chiave: key
                    };

                    segmenti.push(nuovoSegmento);
                    segmentiUnici.set(key, true);
                    segmentoId++;
                }
            });
        });
        return segmenti;
    },

    trovaIntersezioneSegmenti: function (seg1, seg2) {
        const EPSILON = 1e-10;
        
        if (!seg1 || !seg2 || !seg1.p1 || !seg1.p2 || !seg2.p1 || !seg2.p2) {
            return null;
        }    
        if (seg1.chiave === seg2.chiave) {
            return null;
        }
    
        const p1 = seg1.p1, p2 = seg1.p2;
        const p3 = seg2.p1, p4 = seg2.p2;    
        // Calcola i denominatori
        const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
        const numera = (p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x);
        const numerb = (p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x);    
        // Segmenti coincidenti o paralleli
        if (Math.abs(denom) < EPSILON) {
            return null;
        }
    
        const mua = numera / denom;
        const mub = numerb / denom;  

        if (mua >= -EPSILON && mua <= 1 + EPSILON && mub >= -EPSILON && mub <= 1 + EPSILON) {            
            // Calcola punto di intersezione
            const x = p1.x + mua * (p2.x - p1.x);
            const y = p1.y + mua * (p2.y - p1.y);
            
            return {
                x: x,
                y: y,
                segmenti: {
                    voronoi: seg1.id.startsWith('V') ? seg1.id : seg2.id,
                    delaunay: seg1.id.startsWith('D') ? seg1.id : seg2.id
                }
            };
        }        
        return null;
    },

    // Verifica se un punto è già presente nell'array entro una certa tolleranza
    puntoGiàPresente: function (punto, arrayPunti, tolleranza = window.SQRT_EPSILON) {
        return arrayPunti.some(p => {
            const dx = p.x - punto.x;
            const dy = p.y - punto.y;
            return dx * dx + dy * dy < tolleranza;
        });
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

    calcolaRaggioMinimo: (punti, centro) => {
        return Math.min(...punti.map(p => algoritmiGeometrici.distanzaTraPunti(p, centro)));
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
    },

    estraiSegmenti(geometrie, getVertici) {
        const segmenti = [];
        for (const geo of geometrie) {
            const vertici = getVertici(geo);
            for (let i = 0; i < vertici.length; i++) {
                const p1 = vertici[i];
                const p2 = vertici[(i + 1) % vertici.length];
                segmenti.push({ p1, p2 });
            }
        }
        return segmenti;
    },
    normalizzaPunto: (punto, riferimento) => ({
        x: (punto.x - riferimento.x) / 10000,
        y: (punto.y - riferimento.y) / 10000
    }),

    denormalizzaPunto: (punto, riferimento) => ({
        x: punto.x * 10000 + riferimento.x,
        y: punto.y * 10000 + riferimento.y
    }),

    trovaPuntoRiferimento: (punti) => {
        const allX = punti.map(p => p.x);
        const allY = punti.map(p => p.y);
        return {
            x: Math.min(...allX),
            y: Math.min(...allY)
        };
    },
    
    orientamentoCrossProduct: (o, a, b) => {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    },

    returnCoordRaggio: (punti, coord) => {
        return {
            ...coord,
            raggio: algoritmiGeometrici.calcolaRaggioMassimo(punti, coord)
        };
    }
};