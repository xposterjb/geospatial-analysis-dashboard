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
        // Data e orario: 22 agosto 1968 tra le 00:15 e le 00:25
        [
            43.79475, 11.08234,
            'Castelletti Signa 1968',
            null,
            { url: 'https://www.mostrodifirenze.com/1968/08/21/21-agosto-1968-delitto-di-barbara-locci-e-antonio-lo-bianco-a-signa/', nome: 'MostroDiFirenze.com - Delitto di Barbara Locci e Antonio Lo Bianco a Signa' },
            { url: 'https://www.mostrodifirenze.com/1968/08/22/21-agosto-1968-mappa-del-delitto-di-signa/', nome: 'MostroDiFirenze.com - Mappa del delitto di Signa' },
            0 
        ],

        // Luogo dell'omicidio Ste. Pet. e Pas. Gen.
        // Data e orario: 14-15 settembre 1974 tra le 21:00 e le 07:30 (testimoni sentono spari alle 23:45)
        [
            43.938899, 11.416420,
            'Fontanine Rabatta 1974',
            null,
            { url: 'https://www.mostrodifirenze.com/1974/09/15/15-settembre-1974-mattina-delitto-stefania-pettini-e-pasquale-gentilcore-a-borgo-san-lorenzo/', nome: 'MostroDiFirenze.com - Delitto di Stefania Pettini e Pasquale Gentilcore a Borgo San Lorenzo' },
            { url: 'https://www.mostrodifirenze.com/1974/09/15/14-settembre-1974-mappa-del-delitto-di-borgo-san-lorenzo/', nome: 'MostroDiFirenze.com - Mappa del delitto di Borgo San Lorenzo' },
            0 
        ],

        // Luogo dell'omicidio di Car. DeN. e Gio. Fog.
        // Data e orario: 6-7 giugno 1981 tra le 22:30 e la mattina seguente
        [
            43.733065, 11.168895,
            'Mosciano Scandicci 1981',
            null,
            { url: 'https://www.mostrodifirenze.com/1981/06/06/6-giugno-1981-notte-delitto-di-carmela-de-nuccio-e-giovanni-foggi-a-scandicci/', nome: 'MostroDiFirenze.com - Delitto di Carmela De Nuccio e Giovanni Foggi a Scandicci' },
            { url: 'https://www.mostrodifirenze.com/1981/06/06/6-giugno-1981-mappa-del-delitto-di-mosciano/', nome: 'MostroDiFirenze.com - Mappa del delitto di Mosciano' },
            0 
        ],

        // Luogo dell'omicidio di Sus. Cam. e Ste. Bal.
        // Data e orario: 22-23 ottobre 1981 tra le 23:00 e la mattina seguente
        [
            43.871668, 11.158981,
            'Le Bartoline Calenzano 1981',
            null,
            { url: 'https://www.mostrodifirenze.com/1981/10/22/22-ottobre-1981-delitto-di-susanna-cambi-e-stefano-baldi-a-calenzano/', nome: 'MostroDiFirenze.com - Delitto di Susanna Cambi e Stefano Baldi a Calenzano' },
            { url: 'https://www.mostrodifirenze.com/1981/10/22/22-ottobre-1981-mappa-del-delitto-di-calenzano/', nome: 'MostroDiFirenze.com - Mappa del delitto di Calenzano' },
            0 
        ],

        // Luogo dell'omicidio di Ant. Mig. e Pao. Mai.
        // Data e orario: 19 giugno 1982 tra le 23:40 e le 23:45
        [
            43.654446, 11.090850,
            'Baccaiano Montespertoli 1982',
            null,
            { url: 'https://www.mostrodifirenze.com/1982/06/19/19-giugno-1982-delitto-di-antonella-migliorini-e-paolo-mainardi/', nome: 'MostroDiFirenze.com - Delitto di Antonella Migliorini e Paolo Mainardi a Baccaiano' },
            { url: 'https://www.mostrodifirenze.com/1982/06/19/19-giugno-1982-mappa-del-delitto-di-baccaiano/', nome: 'MostroDiFirenze.com - Mappa del delitto di Baccaiano' },
            0 
        ],

        // Luogo dell'omicidio di W.F.Hor.Mey. e U.J.Rüs.
        // Data e orario: 9-10 settembre 1983 notte del 9
        [
            43.732077, 11.206387,
            'Giogoli Impruneta 1983',
            null,
            { url: 'https://www.mostrodifirenze.com/1983/09/09/9-settembre-1983-delitto-di-wilhelm-friedrich-horst-meyer-e-uwe-jens-rusch/', nome: 'MostroDiFirenze.com - Delitto di Wilhelm Friedrich Horst Meyer e Uwe Jens Rüs' },
            { url: 'https://www.mostrodifirenze.com/1983/09/09/9-settembre-1983-mappa-del-delitto-di-giogoli/', nome: 'MostroDiFirenze.com - Mappa del delitto di Giogoli' },
            0 
        ],

        // Luogo dell'omicidio di Cla. Ste. e Pia Ron.
        // Data e orario: 29 luglio 1984 tra le 21:30 e la mattina seguente (testimoni sentono spari alle 21:45)
        [
            43.919017, 11.498061,
            'La Boschetta Vicchio 1984',
            null,
            { url: 'https://www.mostrodifirenze.com/1984/07/29/29-luglio-1984-delitto-di-pia-rontini-e-claudio-stefanacci/', nome: 'MostroDiFirenze.com - Delitto di Pia Rontini e Claudio Stefanacci a La Boschetta' },
            { url: 'https://www.mostrodifirenze.com/1984/07/29/29-luglio-1984-mappa-del-delitto-del-la-boschetta/', nome: 'MostroDiFirenze.com - Mappa del delitto di La Boschetta' },
            0 
        ],

        // Luogo dell'omicidio di Nad. Mau. e J.M. Kra. 
        // Data e orario: 8-9 settembre 1985 (testimoni sentono spari alle 22:30 del 7 settembre)
        [
            43.694202, 11.201946,
            'Scopeti 1985',
            null,
            { url: 'https://www.mostrodifirenze.com/1985/09/08/8-settembre-1985-delitto-di-nadine-mauriot-e-jean-michel-kraveichvili/', nome: 'MostroDiFirenze.com - Delitto di Nadine Mauriot e Jean-Michel Kraveichvili a Scopeti' },
            { url: 'https://www.mostrodifirenze.com/1985/09/08/6-7-8-settembre-1985-mappa-del-delitto-dei-scopeti/', nome: 'MostroDiFirenze.com - Mappa del delitto di Scopeti' },
            0 
        ],        
    ],

    omicidiCollaterali: [
        // Omicidio irrisolto di Mir. Esc. trovata strangolata in una traversa di via Bolognese
        // Possibile riferimento (M.E. 72) nella lettera a Vagheggi
        // Data 22 marzo 1972
        [
            43.80539, 11.26153,
            'Mir. Escobar 1972',
            null,
            { url: 'https://www.mostrodifirenze.com/1972/03/22/22-marzo-1972-delitto-di-miriam-ana-escobar/', nome: 'MostroDiFirenze.com - Delitto di Miriam Ana Escobar' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Marito di Mar.Ant.Sper.Trovato impiccato nella stalla di casa, archiviato come suicidio.
        // Data 23 dicembre 1980
        [
            43.6857, 11.19179,
            'Ren. Malatesta (?) 1980',
            null,
            { url: 'https://www.mostrodifirenze.com/1980/12/23/23-dicembre-1980-renato-malatesta-viene-trovato-impiccato-nella-stalla/', nome: 'MostroDiFirenze.com - Renato Malatesta viene trovato morto' },
            0 
        ],

        // Prostituta fiorentina citata nel processo ai CdM. Ufficialmente la donna morì cadendo dalle scale di casa sua​.
        // Data 4 agosto 1981
        [
            43.79946, 11.23883,
            'Gin. Manfredi 1981',
            null,
            { url: 'https://www.mostrodifirenze.com/1981/08/04/4-agosto-1981-delitto-di-gina-manfredi/', nome: 'MostroDiFirenze.com - Delitto di Gina Manfredi' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Ritrovata dalla coinquilina, colpita da 17 coltellate al petto, inguine e collo.
        // Data 11 febbraio 1982
        [
            43.77293, 11.25029,
            'Giu. Monciatti 1982',
            null,
            { url: 'https://www.mostrodifirenze.com/1982/02/11/11-febbraio-1982-delitto-di-giuliana-monciatti/', nome: 'MostroDiFirenze.com - Delitto di Giuliana Monciatti' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Trovata morta mentre era in vacanza in Sicilia. Numerose ferite da taglio sul corpo
        // Era vicina di casa di Sus. Cam., una delle vittime del mostro
        // Data 22 agosto 1982
        [
            36.72118, 14.73763,
            'Eli. Ciabani 1982',
            null,
            { url: 'https://www.mostrodifirenze.com/1982/08/22/elisabetta-ciabani/', nome: 'MostroDiFirenze.com - Elisabetta Ciabani' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Prostituta frequentata da MV. Trovata morta nella sua abitazione.
        // Coltellate sul corpo e soffocata con il filo del telefono.
        // Data 14 dicembre 1983
        [
            43.76334, 11.27619,
            'Cle. Cuscito 1983',
            null,
            { url: 'https://www.mostrodifirenze.com/1983/12/14/14-dicembre-1983-delitto-di-clelia-cuscito/', nome: 'MostroDiFirenze.com - Delitto di Clelia Cuscito' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Duplice omicidio alle porte di Lucca, in un luogo appartato frequentato da coppiette.
        // I due fidanzati furono trovati nella loro auto crivellati da cinque colpi di pistola calibro .22​
        // con bossoli di marca Lapua
        // Data 21 gennaio 1984
        [
            43.85243, 10.48713,
            'Benedetti Riggio 1984',
            null,
            { url: 'https://www.mostrodifirenze.com/1984/01/21/21-gennaio-1984-delitto-di-graziella-benedetti-e-paolo-riggio/', nome: 'MostroDiFirenze.com - Delitto di Graziella Benedetti e Paolo Riggio' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Trovata morta in una traversa di via Bolognese, come Mir. Esc.
        // Segni di strangolamento e cinque coltellate.
        // Data 1 marzo 1984
        [
            43.811972, 11.272342,
            'Gab. Caltabellotta 1984',
            null,
            { url: 'https://www.mostrodifirenze.com/1984/03/01/1-marzo-1984-delitto-di-gabriella-caltabellotta/', nome: 'MostroDiFirenze.com - Delitto di Gabriella Caltabellotta' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Cadavere carbonizzato trovato in un prato. Presenza di una Golf rubata di colore verde.
        // Data 22 luglio 1984
        [
            43.95698, 11.21286,
            'Donna trovata carbonizzata 1984',
            null,
            { url: 'https://www.mostrodifirenze.com/1984/07/22/22-luglio-1984-delitto-di-una-sconosciuta/', nome: 'MostroDiFirenze.com - Delitto di una sconosciuta' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Prostituta trovata strangolata nell'appartamento in cui esercitava.
        // Data 27 luglio 1984
        [
            43.77380, 11.24672,
            'Giu. Bassi 1984',
            null,
            { url: 'https://www.mostrodifirenze.com/1984/07/27/27-luglio-1984-delitto-di-giuseppina-bassi/', nome: 'MostroDiFirenze.com - Delitto di Giuseppina Bassi' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Cercatore di funghi trovato morto in una zona frequentata da guardoni.
        // Data 3 ottobre 1984
        [
            43.79662, 11.30643,
            'Bru. Borselli 1984',
            null,
            { url: 'https://www.mostrodifirenze.com/1984/10/03/3-ottobre-1984-delitto-di-bruno-borselli/', nome: 'MostroDiFirenze.com - Delitto di Bruno Borselli' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Prostituta trovata morta nel suo appartamento, soffocata e con le braccia legate al corpo.
        // Data 27 luglio 1984
        [
            43.76635, 11.24449,
            'Lui. Meoni 1984',
            null,
            { url: 'https://www.mostrodifirenze.com/1984/10/13/13-ottobre-1984-la-morte-di-luisa-meoni/', nome: 'MostroDiFirenze.com - La morte di Luisa Meoni' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Ragazza trovata morta vicino a dove venne trovato il cadavere di Bru. Bor.
        // Data 6 aprile 1985
        [
            43.79459, 11.29358,
            'Car. Fantoni 1985',
            null,
            { url: 'https://www.mostrodifirenze.com/1985/04/06/6-aprile-1985-delitto-di-carla-fantoni/', nome: 'MostroDiFirenze.com - Delitto di Carla Fantoni' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Trovato impiccato nella sua cella a pochi giorni dalla scadenza della detenzione
        [
            43.76915, 11.17299,
            'Vin. Limongi 1991',
            null,
            { url: 'https://www.mostrodifirenze.com/1991/05/19/vincenzo-limongi/', nome: 'MostroDiFirenze.com - Vincenzo Limongi' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Trovati carbonizzati nel bagagliaio dell'auto di Fra.Vin.
        [
            43.66751, 10.36432,
            'Fra.Vinci Ang.Vargiu 1993',
            null,
            { url: 'https://www.mostrodifirenze.com/1993/08/07/7-agosto-1993-delitto-di-francesco-vinci-e-angelo-vargiu/', nome: 'MostroDiFirenze.com - Delitto di Francesco Vinci e Angelo Vargiu' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Figlia e nipote di Ren.Mal. trovati carbonizzati all'interno di un'auto in una scarpata
        [
            43.51866, 11.12832,
            'Mil. & Mir. Malatesta 1993',
            null,
            { url: 'https://www.mostrodifirenze.com/1993/08/19/19-agosto-1993-delitto-di-milva-malatesta-e-suo-figlio-mirko/', nome: 'MostroDiFirenze.com - Delitto di Milva Malatesta e suo figlio Mirko' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Prostituta trovata morta nel suo appartamento da una coinquilina, convivente del figlio di Fra.Vin.
        [
            43.79657, 11.12345,
            'A.M. Mattei 1994',
            null,
            { url: 'https://www.mostrodifirenze.com/1994/05/29/29-maggio-1994-delitto-di-anna-milva-mattei/', nome: 'MostroDiFirenze.com - Delitto di Anna Milva Mattei' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Tassista, fu assassinata durante una corsa notturna a Siena. 
        [
            43.47351, 11.28957,
            'Ale. Vanni Siena22 1997',
            null,
            { url: 'https://www.mostrodifirenze.com/1997/05/22/22-maggio-1997-delitto-di-alessandra-vanni/', nome: 'MostroDiFirenze.com - Delitto di Alessandra Vanni' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ],

        // Trovato morto impiccato nella sua abitazione. Svolgeva ricerche su sette e gruppi religiosi.
        // Probabile corrispondenza e incontro con Eli.Cia.
        [
            45.53107, 12.19281,
            'Mau. Antonello 2003',
            null,
            { url: 'https://www.mostrodifirenze.com/2003/05/14/14-maggio-2003-morte-di-maurizio-antonello/', nome: 'MostroDiFirenze.com - Maurizio Antonello' },
            { url: 'https://www.mostrodifirenze.com/2020/10/04/mappe-degli-omicidi-collaterali/', nome: 'MostroDiFirenze.com - Mappa degli omicidi collaterali' },
            0 
        ]
    ],

    puntiInteresse: [       

        // Bar frequentato da alcuni dei CdM
        //[43.7338035, 11.2065226, 'Bar Centrale San Casciano'],

        // Cinema frequentato da Bar.Loc. e Ant. LoB.
        [
            43.7806324, 11.0963065,
            'Cinema Giardino Michelacci',
            null,
            { url: 'https://www.mostrodifirenze.com/1968/08/21/21-agosto-1968-cinema-giardino-michelacci/', nome: 'MostroDiFirenze.com - Cinema Giardino Michelacci' },
            { url: 'https://www.mostrodifirenze.com/1968/08/22/21-agosto-1968-mappa-del-delitto-di-signa/', nome: 'MostroDiFirenze.com - Mappa del delitto di Signa' },
            1 
        ],

        // Ponte dove fu lasciato Nat. Mel.
        [
            43.7969636, 11.0856268,
            'Ponte alle Palle',
            null,
            { url: 'https://www.mostrodifirenze.com/2021/01/18/18-gennaio-2021-chi-ha-accompagnato-natalino-mele/', nome: 'MostroDiFirenze.com - Chi ha accompagnato Natalino Mele' },
            { url: 'https://www.mostrodifirenze.com/1968/08/22/21-agosto-1968-mappa-del-delitto-di-signa/', nome: 'MostroDiFirenze.com - Mappa del delitto di Signa' },
            1
        ],
        [
            43.8023238, 11.0909141,
            'Primo ponte via dei Sodi',
            null,
            { url: 'https://www.mostrodifirenze.com/2021/01/18/18-gennaio-2021-chi-ha-accompagnato-natalino-mele/', nome: 'MostroDiFirenze.com - Chi ha accompagnato Natalino Mele' },
            { url: 'https://www.mostrodifirenze.com/1968/08/22/21-agosto-1968-mappa-del-delitto-di-signa/', nome: 'MostroDiFirenze.com - Mappa del delitto di Signa' },
            1
        ],
        [
            43.8074198, 11.0954578,
            'Secondo ponte via dei Sodi',
            null,
            { url: 'https://www.mostrodifirenze.com/2021/01/18/18-gennaio-2021-chi-ha-accompagnato-natalino-mele/', nome: 'MostroDiFirenze.com - Chi ha accompagnato Natalino Mele' },  
            { url: 'https://www.mostrodifirenze.com/1968/08/22/21-agosto-1968-mappa-del-delitto-di-signa/', nome: 'MostroDiFirenze.com - Mappa del delitto di Signa' },
            1
        ],

        //--------------------------------

        // Discoteca dove Pas.Gentilcore lasciò la sorella.
        [
            43.9541819, 11.3907706,
            'Discoteca Teen Club',
            null,
            2
        ],

        //--------------------------------



        //--------------------------------

        // Due fidanzati incrociano auto rossa sportiva
        [
            43.8609502, 11.1551875,
            'Auto rossa Ponte Torrente Marina 1981',
            null,
            4
        ],
        //--------------------------------

        // Abitazione dell'uomo che trovò i tedeschi
        [
            43.7338035,
            11.2065226,
            'Abit. Rol. Rei. 1983',
            null,
            6
        ],

        //--------------------------------        

        // Bar dove lavorava Pia Ron.
        [
            43.9337263, 11.4583901,
            'Bar La Nuova Spiaggia',
            null,
            7
        ],

        // Bar gestito da un testimone
        [
            43.9610135, 11.3564882,
            'Bar Bardazzi',
            null,
            7
        ],

        //--------------------------------

        // Festa dell'Unità di Cerbaia, dove furono visti i due turisti francesi prima dell'ultimo delitto.
        [
            43.6851916, 11.1317787,
            'Festa Unità di Cerbaia',
            null,
            8
        ],
        // Trattoria nei pressi della piazzola degli Scopeti, dove cenarono Bettinelli e Bernini. I due sentirono 8 spari la sera del 7 settembre 1985
        [
            43.6918710, 11.2014136,
            'Tratt. Baracchina',
            null,
            8
        ],

        // Luogo da cui fu spedita la lettera alla PM SDM
        [
            43.95909, 11.32101,
            'Poste S.Piero a Sieve',
            null,
            8
        ],

        //--------------------------------

        [
            43.66697941313906, 11.193038632792693,
            'Cimitero San Casciano',
            null,
            11
        ],

        // Procura della Repubblica
        [
            43.79596598502125, 11.225703535939058,
            'Procura della Repubblica',
            null,
            11
        ],

        // Tiro a Segno Montespertoli
        [
            43.65627712096565, 11.091416605746682,
            'Tiro a Segno Montespertoli',
            null,
            { url: 'https://mostrodifirenzevolumei.blogspot.com/2016/06/due-minuti-baccaiano-2.html', nome: 'MostroDiFirenze.com - Due minuti Baccaiano 2' },
            11
        ],

        // Possibile origine delle munizioni usate dal Mostro.
        [
            43.6497, 10.3239,
            'Camp Darby',
            null,
            11
        ],

        // Locale frequentato da guardoni
        [
            43.7233708, 11.146381,
            'Taverna Diavolo',
            null,
            11
        ],

        [
            43.73306552, 11.20698601,
            'Villa La Sfacciata',
            null,
            11
        ],

        [
            43.321444211214875, 11.328640679847327,
            'Partenza taxi Siena22',
            null,
            11
        ],
        
        
    ],

    abitazioniSospettati: [
        
        // Abitazioni sardi
        [
            43.7670, 11.1172,
            'Casa Fra. Vin.',
            null,
            9
        ],
        [
            43.8808, 11.0966,
            'Casa Sal. Vin.',
            null,
            9
        ],

        // Abitazioni CdM    
        [
            43.6347, 11.2328,
            'Casa Pie. Pac.',
            null,
            10
        ],
        [
            43.6546, 11.18356,
            'Casa Mar. Van.',
            null,
            10
        ],

        [
            43.657073, 11.185923,
            'Casa Fra. Cal.',
            null,
            10
        ],
        //[43.6531, 11.1819, 'Casa Pucci'],

        // Altri
        [
            43.6932, 11.2070,
            'Cim. Falciani',
            null,
            11
        ],
        [
            43.8843448, 11.1028289,
            'Casa Gia. Vig.',
            null,
            11
        ],
        [
            43.1283, 12.1700,
            'Villa Fra. Nar.',
            null,
            11
        ],
        
        [
            43.685244, 11.191890,
            'Casa Sal. Ind.',
            null,
           11
        ]
    ],

    abitazioniVittime: [
        [
            43.7706075, 11.1117782,
            'Casa Ste. Mel. - Bar. Loc.',
            null,
            0 
        ],

        [
            43.7715977, 11.1068373,
            'Casa Ant. LoB.',
            null,
            0 
        ],
        [
            43.8083887, 11.0963123,
             'Casa Fra. DeF.',
            null,
            0
        ],

        [
            43.810167, 11.399329,
            'Casa Pas. Gen.',
            null,
            0 
        ],
        [
            43.942676, 11.4412496, 
            'Casa Ste. Pet.', 
            null, 
            0
        ],

        [
            43.7584008, 11.1970467,
            'Casa Car. DeN.',
            null,
            0 
        ],
        [
            43.7733886, 11.4347534, 
            'Casa Gio. Fog.', 
            null, 
            0
        ],

        [
            43.782659, 11.240787,
            'Casa Sus. Cam.',
            null,
            0 
        ],
        [
            43.7816133,11.2392434, 
            'Casa prov. Sus. Cam.',
            null,
            0
        ],
        [
            43.8663673, 11.1426719,
            'Casa Ste. Bal.',
            null,
            0
        ],

        [
            43.6389567, 11.0818644,
            'Casa Pao. Mai.',
            null,
            0 
        ],
        [
            43.6464069, 11.0624505, 
            'Casa Ant. Mig.', 
            null, 
            0
        ],

        [
            43.9333951, 11.4626938,
            'Casa Pia. Ron.',
            null,
            0 
        ],
        [
            43.9332041, 11.4645859, 
            'Casa Cla. Ste.', 
            null,
            0
        ]
    ]
};

// Aggiunta etichette per i gruppi di checkbox
window.groupLabels = {
    0: "", // Usato per elementi non specificamente raggruppati o come default
    1: "Signa",
    2: "Rabatta",
    3: "Scandicci",
    4: "Calenzano",
    5: "Baccaiano",
    6: "Giogoli",
    7: "Vicchio",
    8: "Scopeti",
    9: "Sardi",
    10: "CdM",
    11: "Altri",
};

const convertiInUTM = data => data.map(puntoRaw => {
    const lat = puntoRaw[0];
    const lon = puntoRaw[1];
    const label = puntoRaw[2];
    const desc = puntoRaw[3];

    // Gli elementi rimanenti possono essere link o un groupId numerico alla fine
    const rest = puntoRaw.slice(4);

    let groupId = 0;
    const fonti = [];

    if (rest.length > 0 && typeof rest[rest.length - 1] === 'number') {
        groupId = rest.pop(); // Estrai e rimuovi groupId da 'rest'
    }

    // Tutti gli elementi rimanenti in 'rest' sono considerati fonti/link
    rest.forEach(link => {
        if (link && ((typeof link === 'string' && link.startsWith('http')) || (typeof link === 'object' && link.url))) {
            fonti.push(link);
        }
    });

    // Determina la proiezione UTM basata sul caso attivo (mdf o zodiac)
    const projTarget = window.casoAttivo === 'zodiac' ? 'EPSG:32610' : 'EPSG:32632'; 
    const [x, y] = proj4('EPSG:4326', projTarget, [lon, lat]);
    
    const yearMatch = label.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    
    return {
        x,
        y,
        label,
        lat,
        lon,
        desc: desc || null,
        year,
        fonti: fonti.length > 0 ? fonti : null,
        groupId
    };
});

