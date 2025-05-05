/**
 * Algoritmi per l'analisi criminologica.
 * Strumenti inclusi:
 *
 * 1. calcolaRaggioMassimo:
 *    - Determina la distanza massima di un insieme di punti da un punto centrale.
 * 
 * 2. algoritmiGeometrici:
 *    - baricentro:
 *        Calcola la media aritmetica delle coordinate dei punti (centroide geometrico).
 *    - centro di minima distanza (CMD) - punto di Fermat:
 *        Trova il punto che minimizza la somma delle distanze euclidee da tutti i punti.
 *        Implementa l'algoritmo di Weiszfeld.
 *    - Canter:
 *        Identifica il centro del cerchio avente come diametro la coppia di punti più distanti.
 *        Può non contenere tutti i punti.
 *    - centroProbabileResidenza (CPR):
 *        Calcola un punto pesato che stima la probabile zona di residenza del colpevole.
 *        I pesi decrescono con la distanza, il tempo e la tipologia dell’evento.
 *        È un algoritmo iterativo basato su una variante pesata del centro di Fermat.
 *    - convexHull:
 *        Calcola il minimo poligono convesso che racchiude tutti i punti (Convex Hull).
 *        Utile per comprendere l'estensione spaziale dei delitti.
 *    - calcolaDeviazioneStandardDistanze:
 *        Misura la dispersione dei punti rispetto a un centro dato.
 */

const SQRT_EPSILON = window.SQRT_EPSILON;
const COLLINEARITY_THRESHOLD = window.COLLINEARITY_THRESHOLD;
const MAX_ITERATIONS = window.MAX_ITERATIONS;
const POSITION_TOLERANCE = window.POSITION_TOLERANCE;

const median = punti => {
    if (punti.length === 0) return { x: 0, y: 0, raggio: 0 };
    const medianCoord = axis => {
        const values = punti.map(p => p[axis]).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        return values.length % 2 === 0
            ? (values[mid - 1] + values[mid]) / 2
            : values[mid];
    };
    const x = medianCoord('x');
    const y = medianCoord('y');
    return {
        x,
        y,
        raggio: calcolaRaggioMassimo(punti, { x, y })
    };
};

const calcolaRaggioMassimo = (points, center) => Math.max(...points.map(p =>
    Math.hypot(p.x - center.x, p.y - center.y)
));

