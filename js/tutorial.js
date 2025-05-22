class Tutoriale {
    constructor(passaggi) {
        this.passaggi = passaggi;
        this.indicePassaggioCorrente = 0;
        this.chiaveLocalStorage = 'geoAnalysisTutorialVisto';
        this.elementoTutorial = null;
        this.elementoOverlay = null;
    }

    tutorialVisto() {
        return localStorage.getItem(this.chiaveLocalStorage) === 'true';
    }

    segnaTutorialComeVisto() {
        localStorage.setItem(this.chiaveLocalStorage, 'true');
    }

    avvia() {
        if (this.tutorialVisto() || this.passaggi.length === 0) {
            return;
        }
        this.creaOverlay();
        this.mostraPassaggio(this.indicePassaggioCorrente);
    }

    passaggioSuccessivo() {
        this.indicePassaggioCorrente++;
        if (this.indicePassaggioCorrente < this.passaggi.length) {
            this.mostraPassaggio(this.indicePassaggioCorrente);
        } else {
            this.termina();
        }
    }

    passaggioPrecedente() {
        if (this.indicePassaggioCorrente > 0) {
            this.indicePassaggioCorrente--;
            this.mostraPassaggio(this.indicePassaggioCorrente);
        }
    }

    termina() {
        this.segnaTutorialComeVisto();
        this.rimuoviElementoTutorial();
        this.rimuoviOverlay();
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    }

    creaOverlay() {
        if (this.elementoOverlay) return;
        this.elementoOverlay = document.createElement('div');
        this.elementoOverlay.classList.add('tutorial-overlay');
        document.body.appendChild(this.elementoOverlay);
    }

    rimuoviOverlay() {
        if (this.elementoOverlay) {
            this.elementoOverlay.remove();
            this.elementoOverlay = null;
        }
    }

    rimuoviElementoTutorial() {
        if (this.elementoTutorial) {
            this.elementoTutorial.remove();
            this.elementoTutorial = null;
        }
    }

    mostraPassaggio(indicePassaggio) {
        this.rimuoviElementoTutorial();
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

        if (indicePassaggio < 0 || indicePassaggio >= this.passaggi.length) {
            this.termina();
            return;
        }

        const passaggio = this.passaggi[indicePassaggio];
        const elementoTarget = document.querySelector(passaggio.elementSelector);

        if (!elementoTarget && passaggio.elementSelector) {
            console.warn(`[Tutorial] Elemento target non trovato per lo selector: ${passaggio.elementSelector}`);
            if (this.indicePassaggioCorrente === indicePassaggio) {
                 this.passaggioSuccessivo();
            }
            return;
        }
        
        this.elementoTutorial = document.createElement('div');
        this.elementoTutorial.classList.add('tutorial-popup');
        if (passaggio.customClass) {
            // Gestisce il caso in cui customClass contenga più classi separate da spazi
            const nomiClassi = passaggio.customClass.split(' ');
            nomiClassi.forEach(nomeClasse => {
                if (nomeClasse.trim()) {
                    this.elementoTutorial.classList.add(nomeClasse.trim());
                }
            });
        }

        let contenutoHtml = `
            <div class="tutorial-header">
                <h4>${passaggio.title} (${indicePassaggio + 1}/${this.passaggi.length})</h4>
                <button class="tutorial-close-btn">&times;</button>
            </div>
            <div class="tutorial-content"><p>${passaggio.text}</p></div>
            <div class="tutorial-navigation">
        `;

        if (this.indicePassaggioCorrente > 0) {
            contenutoHtml += `<button class="tutorial-prev-btn">Precedente</button>`;
        }
        
        contenutoHtml += `<button class="tutorial-next-btn">${indicePassaggio === this.passaggi.length - 1 ? 'Fine' : 'Successivo'}</button>`;
        contenutoHtml += `</div>`;
        
        this.elementoTutorial.innerHTML = contenutoHtml;
        document.body.appendChild(this.elementoTutorial);

        this.elementoTutorial.querySelector('.tutorial-close-btn').addEventListener('click', () => this.termina());
        this.elementoTutorial.querySelector('.tutorial-next-btn').addEventListener('click', () => this.passaggioSuccessivo());
        
        const bottonePrecedente = this.elementoTutorial.querySelector('.tutorial-prev-btn');
        if (bottonePrecedente) {
            bottonePrecedente.addEventListener('click', () => this.passaggioPrecedente());
        }

        this.posizionaPopup(passaggio, elementoTarget);
    }

    posizionaPopup(passaggio, elementoTarget) {
        if (!this.elementoTutorial) return;

        // Stile di default se l'elemento non è trovato
        if (!elementoTarget) {
            this.elementoTutorial.style.position = 'fixed';
            this.elementoTutorial.style.top = '50%';
            this.elementoTutorial.style.left = '50%';
            this.elementoTutorial.style.transform = 'translate(-50%, -50%)';
            this.elementoTutorial.style.zIndex = '10001'; // Sopra l'overlay
            if(this.elementoOverlay) this.elementoOverlay.classList.add('dimmed');
            return;
        }
        if(this.elementoOverlay) this.elementoOverlay.classList.remove('dimmed');


        const rectTarget = elementoTarget.getBoundingClientRect();
        const rectPopup = this.elementoTutorial.getBoundingClientRect();
        elementoTarget.classList.add('tutorial-highlight');


        let top, left;
        const offset = passaggio.offset || 10;

        switch (passaggio.position) {
            case 'top':
                top = rectTarget.top - rectPopup.height - offset;
                left = rectTarget.left + (rectTarget.width / 2) - (rectPopup.width / 2);
                break;
            case 'bottom':
                top = rectTarget.bottom + offset;
                left = rectTarget.left + (rectTarget.width / 2) - (rectPopup.width / 2);
                break;
            case 'left':
                top = rectTarget.top + (rectTarget.height / 2) - (rectPopup.height / 2);
                left = rectTarget.left - rectPopup.width - offset;
                break;
            case 'right':
                top = rectTarget.top + (rectTarget.height / 2) - (rectPopup.height / 2);
                left = rectTarget.right + offset;
                break;
            case 'center':
                 top = rectTarget.top + (rectTarget.height / 2) - (rectPopup.height / 2);
                 left = rectTarget.left + (rectTarget.width / 2) - (rectPopup.width / 2);
                 break;
            default:
                top = rectTarget.bottom + offset;
                left = rectTarget.left + (rectTarget.width / 2) - (rectPopup.width / 2);
        }

        // Assicura che il popup rimanga dentro i limiti della viewport
        if (top < 0) top = offset;
        if (left < 0) left = offset;
        if (left + rectPopup.width > window.innerWidth) left = window.innerWidth - rectPopup.width - offset;
        if (top + rectPopup.height > window.innerHeight) top = window.innerHeight - rectPopup.height - offset;
        
        this.elementoTutorial.style.position = 'fixed';
        this.elementoTutorial.style.top = `${top}px`;
        this.elementoTutorial.style.left = `${left}px`;
        this.elementoTutorial.style.zIndex = '10001';

        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        elementoTarget.classList.add('tutorial-highlight');
    }
    
    static ottieniPassaggiDefault() {
        return [
            {
                elementSelector: '.case-selector-container',
                title: 'Selezione del Caso',
                text: 'Scegli tra il Mostro di Firenze (MdF) o Zodiac. Ogni caso carica dataset separati con punti, luoghi ed eventi specifici.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Filtro Timeline"]',
                title: 'Timeline',
                text: 'Filtra gli eventi sulla mappa per anno. Delitti e eventi successivi all\'anno selezionato non saranno visualizzati.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Filtri Delitti MdF"]',
                title: 'Delitti Principali',
                text: 'Seleziona o deseleziona i delitti principali da includere nell\'analisi.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Filtri Omicidi Collaterali"]',
                title: 'Morti Collaterali',
                text: 'Visualizza o nascondi morti collaterali e omicidi non confermati. Questi eventi possono essere inclusi nelle analisi.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Filtri Abitazioni Sospettati"]',
                title: 'Abitazioni Sospettati',
                text: 'Gestisce la visibilità delle abitazioni dei principali sospettati e delle persone di interesse.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Filtri Abitazioni Vittime"]',
                title: 'Abitazioni Vittime',
                text: 'Gestisce la visibilità delle abitazioni delle vittime. Questi punti possono rivelare pattern geografici e correlazioni con i luoghi dei delitti.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Filtri Punti di Interesse"]',
                title: 'Punti di Interesse',
                text: 'Altri luoghi significativi per il caso, come avvistamenti o luoghi legati alle indagini. Puoi includerli nelle analisi tramite l\'opzione nelle preferenze.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Selezione tipo di analisi"]',
                title: 'Metodi di Analisi',
                text: 'Seleziona una o più tecniche di analisi geospaziale da applicare ai punti attivi.',
                position: 'bottom'
            },
            {
                elementSelector: 'details[aria-label="Preferenze Applicazione"]',
                title: 'Preferenze',
                text: 'Personalizza l\'interfaccia e scegli quali tipi di punti secondariincludere nei calcoli delle analisi.',
                position: 'top'
            },
            {
                elementSelector: 'details[aria-label="Configurazione Parametri CPR"]',
                title: 'Configurazione CPR',
                text: 'Regola i parametri avanzati per l\'analisi del Centro di Probabile Residenza (CPR). Modifica i pesi e altri fattori per affinare l\'analisi.',
                position: 'top'
            },
            {
                elementSelector: 'details[aria-label="Legenda"]',
                title: 'Legenda',
                text: 'Consulta la legenda per interpretare correttamente tutti gli elementi visualizzati sulla mappa.',
                position: 'top'
            },
            {
                elementSelector: '#map',
                title: 'Mappa Interattiva',
                text: 'Esplora la mappa interattiva dove sono visualizzati tutti i punti e i risultati delle analisi. Puoi cliccare sui punti per ottenere informazioni dettagliate.',
                position: 'center',
                customClass: 'tutorial-popup-map'
            },
            {
                elementSelector: '.map-tools-container',
                title: 'Strumenti di Disegno',
                text: 'Utilizza questi strumenti per misurare distanze, disegnare sulla mappa, aggiungere punti personalizzati.',
                position: 'left',
                customClass: 'tutorial-popup-draw'
            },
            {
                elementSelector: '#tool-add-point',
                title: 'Aggiunta Punti',
                text: 'Clicca qui per attivare la modalità di aggiunta punti. Potrai aggiungerli cliccando sulla mappa o importarli da un file KML. I punti aggiunti verranno salvati e potranno essere utilizzati nelle analisi successive.',
                position: 'left',
                customClass: 'tutorial-popup-add-point'
            },
            {
                elementSelector: '.map-selector',
                title: 'Stili di Mappa',
                text: 'Cambia lo stile della mappa di base scegliendo tra Standard, Satellitare e Topografica per visualizzare i dati nel contesto più adatto all\'analisi.',
                position: 'left',
                customClass: 'tutorial-popup-layers'
            },
            {
                elementSelector: '.map-legend-unified',
                title: 'Pannello Analisi e Risultati',
                text: 'Qui vengono visualizzati in dettaglio i risultati delle analisi attive. Il pannello si aggiorna automaticamente quando modifichi i punti sulla mappa o il tipo di analisi.',
                position: 'left',
                customClass: 'tutorial-popup-infobox'
            }
        ];
    }    
    static avviaTutorialDefault() {
        const tutoriale = new Tutoriale(Tutoriale.ottieniPassaggiDefault());
        tutoriale.avvia();
        return tutoriale;
    }
} 