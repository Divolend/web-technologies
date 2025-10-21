/* cart.js — локальное хранилище и утилиты заказа */
(function () {
  'use strict';

  var LS_KEY = 'fc_cart_ids'; // Array<number>

  function normalizeIds(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(function (v) { return Number(v); })
      .filter(function (n) { return Number.isFinite(n); });
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      return normalizeIds(JSON.parse(raw));
    } catch (e) {
      return [];
    }
  }
  function writeCart(ids) {
    localStorage.setItem(LS_KEY, JSON.stringify(normalizeIds(ids)));
  }

  // ☑ нормализация категорий — такая же, как в checkout.js
  function normalizeCategory(cat){
    var s = String(cat || '').toLowerCase().trim();
    if (s === 'soup' || s === 'soups') return 'soup';
    if (s === 'main' || s === 'mains' || s === 'main_course' || s === 'maincourse') return 'main';
    if (s === 'salad' || s === 'salads' || s === 'starter' || s === 'starters') return 'salad';
    if (s === 'drink' || s === 'drinks' || s === 'beverage' || s === 'beverages') return 'drink';
    if (s === 'dessert' || s === 'desserts') return 'dessert';
    return s;
  }

  window.Cart = {
    // базовые операции
    getIds: readCart,
    setIds: writeCart,
    clear: function () { writeCart([]); },

    has: function (id) {
      id = Number(id);
      if (!Number.isFinite(id)) return false;
      return readCart().indexOf(id) !== -1;
    },

    add: function (id) {
      id = Number(id);
      if (!Number.isFinite(id)) return false;
      var ids = readCart();
      if (ids.indexOf(id) === -1) { ids.push(id); writeCart(ids); return true; }
      return false;
    },

    remove: function (id) {
      id = Number(id);
      if (!Number.isFinite(id)) return false;
      var ids = readCart();
      var i = ids.indexOf(id);
      if (i !== -1) { ids.splice(i, 1); writeCart(ids); return true; }
      return false;
    },

    // Добавить/убрать id; true — добавили, false — убрали, null — id невалидный
    toggle: function (id) {
      id = Number(id);
      if (!Number.isFinite(id)) return null;
      var ids = readCart();
      var idx = ids.indexOf(id);
      if (idx === -1) { ids.push(id); writeCart(ids); return true; }
      ids.splice(idx, 1); writeCart(ids); return false;
    },

    // 🔎 Проверка содержимого против допустимых комбо
    // dishesById — словарь {id: dish}, чтобы знать категории
    isValidCombo: function (ids, dishesById) {
      ids = normalizeIds(ids);
      var s = { soup: 0, main: 0, salad: 0, drink: 0, dessert: 0 };

      ids.forEach(function (id) {
        var d = dishesById && dishesById[id];
        var cat = d ? normalizeCategory(d.category) : null;
        if (cat && s.hasOwnProperty(cat)) s[cat]++;
      });

      var A = s.soup > 0 && s.main > 0 && s.salad > 0 && s.drink > 0; // 4
      var B = s.soup > 0 && s.main > 0 && s.drink > 0;
      var C = s.soup > 0 && s.salad > 0 && s.drink > 0;
      var D = s.main > 0 && s.salad > 0 && s.drink > 0;
      var E = s.main > 0 && s.drink > 0;
      return A || B || C || D || E;
    },

    // Итоговая сумма
    total: function (ids, dishesById) {
      ids = normalizeIds(ids);
      var sum = 0;
      ids.forEach(function (id) {
        var d = dishesById && dishesById[id];
        if (d) sum += Number(d.price) || 0;
      });
      return sum;
    }
  };
})();