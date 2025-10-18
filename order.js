// ===============================
//  Состояние заказа по категориям
// ===============================
const order = {
  soup: null,
  main: null,
  salad: null,
  drink: null,
  dessert: null
};

// -------------------------------
//  Сброс заказа программно
// -------------------------------
function clearOrder() {
  order.soup = null;
  order.main = null;
  order.salad = null;
  order.drink = null;
  order.dessert = null;
}

// ---------------------------------------------------------
//  Добавить блюдо в заказ (вызывается из render.js по клику)
//  dish.category: 'soup' | 'main' | 'salad' | 'drink' | 'dessert'
// ---------------------------------------------------------
function addToOrder(dish) {
  if (!dish || !dish.category) return;
  order[dish.category] = dish;     // в каждой категории максимум 1 позиция
  updateOrderBlock();
}

// ---------------------------------------------------------
//  Обновление блока "Ваш заказ" (textarea не трогаем)
//  + добавляем data-category, чтобы при желании можно было
//    читать заказ из DOM
// ---------------------------------------------------------
function updateOrderBlock() {
  const orderItems = document.getElementById('order-items');
  if (!orderItems) return;

  const nothingSelected =
    !order.soup && !order.main && !order.salad && !order.drink && !order.dessert;

  if (nothingSelected) {
    orderItems.innerHTML = `<p><strong>Ничего не выбрано</strong></p>`;
    return;
  }

  const catTitle = {
    soup: 'Суп',
    main: 'Главное блюдо',
    salad: 'Салат/стартер',
    drink: 'Напиток',
    dessert: 'Десерт'
  };

  let total = 0;
  let html = '';

  ['soup', 'main', 'salad', 'drink', 'dessert'].forEach(cat => {
    const item = order[cat];
    if (item) {
      html += `
        <p data-category="${cat}">
          <strong>${catTitle[cat]}</strong><br>${item.name} ${item.price}₽
        </p>`;
      total += Number(item.price) || 0;
    } else {
      const noneText = (cat === 'drink') ? 'Напиток не выбран' : 'Блюдо не выбрано';
      html += `
        <p data-category="${cat}">
          <strong>${catTitle[cat]}</strong><br>${noneText}
        </p>`;
    }
  });

  if (total > 0) {
    html += `<p><strong>Стоимость заказа</strong><br>${total}₽</p>`;
  }

  orderItems.innerHTML = html;
}

/* ===========================
   ВАЛИДАЦИЯ КОМБО + УВЕДОМЛЕНИЯ
   =========================== */

// Собираем статистику из объекта order (т.к. у тебя по 1 позиции в категории)
function collectOrderStats(){
  const stats = { soup:0, main:0, salad:0, drink:0, dessert:0, total:0 };
  ['soup','main','salad','drink','dessert'].forEach(cat => {
    if (order[cat]) { stats[cat] = 1; stats.total += 1; }
  });
  return stats;
}

// Проверяем соответствие одному из допустимых комбо
// A: soup + main + salad + drink
// B: soup + main + drink
// C: soup + salad + drink
// D: main + salad + drink
// E: main + drink
function matchesAllowedCombos(s){
  const A = s.soup && s.main && s.salad && s.drink;
  const B = s.soup && s.main && s.drink;
  const C = s.soup && s.salad && s.drink;
  const D = s.main && s.salad && s.drink;
  const E = s.main && s.drink;
  return A || B || C || D || E;
}

// Возвращает { ok, code?, msg? } c одним из 5 текстов
function validateOrder(){
  const s = collectOrderStats();

  // 1) Пусто
  if (s.total === 0) {
    return { ok:false, code:'empty', msg:'Ничего не выбрано. Выберите блюда для заказа' };
  }

  // 2) Уже валидно
  if (matchesAllowedCombos(s)) {
    return { ok:true };
  }

  // 3) «Выберите напиток» — выбраны все нужные, кроме drink
  //    Любая комбо в нашем списке требует drink
  if (
    s.drink === 0 && (
      (s.soup && s.main) ||
      (s.soup && s.salad) ||
      (s.main && s.salad) ||
      (s.main)                // для комбо E (main+drink)
    )
  ) {
    return { ok:false, code:'need_drink', msg:'Выберите напиток' };
  }

  // 4) «Выберите главное блюдо/салат/стартер» — есть суп, но нет main и salad
  if (s.soup && !s.main && !s.salad) {
    return { ok:false, code:'need_main_or_salad', msg:'Выберите главное блюдо/салат/стартер' };
  }

  // 5) «Выберите суп или главное блюдо» — есть салат, но нет soup и main
  if (s.salad && !s.soup && !s.main) {
    return { ok:false, code:'need_soup_or_main', msg:'Выберите суп или главное блюдо' };
  }

  // 6) «Выберите главное блюдо» — выбран напиток/десерт, но нет main
  if (!s.main && (s.drink || s.dessert)) {
    return { ok:false, code:'need_main', msg:'Выберите главное блюдо' };
  }

  // Фолбэк (на всякий случай)
  return { ok:false, code:'generic', msg:'Проверьте состав ланча: чего-то не хватает' };
}

// Показ модалки-уведомления (если нет стилей — вставим минимальные)
function showNotice(message){
  const id = 'notice-styles';
  if (!document.getElementById(id)){
    const css = document.createElement('style');
    css.id = id;
    css.textContent = `
      .notice-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.15);z-index:9999}
      .notice-modal{background:#fff;border:1px solid #d6d6d6;border-radius:16px;max-width:640px;width:min(88vw,640px);padding:28px 24px;box-shadow:0 16px 24px rgba(0,0,0,.12);text-align:center}
      .notice-title{font-size:28px;line-height:1.3;margin:0 0 22px}
      .notice-btn{padding:14px 32px;border-radius:12px;border:1px solid #111;background:#fff;font-size:20px;cursor:pointer;transition:.2s}
      .notice-btn:hover{background:#111;color:#fff}
    `;
    document.head.appendChild(css);
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'notice-backdrop';
  backdrop.innerHTML = `
    <div class="notice-modal" role="dialog" aria-modal="true">
      <div class="notice-title">${message}</div>
      <button type="button" class="notice-btn">Окей 👌</button>
    </div>
  `;

  function close(){
    backdrop.remove();
    document.removeEventListener('keydown', onEsc);
  }
  function onEsc(e){ if (e.key === 'Escape') close(); }

  backdrop.addEventListener('click', (e)=>{
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('.notice-btn').addEventListener('click', close);
  document.addEventListener('keydown', onEsc);

  document.body.appendChild(backdrop);
}

// Подключаем валидацию к форме
(function attachOrderValidation(){
  const form = document.getElementById('order-form');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    const res = validateOrder();
    if (!res.ok){
      e.preventDefault();
      showNotice(res.msg);
    }
  });
})();
