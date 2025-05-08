## Analisi Geospaziale dei Delitti del Mostro di Firenze

Dashboard interattiva per l'analisi spaziale dei delitti attribuiti al Mostro di Firenze.

[geospatial-analysis-dashboard](https://xposterjb.github.io/geospatial-analysis-dashboard/)

Include i principali luoghi legati al caso MdF:

- Delitti principali e omicidi collaterali  
- Abitazioni di vittime, indagati, principali sospettati e persone d'interesse  
- Luoghi d'interesse investigativo

### Funzionalità principali

- Mappa interattiva basata su Leaflet  
- Timeline per filtrare gli eventi per anno  
- Filtri configurabili per categoria di evento  
- Algoritmi di analisi spaziale:
  - Baricentro geometrico  
  - Mediana delle coordinate  
  - Centro di minima distanza (Punto di Fermat)  
  - Centro di Canter  
  - Centro di Probabile Residenza (CPR) con parametri configurabili  
  - Convex Hull  
  - Mean Interpoint Distance (MID)  
  - Nearest Neighbour Index (NNI)  
- Aggiunta manuale di nuovi punti sulla mappa  
- Strumenti di disegno di base  
- Visualizzazione di etichette e dettagli per ciascun punto

### In sviluppo / Aggiornamenti futuri

- Salvataggio locale dei punti di interesse  
- Esportazione dei dati e delle analisi  
- Miglioramenti all’accessibilità e all’interfaccia  
- Ottimizzazione delle prestazioni  
- Revisione del dataset  
- Documentazione più dettagliata

### Centro di Probabile Residenza (CPR)

Il CPR è un algoritmo iterativo che assegna a ciascun luogo un peso in base alla distanza dal baricentro dei delitti, al delta temporale e al tipo di punto (delitto, luogo d’interesse, ecc.).  
Questo metodo non ha valenza criminologica o scientifica, ma può essere utile per testare ipotesi avanzate in modo esplorativo.

### Fonti

I luoghi, le coordinate, le informazioni sui delitti e i metodi di analisi geospaziale sono stati ricavati da diverse fonti, tra cui:

- [mostrodifirenze.com](https://www.mostrodifirenze.com/)  
- [insufficienzadiprove.blogspot.com](https://insufficienzadiprove.blogspot.com/)  
- [quattrocosesulmostro.blogspot.com](https://quattrocosesulmostro.blogspot.com/)  
- [mostrologia.blogspot.com](https://mostrologia.blogspot.com/)  
- [mdf-alias-mostrodifirenze.blogspot.com](https://mdf-alias-mostrodifirenze.blogspot.com/)

Il dataset si trova nel file `data.js`.  
Segnalazioni di errori e inesattezze sono benvenute.
