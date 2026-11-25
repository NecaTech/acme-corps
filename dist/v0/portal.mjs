import { addDossier, advanceIncident, computeNeeds, equipment, products } from './industry.mjs';
import * as screen from './screens.mjs';
import * as measurement from './releve.mjs';

const main = document.querySelector('main');
const navigation = document.querySelectorAll('.main-nav a');
let feedback = '';

function route() {
  const fragment = location.hash.slice(1);
  const separator = fragment.indexOf('?');
  const path = separator === -1 ? fragment : fragment.slice(0, separator);
  const search = separator === -1 ? '' : fragment.slice(separator + 1);
  const [page = 'accueil', detail] = (path || 'accueil').split('/');
  return { page, detail, query: new URLSearchParams(search) };
}

const screens = {
  accueil: () => screen.home(),
  groupe: ({ detail }) => screen.group(detail),
  catalogue: ({ query }) => screen.catalogue(query),
  fiche: ({ detail }) => screen.product(detail),
  services: ({ detail, query }) => screen.services(detail, query),
  espace: ({ detail }) => screen.dossiers(detail, feedback),
  atelier: () => screen.workshop(),
  stock: ({ query }) => screen.stock(query),
  modules: () => screen.directory(),
  recherche: ({ query }) => screen.search(query),
  releve: () => measurement.report(),
};

function render({ focus = false, observe = true } = {}) {
  const current = route();
  const renderScreen = Object.hasOwn(screens, current.page) ? screens[current.page] : screens.accueil;
  main.innerHTML = renderScreen(current);
  feedback = '';
  document.title = main.querySelector('h1').textContent + ' — ACME-Corps';
  const navKey = current.page === 'fiche' ? 'catalogue' : current.page;
  for (const link of navigation) {
    if (link.getAttribute('href') === '#' + navKey) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (observe) measurement.observe('screen', Object.hasOwn(screens, current.page) ? current.page : 'accueil');
  if (focus) {
    main.focus({ preventScroll: true });
    scrollTo(0, 0);
  }
}

function go(hash) {
  if (location.hash === hash) render({ focus: true, observe: false });
  else location.hash = hash;
}

function searchRoute(path, fields) {
  const params = new URLSearchParams(fields);
  go('#' + path + '?' + params);
}

function field(data, name) {
  return String(data.get(name) ?? '').trim();
}

function showError(form, message) {
  const target = form.querySelector('[data-error]');
  if (!target) return;
  target.textContent = message;
  target.hidden = false;
}

function caseFields(type, data) {
  const subject = field(data, 'subject');
  const note = field(data, 'note');
  if (!note) return null;
  if (type === 'incident') {
    const priority = field(data, 'priority');
    if (!equipment.some(item => item.id === subject) || !['Standard', 'Bloquante'].includes(priority)) return null;
    return { subject, note, priority };
  }

  const organization = field(data, 'organization');
  if (!organization || !products.some(item => item.id === subject)) return null;
  if (type === 'sav') return { subject, note, organization };
  const quantity = Number(field(data, 'quantity'));
  if (type !== 'devis' || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return null;
  return { subject, note, organization, quantity };
}

const actions = {
  search: data => searchRoute('recherche', { q: field(data, 'query') }),
  catalogue: data => searchRoute('catalogue', { famille: field(data, 'family') }),
  lookup: data => {
    const reference = field(data, 'reference').toUpperCase();
    go(reference ? '#espace/' + encodeURIComponent(reference) : '#espace');
  },
  stock: data => {
    const product = field(data, 'product');
    const quantity = field(data, 'quantity');
    if (computeNeeds(product, Number(quantity))) measurement.observe('success', 'stock', 'besoins-calcules');
    searchRoute('stock', { article: product, quantite: quantity });
  },
  dossier: async (data, form) => {
    const type = form.dataset.type;
    const values = caseFields(type, data);
    if (!values) {
      showError(form, 'Vérifiez la référence et complétez tous les champs obligatoires.');
      return;
    }
    const id = await addDossier(type, values);
    measurement.observe('success', route().page, type);
    feedback = 'Saisie enregistrée. Référence de suivi ' + id + '.';
    go('#espace/' + id);
  },
  advance: async (data, form) => {
    const id = field(data, 'id');
    const status = await advanceIncident(id, field(data, 'status'));
    if (!status) {
      showError(form, 'Le dossier a changé. Rouvrez-le depuis le registre avant de poursuivre.');
      return;
    }
    measurement.observe('success', 'espace', 'etat-incident');
    feedback = 'État mis à jour. ' + status + '.';
    render({ focus: true, observe: false });
  },
  'measure-start': () => {
    measurement.start();
    go('#accueil');
  },
  'measure-stop': () => {
    measurement.stop();
    render({ focus: true, observe: false });
  },
  'measure-download': () => measurement.download(),
};

document.addEventListener('click', event => {
  const target = event.target.closest('a, button');
  if (!target) return;
  if (target.hasAttribute('data-skip')) {
    event.preventDefault();
    main.focus();
    return;
  }
  const href = target.getAttribute('href');
  if (href === '#releve' || target.closest('form')?.dataset.action?.startsWith('measure-')) return;
  measurement.observe('click', route().page, target.matches('button') ? 'bouton' : 'lien');
});

document.addEventListener('submit', async event => {
  const form = event.target;
  const name = form.dataset.action;
  if (!name || !Object.hasOwn(actions, name)) return;
  event.preventDefault();

  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  const error = form.querySelector('[data-error]');
  if (error) error.hidden = true;
  try {
    await actions[name](new FormData(form), form);
  } catch {
    showError(form, 'L’enregistrement local a échoué. Autorisez le stockage dans ce navigateur, puis réessayez.');
  } finally {
    button.disabled = false;
  }
});

window.addEventListener('hashchange', () => render({ focus: true }));
render();
