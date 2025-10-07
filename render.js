function renderDishes() {
  // контейнеры по категориям
  const containers = {
    soup: document.querySelector('#soups .dish-grid'),
    main: document.querySelector('#mains .dish-grid'),
    drink: document.querySelector('#drinks .dish-grid')
  };

  if (!containers.soup || !containers.main || !containers.drink) return;

  // сортируем блюда каждой категории по имени
  const byCategory = { soup: [], main: [], drink: [] };
  dishes.forEach(d => byCategory[d.category].push(d));
  Object.keys(byCategory).forEach(cat => {
    byCategory[cat].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  });

  // функция создания карточки
  const createCard = (dish) => {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.setAttribute('data-dish', dish.keyword);
    card.setAttribute('data-category', dish.category);

    card.innerHTML = `
      <img src="${dish.image}" alt="${dish.name}">
      <p class="price">${dish.price}₽</p>
      <p class="name">${dish.name}</p>
      <p class="weight">${dish.count}</p>
      <button type="button">Добавить</button>
    `;

    // клик по всей карточке — выбрать блюдо
    card.addEventListener('click', (e) => {
      // если клик по кнопке — тоже ок; если по чему-то внутри — неважно
      addToOrder(dish);
      e.stopPropagation();
    });

    // отдельно страхуем клик по кнопке (на случай всплытия/стилей)
    card.querySelector('button').addEventListener('click', (e) => {
      addToOrder(dish);
      e.stopPropagation();
    });

    return card;
  };

  // рендерим по категориям
  ['soup', 'main', 'drink'].forEach(cat => {
    const grid = containers[cat];
    grid.innerHTML = ''; // на всякий случай
    byCategory[cat].forEach(dish => {
      grid.appendChild(createCard(dish));
    });
  });
}