const algoritmiGeometrici = {
    baricentro: punti => {
        /* Calcolo somma delle coordinate. acc (accumulo), p (punto) */
        const somma = punti.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y
        }), { x: 0, y: 0 });
        return {
            /* Restituisce media delle coordinate e raggio massimo */
            x: somma.x / punti.length,
            y: somma.y / punti.length,

            raggio: calcolaRaggioMassimo(punti, {
                x: somma.x / punti.length,
                y: somma.y / punti.length
            })
        };
    },

    fermat: punti => {
        /* Per meno di 3 punti restituisce il baricentro */
        if (punti.length < 3) return algoritmiGeometrici.baricentro(punti);

        /* Valuta se i punti sono collineari */
        let isCollineare = true;
        for (let i = 2; i < punti.length; i++) {

            /* Calcola il doppio dell'area di tre punti. Se questa è maggiore della soglia i punti non sono collineari */
            const area = Math.abs(
                (punti[1].x - punti[0].x) * (punti[i].y - punti[0].y) -
                (punti[1].y - punti[0].y) * (punti[i].x - punti[0].x)
            );
            if (area > COLLINEARITY_THRESHOLD) {
                isCollineare = false;
                break;
            }
        }

        if (isCollineare) {
            const minX = Math.min(...punti.map(p => p.x));
            const maxX = Math.max(...punti.map(p => p.x));
            const minY = Math.min(...punti.map(p => p.y));
            const maxY = Math.max(...punti.map(p => p.y));
            
            return {
                /* Se collineari restituisce il punto medio tra le coordinate min e max */
                x: (minX + maxX) * 0.5,
                y: (minY + maxY) * 0.5,
                raggio: calcolaRaggioMassimo(punti, {
                    x: (minX + maxX) * 0.5,
                    y: (minY + maxY) * 0.5
                })
            };
        }

        /* Parto dal baricentro */
        let punto = algoritmiGeometrici.baricentro(punti);
        let prevX = punto.x, prevY = punto.y;

        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
            let sumX = 0, sumY = 0, sumW = 0;

            for (const p of punti) {
                /* Per ogni punto p calcolo la distanza x y con il precedente */
                const dx = p.x - prevX;
                const dy = p.y - prevY;

                /* Trovo la distanza. Aggiungo epsilon per evitare divisioni per zero */
                const dist = Math.sqrt(dx * dx + dy * dy + SQRT_EPSILON);

                /* Uso il reciproco della distanza come peso */
                const invDist = 1 / dist;
                sumX += p.x * invDist;
                sumY += p.y * invDist;

                /* Somma dei pesi totali */
                sumW += invDist;
            }

            const newX = sumX / sumW;
            const newY = sumY / sumW;
            const dx = newX - prevX;
            const dy = newY - prevY;

            /* Se il nuovo punto è molto vicino a quello precedente interrompo il ciclo */
            if (dx * dx + dy * dy < POSITION_TOLERANCE) break;

            /* Smorzo il salto al nuovo punto per avere maggiore stabilità */
            prevX += 0.67 * dx;
            prevY += 0.67 * dy;
        }
        return {
            x: prevX,
            y: prevY,
            raggio: calcolaRaggioMassimo(punti, { x: prevX, y: prevY })
        };
    },

    canter: punti => {
        if (punti.length <= 1) {
            return { ...(punti[0] || { x: 0, y: 0 }), raggio: 0 };
        }
        let maxDist = 0;
        let coppia = null;
        for (let i = 0; i < punti.length; i++) {
            for (let j = i + 1; j < punti.length; j++) {
                const dist = Math.hypot(
                    punti[i].x - punti[j].x,
                    punti[i].y - punti[j].y
                );
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

    centroProbabileResidenza: punti => {
        if (punti.length === 0) return { x: 0, y: 0 };

        /* Parto dal baricentro */
        const baricentroIniziale = algoritmiGeometrici.baricentro(punti.map(p => ({ x: p.x, y: p.y })));
        
        /* Trovo l'anno più recente tra tutti i punti */
        const annoMassimo = Math.max(...punti.map(p => p.year || 1985));

        const datasetPesi = punti.map(p => {

            /* Peso relativo alla distanza dal centro iniziale. Più è lontano e meno pesa */
            const dist = Math.hypot(p.x - baricentroIniziale.x, p.y - baricentroIniziale.y);
            const journeyWeight = Math.exp(-0.5 * Math.pow(dist / 5000, 2));

            /* Peso relativo al tempo trascorso. Più è vecchio e meno conta */
            const deltaAnni = annoMassimo - (p.year || annoMassimo);
            const decayTime = Math.exp(-0.25 * deltaAnni);
            
            /* Ipotesi che le morti collaterali siano meno informnative (peso 0.3) */
            const pesoTipo = (p.pesoBase !== undefined) ? p.pesoBase : 1.0;
            return {
                /* restituisce il punto e il suo peso finale (media ponderata dei tre pesi calcolati) */
                x: p.x,
                y: p.y,
                peso: 0.333 * pesoTipo + 0.333 * journeyWeight + 0.333 * decayTime
            };
        });

        let centro = { ...baricentroIniziale };
        let delta = Infinity;
        let iter = 0;
        while (delta > 1e-8 && iter < MAX_ITERATIONS) {
            let sumX = 0, sumY = 0, sumW = 0;
            datasetPesi.forEach(p => {
                const dist = Math.hypot(p.x - centro.x, p.y - centro.y) + SQRT_EPSILON;
                sumX += (p.peso * p.x) / dist;
                sumY += (p.peso * p.y) / dist;
                sumW += p.peso / dist;
            });
            const newX = sumX / sumW;
            const newY = sumY / sumW;
            delta = Math.hypot(newX - centro.x, newY - centro.y);
            centro = { x: newX, y: newY };
            iter++;
        }
        return centro;
    },

    convexHull: function (points) {
        const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
        const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        const lower = [];
        for (const p of sorted) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
                lower.pop();
            }
            lower.push(p);
        }
        const upper = [];
        for (let i = sorted.length - 1; i >= 0; i--) {
            const p = sorted[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
                upper.pop();
            }
            upper.push(p);
        }
        upper.pop();
        lower.pop();
        return lower.concat(upper);
    },

    calcolaDeviazioneStandardDistanze: (punti, centro) => {
        if (punti.length === 0) return 0;
        const distanze = punti.map(p => Math.hypot(p.x - centro.x, p.y - centro.y));
        const media = distanze.reduce((acc, d) => acc + d, 0) / distanze.length;
        const varianza = distanze.reduce((acc, d) => acc + Math.pow(d - media, 2), 0) / distanze.length;
        return Math.sqrt(varianza);
    }
};
