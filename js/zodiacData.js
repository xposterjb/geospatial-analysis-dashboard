/**
 * Dataset dei luoghi rilevanti del caso Zodiac Killer
 * 
 * Contiene:
 * - Delitti principali con data e coordinate
 * - Omicidi collaterali e non confermati
 * - Punti di interesse collegati ai casi
 * - Abitazioni dei sospettati principali
 */
const zodiacData = {
    delitti: [
        // Lake Herman Road - 20 dicembre 1968
        [
            38.094836, -122.144056,
            'Lake Herman Road 1968',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-herman-road', nome: 'ZodiacKillerInfo.com - Lake Herman Road' },
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ],

        // Blue Rock Springs - 4 luglio 1969
        [
            38.1257281, -122.1909742,
            'Blue Rock Springs 1969',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' },
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ],

        // Lake Berryessa - 27 settembre 1969 (coordinate KML: Lake Berryessa)
        // Luogo dell'aggressione a Cecelia Shepard e Bryan Hartnell.
        [
            38.563414, -122.23165,
            'Lake Berryessa 1969',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-berryessa', nome: 'ZodiacKillerInfo.com - Lake Berryessa' },
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ],

        // Presidio Heights - 11 ottobre 1969 (coordinate KML: Washington st e Cherry st)
        [
            37.7887448, -122.457213,
            'Presidio Heights 1969',
            null,
            { url: 'https://www.zodiackillerinfo.com/presidio-heights', nome: 'ZodiacKillerInfo.com - Presidio Heights' },
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ]
    ],

    omicidiCollaterali: [
        // Omicidio tassista Ray Davis 10 aprile 1962
        [
            33.1712262986028, -117.36310560195028,
            'Ray Davis 1962',
            null,
            { url: 'https://historiesandmysteries.blog/2020/01/07/the-murder-of-ray-davis/', nome: 'Histories & Mysteries - Omicidio Ray Davis' }
        ],

        // Robert Domingos e Linda Edwards (coordinate KML: Canada del Mulino)
        [
            34.46986, -120.168569,
            'Rob. Domingos e Lin. Edwards 1963',
            null,
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ],

        // Cheri Jo Bates (coordinate KML: Casa di Cheri)
        [
            33.9421178, -117.4228313,
            'Che.Jo. Bates 1966',
            null,
            { url: 'https://www.zodiackillerinfo.com/riverside-city-college', nome: 'ZodiacKillerInfo.com - Riverside City College' },
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ],

        // Kathleen Johns (coordinate KML: Highway 132 vicino I-5)
        [
            37.6379018, -121.3531375,
            'Tentato rapimento Kat. Johns 1970',
            null,
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ],

        // Donna Lass (coordinate KML: Appartamenti di Stateline)
        [
            38.9573292, -119.9422457,
            'Donna Lass 1970',
            null,
            { url: 'https://www.mostrodifirenze.com/2023/06/11/11-giugno-2023-mappa-degli-omicidi-di-zodiac/', nome: 'MostroDiFirenze.com - Mappa omicidi Zodiac' }
        ]
    ],

    // Punti di interesse collegati ai casi
    puntiInteresse: [
        // Riverside City College (Cheri Jo Bates)
        [
            33.971348, -117.381082,
            'Riverside City College',
            null,
            { url: 'https://www.zodiackillerinfo.com/riverside-city-college', nome: 'ZodiacKillerInfo.com - Riverside City College' }
        ],
        [
            33.887632333397605, -117.26883558907161,
            'Base aerea March Joint',
            null,
            { url: 'https://it.wikipedia.org/wiki/March_Joint_Air_Reserve_Base', nome: 'Wikipedia' }
        ],


        // ------------------------------------------------------------

        // Primo incontro tra Faraday e Jensen
        [
            38.11080091505653, -122.25468809136737,
            'Pythian Castle',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/the-pythian-castle', nome: 'ZodiacCiphers.com - The Pythian Castle' }
        ],
        // Hogan High School - Scuola dove Faraday e Jensen parteciparono a un concerto prima dell'omicidio.
        [
            38.10150274210728, -122.21582648674723,
            'Hogan High School',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-herman-road', nome: 'ZodiacKillerInfo.com - Lake Herman Road' }
        ],
        // Ford Impala Blu avvistata da Stan
        [
            38.115794325644806, -122.1939357397,
            'Ford Impala Blu',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/the-cottage-on-lake-herman-road', nome: 'ZodiacCiphers.com - The Cottage on Lake Herman Road' }
        ],

        [
            38.097833874977134, -122.15144468478745,
            'The Cottage - Blitz antidroga',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/the-cottage-on-lake-herman-road', nome: 'ZodiacCiphers.com - The Cottage on Lake Herman Road' }
        ],
        // Luogo dove Stella Medeiros fermò la polizia per segnalare il crimine
        [
            38.0659294556005, -122.1466312895095,
            'Stella Medeiros',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-herman-road', nome: 'ZodiacKillerInfo.com - Lake Herman Road' }
        ],
        [
            38.247607948261326, -122.04000808954412,
            'Sceriffo Solano County',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-herman-road', nome: 'ZodiacKillerInfo.com - Lake Herman Road' }
        ],

        // ------------------------------------------------------------        

        // 130 Jordan St, Vallejo
        [
            38.076660738352025, -122.23075158950891,
            'Casa genitori di Darlene Ferrin',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],
        [
            38.09579410955663, -122.22448390300039,
            'Casa sorella di Darlene Ferrin',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],
        [
            38.11001220150765, -122.25752200415859,
            'Caesar Restaurant -  Lavoro Dean Ferrin',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/the-darlene-ferrin-timeline', nome: 'ZodiacCiphers.com - The Darlene Ferrin Timeline' },
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],
        [
            38.079247232675996, -122.23262020485305,
            'Terry s Waffle Shop - Lavoro Darlene Ferrin',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/the-darlene-ferrin-timeline', nome: 'ZodiacCiphers.com - The Darlene Ferrin Timeline' },
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],
        // Precedente luogo di lavoro di Darlene (1966-1967). Collegato ad Arthur Leigh Allen.
        [
            38.11012947682077, -122.24116637375022,
            'IHOP - Lavoro Darlene Ferrin 1967',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' },
            { url: 'https://zodiackiller.com/CheneyTranscript.txt', nome: 'ZodiacKiller.com - Cheney Transcript' }
        ],
        // Cabina telefonica usata dopo Blue Rock Springs, incrocio tra Springs Road e Tuolumne Street
        // Zodiac chiamò la polizia alle 12:40
        [
            38.106278, -122.238208,
            'Cabina telefonica usata dopo Blue Rock Springs',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],

        // ------------------------------------------------------------

        // Incrocio tra Main Street e Lincoln street
        [
            38.30133561297006, -122.28718973543243,
            'Cabina telefonica usata dopo Lake Berryessa',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/the-payphone-call-at-main-street', nome: 'ZodiacCiphers.com' },
            { url: 'https://www.zodiackillerinfo.com/lake-berryessa', nome: 'ZodiacKillerInfo.com - Lake Berryessa' }
        ],

        // Possibile avvistamento da parte delle 3 ragazze
        [
            38.574959130632564, -122.24458733862411,
            'North Smittle Creek Trailhead parking lot',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-berryessa', nome: 'ZodiacKillerInfo.com - Lake Berryessa' },
            { url: 'https://www.zodiacciphers.com/zodiac-news/lake-berryessa-a-killers-timeline', nome: 'ZodiacCiphers.com - Lake Berryessa a killer s timeline' }
        ],

        // Possibile avvistamento
        [
            38.56564447065944, -122.23793780517877,
            'Dr Rayfield & figlio',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/lake-berryessa-a-killers-timeline', nome: 'ZodiacCiphers.com - Lake Berryessa a killer s timeline' }
        ],
        [
            38.5601023928292, -122.23490466065579,
            'Auto Bryan Hartnell',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/lake-berryessa-a-killers-timeline', nome: 'ZodiacCiphers.com - Lake Berryessa a killer s timeline' }
        ],
        [
            38.55087013605416, -122.23060618806333,
            'Lake Berryessa Field Office',
            null,
            { url: 'https://www.zodiacciphers.com/zodiac-news/lake-berryessa-a-killers-timeline', nome: 'ZodiacCiphers.com - Lake Berryessa a killer s timeline' }
        ],
        // A&W Root Beer Stand
        [
            38.541470712644504, -122.23782738773355,
            'A&W Root Beer Stand',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-berryessa', nome: 'ZodiacKillerInfo.com - Lake Berryessa' }
        ],
        [
            38.324307482203096, -122.29641099149121,
            'Ospedale Queen of the Valley',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-berryessa', nome: 'ZodiacKillerInfo.com - Lake Berryessa' }
        ],
        [
            46.38301978120252, -112.80112670452776,
            'Deer Lodge Prison',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-berryessa', nome: 'ZodiacKillerInfo.com - Lake Berryessa' }
        ],
        // Base militare da cui forse provengono gli stivali wing walkers
        [
            38.2695347483604, -121.94767995342107,
            'Travis Air Force Base',
            null,
            { url: 'https://www.zodiackillerinfo.com/lake-berryessa', nome: 'ZodiacKillerInfo.com - Lake Berryessa' }
        ],

        // ------------------------------------------------------------ 

        // Dove Zodiac ha preso il taxi (9:40 PM)
        [
            37.7872010034326, -122.40989440041166,
            'Partenza Taxi Stine',
            null,
            { url: 'https://www.zodiackillerinfo.com/presidio-heights', nome: 'ZodiacKillerInfo.com - Presidio Heights' }
        ],
        // Stima destinazione Taxi Stine
        [
            37.788934824881665, -122.45561775037345,
            'Probabile destinazione Taxi',
            null,
            { url: 'https://www.zodiackillerinfo.com/presidio-heights', nome: 'ZodiacKillerInfo.com - Presidio Heights' }
        ],

        // 3712 Jackson Street
        [
            37.79041451188527, -122.45633457435181,
            'Avvistamento Jackson St (Agente Fourke)',
            null,
            { url: 'https://www.zodiackillerinfo.com/presidio-heights', nome: 'ZodiacKillerInfo.com - Presidio Heights' }
        ],

        // Luogo dove andò in scena una rappresentazione del Mikado subito dopo l'omicidio di Stine  
        [
            37.778947033351706, -122.44845067249963,
            'Mikado - Presentation Theatre',
            null,
            { url: 'https://ostellovolante.com/wp-content/uploads/2025/04/inchiesta-zodiac-mostro-di-firenze-joe-bevilacqua-di-f.-amicone.pdf', nome: 'Osterellovolante.com - Inchiesta Zodiac' }
        ],

        // ------------------------------------------------------------ 

        // Destinazione Kathleen Johns (città della madre)
        [
            38.247529261742365, -122.6278120318169,
            'Petaluma - Destinazione K.Johns',
            null,
            { url: 'https://www.zodiackillerinfo.com/kathleen-johns-incident', nome: 'ZodiacKillerInfo.com - Kathleen Johns Incident' }
        ],
        // Luogo dove fu accompagnata KJ
        [
            37.47661829809776, -121.1319700105655,
            'Patterson Police Department',
            null,
            { url: 'https://www.zodiackillerinfo.com/kathleen-johns-incident', nome: 'ZodiacKillerInfo.com - Kathleen Johns Incident' }
        ],

        // 1228 Montgomery St, San Francisco
        [
            37.800577032194624, -122.4040144457205,
            'Casa di Melvin Belli',
            null
        ],

        [
            38.10298, -122.25631,
            'City Hall - Vallejo Police Department (1969)',
            null,
            { url: 'https://www.solanoarticles.com/history/index.php/weblog5/more/the_vallejo_police_department_from_1900_to_2008', nome: 'SolanoArticles.com - Vallejo City Hall' }
        ],

        // Amador street 111
        [
            38.100055755119214, -122.2435824474584,
            'Vallejo Police Department',
            null,
            { url: 'https://www.solanoarticles.com/history/index.php/weblog5/more/the_vallejo_police_department_from_1900_to_2008', nome: 'SolanoArticles.com - Vallejo Police Department' }
        ],

        // San Francisco Chronicle (invio lettere)
        [
            37.7822487, -122.406514,
            'San Francisco Chronicle',
            null
        ],

        [
            38.05862001571689, -122.51531259922436,
            'Base aerea Hamilton Field',
            null,
            { url: 'https://en.wikipedia.org/wiki/Hamilton_Field_(Hamilton_AFB)', nome: 'Wikipedia' }
        ],
        [
            37.779944777222475, -122.40319753930113,
            'Great West Food Packers (Khaki Mafia)',
            null,
            { url: 'https://ostellovolante.com/wp-content/uploads/2025/04/inchiesta-zodiac-mostro-di-firenze-joe-bevilacqua-di-f.-amicone.pdf', nome: 'Osterellovolante.com - Inchiesta Zodiac' }
        ],
        [
            37.79939072361598, -122.45878725441385,
            'Presidio Heights 6th US Army',
            null,
            { url: 'https://ostellovolante.com/wp-content/uploads/2025/04/inchiesta-zodiac-mostro-di-firenze-joe-bevilacqua-di-f.-amicone.pdf', nome: 'Osterellovolante.com - Inchiesta Zodiac' }
        ],

        [
            38.1219651114971, -122.24988377871321,
            'Barca a vela Arthur Leigh Allen',
            null,
            { url: 'https://www.zodiackillerinfo.com/arthur-leigh-allen', nome: 'ZodiacKillerInfo.com - Arthur Leigh Allen' }
        ],

        [
            38.11345334730933, -122.24822294058313,
            'Arco Station - Lavoro Arthur Leigh Allen 69',
            null,
            { url: 'https://www.zodiackillerinfo.com/arthur-leigh-allen', nome: 'ZodiacKillerInfo.com - Arthur Leigh Allen' }
        ],

        [
            38.108004534657546, -122.22269508921225,
            'Elmer Cave School - Lavoro Arthur Leigh Allen 70',
            null,
            { url: 'https://www.zodiackillerinfo.com/arthur-leigh-allen', nome: 'ZodiacKillerInfo.com - Arthur Leigh Allen' }
        ],

        [
            38.049952269464114, -122.26043139914886,
            'Union Oil Pinole - Lavoro Arthur Leigh Allen',
            null,
            { url: 'https://www.zodiackillerinfo.com/arthur-leigh-allen', nome: 'ZodiacKillerInfo.com - Arthur Leigh Allen' }
        ],

        [
            38.10988032511707, -122.24333991172874,
            'Ace Hardware - Lavoro Arthur Leigh Allen',
            null,
            { url: 'https://www.zodiackillerinfo.com/arthur-leigh-allen', nome: 'ZodiacKillerInfo.com - Arthur Leigh Allen' }
        ],

        /*
        [
            
            'Daily Enterprise',
            null,
            { url: , nome:  }
            
        ],
        */
    ],

    // Abitazioni dei sospettati principali
    abitazioniSospettati: [

        // Casa Arthur Leigh Allen - 32 Fresno Street
        [
            38.1107775134565, -122.24009214717978,
            'Casa Arthur Leigh Allen Fresno St',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' },
            { url: 'https://zodiackiller.com/CheneyTranscript.txt', nome: 'ZodiacKiller.com - Cheney Transcript' }
        ],
        // Trailer Arthur Leigh Allen
        [
            38.40503676040336, -122.7147494291102,
            'Trailer Arthur Leigh Allen 70s',
            null,
            { url: 'https://en.wikipedia.org/wiki/Arthur_Leigh_Allen', nome: 'Wikipedia' },
            { url: 'https://virtualglobetrotting.com/map/arthur-leigh-allens-santa-rosa-trailer/', nome: 'VirtualGlobetrotting' }
        ],

        [
            38.33834012969728, -123.05028473771212,
            'Trailer Arthur Leigh Allen Bodega Bay',
            null,
            { url: 'https://www.zodiackillerinfo.com/arthur-leigh-allen', nome: 'ZodiacKillerInfo.com - Arthur Leigh Allen' }
        ],
        // Ross Sullivan
        // 512 2nd Street Apt 2 Santa Cruz, CA
        [
            36.9652190917106, -122.02344093187588,
            'Casa Ross Sullivan',
            null,
            { url: 'https://www.shadowofthezodiac.com/suspects/ross-sullivan/', nome: 'ShadowOfZodiac.com - Ross Sullivan' }
        ],
        // Richard Gaikowski
        // 2377 Bush Street, San Francisco, CA
        [
            37.78645975608931, -122.43630309308324,            
            'Casa Rich. Gaikowski 68',
            null,
            { url: 'https://www.shadowofthezodiac.com/suspects/richard-gaikowski/', nome: 'ShadowOfZodiac.com - Richard Gaikowski' }
        ],
        // 217 Eddy Street, San Francisco, CA
        [
            37.784107161104025, -122.41136894719148,
            'Casa Lawrence Kane 68',
            null,
            { url: 'https://www.shadowofthezodiac.com/suspects/lawrence-kane/', nome: 'ShadowOfZodiac.com - Lawrence Kane' }
        ]
    ],

    abitazioniVittime: [
        // Cheri Jo Bates 4195 San Jose Ave, Riverside 
        [
            33.942705429362604, -117.42313476751978,
            'Casa Cheri Jo Bates',
            null,
            { url: 'https://www.zodiackillerinfo.com/riverside-city-college', nome: 'ZodiacKillerInfo.com - Riverside City College' }
        ],

        // ------------------------------------------------------------

        // Casa Betty Lou Jensen da certificato di morte
        // 123 Ridgewood Ct
        [
            38.09805443453492, -122.21450903183624,
            'Casa Betty Lou Jensen',
            null,
            { url: 'https://www.mostrodifirenze.com/1968/12/20/20-dicembre-1968-zodiac-omicidio-di-betty-lou-jensen-e-david-faraday/', nome: 'MostroDiFirenze.com - Omicidio Betty Lou Jensen e David Faraday' }
        ],
        // Casa David Faraday da certificato di morte
        // 1930 Sereno Drive
        [
            38.12913357581269, -122.23081135696735,
            'Casa David Faraday',
            null,
            { url: 'https://zodiackillerfacts.com/gallery/displayimage.php?pid=920&fullsize=1', nome: 'ZodiacKillerFacts.com' }
        ],

        // ------------------------------------------------------------

        // Casa Darlene e Dean Ferrin
        // 1300 Virginia Street, Vallejo, CA
        [
            38.10229292473956, -122.24128633183612,
            'Casa Darlene e Dean Ferrin',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],

        [
            38.09602856572424, -122.23031081834448,
            'Casa di Darlene e Dean Ferrin (Marzo 1969)',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],

        // Casa di Michael Mageau
        // 864 Beechwood Ave
        [
            38.10236725628509, -122.21673650300015,
            'Casa Michael Mageau',
            null,
            { url: 'https://www.zodiackillerinfo.com/blue-rock-springs', nome: 'ZodiacKillerInfo.com - Blue Rock Springs' }
        ],

        // ------------------------------------------------------------

        // Casa Cecelia Shepard 10733 Mead Ln, Loma Linda (non confermato)
        [
            34.0581907042757, -117.24540473415813,
            'Casa Cecelia Shepard',
            null,
            { url: 'https://forum.zodiackillerciphers.com/community/cecelia-shepard-bryan-hartnell-9-27-69/cecelias-address/', nome: 'ZodiacForum.com - Cecelia Shepard' }
        ],
        // Pacific Union College
        [
            38.57009576785998, -122.43941902996758,
            'Residenza Bryan Hartnell - Campus PUC',
            null,
        ],

        // ------------------------------------------------------------
        [
            37.7736, -122.4467,
            'Casa Paul Stine',
            null,
            { url: 'http://www.zodiackillerfacts.com/stine.html', nome: 'ZodiacKillerFacts.com' }
        ]
    ]
};

window.convertiInUTM = data => data.map(([lat, lon, label, desc, link1, link2]) => {
    const [x, y] = proj4('EPSG:4326', 'EPSG:32610', [lon, lat]);
    const yearMatch = label.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;

    const fonti = [];
    if (link1) {
        if (typeof link1 === 'string') {
            fonti.push(link1);
        } else if (link1 && typeof link1.url === 'string') {
            fonti.push(link1);
        }
    }
    if (link2) {
        if (typeof link2 === 'string') {
            fonti.push(link2);
        } else if (link2 && typeof link2.url === 'string') {
            fonti.push(link2);
        }
    }

    return {
        x,
        y,
        lat,
        lon,
        label,
        desc: desc || null,
        year,
        fonti: fonti.length > 0 ? fonti : null
    };
});
