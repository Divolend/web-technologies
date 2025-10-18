function renderDishes() {
  const containers = {
    soup:    document.querySelector('#soups .dish-grid'),
    main:    document.querySelector('#mains .dish-grid'),
    salad:   document.querySelector('#salads .dish-grid'),
    drink:   document.querySelector('#drinks .dish-grid'),
    dessert: document.querySelector('#desserts .dish-grid'),
  };
  if (!containers.soup || !containers.main || !containers.salad || !containers.drink || !containers.dessert) return;

  const byCategory = { soup: [], main: [], salad: [], drink: [], dessert: [] };
  dishes.forEach(d => {
    if (byCategory[d.category]) {
      byCategory[d.category].push(d);
    }
  });

  Object.keys(byCategory).forEach(cat => {
    byCategory[cat].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  });

  const createCard = (dish) => {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.dish = dish.keyword;
    card.dataset.category = dish.category;
    card.dataset.kind = dish.kind;

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
    weight.textContent = dish.count;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Добавить';

    const handleClick = (e) => {
      addToOrder(dish);
      e.stopPropagation();
    };

    card.addEventListener('click', handleClick);
    btn.addEventListener('click', handleClick);

    card.append(img, price, name, weight, btn);
    return card;
  };

  Object.keys(byCategory).forEach(cat => {
    const grid = containers[cat];
    grid.innerHTML = '';
    byCategory[cat].forEach(dish => {
      grid.appendChild(createCard(dish));
    });
  });

  setupFilters();
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
