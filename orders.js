// orders.js
(function () {
  'use strict';

  // === Константы API ===
  const API_BASE = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
  const API_KEY  = '13dbb247-3839-4069-8e81-64e1240cca8a';

  // === Утилиты ===
  const $ = (sel, root=document) => root.querySelector(sel);
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const fmtMoney = (n) => `${Number(n||0)}₽`;

  const normalizeCat = (cat) => {
    const s = String(cat||'').toLowerCase().trim();
    if (['soup','soups'].includes(s)) return 'soup';
    if (['main','mains','main_course','maincourse'].includes(s)) return 'main';
    if (['salad','salads','starter','starters'].includes(s)) return 'salad';
    if (['drink','drinks','beverage','beverages'].includes(s)) return 'drink';
    if (['dessert','desserts'].includes(s)) return 'dessert';
    return s;
  };

  // из dishes делаем map по id
  const buildMap = (arr) => {
    const m = Object.create(null);
    (arr||[]).forEach(d => { if (d && d.id!=null) m[Number(d.id)] = d; });
    return m;
  };

  // === Запросы ===
  async function getJSON(url) {
    const res = await fetch(url, { headers: { 'Accept':'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function fetchOrders() {
    return getJSON(`${API_BASE}/orders?api_key=${encodeURIComponent(API_KEY)}`);
  }
  async function fetchOrder(id) {
    return getJSON(`${API_BASE}/orders/${id}?api_key=${encodeURIComponent(API_KEY)}`);
  }

  // PUT: используем FormData (можно JSON, но так без preflight)
  async function updateOrder(id, patch) {
    const fd = new FormData();
    Object.keys(patch).forEach(k => {
      const v = patch[k];
      if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
    });
    const res = await fetch(`${API_BASE}/orders/${id}?api_key=${encodeURIComponent(API_KEY)}`, {
      method: 'PUT', body: fd
    });
    const text = await res.text(); let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch(_) {}
    if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }

  async function deleteOrder(id) {
    const res = await fetch(`${API_BASE}/orders/${id}?api_key=${encodeURIComponent(API_KEY)}`, { method:'DELETE' });
    const text = await res.text(); let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch(_) {}
    if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }

  // === Рендер списка ===
  let dishes = [];
  let dishById = {};

  function dishNameById(id) {
    const d = dishById[id];
    return d ? d.name : `#${id}`;
    // при желании можно подтягивать цены и формировать "Имя (цена₽)"
  }

  function orderItemsHuman(o) {
    const parts = [];
    if (o.soup_id)    parts.push(dishNameById(o.soup_id));
    if (o.main_course_id) parts.push(dishNameById(o.main_course_id));
    if (o.salad_id)   parts.push(dishNameById(o.salad_id));
    if (o.drink_id)   parts.push(dishNameById(o.drink_id));
    if (o.dessert_id) parts.push(dishNameById(o.dessert_id));
    return parts.join(', ');
  }

  function orderCost(o) {
    let sum = 0;
    const add = (id) => { const d = dishById[id]; if (d) sum += Number(d.price)||0; };
    if (o.soup_id) add(o.soup_id);
    if (o.main_course_id) add(o.main_course_id);
    if (o.salad_id) add(o.salad_id);
    if (o.drink_id) add(o.drink_id);
    if (o.dessert_id) add(o.dessert_id);
    return sum;
  }

  function humanDelivery(o) {
    if (o.delivery_type === 'by_time' && o.delivery_time) {
      return o.delivery_time;
    }
    return 'Как можно скорее (с 07:00 до 23:00)';
  }

  function formatDateTime(dtIso) {
    // сервер присылает created_at/updated_at — попытаемся красиво отрисовать
    try {
      const d = new Date(dtIso);
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      const HH = String(d.getHours()).padStart(2,'0');
      const MM = String(d.getMinutes()).padStart(2,'0');
      return `${dd}.${mm}.${yyyy} ${HH}:${MM}`;
    } catch { return dtIso || ''; }
  }

  function renderOrders(list) {
    const tbody = $('#orders-tbody');
    const empty = $('#orders-empty');

    if (!list.length) {
      tbody.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    // сортировка по дате (новые сверху)
    list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    tbody.innerHTML = list.map((o, idx) => {
      const cost = orderCost(o);
      const items = orderItemsHuman(o);
      const when = humanDelivery(o);
      return `
        <tr data-id="${o.id}">
          <td>${idx+1}</td>
          <td>${formatDateTime(o.created_at)}</td>
          <td>${items || '<span class="muted">—</span>'}</td>
          <td>${fmtMoney(cost)}</td>
          <td>${when}</td>
          <td>
            <div class="actions">
              <button class="btn-icon js-view"   title="Подробнее">👁️</button>
              <button class="btn-icon js-edit"   title="Редактировать">✏️</button>
              <button class="btn-icon js-delete" title="Удалить">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    // кнопки действий
    $all('.js-view', tbody).forEach(btn => btn.addEventListener('click', onView));
    $all('.js-edit', tbody).forEach(btn => btn.addEventListener('click', onEdit));
    $all('.js-delete', tbody).forEach(btn => btn.addEventListener('click', onDelete));
  }

  // === Модалки (простая реализация) ===
  function modalShell(titleHtml, bodyHtml, footerButtonsHtml) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <header>
          <h3>${titleHtml}</h3>
          <button class="close" aria-label="Закрыть">×</button>
        </header>
        <div class="modal-body">${bodyHtml}</div>
        <footer>${footerButtonsHtml||''}</footer>
      </div>`;
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); };
    $('.close', wrap).addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    wrap.style.display = 'flex';
    return { el: wrap, close };
  }

  // ===== ДЕЙСТВИЯ =====
  async function onView(e) {
    const row = e.currentTarget.closest('tr');
    const id = Number(row.dataset.id);
    try {
      const o = await fetchOrder(id);
      const items = orderItemsHuman(o);
      const cost  = orderCost(o);

      const body = `
        <div class="row"><label>Дата оформления</label><div>${formatDateTime(o.created_at)}</div></div>
        <h4>Доставка</h4>
        <div class="row"><label>Имя получателя</label><div>${o.full_name||'—'}</div></div>
        <div class="row"><label>Адрес доставки</label><div>${o.delivery_address||'—'}</div></div>
        <div class="row"><label>Время доставки</label><div>${humanDelivery(o)}</div></div>
        <div class="row"><label>Телефон</label><div>${o.phone||'—'}</div></div>
        <div class="row"><label>Email</label><div>${o.email||'—'}</div></div>
        <h4>Комментарий</h4>
        <div>${(o.comment||'—').replace(/\n/g,'<br>')}</div>
        <h4>Состав заказа</h4>
        <div>${items || '—'}</div>
        <h4>Стоимость</h4>
        <div>${fmtMoney(cost)}</div>
      `;
      const m = modalShell('Просмотр заказа', body, `<button class="btn-primary">Ок</button>`);
      $('footer .btn-primary', m.el).addEventListener('click', m.close);
    } catch (err) {
      alert('Не удалось получить заказ: ' + err.message);
    }
  }

  async function onEdit(e) {
    const row = e.currentTarget.closest('tr');
    const id = Number(row.dataset.id);
    try {
      const o = await fetchOrder(id);

      const checkedNow = o.delivery_type !== 'by_time' ? 'checked' : '';
      const checkedBy  = o.delivery_type === 'by_time' ? 'checked' : '';

      const body = `
        <div class="row"><label>Дата оформления</label><div>${formatDateTime(o.created_at)}</div></div>

        <h4>Доставка</h4>
        <div class="row"><label>Имя получателя</label><div><input type="text" id="f_full_name" value="${o.full_name||''}"></div></div>
        <div class="row"><label>Адрес доставки</label><div><input type="text" id="f_delivery_address" value="${o.delivery_address||''}"></div></div>

        <div class="row"><label>Время доставки</label>
          <div>
            <label style="display:block; margin-bottom:6px;">
              <input type="radio" name="f_delivery_type" value="now" ${checkedNow}> Как можно скорее
              <span class="badge-now">(с 07:00 до 23:00)</span>
            </label>
            <label style="display:block;">
              <input type="radio" name="f_delivery_type" value="by_time" ${checkedBy}> К указанному времени
            </label>
            <div style="margin-top:6px;">
              <input type="time" id="f_delivery_time" min="07:00" max="23:00" step="300" value="${o.delivery_time || ''}">
            </div>
          </div>
        </div>

        <div class="row"><label>Телефон</label><div><input type="tel" id="f_phone" value="${o.phone||''}"></div></div>
        <div class="row"><label>Email</label><div><input type="email" id="f_email" value="${o.email||''}"></div></div>

        <h4>Комментарий</h4>
        <textarea id="f_comment">${o.comment||''}</textarea>
      `;

      const m = modalShell('Редактирование заказа', body,
        `<button class="btn-secondary js-cancel">Отмена</button>
         <button class="btn-primary js-save">Сохранить</button>`);

      $('footer .js-cancel', m.el).addEventListener('click', m.close);
      $('footer .js-save', m.el).addEventListener('click', async () => {
        try {
          const type = $('input[name="f_delivery_type"]:checked', m.el)?.value || 'now';
          const patch = {
            full_name:        $('#f_full_name', m.el).value.trim(),
            email:            $('#f_email', m.el).value.trim(),
            phone:            $('#f_phone', m.el).value.trim(),
            delivery_address: $('#f_delivery_address', m.el).value.trim(),
            delivery_type:    type,
            delivery_time:    type === 'by_time' ? ($('#f_delivery_time', m.el).value || '') : '', // если now — очищаем
            comment:          $('#f_comment', m.el).value.trim()
          };

          await updateOrder(id, patch);
          m.close();
          alert('Заказ успешно изменён.');
          await refresh(); // перерисовать список
        } catch (err) {
          alert('Не удалось изменить заказ: ' + err.message);
        }
      });

    } catch (err) {
      alert('Не удалось открыть заказ: ' + err.message);
    }
  }

  function onDelete(e) {
    const row = e.currentTarget.closest('tr');
    const id = Number(row.dataset.id);

    const m = modalShell('Удаление заказа',
      `<p>Вы уверены, что хотите удалить заказ <strong>#${id}</strong>?</p>`,
      `<button class="btn-secondary js-cancel">Отмена</button>
       <button class="btn-danger js-yes">Да</button>`);

    $('footer .js-cancel', m.el).addEventListener('click', m.close);
    $('footer .js-yes', m.el).addEventListener('click', async () => {
      try {
        await deleteOrder(id);
        m.close();
        alert('Заказ удалён.');
        await refresh();
      } catch (err) {
        alert('Не удалось удалить заказ: ' + err.message);
      }
    });
  }

  // === Инициализация ===
  async function refresh() {
    // блюда нужны, чтобы красиво показать состав и сумму
    if (!Array.isArray(window.dishes) || window.dishes.length === 0) {
      try { if (typeof loadDishes === 'function') await loadDishes(); } catch {}
    }
    dishes = window.dishes || [];
    dishById = buildMap(dishes);

    try {
      const orders = await fetchOrders();
      renderOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      alert('Не удалось загрузить список заказов: ' + err.message);
      renderOrders([]);
    }
  }

  document.addEventListener('DOMContentLoaded', refresh);
})();