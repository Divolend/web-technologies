/* api.js — загрузка блюд (сначала с серверного API, потом если ошибка fallback на GitHub(запасной)) */
(function () {
  'use strict';

  var API_ORIGIN = 'https://edu.std-900.ist.mospolytech.ru';
  var API_KEY    = '13dbb247-3839-4069-8e81-64e1240cca8a';

  //запасной
  var DISHES_URL = API_ORIGIN + '/labs/api/dishes?api_key=' + encodeURIComponent(API_KEY);
  var FALLBACK_URL = 'https://divolend.github.io/web-technologies/labs/api/dishes.json';

  function normalizeDish(d) {
    return {
      id:       (d && typeof d.id !== 'undefined') ? Number(d.id) : null,
      keyword:  (d && d.keyword)  ? d.keyword  : '',
      name:     (d && d.name)     ? d.name     : '',
      price:    (d && typeof d.price !== 'undefined') ? Number(d.price) || 0 : 0,
      category: (d && d.category) ? d.category : '',
      count:    (d && d.count)    ? d.count    : '',
      image:    (d && d.image)    ? d.image    : '',
      kind:     (d && d.kind)     ? d.kind     : ''
    };
  }

  async function fetchJSON(url) {
    var res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // Глобальная функция для страниц
  window.loadDishes = async function loadDishes() {
    try {
      var data = await fetchJSON(DISHES_URL); // пробуем сервер
      if (!Array.isArray(data) || !data.length) throw new Error('Пустой ответ API');
      window.dishes = data.map(normalizeDish);
    } catch (e) {
      console.warn('[loadDishes] Серверные блюда недоступны, fallback на GitHub:', e);
      try {
        var fb = await fetchJSON(FALLBACK_URL);
        window.dishes = (Array.isArray(fb) ? fb : []).map(normalizeDish);
      } catch (e2) {
        console.error('[loadDishes] Не удалось получить блюда ни с сервера, ни с fallback:', e2);
        window.dishes = [];
      }
    }
  };

})();