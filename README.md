# Lega Fantamazzo — L'Asta

Landing page cinematografica per il conto alla rovescia dell'asta della **Lega Fantamazzo**.
Un'unica pagina statica (HTML/CSS/JS, senza framework né backend) che simula l'ingresso in
uno stadio notturno: luci, foschia, campo in prospettiva e un countdown ore:minuti:secondi
sempre sincronizzato con l'orario reale, che racconta da solo tutto il ciclo di vita
dell'asta — dall'attesa alla fine.

## Anteprima locale

Non serve alcuna build o server: basta aprire `index.html` con un doppio click, oppure con
un server statico qualsiasi (es. estensione "Live Server"). Tutti i percorsi sono relativi.

## Struttura del progetto

```
/
├── index.html                → markup della pagina (hero, viaggio, squadre, proclama, finale)
├── assets/
│   ├── css/
│   │   └── style.css         → tutto lo stile (stadio, countdown, viaggio sul campo, responsive, riduzione movimento)
│   ├── js/
│   │   ├── config.js         → costanti dell'asta (date, stagione, soglie), stato condiviso, cache DOM
│   │   ├── perf.js           → IntersectionObserver/visibilitychange condivisi, per mettere in pausa i loop fuori viewport
│   │   ├── countdown.js      → calcolo stato/tempo, formattazione, loop del countdown
│   │   ├── intro.js          → pallone cinematografico + apertura a fasi (sipario, luci, campo, countdown)
│   │   ├── parallax.js       → parallax cinematografico (mouse + respiro ambientale)
│   │   ├── journey.js        → camera che segue una linea del campo durante lo scroll (sezione "viaggio")
│   │   ├── particles.js      → particelle su canvas 2D
│   │   ├── teams.js          → genera le card delle Fantasquadre e i pulsanti "copia"
│   │   ├── scroll-reveal.js  → reveal a scorrimento della sezione "proclama"
│   │   ├── page-nav.js       → pulsanti fissi per saltare alla sezione successiva/precedente
│   │   ├── countdown-fit.js  → su mobile, calcola la taglia del countdown per riempire il 100% della larghezza
│   │   └── main.js           → bootstrap, caricato per ultimo
│   └── images/
│       └── favicon.svg
└── README.md
```

Gli script in `assets/js/` sono file classici (nessun modulo/bundler) caricati in sequenza in
`index.html`: condividono tutti lo stesso scope globale, quindi l'ordine di caricamento
(`config.js` per primo, `main.js` per ultimo) va mantenuto se si aggiungono nuovi file.

## Configurare l'asta

Tutto quello che cambia da un'asta all'altra sta in cima a
[`assets/js/config.js`](assets/js/config.js):

```javascript
const EVENT_DATE = "2026-09-07T21:10:00";
const AUCTION_END_DATE = "2026-09-08T01:56:30";
const AUCTION_SEASON = "2026/27";
const AUCTION_VISIBLE_AFTER_START_HOURS = 6;
```

- **`EVENT_DATE`** — data/ora di inizio, formato `AAAA-MM-GGTHH:MM:SS`. **Non aggiungere
  `Z`**: viene interpretata come ora locale del browser di chi visita la pagina, non UTC.
- **`AUCTION_END_DATE`** — data/ora di fine, stesso formato. Si può lasciare `""` finché
  non è nota: il countdown si comporta come se non ci fosse una fine (vedi sotto).
- **`AUCTION_SEASON`** — stagione mostrata nello stato finale (es. `"2026/27"`). Ogni anno
  basta aggiornare queste quattro righe: nessuna modifica a HTML o CSS.
- **`AUCTION_VISIBLE_AFTER_START_HOURS`** — usata solo quando `AUCTION_END_DATE` è vuota
  (vedi stato "expired" sotto).

Il blocco countdown vive nell'hero, subito sotto il titolo, e cambia stato da solo in base
alla data/ora corrente (nessuna azione manuale richiesta), attraversando fino a quattro fasi:

1. **prima dell'inizio** (`before`) — "L'ASTA STA PER COMINCIARE", timer negativo con
   millisecondi, segno e cifre in rosso.
2. **asta in corso** (`live`) — appena raggiunta `EVENT_DATE`: "L'ASTA È INIZIATA", timer
   positivo che conta ore/minuti/secondi trascorsi, segno e cifre in verde, flash e boost
   delle particelle.
3. **asta terminata** (`ended`) — appena raggiunta `AUCTION_END_DATE` (se valorizzata): il
   blocco mostra la durata finale ore:minuti:secondi (fissa, non conta più), l'intervallo
   "Dal GG/MM HH:MM al GG/MM HH:MM", l'augurio "Buon campionato a tutti! 🏆" e la stagione.
4. **scaduto** (`expired`) — solo se `AUCTION_END_DATE` è vuota: oltre
   `AUCTION_VISIBLE_AFTER_START_HOURS` ore dall'inizio, l'intero blocco (etichetta + timer)
   sparisce dall'hero.

