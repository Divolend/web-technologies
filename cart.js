/* cart.js — локальное хранилище и утилиты заказа */
(function () {
  'use strict';

  // Где храним заказ (только id блюд)
  var LS_KEY = 'fc_cart_ids'; // Array<number>

  // ---------- внутренние ----------
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
      var arr = JSON.parse(raw);
      return normalizeIds(arr);
    } catch (e) {
      return [];
    }
  }

  function writeCart(ids) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(normalizeIds(ids)));
    } catch (e) {
      // ignore
    }
  }

  // Нормализация категорий к: soup | main | salad | drink | dessert
  function normalizeCategory(cat) {
    var s = String(cat || '').toLowerCase().trim();
    if (s === 'soup' || s === 'soups') return 'soup';
    if (
      s === 'main' ||
      s === 'mains' ||
      s === 'main_course' ||
      s === 'maincourse' ||
      s === 'main-course' // ВАЖНО: вариант из API
    ) return 'main';
    if (s === 'salad' || s === 'salads' || s === 'starter' || s === 'starters') return 'salad';
    if (s === 'drink' || s === 'drinks' || s === 'beverage' || s === 'beverages') return 'drink';
    if (s === 'dessert' || s === 'desserts') return 'dessert';
    return s;
  }

  // ---------- публичное API ----------
  window.Cart = {
    // Текущее содержимое (массив id)
    getIds: function () {
      return readCart();
    },

    // Очистить
    clear: function () {
      writeCart([]);
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

    // Помощник: строит словарь { id: dish } из массива блюд
    mapById: function (dishes) {
      var dict = {};
      (dishes || []).forEach(function (d) {
        if (d && typeof d.id !== 'undefined') dict[d.id] = d;
      });
      return dict;
    },

    // Проверка допустимого набора комбо
    // Допустимо: A) soup+main+salad+drink; B) soup+main+drink; C) soup+salad+drink;
    //            D) main+salad+drink; E) main+drink
    isValidCombo: function (ids, dishesById) {
      ids = normalizeIds(ids);
      var s = { soup: 0, main: 0, salad: 0, drink: 0, dessert: 0 };

      ids.forEach(function (id) {
        var d = dishesById && dishesById[id];
        if (!d) return;
        var cat = normalizeCategory(d.category);  // ← нормализуем
        if (s.hasOwnProperty(cat)) s[cat]++;
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