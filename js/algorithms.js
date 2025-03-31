/**
 * Algoritmi per l'analisi dei punti:
 * 
 * 1) calcolaRaggioMassimo: Determina la distanza massima da un punto centrale
 * 2) algoritmiGeometrici - Contiene tre metodi di analisi:
 *    - centroide: Calcola il baricentro geometrico
 *    - fermat: Trova il punto che minimizza le distanze (algoritmo di Weiszfeld)
 *    - canter: Identifica l'area circolare minima che contiene tutti i punti
 */

const calcolaRaggioMassimo = (points, center) => Math.max(...points.map(p =>
    Math.hypot(p.x - center.x, p.y - center.y))
);

const algoritmiGeometrici = {
    centroide: punti => {
        const somma = punti.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y
        }), { x: 0, y: 0 });
        
        return {
            x: somma.x / punti.length,
            y: somma.y / punti.length,
            raggio: calcolaRaggioMassimo(punti, {
                x: somma.x / punti.length,
                y: somma.y / punti.length
            })
        };
    },

    fermat: punti => {
        if (punti.length < 3) return algoritmiGeometrici.centroide(punti);

        let isCollineare = true;
        for (let i = 2; i < punti.length; i++) {
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
            
            const midPoint = {
                x: (minX + maxX) * 0.5,
                y: (minY + maxY) * 0.5,
                raggio: calcolaRaggioMassimo(punti, {
                    x: (minX + maxX) * 0.5,
                    y: (minY + maxY) * 0.5
                })
            };
            return midPoint;
        }

        // Algoritmo di Weiszfeld
        let punto = algoritmiGeometrici.centroide(punti);
        let prevX = punto.x, prevY = punto.y;

        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
            let sumX = 0, sumY = 0, sumW = 0;

            for (const p of punti) {
                const dx = p.x - prevX;
                const dy = p.y - prevY;
                const dist = Math.sqrt(dx * dx + dy * dy + SQRT_EPSILON);
                const invDist = 1 / dist;

                sumX += p.x * invDist;
                sumY += p.y * invDist;
                sumW += invDist;
            }

            const newX = sumX / sumW;
            const newY = sumY / sumW;
            const dx = newX - prevX;
            const dy = newY - prevY;

            if (dx * dx + dy * dy < POSITION_TOLERANCE) break;

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
        if (punti.length <= 1) return { 
            ...(punti[0] || { x: 0, y: 0 }), 
            raggio: 0 
        };

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
    }
};
