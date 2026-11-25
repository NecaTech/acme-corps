import { bills, computeNeeds, dossierTypes, equipment, inventory, locations, modules, products, readState } from './industry.mjs';

export function escapeHTML(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, char => entities[char]);
}

const date = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

function heading(title, section = 'Portail Groupe') {
  return `<p class="crumb"><a href="#accueil">Accueil</a> / ${section}</p><h1>${title}</h1>`;
}

function table(caption, headings, rows) {
  return `<div class="table-wrap"><table>
    <caption class="sr-only">${caption}</caption>
    <thead><tr>${headings.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function options(entries, selected = '') {
  return entries.map(([value, label]) =>
    `<option value="${escapeHTML(value)}"${value === selected ? ' selected' : ''}>${escapeHTML(label)}</option>`
  ).join('');
}

function productLink(product) {
  return `<a href="#fiche/${product.id}">${product.id} · ${product.name}</a>`;
}

function lookupForm() {
  return `<form class="form-panel filters" data-action="lookup" aria-label="Rechercher un dossier">
    <div class="field"><label for="case-reference">Référence du dossier</label>
    <input id="case-reference" name="reference" placeholder="Ex. DEV-0028" maxlength="18" required></div>
    <button>Rechercher</button>
  </form>`;
}

export function home() {
  return `<p class="crumb">Portail Groupe / Bienvenue</p>
    <section class="lead">
      <h1>Bienvenue sur le portail ACME-Corps Industrie</h1>
      <p>Les activités Fabrication, Distribution et Service sont regroupées dans ce portail. Pour traiter une demande, sélectionnez votre domaine, le référentiel concerné ou un accès direct selon votre situation.</p>
      <p><a href="#groupe">Organisation et implantations du groupe</a></p>
    </section>
    <div class="quick-actions">
      <a href="#catalogue">Offres et matériels</a>
      <a href="#services">Démarches en ligne</a>
      <a href="#espace">Accès aux dossiers</a>
    </div>
    <h2 class="section-bar">Informations produits et opérations</h2>
    ${table('Références en circulation', ['Référence', 'Famille', 'Implantation'], products.map(product =>
      [productLink(product), product.family, product.site]))}
    <div class="column-pair">
      <section class="box pale">
        <h2 class="box-title">Espace entreprises</h2>
        <p><a href="#services/devis">Chiffrage / demande entrante</a></p>
        <p><a href="#services/sav">Pièces et réclamations</a></p>
        <p><a href="#espace">Consulter le registre</a></p>
      </section>
      <section class="box yellow">
        <h2 class="box-title">Organisation industrielle</h2>
        <p><a href="#atelier">Déclarer un événement</a></p>
        <p><a href="#stock">Disponibilité des composants</a></p>
        <p><a href="#modules">Répertoire des applications</a></p>
      </section>
    </div>`;
}

export function group(site) {
  const location = locations.find(item => item.id === site);
  return `${heading(location?.name ?? 'Organisation du groupe', 'Le Groupe')}
    <p>ACME-Corps assemble des équipements, fournit les pièces de rechange et prend en charge la remise en état sur trois sites.</p>
    ${location ? `<p class="message"><strong>${location.activity}</strong><br>${location.details}</p>` : ''}
    ${table('Sites et activités', ['Site', 'Périmètre', 'Activités'], locations.map(item =>
      [`<a href="#groupe/${item.id}">${item.name}</a>`, item.activity, item.details]))}
    <p><a href="#catalogue">Matériels et services</a> · <a href="#services">Adresser une demande</a></p>`;
}

export function catalogue(query) {
  const families = [...new Set(products.map(product => product.family))];
  const family = families.find(item => item === query.get('famille')) ?? '';
  const rows = products.filter(product => !family || product.family === family).map(product =>
    [productLink(product), product.family, product.site, `<a href="#services/devis?article=${product.id}">Consulter le chiffrage</a>`]);
  return `${heading('Offres et référentiels', 'Référentiel articles')}
    <form class="form-panel filters" data-action="catalogue">
      <div class="field"><label for="family">Activité / famille</label>
      <select id="family" name="family">${options([['', 'Toutes les familles'], ...families.map(item => [item, item])], family)}</select></div>
      <button>Appliquer</button>
    </form>
    ${table('Catalogue des matériels', ['Article', 'Famille', 'Site', 'Démarche'], rows)}
    <p><a href="#stock">Tableau de disponibilité des composants</a></p>`;
}

export function product(id) {
  const entry = products.find(item => item.id === id);
  if (!entry) return `${heading('Référence introuvable')}<p><a href="#catalogue">Revenir au référentiel articles</a></p>`;

  return `${heading(entry.name + ' ' + entry.id, '<a href="#catalogue">Offres et référentiels</a> / Fiche')}
    <p>${entry.description}</p>
    <dl class="data-labels">
      <dt>Code</dt><dd>${entry.id}</dd>
      <dt>Famille</dt><dd>${entry.family}</dd>
      <dt>Site</dt><dd>${entry.site}</dd>
      <dt>Usage</dt><dd>${entry.use}</dd>
      <dt>Options</dt><dd>${entry.options}</dd>
    </dl>
    <div class="form-actions">
      <a class="button-link" href="#services/devis?article=${entry.id}">Accéder au formulaire DEV</a>
      <a href="#services/sav?article=${entry.id}">Service et pièces</a>
      ${bills[entry.id] ? `<a href="#stock?article=${entry.id}">Nomenclature</a>` : ''}
    </div>`;
}

export function services(type, query) {
  if (type !== 'devis' && type !== 'sav') {
    return `${heading('Téléservices et dossiers', 'Démarches')}
      <p>Sélectionnez un formulaire selon le circuit de traitement. Le numéro attribué permet de reprendre le dossier.</p>
      ${table('Formulaires et circuits', ['Code', 'Libellé', 'Circuit'], [
        ['DEV', '<a href="#services/devis">Chiffrage et demande commerciale</a>', 'Bureau commercial'],
        ['SAV', '<a href="#services/sav">Pièces, assistance et retour matériel</a>', 'Service client'],
        ['INT', '<a href="#atelier">Événement de production</a>', 'Maintenance'],
      ])}
      <p><a href="#espace">Reprendre une demande dans l’espace dossiers</a></p>`;
  }

  const { prefix, label } = dossierTypes[type];
  return `${heading(prefix + ' · ' + label, '<a href="#services">Téléservices</a> / Saisie')}
    <p class="muted">Saisie de démonstration. Utilisez un nom d’établissement fictif.</p>
    <form class="form-panel" data-action="dossier" data-type="${type}">
      <div class="form-grid">
        <div class="field">
          <label for="organization">Raison sociale / établissement</label>
          <input id="organization" name="organization" maxlength="80" required>
        </div>
        <div class="field">
          <label for="product">Référence article</label>
          <select id="product" name="subject" required>${options(
            [['', 'Choisir une référence'], ...products.map(item => [item.id, item.id + ' · ' + item.name])],
            query.get('article')
          )}</select>
        </div>
        ${type === 'devis' ? `<div class="field"><label for="quantity">Quantité</label>
          <input id="quantity" name="quantity" type="number" min="1" max="1000" value="1" required></div>` : ''}
        <div class="field full">
          <label for="description">${type === 'devis' ? 'Objet du chiffrage et conditions de montage' : 'Motif de la demande SAV'}</label>
          <textarea id="description" name="note" maxlength="1000" required></textarea>
        </div>
      </div>
      <div class="form-actions"><button>Valider la saisie</button><a href="#services">Retour aux imprimés</a></div>
      <p class="error-text" role="alert" data-error hidden></p>
    </form>`;
}

function dossierRow(record) {
  const status = record.history.at(-1);
  return [
    `<a href="#espace/${escapeHTML(record.id)}">${escapeHTML(record.id)}</a>`,
    dossierTypes[record.type].label, escapeHTML(record.subject), escapeHTML(status.status),
  ];
}

export function dossiers(reference, feedback) {
  const state = readState();
  const record = state.dossiers.find(item => item.id === reference);
  if (!reference || !record) {
    return `${heading('Espace dossiers', 'Registre et correspondance')}
      ${reference ? `<p class="message error" role="status">Dossier ${escapeHTML(reference)} introuvable. Vérifiez son numéro ou utilisez la liste ci-dessous.</p>` : ''}
      ${lookupForm()}
      ${table('Registre des dossiers', ['Référence', 'Nature', 'Objet', 'État'], state.dossiers.map(dossierRow))}`;
  }

  const status = record.history.at(-1).status;
  const subject = [...products, ...equipment].find(item => item.id === record.subject);
  const incidentAction = { 'Déclaré': 'Prendre en charge', 'Pris en charge': 'Clôturer l’intervention' }[status];
  return `${heading('Dossier ' + escapeHTML(record.id), '<a href="#espace">Espace dossiers</a> / Consultation')}
    ${feedback ? `<p class="message ok" role="status">${escapeHTML(feedback)}</p>` : ''}
    <dl class="data-labels">
      <dt>Type</dt><dd>${dossierTypes[record.type].label}</dd>
      <dt>État</dt><dd><strong>${escapeHTML(status)}</strong></dd>
      <dt>Objet</dt><dd>${escapeHTML(subject?.name ?? record.subject)} · ${escapeHTML(record.subject)}</dd>
      ${record.organization ? `<dt>Établissement</dt><dd>${escapeHTML(record.organization)}</dd>` : ''}
      ${record.quantity ? `<dt>Quantité</dt><dd>${record.quantity}</dd>` : ''}
      ${record.priority ? `<dt>Priorité</dt><dd>${escapeHTML(record.priority)}</dd>` : ''}
      <dt>Description</dt><dd>${escapeHTML(record.note)}</dd>
    </dl>
    <h2>Historique des états</h2>
    ${table('Historique des états', ['État', 'Horodatage'], record.history.map(event =>
      [escapeHTML(event.status), date.format(new Date(event.at))]))}
    <div class="form-actions">
      ${record.type === 'incident' && incidentAction ? `<form data-action="advance">
        <input type="hidden" name="id" value="${escapeHTML(record.id)}">
        <input type="hidden" name="status" value="${escapeHTML(status)}">
        <button>${incidentAction}</button>
        <p class="error-text" role="alert" data-error hidden></p>
      </form>` : ''}
      <a href="#espace">Registre des dossiers</a>
      ${record.type === 'incident' ? '<a href="#atelier">Retour à l’atelier</a>' : ''}
    </div>`;
}

export function workshop() {
  const incidentRows = readState().dossiers.filter(record => record.type === 'incident').map(dossierRow);
  return `${heading('Exploitation et interventions', 'Registre atelier')}
    ${table('Équipements affectés', ['Équipement', 'Site', 'Référence'], equipment.map(item => [
      `${item.id} · ${item.name}`, item.site, `<a href="#fiche/${item.product}">${item.product}</a>`,
    ]))}
    <h2 class="section-bar">INT · Déclaration d’événement</h2>
    <form class="form-panel" data-action="dossier" data-type="incident">
      <div class="form-grid">
        <div class="field"><label for="asset">Équipement / ligne</label>
        <select id="asset" name="subject" required>${options([['', 'Choisir'], ...equipment.map(item => [item.id, item.id + ' · ' + item.name])])}</select></div>
        <div class="field"><label for="priority">Priorité</label>
        <select id="priority" name="priority"><option>Standard</option><option>Bloquante</option></select></div>
        <div class="field full"><label for="incident-description">Description de l’événement</label>
        <textarea id="incident-description" name="note" maxlength="1000" required></textarea></div>
      </div>
      <div class="form-actions"><button>Enregistrer l’événement</button></div>
      <p class="error-text" role="alert" data-error hidden></p>
    </form>
    <h2>Interventions</h2>
    ${table('Interventions atelier', ['Référence', 'Nature', 'Objet', 'État'], incidentRows)}`;
}

export function stock(query) {
  const productId = Object.keys(bills).find(id => id === query.get('article')) ?? '';
  const rawQuantity = query.get('quantite');
  const quantity = Number(rawQuantity ?? 1);
  const result = computeNeeds(productId, quantity);
  const shortage = result?.some(item => item.missing > 0);
  return `${heading('Disponibilités et nomenclatures', 'Exploitation / Magasin')}
    <form class="form-panel filters" data-action="stock">
      <div class="field"><label for="production-product">Article à fabriquer</label>
      <select name="product" id="production-product" required>${options(
        [['', 'Sélectionner'], ...products.filter(entry => bills[entry.id]).map(item => [item.id, item.id + ' · ' + item.name])], productId
      )}</select></div>
      <div class="field"><label for="production-quantity">Quantité à produire</label>
      <input type="number" name="quantity" id="production-quantity" min="1" max="1000" value="${escapeHTML(rawQuantity ?? '1')}" required></div>
      <button>Calculer les besoins</button>
    </form>
    ${result && rawQuantity !== null ? `
      <p class="message${shortage ? '' : ' ok'}" role="status"><strong>${shortage ? 'Composants manquants' : 'Stock suffisant'}</strong>
      · ${quantity} × ${productId}</p>
      ${table('Besoin par composant', ['Composant', 'Par unité', 'Nécessaire', 'Disponible', 'Manque'], result.map(item =>
        [item.component + ' · ' + item.name, item.perUnit, item.required, item.available, item.missing]))}
    ` : rawQuantity !== null ? '<p class="message error" role="status">Choisissez un article et une quantité entière comprise entre 1 et 1 000.</p>' : ''}
    <h2>État du magasin</h2>
    ${table('Stock disponible', ['Référence', 'Composant', 'Disponible'], Object.entries(inventory).map(([code, item]) =>
      [code, item.name, item.available]))}`;
}

export function directory() {
  return `${heading('Annuaire des applications et services', 'Index fonctionnel')}
    ${table('Modules du portail', ['Application', 'Utilisateurs', 'Données'], modules.map(item =>
      [`<a href="${item.route}">${item.name}</a>`, item.role, item.data]))}`;
}

export function search(query) {
  const term = (query.get('q') ?? '').trim().slice(0, 80);
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr');
  const candidates = [
    ...products.map(item => ({ name: item.id + ' · ' + item.name, route: '#fiche/' + item.id, data: item.family })),
    ...modules,
  ];
  const matches = term ? candidates.filter(item => normalize(item.name).includes(normalize(term))) : [];
  return `${heading('Résultats de recherche', 'Index transversal')}
    <p>Recherche dans le titre ou la référence. ${term ? `Terme saisi <strong>${escapeHTML(term)}</strong>.` : 'Saisissez un terme dans la barre de recherche.'}</p>
    ${matches.length ? table('Résultats', ['Intitulé', 'Référentiel'], matches.map(item =>
      [`<a href="${item.route}">${item.name}</a>`, item.data])) : '<p class="message">Aucune entrée correspondante dans l’index.</p>'}`;
}
