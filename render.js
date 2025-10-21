// render.js — вывод блюд и фильтры-тогглы (без кнопки «всё»)

function renderDishes() {
  if (!Array.isArray(window.dishes)) window.dishes = [];

  // Нормализация категорий к: soup | main | salad | drink | dessert
  function normalizeCategory(cat) {
    var s = String(cat || '').toLowerCase().trim();
    if (s === 'soup' || s === 'soups') return 'soup';
    if (s === 'main' || s === 'mains' || s === 'main_course' || s === 'maincourse' || s === 'main-course') return 'main';
    if (s === 'salad' || s === 'salads' || s === 'starter' || s === 'starters') return 'salad';
    if (s === 'drink' || s === 'drinks' || s === 'beverage' || s === 'beverages') return 'drink';
    if (s === 'dessert' || s === 'desserts') return 'dessert';
    return s;
  }

  // Индекс по id
  window.dishesById = {};
  (window.dishes || []).forEach(function (d) {
    if (d && typeof d.id !== 'undefined') window.dishesById[d.id] = d;
  });

  // Контейнеры секций
  var containers = {
    soup:    document.querySelector('#soups .dish-grid'),
    main:    document.querySelector('#mains .dish-grid'),
    salad:   document.querySelector('#salads .dish-grid'),
    drink:   document.querySelector('#drinks .dish-grid'),
    dessert: document.querySelector('#desserts .dish-grid')
  };
  if (!containers.soup || !containers.main || !containers.salad || !containers.drink || !containers.dessert) {
    console.warn('[render] отсутствуют ожидаемые контейнеры секций');
    return;
  }

  // Группировка по нормализованной категории
  var byCategory = { soup: [], main: [], salad: [], drink: [], dessert: [] };
  window.dishes.forEach(function (d) {
    var cat = normalizeCategory(d.category);
    if (byCategory[cat]) byCategory[cat].push(d);
  });

  // Сортировка по имени
  Object.keys(byCategory).forEach(function (cat) {
    byCategory[cat].sort(function (a, b) { return String(a.name||'').localeCompare(String(b.name||''), 'ru'); });
  });

  var selected = new Set(Cart.getIds());

  function createCard(dish) {
    var card = document.createElement('article');
    card.className = 'dish-card';
    card.dataset.id = dish.id;
    card.dataset.category = normalizeCategory(dish.category);
    card.dataset.kind = String(dish.kind || '');
    if (selected.has(dish.id)) card.classList.add('selected');

    var img = document.createElement('img');
    img.src = dish.image; img.alt = dish.name;

    var price = document.createElement('p');
    price.className = 'price'; price.textContent = (Number(dish.price)||0) + '₽';

    var name = document.createElement('p');
    name.className = 'name'; name.textContent = dish.name || '';

    var weight = document.createElement('p');
    weight.className = 'weight'; weight.textContent = dish.count || '';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = selected.has(dish.id) ? 'Убрать' : 'Добавить';

    function toggle(e){
      e.stopPropagation();
      var added = Cart.toggle(dish.id);
      if (added) { selected.add(dish.id); card.classList.add('selected'); btn.textContent='Убрать'; }
      else { selected.delete(dish.id); card.classList.remove('selected'); btn.textContent='Добавить'; }
      updateStickyPanel();
    }
    card.addEventListener('click', toggle);
    btn.addEventListener('click', toggle);

    card.appendChild(img);
    card.appendChild(price);
    card.appendChild(name);
    card.appendChild(weight);
    card.appendChild(btn);
    return card;
  }

  // Рисуем секции
  Object.keys(containers).forEach(function (cat) {
    var box = containers[cat];
    box.innerHTML = '';
    (byCategory[cat] || []).forEach(function (d) {
      box.appendChild(createCard(d));
    });
  });

  // При первом рендере показываем всё (нет активных фильтров)
  ['soups','mains','salads','drinks','desserts'].forEach(function(secId){
    var sec = document.getElementById(secId);
    if (!sec) return;
    sec.querySelectorAll('.dish-card').forEach(function(el){ el.style.display=''; });
    var filter = sec.querySelector('.kind-filter');
    if (filter) filter.querySelectorAll('.active').forEach(function(x){ x.classList.remove('active'); });
  });
}

/* Глобальный обработчик кликов по фильтрам.
   Логика:
   - клик по неактивной кнопке => включить фильтр по её data-kind
   - повторный клик по активной => отключить фильтр (показать все) */
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.kind-filter [data-kind]');
  if (!btn) return;

  e.preventDefault();

  var filter = btn.closest('.kind-filter');
  var section = btn.closest('#soups, #mains, #salads, #drinks, #desserts');
  if (!filter || !section) return;

  var isActive = btn.classList.contains('active');
  // сбрасываем активность у всех
  filter.querySelectorAll('.active').forEach(function (x) { x.classList.remove('active'); });

  if (!isActive) {
    // включаем новый фильтр
    btn.classList.add('active');
    var kind = btn.dataset.kind || '';
    section.querySelectorAll('.dish-card').forEach(function (el) {
      el.style.display = (el.dataset.kind === kind) ? '' : 'none';
    });
  } else {
    // снимаем фильтр — показываем всё
    section.querySelectorAll('.dish-card').forEach(function (el) { el.style.display = ''; });
  }
}, true);

// панель «перейти к оформлению»
function updateStickyPanel() {
  var el = document.getElementById('checkout-sticky');
  var sumEl = document.getElementById('sticky-total');
  var btn = document.getElementById('go-checkout');
  if (!el || !sumEl || !btn || !window.dishesById) return;

  var ids = Cart.getIds();
  var total = Cart.total(ids, window.dishesById);
  var ok = Cart.isValidCombo(ids, window.dishesById);

  if (ids.length === 0) el.classList.add('is-hidden'); else el.classList.remove('is-hidden');
  sumEl.textContent = total;
  if (ok) { btn.classList.remove('is-disabled'); btn.setAttribute('aria-disabled','false'); }
  else { btn.classList.add('is-disabled'); btn.setAttribute('aria-disabled','true'); }
}