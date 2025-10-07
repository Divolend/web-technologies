// состояние заказа
const order = {
  soup: null,
  main: null,
  drink: null
};

// сброс заказа программно
function clearOrder() {
  order.soup = null;
  order.main = null;
  order.drink = null;
}

// добавить блюдо (вызывается из render.js по клику на карточку)
function addToOrder(dish) {
  // dish.category: 'soup' | 'main' | 'drink'
  order[dish.category] = dish;
  updateOrderBlock();
}

// обновление разметки блока заказа (не трогаем textarea!)
function updateOrderBlock() {
  const orderItems = document.getElementById('order-items');
  if (!orderItems) return;

  // если ничего не выбрано
  if (!order.soup && !order.main && !order.drink) {
    orderItems.innerHTML = `<p><strong>Ничего не выбрано</strong></p>`;
    return;
  }

  // иначе выводим по категориям
  const catTitle = {
    soup: 'Суп',
    main: 'Главное блюдо',
    drink: 'Напиток'
  };

  let total = 0;
  orderItems.innerHTML = '';

  ['soup', 'main', 'drink'].forEach(cat => {
    const item = order[cat];
    if (item) {
      orderItems.innerHTML += `<p><strong>${catTitle[cat]}</strong><br>${item.name} ${item.price}₽</p>`;
      total += item.price;
    } else {
      // когда есть хотя бы один выбранный — пустые категории показываем
      orderItems.innerHTML += `<p><strong>${catTitle[cat]}</strong><br>${cat === 'drink' ? 'Напиток не выбран' : 'Блюдо не выбрано'}</p>`;
    }
  });

  // блок стоимости — только если выбрано хоть что-то
  if (total > 0) {
    orderItems.innerHTML += `<p><strong>Стоимость заказа</strong><br>${total}₽</p>`;
  }
}
