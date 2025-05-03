/**
 * Dataset dei luoghi rilevanti e funzione di conversione
 * in coordinate UTM per l'analisi geospaziale.
 * 
 * Contiene:
 * - Delitti principali con anno di riferimento
 * - Omicidi collaterali
 * - Punti di interesse
 * - Abitazioni dei sospettati
 * - Abitazioni delle vittime
 * - Funzione per la conversione in coordinate UTM
 */
const rawData = {
    delitti: [
        // Luogo dell'omicidio Bar. Loc. e Ant. LoB.
        [43.79475, 11.08234, 'Castelletti Signa 1968'],

        // Luogo dell'omicidio Ste. Pet. e Pas. Gen.
        [43.938899, 11.416420, 'Fontanine Rabatta 1974'],

        // Luogo dell'omicidio di Car. DeN. e Gio. Fog.
        [43.733065, 11.168895, 'Mosciano Scandicci 1981'],

        // Luogo dell'omicidio di Sus. Cam. e Ste. Bal. 
        [43.871668, 11.158981, 'Le Bartoline Calenzano 1981'],

        // Luogo dell'omicidio di Ant. Mig. e Pao. Mai.
        [43.654446, 11.090850, 'Baccaiano Montespertoli 1982'],

        // Luogo dell'omicidio di W.F.Hor.Mey. e U.J.Rüs.
        [43.732077, 11.206387, 'Giogoli Impruneta 1983'],

        // Luogo dell'omicidio di Cla. Ste. e Pia Ron.
        [43.919017, 11.498061, 'La Boschetta Vicchio 1984'],

        // Luogo dell'omicidio di Nad. Mau. e J.M. Kra. 
        [43.694202, 11.201946, 'Scopeti 1985']
    ],

    omicidiCollaterali: [
        // Omicidio irrisolto di Mir. Esc. trovata strangolata in una traversa di via Bolognese
        // Possibile riferimento (M.E. 72) nella lettera a Vagheggi
        [43.80539, 11.26153, 'Mir. Esc. 1972'],

        // Marito di Mar.Ant.Sper.Trovato impiccato nella stalla di casa, archiviato come suicidio.
        [43.6857, 11.19179, 'Ren. Mal. (?) 1980'],

        // Prostituta fiorentina citata nel processo ai CdM. Ufficialmente la donna morì cadendo dalle scale di casa sua​.
        [43.79946, 11.23883, 'Gin. Man. 1981'],

        // Ritrovata dalla coinquilina, colpita da 17 coltellate al petto, inguine e collo.
        [43.77293, 11.25029, 'Giu. Mon. 1982'],

        // Trovata morta mentre era in vacanza in Sicilia. Numerose ferite da taglio sul corpo
        // Era vicina di casa di Sus. Cam., una delle vittime del mostro
        [36.72118, 14.73763, 'Eli. Ciab. B.S. 1982'],

        // Prostituta frequentata da MV. Trovata morta nella sua abitazione.
        // Coltellate sul corpo e soffocata con il filo del telefono.
        [43.76334, 11.27619, 'Cle. Cusc. 1983'],

        // Duplice omicidio alle porte di Lucca, in un luogo appartato frequentato da coppiette.
        // I due fidanzati furono trovati nella loro auto crivellati da cinque colpi di pistola calibro .22​
        // con bossoli di marca Lapua
        [43.85243, 10.48713, 'Ben. Rig. 1984'],

        // Trovata morta in una traversa di via Bolognese, come Mir. Esc.
        // Segni di strangolamento e cinque coltellate.
        [43.811972, 11.272342, 'Gab. Car. 1984'],

        // Cadavere carbonizzato trovato in un prato. Presenza di una Golf rubata di colore verde.
        [43.95698, 11.21286, 'Donna trovata carbonizzata 1984'],

        // Prostituta trovata strangolata nell'appartamento in cui esercitava.
        [43.77380, 11.24672, 'Giu. Bas. 1984'],

        // Cercatore di funghi trovato morto in una zona frequentata da guardoni.
        [43.79662, 11.30643, 'Bru. Bor. 1984'],

        // Prostituta trovata morta nel suo appartamento, soffocata e con le braccia legate al corpo.
        [43.76635, 11.24449, 'Lui. Meo. 1984'],

        // Ragazza trovata morta vicino a dove venne trovato il cadavere di Bru. Bor.
        [43.79459, 11.29358, 'Car. Fan. 1985'],

        // Trovato impiccato nella sua cella a pochi giorni dalla scadenza della detenzione
        [43.76915, 11.17299, 'Vin. Lim. 1991'],

        // Trovati carbonizzati nel bagagliaio dell'auto di Fra.Vin.
        [43.66751, 10.36432, 'Fra.Vin. Ang.Var. 1993'],

        // Figlia e nipote di Ren.Mal. trovati carbonizzati all'interno di un'auto in una scarpata
        [43.51866, 11.12832, 'Mil.Mal. Mir.Mal. 1993'],

        // Prostituta trovata morta nel suo appartamento da una coinquilina, convivente del figlio di Fra.Vin.
        [43.79657, 11.12345, 'Ann. Mat. 1994'],

        // Tassista, fu assassinata durante una corsa notturna a Siena. 
        [43.47351, 11.28957, 'Ale. Van. Siena22 1997'],

        // Trovato morto impiccato nella sua abitazione. Svolgeva ricerche su sette e gruppi religiosi.
        // Probabile corrispondenza e incontro con Eli.Cia.
        [45.53107, 12.19281, 'Mau. Ant. 2003']
    ],

    puntiInteresse: [

        // Possibile origine delle munizioni usate dal Mostro.
        [43.6497, 10.3239, 'Camp Darby'],

        // Bar frequentato da alcuni dei CdM
        [43.7338035, 11.2065226, 'Bar Centrale San Casciano'],

        // Cinema frequentato da Bar.Loc. e Ant. LoB.
        [43.7806324, 11.0963065, 'Cinema Giardino Michelacci'],

        // Ponte dove fu lasciato Nat. Mel.
        [43.7969636, 11.0856268, 'Ponte alle Palle'],
        [43.8023238, 11.0909141, 'Primo ponte via dei Sodi'],
        [43.8074198, 11.0954578, 'Secondo ponte via dei Sodi'],

        // Discoteca dove Pas.Gen. lasciò la sorella.
        [43.9541819, 11.3907706, 'Discoteca Teen Club'],

        // Locale frequentato da guardoni
        [43.7233708, 11.146381, 'Taverna Diavolo'],

        // Due fidanzati incrociano auto rossa sportiva
        [43.8609502, 11.1551875, 'Auto rossa Ponte Torrente Marina 1981'],

        // Abitazione dell'uomo che trovò i tedeschi
        [43.7338035, 11.2065226, 'Abit. Rol. Rei. 1983'],
        [43.73306552, 11.20698601, 'Villa La Sfacciata'],

        // Bar dove lavorava Pia Ron.
        [43.9337263, 11.4583901, 'Bar La Nuova Spiaggia'],

        // Bar gestito da un testimone
        [43.9610135, 11.3564882, 'Bar Bardazzi'],

        // Trattoria nei pressi della piazzola degli Scopeti
        [43.6918710, 11.2014136, 'Tratt. Baracchina'],

        // Festa dell'Unità di Cerbaia, dove furono visti i due turisti francesi prima dell'ultimo delitto.
        [43.6851916, 11.1317787, 'Festa Unità di Cerbaia'],

        // Luogo da cui fu spedita la lettera alla PM SDM
        [43.95909, 11.32101, 'Poste S.Piero a Sieve'],

        [43.66697941313906, 11.193038632792693, 'Cimitero San Casciano']
    ],

    abitazioniSospettati: [
        // Abitazioni sardi
        [43.7670, 11.1172, 'Casa Fra. Vin.'],
        [43.8808, 11.0966, 'Casa Sal. Vin.'],

        // Abitazioni CdM    
        [43.6347, 11.2328, 'Casa Pie. Pac.'],
        [43.6546, 11.18356, 'Casa Mar. Van.'],
        [43.6558, 11.18414, 'Casa Gia. Lot.'],
        //[,'Casa Faggi'],
        //[43.6531, 11.1819, 'Casa Pucci'],

        // Altri
        [43.6932, 11.2070, 'Cim. Falciani'],
        [43.8843448, 11.1028289, 'Casa Gia. Vig.'],
        [43.9651471, 11.4654640, 'Casa Madre Gia. Vig.'],
        [43.1283, 12.1700, 'Villa Fra. Nar.'],
        [43.657073, 11.185923,'Casa Fra. Cal.'],
        [43.685244, 11.191890, 'Casa Sal. Ind.']
    ],

    abitazioniVittime: [
        [43.7706075, 11.1117782, 'Casa Ste. Mel. - Bar. Loc.'],

        [43.7715977, 11.1068373, 'Casa Ant. LoB.'],
        [43.8083887, 11.0963123, 'Casa Fra. DeF.'],

        [43.810167, 11.399329, 'Casa Pas. Gen.'],
        [43.942676, 11.4412496, 'Casa Ste. Pet.'],

        [43.7584008, 11.1970467, 'Casa Car. DeN.'],
        [43.7733886, 11.4347534, 'Casa Gio. Fog.'],

        [43.782659, 11.240787, 'Casa Sus. Cam.'],
        [43.7816133, 11.2392434, 'Casa prov. Sus. Cam.'],
        [43.8663673, 11.1426719, 'Casa Ste. Bal.'],

        [43.6389567, 11.0818644, 'Casa Pao. Mai.'],
        [43.6464069, 11.0624505, 'Casa Ant. Mig.'],

        [43.9333951, 11.4626938, 'Casa Pia. Ron.'],
        [43.9332041, 11.4645859, 'Casa Cla. Ste.']
    ]
};

const convertiInUTM = data => data.map(([lat, lon, label]) => {
    const [x, y] = proj4('EPSG:4326', 'EPSG:32632', [lon, lat]);
    const yearMatch = label.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    return { x, y, label, lat, lon, year };
});
