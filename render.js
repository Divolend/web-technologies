// render.js
function renderDishes() {
  // страховка
  if (!Array.isArray(window.dishes)) window.dishes = [];

  // словарь блюд по id для быстрых вычислений
  window.dishesById = {};
  window.dishes.forEach(d => { if (d && typeof d.id !== 'undefined') dishesById[d.id] = d; });

  const containers = {
    soup:    document.querySelector('#soups .dish-grid'),
    main:    document.querySelector('#mains .dish-grid'),
    salad:   document.querySelector('#salads .dish-grid'),
    drink:   document.querySelector('#drinks .dish-grid'),
    dessert: document.querySelector('#desserts .dish-grid'),
  };
  if (!containers.soup || !containers.main || !containers.salad || !containers.drink || !containers.dessert) return;

  // группируем
  const byCategory = { soup: [], main: [], salad: [], drink: [], dessert: [] };
  dishes.forEach(d => { if (byCategory[d.category]) byCategory[d.category].push(d); });
  Object.keys(byCategory).forEach(cat => byCategory[cat].sort((a,b)=>a.name.localeCompare(b.name,'ru')));

  // текущие выбранные id
  const selectedIds = new Set(Cart.getIds());

  // фабрика карточки
  const createCard = (dish) => {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.id = dish.id;
    card.dataset.category = dish.category;
    card.dataset.kind = dish.kind;

    if (selectedIds.has(dish.id)) card.classList.add('selected');

    const img = document.createElement('img');
    img.src = dish.image;
    img.alt = dish.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `${dish.price}₽`;

    const name = document.createElement('p');
    name.className = 'name';
    name.textContent = dish.name;

    const weight = document.createElement('p');
    weight.className = 'weight';
    weight.textContent = dish.count || '';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = selectedIds.has(dish.id) ? 'Убрать' : 'Добавить';

    const toggle = (e) => {
      e.stopPropagation();
      const added = Cart.toggle(dish.id); // true если добавили, false если убрали
      if (added) {
        card.classList.add('selected');
        btn.textContent = 'Убрать';
      } else {
        card.classList.remove('selected');
        btn.textContent = 'Добавить';
      }
      updateStickyPanel(); // пересчитать сумму и доступность кнопки
    };

    card.addEventListener('click', toggle);
    btn.addEventListener('click', toggle);

    card.append(img, price, name, weight, btn);
    return card;
  };

  // рендерим
  Object.keys(byCategory).forEach(cat => {
    const grid = containers[cat];
    grid.innerHTML = '';
    byCategory[cat].forEach(dish => grid.appendChild(createCard(dish)));
  });

  // фильтры
  setupFilters();

  // первичная отрисовка панели
  updateStickyPanel();
}

function setupFilters() {
  document.querySelectorAll('section[data-category]').forEach(section => {
    const grid = section.querySelector('.dish-grid');
    const links = section.querySelectorAll('.filters a');

    const showAll = () =>
      grid.querySelectorAll('.dish-card').forEach(c => { c.style.display = ''; });

    const applyFilter = (kind) =>
      grid.querySelectorAll('.dish-card').forEach(card => {
        card.style.display = (card.dataset.kind === kind) ? '' : 'none';
      });

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const wasActive = link.classList.contains('active');
        links.forEach(l => l.classList.remove('active'));

        if (wasActive) {
          showAll();
        } else {
          link.classList.add('active');
          applyFilter(link.dataset.kind);
        }
      });
    });
  });
}

/* ======= панель «перейти к оформлению» ======= */
function updateStickyPanel() {
  const el = document.getElementById('checkout-sticky');
  const sumEl = document.getElementById('sticky-total');
  const btn = document.getElementById('go-checkout');
  if (!el || !sumEl || !btn || !window.dishesById) return;

  const ids = Cart.getIds();
  const total = Cart.total(ids, dishesById);
  const canCheckout = Cart.isValidCombo(ids, dishesById);

  // показать/скрыть панель
  if (ids.length === 0) {
    el.classList.add('is-hidden');
  } else {
    el.classList.remove('is-hidden');
  }

  sumEl.textContent = total;

  // активность кнопки
  if (canCheckout) {
    btn.classList.remove('is-disabled');
    btn.setAttribute('aria-disabled', 'false');
  } else {
    btn.classList.add('is-disabled');
    btn.setAttribute('aria-disabled', 'true');
  }
}
