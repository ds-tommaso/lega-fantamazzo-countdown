# Lega Fantamazzo — L'Asta

Landing page cinematografica per il conto alla rovescia dell'asta della **Lega Fantamazzo**.
Un'unica pagina statica (HTML/CSS/JS, senza framework né backend) che simula l'ingresso in
uno stadio notturno: luci, foschia, campo in prospettiva e un countdown ore:minuti:secondi
sempre sincronizzato con l'orario reale.

## Anteprima locale

Non serve alcuna build o server: basta aprire `index.html` con un doppio click, oppure con
un server statico qualsiasi (es. estensione "Live Server"). Tutti i percorsi sono relativi.

## Come cambiare la data dell'asta

L'unica cosa da modificare è la costante `EVENT_DATE` in cima a [`assets/js/config.js`](assets/js/config.js):

```javascript
// ========================================
// CONFIGURAZIONE ASTA
// Modifica SOLO questa data e ora.
// ========================================
const EVENT_DATE = "2026-09-07T20:00:00";
```

- Il formato è `AAAA-MM-GGTHH:MM:SS`.
- **Non aggiungere `Z`**: la data viene interpretata come ora locale del browser di chi
  visita la pagina, non come UTC.
- Il countdown mostra ore/minuti/secondi (niente giorni, niente millisecondi); le ore
  possono superare 23 se manca più di un giorno all'evento.
- Il blocco countdown vive nell'hero, subito sotto "L'ASTA STA PER COMINCIARE", e cambia
  stato automaticamente in base alla data (nessuna azione manuale richiesta):
  - **prima dell'inizio**: "L'ASTA STA PER COMINCIARE" e timer negativo, segno e cifre
    in rosso;
  - **da 0 a `AUCTION_VISIBLE_AFTER_START_HOURS` ore dopo l'inizio** (6 ore di default,
    modificabile in `config.js`): "L'ASTA È INIZIATA" e timer positivo che conta il tempo
    trascorso, segno e cifre in verde;
  - **oltre quella soglia**: l'intero blocco (etichetta + timer) sparisce dall'hero.

## Struttura del progetto

```
/
├── index.html            → markup della pagina (hero, viaggio, squadre, proclama, finale)
├── assets/
│   ├── css/
│   │   └── style.css     → tutto lo stile (stadio, countdown, viaggio sul campo, responsive, riduzione movimento)
│   ├── js/
│   │   ├── config.js     → EVENT_DATE e costanti regolabili, stato condiviso, cache DOM
│   │   ├── countdown.js  → calcolo stato/tempo, formattazione, loop del countdown
│   │   ├── intro.js      → pallone cinematografico + apertura a fasi (sipario, luci, campo, countdown)
│   │   ├── parallax.js   → parallax cinematografico (mouse + respiro ambientale)
│   │   ├── journey.js    → camera che segue una linea del campo durante lo scroll (sezione "viaggio")
│   │   ├── particles.js  → particelle su canvas 2D
│   │   ├── audio.js      → rumore di stadio opzionale (Web Audio API, solo su click)
│   │   ├── scroll-reveal.js → reveal a scorrimento della sezione "proclama"
│   │   ├── page-nav.js   → pulsanti fissi per saltare alla sezione successiva/precedente
│   │   └── main.js       → bootstrap, caricato per ultimo
│   └── images/
│       └── favicon.svg
└── README.md
```

## Navigazione tra le sezioni

Due pulsanti fissi, presenti su tutta la pagina: uno in basso a destra per andare alla
sezione successiva, uno in alto a destra per tornare a quella precedente (nascosto sulla
prima sezione, l'hero). `assets/js/page-nav.js` deduce la sezione corrente dallo scroll
(anche quello manuale, non solo i click sui pulsanti) e nasconde il pulsante "successiva"
anche in fondo alla pagina.

## Un solo campo, dall'hero al footer

Il manto erboso (colori `--pitch-a`/`--pitch-b`) non sparisce dopo il "viaggio":
`Le Fantasquadre`, `Il proclama`, la sezione finale e il footer condividono la stessa
texture a strisce, affievolita in due custom property (`--pitch-a-dim`/`--pitch-b-dim`)
così il campo resta percepibile sotto ai testi invece di lasciare il posto a blocchi
neri piatti. Il footer aggiunge una linea bianca luminosa in cima, come fosse la linea
di fondo dello stesso campo. Poco prima del footer, `.final-shot` mostra "Il destino vi
aspetta" oppure "L'asta è iniziata" a seconda di `body.is-live` (già gestito da
`countdown.js`, nessuna logica nuova).

## Il "viaggio sul campo" (scroll cinematografico)

Tra l'hero e il proclama c'è una sezione (`#pitch-journey` in `index.html`) che trasforma lo
scroll in una camera che segue una linea bianca del campo, disegnata come un vero `<path>` SVG.
Il meccanismo, tutto in `assets/js/journey.js`:

- la sezione è molto più alta di uno schermo (`.pitch-journey`) mentre il suo contenuto resta
  agganciato in `position: sticky`; il progresso 0→1 si calcola dal bounding rect della sezione,
  non dall'intera pagina, così non interferisce con countdown o proclama;
- ad ogni frame (`requestAnimationFrame`) il progresso viene "ammorbidito" (lerp) e usato per
  leggere `path.getPointAtLength()` sul percorso, calcolando anche la tangente (direzione) tra
  due punti vicini: il gruppo SVG viene poi traslato/ruotato/scalato in modo che quel punto resti
  centrato e la scena segua realmente la direzione della linea;
- le costanti in cima al file (`JOURNEY_ZOOM_END`, `JOURNEY_APPROACH_END`, `JOURNEY_TRAVEL_END`,
  scale, rotazioni, smoothing) dividono il percorso in fasi (campo lontano → zoom → viaggio →
  arrivo) e sono pensate per essere facilmente modificabili;
- con `prefers-reduced-motion: reduce` l'aggancio sticky e la camera non partono affatto: la
  sezione diventa un blocco statico con le tre tappe (Strategia/Rilanci/Gloria) impilate e un
  reveal semplice via `IntersectionObserver`, esattamente come la sezione proclama.

Gli script in `assets/js/` sono file classici (nessun modulo/bundler) caricati in sequenza in
`index.html`: condividono tutti lo stesso scope globale, quindi l'ordine di caricamento
(`config.js` per primo, `main.js` per ultimo) va mantenuto se si aggiungono nuovi file.

## Pubblicazione su GitHub Pages

1. Effettua il push del repository su GitHub (repository di riferimento:
   `https://github.com/ds-tommaso/lega-fantamazzo-countdown`).
2. Nel repository, vai su **Settings → Pages**.
3. Come sorgente scegli il branch `main` e la cartella `/ (root)`.
4. Salva: la pagina sarà pubblicata su
   `https://ds-tommaso.github.io/lega-fantamazzo-countdown/`.

Non è richiesta alcuna configurazione aggiuntiva: nessun backend, nessuna API, nessun path assoluto.

## Note tecniche

- Il countdown usa `requestAnimationFrame` e calcola sempre `targetTime - Date.now()`: non
  c'è drift anche se il browser rallenta o perde frame.
- Il parallax e le particelle si riducono automaticamente su schermi piccoli e si disattivano
  con `prefers-reduced-motion: reduce`, mantenendo comunque il countdown pienamente funzionante.
- L'effetto audio (rumore ambientale da stadio, generato via Web Audio API) parte solo dopo un
  click esplicito sul pulsante dedicato: nessun autoplay.
