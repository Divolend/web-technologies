// checkout.js
(function () {
  'use strict';

  // Этот флаг сразу говорит потенциальным другим скриптам «не вешайте свой submit»
  window.__checkoutHandlesSubmit = true;

  // =============================
  //  API (ЛР8)
  // =============================
  const API_BASE = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
  const API_KEY  = '13dbb247-3839-4069-8e81-64e1240cca8a';

  async function submitOrderToServer(payload) {
    const url = `${API_BASE}/orders?api_key=${encodeURIComponent(API_KEY)}`;
    try {
      // multipart/form-data без кастомных заголовков (без preflight)
      const fd = new FormData();
      Object.keys(payload).forEach((k) => {
        const v = payload[k];
        if (v === null || v === undefined || v === '') return;
        fd.append(k, String(v));
      });
      const res = await fetch(url, { method: 'POST', body: fd });
      const text = await res.text();
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch(_) {}
      if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
      return json; // { id, ... }
    } catch (err) {
      const hint = (/Failed to fetch|NetworkError|Load failed/i.test(String(err))) ?
        '\nВозможна блокировка браузером (TLS/CORS). Проверьте вкладку Network.' : '';
      throw new Error(err.message + hint);
    }
  }

  // =============================
  //  Глобальный индекс блюд по id
  // =============================
  var dishesById = {};

  function buildIndex(arr){
    dishesById = {};
    (arr || []).forEach(function(d){
      if (d && typeof d.id !== 'undefined') dishesById[d.id] = d;
    });
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, function(m){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m];
    });
  }

  // =============================
  //  Нормализация категорий
  // =============================
  function normalizeCategory(cat){
    var s = String(cat || '').toLowerCase().trim();
    if (s === 'soup' || s === 'soups') return 'soup';
    if (
      s === 'main' ||
      s === 'mains' ||
      s === 'main_course' ||
      s === 'maincourse' ||
      s === 'main-course'   // <-- ВАЖНО: вариант с дефисом из API
    ) return 'main';
    if (s === 'salad' || s === 'salads' || s === 'starter' || s === 'starters') return 'salad';
    if (s === 'drink' || s === 'drinks' || s === 'beverage' || s === 'beverages') return 'drink';
    if (s === 'dessert' || s === 'desserts') return 'dessert';
    return s;
  }
  function getCat(dish){ return normalizeCategory(dish && dish.category); }

  // =============================
  //  ЛЕВАЯ КОЛОНКА — карточки
  // =============================
  function cardHTML(dish){
    return (
      '<article class="co-card" data-id="'+dish.id+'" data-cat="'+getCat(dish)+'">'+
        '<img src="'+dish.image+'" alt="'+escapeHtml(dish.name)+'">'+
        '<p class="price">'+dish.price+'₽</p>'+
        '<p class="name">'+escapeHtml(dish.name)+'</p>'+
        '<p class="weight">'+(dish.count||'')+'</p>'+
        '<button type="button" class="remove">Удалить</button>'+
      '</article>'
    );
  }

  function renderCart(){
    var wrap = document.getElementById('co-cart');
    if (!wrap) return;

    var ids = Cart.getIds();
    if (!ids.length){
      wrap.innerHTML =
        '<p style="grid-column:1/-1; padding:8px 0 18px;">' +
        'Ничего не выбрано. Чтобы добавить блюда в заказ, перейдите на страницу ' +
        '<a href="lunch.html">«Собрать ланч»</a>.</p>';
      updateSummary();
      return;
    }

    wrap.innerHTML = ids
      .map(function(id){ var d = dishesById[id]; return d ? cardHTML(d) : ''; })
      .join('');

    wrap.querySelectorAll('.co-card .remove').forEach(function(btn){
      btn.addEventListener('click', function(){
        var card = btn.closest('.co-card');
        var id = Number(card.dataset.id);
        Cart.toggle(id);
        card.remove();
        if (Cart.getIds().length === 0) renderCart();
        updateSummary();
      });
    });

    updateSummary();
  }

  // =============================
  //  ПРАВАЯ КОЛОНКА — сводка
  // =============================
  function updateSummary(){
    var box = document.getElementById('co-summary-list');
    if (!box) return;

    var ids = Cart.getIds();
    if (!ids.length){
      box.innerHTML =
        '<p><strong>Ничего не выбрано.</strong><br>' +
        'Чтобы добавить блюда в заказ, перейдите на страницу ' +
        '<a href="lunch.html">«Собрать ланч»</a>.</p>';
      return;
    }

    var catNames = { soup:'Суп', main:'Главное блюдо', salad:'Салат/стартер', drink:'Напиток', dessert:'Десерт' };
    var pick = { soup:null, main:null, salad:null, drink:null, dessert:null };
    var total = 0;

    ids.forEach(function(id){
      var d = dishesById[id];
      if (!d) return;
      total += Number(d.price) || 0;
      var cat = getCat(d);
      if (!pick[cat]) pick[cat] = d;
    });

    var html = '';
    ['soup','main','salad','drink','dessert'].forEach(function(cat){
      if (pick[cat]) {
        html += '<p><strong>'+catNames[cat]+':</strong> '+
                escapeHtml(pick[cat].name)+' — '+(pick[cat].price)+'₽</p>';
      } else {
        html += '<p><strong>'+catNames[cat]+':</strong> Не выбран</p>';
      }
    });
    html += '<p style="margin-top:8px;"><strong>Стоимость заказа:</strong> '+total+'₽</p>';

    box.innerHTML = html;
  }

  // =============================
  //  Валидация комбо
  // =============================
  function countsByCategory(ids, dict){
    var s = { soup:0, main:0, salad:0, drink:0, dessert:0 };
    (ids || []).forEach(function(id){
      var d = dict[id];
      if (!d) return;
      var cat = getCat(d);
      if (s.hasOwnProperty(cat)) s[cat]++;
    });
    return s;
  }
  function isComboValid(ids){
    var s = countsByCategory(ids, dishesById);
    var A = s.soup>0 && s.main>0 && s.salad>0 && s.drink>0; // soup+main+salad+drink
    var B = s.soup>0 && s.main>0 && s.drink>0;
    var C = s.soup>0 && s.salad>0 && s.drink>0;
    var D = s.main>0 && s.salad>0 && s.drink>0;
    var E = s.main>0 && s.drink>0;
    return A || B || C || D || E;
  }

  // =============================
  //  Отправка формы
  // =============================
  async function submitForm(e){
    e.preventDefault();

    // 1) Заказ есть?
    var idsNow = Cart.getIds();
    console.debug('[checkout] idsNow=', idsNow, 'counts=', countsByCategory(idsNow, dishesById));
    if (!idsNow.length){
      alert('Ничего не выбрано. Перейдите на страницу «Собрать ланч» и добавьте блюда.');
      return;
    }

    // 2) Комбо валидно?
    if (!isComboValid(idsNow)){
      var s = countsByCategory(idsNow, dishesById);
      if (s.drink === 0){
        alert('Добавьте напиток: он обязателен во всех комбо.');
      } else if (s.soup>0 && s.main===0 && s.salad===0){
        alert('Вы добавили суп. Выберите ещё главное блюдо или салат/стартер.');
      } else if (s.salad>0 && s.soup===0 && s.main===0){
        alert('Вы добавили салат. Выберите суп или главное блюдо.');
      } else if (s.main===0){
        alert('Выберите главное блюдо.');
      } else {
        alert('Состав заказа неполный. Выберите допустимое комбо.');
      }
      return;
    }

    // 3) Обязательные поля
    var name  = (document.getElementById('co-name')   || {}).value || '';
    var email = (document.getElementById('co-email')  || {}).value || '';
    var phone = (document.getElementById('co-phone')  || {}).value || '';
    var addr  = (document.getElementById('co-address')|| {}).value || '';
    name  = name.trim(); email = email.trim(); phone = phone.trim(); addr = addr.trim();

    var dType = document.querySelector('input[name="delivery_type"]:checked');
    var time  = (document.getElementById('co-time') || {}).value || '';
    time = time.trim();

    if (!name || !email || !phone || !addr || !dType){
      alert('Пожалуйста, заполните все обязательные поля (Имя, Email, Телефон, Адрес, Тип доставки).');
      return;
    }
    if (dType.value === 'by_time' && !time){
      alert('Укажите время доставки.');
      return;
    }

    var emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailPattern.test(email)){
      alert('Введите корректный email (только латинские буквы и обязательно с @).');
      return;
    }

    var phonePattern = /^[0-9]+$/;
    if (!phonePattern.test(phone)){
      alert('Номер телефона должен содержать только цифры.');
      return;
    }

    // 4) Payload для API
    var payload = {
      full_name: name,
      email: email,
      subscribe: (document.getElementById('co-sub') && document.getElementById('co-sub').checked) ? 1 : 0,
      phone: phone,
      delivery_address: addr,
      delivery_type: dType.value,     // "now" | "by_time"
      delivery_time: time,            // HH:MM (нужно только если by_time)
      comment: (document.getElementById('co-comment') || {}).value ? document.getElementById('co-comment').value.trim() : ''
    };

    // id блюд по категориям (берём первую выбранную из каждой категории)
    var firstByCat = { soup:null, main:null, salad:null, drink:null, dessert:null };
    idsNow.forEach(function(id){
      var d = dishesById[id];
      var cat = getCat(d);
      if (d && !firstByCat[cat]) firstByCat[cat] = d.id;
    });
    if (firstByCat.soup)    payload.soup_id = firstByCat.soup;
    if (firstByCat.main)    payload.main_course_id = firstByCat.main;
    if (firstByCat.salad)   payload.salad_id = firstByCat.salad;
    if (firstByCat.drink)   payload.drink_id = firstByCat.drink;   // drink обязателен
    if (firstByCat.dessert) payload.dessert_id = firstByCat.dessert;

    // 5) POST → сервер
    try{
      const created = await submitOrderToServer(payload);
      alert('Заказ оформлен! 🙌 Номер заказа: ' + (created && created.id ? created.id : '—'));
      Cart.clear();
      renderCart();
      updateSummary();
      var form = document.getElementById('co-form');
      if (form) form.reset();
    } catch(err){
      alert('Не удалось отправить заказ. Попробуйте ещё раз.\n' + err.message);
    }
  }

  // =============================
  //  Сброс формы и корзины
  // =============================
  function resetAll(){
    Cart.clear();
    renderCart();
    updateSummary();
    var form = document.getElementById('co-form');
    if (form) form.reset();
  }

  // =============================
  //  Обязательность времени
  // =============================
  function bindTimeRequired(){
    var rNow = document.querySelector('input[name="delivery_type"][value="now"]');
    var rBy  = document.querySelector('input[name="delivery_type"][value="by_time"]');
    var time = document.getElementById('co-time');
    function toggle(){
      if (!time) return;
      if (rBy && rBy.checked){ time.required = true; }
      else { time.required = false; time.value=''; }
    }
    if (rNow) rNow.addEventListener('change', toggle);
    if (rBy)  rBy.addEventListener('change', toggle);
    toggle();
  }

  // =============================
  //  Инициализация
  // =============================
  document.addEventListener('DOMContentLoaded', async function(){
    try { if (typeof loadDishes === 'function') await loadDishes(); } catch(e){}
    buildIndex(window.dishes || []);
    renderCart();
    updateSummary();

    var form = document.getElementById('co-form');
    if (form) form.addEventListener('submit', submitForm);

    var resetBtn = document.getElementById('co-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);

    bindTimeRequired();
  });
})();