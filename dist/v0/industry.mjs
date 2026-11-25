export const products = [
  {
    id: 'PM-40', name: 'Pompe de transfert', family: 'Hydraulique', site: 'Corbas',
    description: 'Pompe de transfert pour circuit fermé, disponible en échange standard et en ensemble complet.',
    use: 'Remplacement d’une pompe sur un banc de production ou remise en service d’un groupe de transfert.',
    options: 'Ensemble complet, échange standard, kit de joints.',
  },
  {
    id: 'CV-12', name: 'Convoyeur modulaire', family: 'Manutention', site: 'Saint-Priest',
    description: 'Tronçon de convoyeur motorisé pour relier deux postes sur une ligne d’assemblage.',
    use: 'Montage en ligne, extension d’un poste ou remplacement d’un tronçon.',
    options: 'Module complet et pièces de montage.',
  },
  {
    id: 'AR-07', name: 'Armoire de commande', family: 'Automatisme', site: 'Saint-Priest',
    description: 'Armoire de commande pour centraliser les départs d’un petit ensemble de production.',
    use: 'Regroupement des commandes d’un convoyeur et de ses postes adjacents.',
    options: 'Armoire pré-équipée ou boîtier seul.',
  },
  {
    id: 'JM-40', name: 'Kit de joints PM-40', family: 'Hydraulique', site: 'Feyzin',
    description: 'Ensemble de joints pour la maintenance d’une pompe PM-40.',
    use: 'Remise en état en atelier après contrôle de la pompe.',
    options: 'Kit complet conditionné à l’unité.',
  },
];

export const locations = [
  { id: 'saint-priest', name: 'Saint-Priest', activity: 'Fabrication et assemblage', details: 'Assemblage des convoyeurs, montage des armoires et essais de ligne.' },
  { id: 'feyzin', name: 'Feyzin', activity: 'Magasin et expéditions', details: 'Réception, stockage des composants et préparation des expéditions.' },
  { id: 'corbas', name: 'Corbas', activity: 'Service et remise en état', details: 'Diagnostic de pompes, préparation des échanges standard et suivi des retours.' },
];

export const equipment = [
  { id: 'SP-L02', name: 'Convoyeur ligne 2', site: 'Saint-Priest', product: 'CV-12' },
  { id: 'FY-T03', name: 'Groupe de transfert', site: 'Feyzin', product: 'PM-40' },
  { id: 'CO-D01', name: 'Banc de diagnostic', site: 'Corbas', product: 'AR-07' },
];

export const inventory = {
  'MR-220': { name: 'Motoréducteur', available: 3 },
  'GB-12': { name: 'Guide de bande', available: 8 },
  'CP-12': { name: 'Capteur de présence', available: 12 },
  'PL-07': { name: 'Platine de commande', available: 4 },
  'BR-30': { name: 'Bornier', available: 18 },
  'CJ-40': { name: 'Corps de pompe', available: 5 },
  'JM-40': { name: 'Kit de joints', available: 6 },
};

export const bills = {
  'CV-12': { 'MR-220': 2, 'GB-12': 2, 'CP-12': 1 },
  'AR-07': { 'PL-07': 1, 'BR-30': 4 },
  'PM-40': { 'CJ-40': 1, 'JM-40': 1 },
};

export const modules = [
  { id: 'catalogue', name: 'Référentiel articles', role: 'Visiteur / bureau commercial', data: 'Article, gamme, site', route: '#catalogue' },
  { id: 'devis', name: 'Demandes de devis', role: 'Prospect / bureau commercial', data: 'Article, demande, dossier', route: '#services/devis' },
  { id: 'sav', name: 'Service après-vente', role: 'Client / service technique', data: 'Article, demande, dossier', route: '#services/sav' },
  { id: 'dossiers', name: 'Suivi de dossiers', role: 'Client / gestionnaire', data: 'Dossier, état, historique', route: '#espace' },
  { id: 'maintenance', name: 'Maintenance', role: 'Opérateur / technicien', data: 'Équipement, incident, dossier', route: '#atelier' },
  { id: 'fabrication', name: 'Nomenclatures et besoins', role: 'Planificateur / magasinier', data: 'Article, composant, quantité', route: '#stock' },
];

export const dossierTypes = {
  devis: { prefix: 'DEV', label: 'Demande de devis', states: ['Enregistrée'] },
  sav: { prefix: 'SAV', label: 'Demande SAV', states: ['Enregistrée'] },
  incident: { prefix: 'INT', label: 'Incident atelier', states: ['Déclaré', 'Pris en charge', 'Clôturé'] },
};

export const seed = {
  sequence: 31,
  dossiers: [
    {
      id: 'DEV-0028', type: 'devis', subject: 'PM-40', organization: 'Atelier Delta (fictif)',
      quantity: 2, note: 'Deux pompes en échange standard pour un banc de production.',
      history: [{ status: 'Enregistrée', at: '2026-11-23T10:12:00Z' }],
    },
    {
      id: 'INT-0031', type: 'incident', subject: 'SP-L02', priority: 'Standard',
      note: 'Signalement de bruit irrégulier au retour de bande. La ligne reste disponible.',
      history: [
        { status: 'Déclaré', at: '2026-11-25T07:15:00Z' },
        { status: 'Pris en charge', at: '2026-11-25T07:40:00Z' },
      ],
    },
  ],
};

export function computeNeeds(productId, quantity) {
  if (!Object.hasOwn(bills, productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return null;
  const bill = bills[productId];

  return Object.entries(bill).map(([component, perUnit]) => {
    const { name, available } = inventory[component];
    const required = perUnit * quantity;
    return { component, name, perUnit, available, required, missing: Math.max(0, required - available) };
  });
}

const storageKey = 'acme-corps.v0.dossiers';

export function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Number.isInteger(saved?.sequence) && Array.isArray(saved.dossiers)) return saved;
  } catch {
    // The original sample stays readable if local storage is unavailable.
  }
  return structuredClone(seed);
}

function updateState(update) {
  const edit = () => {
    const state = readState();
    const result = update(state);
    localStorage.setItem(storageKey, JSON.stringify(state));
    return result;
  };
  return navigator.locks ? navigator.locks.request(storageKey, edit) : Promise.resolve().then(edit);
}

export function addDossier(type, fields) {
  return updateState(state => {
    state.sequence += 1;
    const { prefix, states } = dossierTypes[type];
    const id = prefix + '-' + String(state.sequence).padStart(4, '0');
    state.dossiers.unshift({
      ...fields, id, type,
      history: [{ status: states[0], at: new Date().toISOString() }],
    });
    return id;
  });
}

export function advanceIncident(id, expectedStatus) {
  return updateState(state => {
    const incident = state.dossiers.find(record => record.id === id && record.type === 'incident');
    const status = incident?.history.at(-1)?.status;
    const validStates = dossierTypes.incident.states;
    const next = validStates[validStates.indexOf(status) + 1];
    if (!incident || status !== expectedStatus || !validStates.includes(status) || !next) return null;
    incident.history.push({ status: next, at: new Date().toISOString() });
    return next;
  });
}