La sorgente di verità è sempre `Date.now()` confrontato con le date configurate: nessun
contatore viene decrementato manualmente, quindi non c'è drift anche se il browser
rallenta o perde frame.

## Versione degli asset (cache-busting)

Ogni foglio di stile e script è referenziato in `index.html` con una query string di
versione, es. `assets/js/countdown.js?v2026.4`. Quando si modifica un file in `assets/`,
va aggiornata la versione su **tutte** le occorrenze in `index.html` (CSS e ogni
`<script>`), così i visitatori con una copia già in cache ricevono sempre l'ultima
versione. La pagina si ricarica comunque da sola ogni 2 minuti (`main.js`), a supporto di
chi la tiene aperta durante l'asta.

## Pubblicazione su GitHub Pages

1. Effettua il push del repository su GitHub (repository di riferimento:
   `https://github.com/ds-tommaso/lega-fantamazzo-countdown`).
2. Nel repository, vai su **Settings → Pages**.
3. Come sorgente scegli il branch `main` e la cartella `/ (root)`.
4. Salva: la pagina sarà pubblicata su
   `https://ds-tommaso.github.io/lega-fantamazzo-countdown/`.

Non è richiesta alcuna configurazione aggiuntiva: nessun backend, nessuna API, nessun path assoluto.

## Le sezioni della pagina

- **Hero** — titolo, stato/countdown dell'asta, claim cinematografico, campo in
  prospettiva con luci/foschia/particelle in parallax.
- **Il viaggio sul campo** (`#pitch-journey`, `assets/js/journey.js`) — tra l'hero e il
  proclama, una sezione molto più alta di uno schermo mentre il contenuto resta agganciato
  in `position: sticky`: lo scroll pilota una camera SVG che segue una linea bianca del
  campo (`path.getPointAtLength()` + tangente per orientarla), attraversando le fasi
  campo lontano → zoom → viaggio → arrivo (costanti regolabili in cima al file). Con
  `prefers-reduced-motion: reduce` diventa un blocco statico con le tre tappe
  (Strategia/Rilanci/Gloria) impilate.
- **Le Fantasquadre** (`assets/js/teams.js`) — 10 card generate da un array dati
  (`FANTASQUADRE`), mescolate una sola volta al caricamento (Fisher-Yates) e rivelate allo
  scroll. Ogni card ha un'iconcina "copia" accanto al nome squadra/allenatore: al click il
  testo va negli appunti (`navigator.clipboard`, con fallback `execCommand` nei contesti
  non sicuri) e l'icona diventa per ~1,6s una spunta verde.
- **Il proclama** (`assets/js/scroll-reveal.js`) — testo rivelato progressivamente allo
  scroll via `IntersectionObserver`.
- **Sezione finale** (`.final-shot`) — poco prima del footer, mostra "Il destino vi
  aspetta", "L'asta è iniziata" o "Buon campionato a tutti!" a seconda dello stato
  dell'asta (`body.is-live` / `body.is-ended`, già gestiti da `countdown.js`).
- **Footer** — linea bianca luminosa in cima, come la linea di fondo dello stesso campo:
  il manto erboso (colori `--pitch-a`/`--pitch-b`, affievoliti in
  `--pitch-a-dim`/`--pitch-b-dim`) accompagna la pagina dall'hero al footer senza mai
  lasciare il posto a blocchi neri piatti.
- **Navigazione tra le sezioni** (`assets/js/page-nav.js`) — due pulsanti fissi presenti su
  tutta la pagina: uno in basso a destra per andare alla sezione successiva, uno in alto a
  destra per tornare a quella precedente (nascosto sull'hero). Deduce la sezione corrente
  dallo scroll, anche manuale, e nasconde "successiva" in fondo alla pagina.

## Note tecniche

- Il countdown usa `requestAnimationFrame` e calcola sempre le date configurate rispetto a
  `Date.now()`: nessun drift anche con browser rallentato o tab in background.
- `perf.js` centralizza `IntersectionObserver`/`visibilitychange` in pochi segnali
  condivisi (hero, viaggio, Fantasquadre, tab in background): countdown, parallax,
  particelle e camera del viaggio riducono il lavoro a un aggiornamento al secondo (o si
  fermano del tutto) quando la relativa sezione non è in viewport o la scheda non è in
  primo piano.
- Il parallax e le particelle si riducono automaticamente su schermi piccoli
  (`MOBILE_BREAKPOINT`) e si disattivano con `prefers-reduced-motion: reduce`, insieme a
  tutte le altre animazioni infinite della pagina.
- `countdown-fit.js` ricalcola a runtime la taglia delle cifre del countdown su mobile,
  così la riga riempie sempre il 100% della larghezza disponibile senza mai andare in
  overflow, qualunque sia lo stato attivo (prima/live/terminata).
