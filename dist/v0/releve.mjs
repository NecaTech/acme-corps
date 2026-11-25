const key = 'acme-corps.v0.releve';
const version = 'V0';
let run;

try {
  run = JSON.parse(sessionStorage.getItem(key));
} catch {
  run = null;
}

function save() {
  try {
    sessionStorage.setItem(key, JSON.stringify(run));
  } catch {
    // The current document can still hold the run in memory.
  }
}

export function observe(type, route, action) {
  if (!run || run.endedAt || route === 'releve') return;
  const event = { type, route, atMs: Date.now() - run.startedAt };
  if (action) event.action = action;
  run.events.push(event);
  save();
}

export function start() {
  run = { version, startedAt: Date.now(), endedAt: null, events: [] };
  save();
}

export function stop() {
  if (!run || run.endedAt) return;
  run.endedAt = Date.now();
  save();
}

export function download() {
  if (!run) return;
  const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'acme-corps-v0-releve.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function report() {
  const active = run && !run.endedAt;
  const count = type => run.events.filter(event => event.type === type).length;
  const seconds = run ? Math.round(((run.endedAt ?? Date.now()) - run.startedAt) / 1000) : 0;
  return `<p class="crumb"><a href="#accueil">Accueil</a> / Relevé</p>
    <h1>Relevé de passage</h1>
    <p>Le relevé compte le temps écoulé, les écrans ouverts, les clics sur les commandes et les opérations abouties après son lancement. Il reste dans cet onglet et peut être téléchargé.</p>
    ${run ? `<dl class="data-labels">
      <dt>État</dt><dd>${active ? 'En cours' : 'Arrêté'}</dd>
      <dt>Temps écoulé</dt><dd>${seconds} s</dd>
      <dt>Écrans</dt><dd>${count('screen')}</dd>
      <dt>Clics</dt><dd>${count('click')}</dd>
      <dt>Opérations abouties</dt><dd>${count('success')}</dd>
    </dl>` : '<p>Aucun relevé en cours.</p>'}
    <div class="form-actions">
      ${active ? '<form data-action="measure-stop"><button>Arrêter le relevé</button></form><a href="#accueil">Revenir à l’accueil</a>' :
        `<form data-action="measure-start"><button>${run ? 'Remplacer par un nouveau relevé' : 'Démarrer depuis l’accueil'}</button></form>`}
      ${run ? '<form data-action="measure-download"><button>Télécharger le relevé JSON</button></form>' : ''}
    </div>`;
}
