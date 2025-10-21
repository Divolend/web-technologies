
// Массив блюд (keyword, name, price, category, count, image)
const dishes = [
  // ===== SOUPS (2 fish, 2 meat, 2 veg) =====
  { keyword: 'tomyam',    name: 'Том ям с креветками',    price: 650, category: 'soup',   count: '500 г', image: 'Images/tomyam.jpg',   kind: 'fish' },
  { keyword: 'seafood',   name: 'Суп с морепродуктами',   price: 510, category: 'soup',   count: '320 г', image: 'Images/sea.webp',      kind: 'fish' },  
  { keyword: 'chicken',   name: 'Куриный суп',            price: 260, category: 'soup',   count: '350 г', image: 'Images/chicken.jpg',  kind: 'meat' },
  { keyword: 'borsh',     name: 'Борщ с говядиной',       price: 350, category: 'soup',   count: '400 г', image: 'Images/borsh.webp',   kind: 'meat' },
  { keyword: 'cheese',    name: 'Сырный суп',             price: 270, category: 'soup',   count: '330 г', image: 'Images/cheese.jpg',   kind: 'veg' },
  { keyword: 'pumpkin',   name: 'Тыквенный крем-суп',     price: 210, category: 'soup',   count: '350 г', image: 'Images/pumpkin.jpg',  kind: 'veg' },

  // mains
  { keyword: 'paste',     name: 'Паста c креветками',             price: 320, category: 'main',   count: '280 г',   image: 'Images/paste.webp',       kind: 'fish' },
  { keyword: 'ricefish',  name: 'Рис с рыбными котлетами',        price: 290, category: 'main',   count: '300 г',   image: 'Images/ricefish.jpeg',   kind: 'fish' },
  { keyword: 'steak',     name: 'Говяжий стейк с овощами',        price: 450, category: 'main',   count: '300 г',   image: 'Images/steak.jpg',       kind: 'meat' },
  { keyword: 'shashl',    name: 'Шашлык из курицы',               price: 360, category: 'main',   count: '300 г',   image: 'Images/shashl.jpg',      kind: 'meat' },
  { keyword: 'pizza',     name: 'Пицца Маргарита',                price: 450, category: 'main',   count: '470 г',   image: 'Images/pizza.jpg',       kind: 'veg' },
  { keyword: 'ragu',      name: 'Овощное рагу',                   price: 280, category: 'main',   count: '350 г',   image: 'Images/ragu.jpg',       kind: 'veg' },

  // salads
  { keyword: 'korean',     name: 'Корейский салат с овощами и яйцом', price: 330, category: 'salad', count: '250 г', image: 'Images/korean.jpg',        kind: 'veg'  },
  { keyword: 'caprese',    name: 'Капрезе с моцареллой',              price: 350, category: 'salad', count: '235 г', image: 'Images/caprese.jpg',       kind: 'veg'  },
  { keyword: 'greek',      name: 'Греческий салат',                   price: 280, category: 'salad', count: '235 г', image: 'Images/greek.webp',        kind: 'veg'  },
  { keyword: 'greens',     name: 'Салат из зелени и огурцов',         price: 260, category: 'salad', count: '220 г', image: 'Images/greens.jpg',        kind: 'veg'  },
  { keyword: 'caesar',     name: 'Цезарь с цыплёнком',                price: 370, category: 'salad', count: '220 г', image: 'Images/caesar.webp',       kind: 'meat' },
  { keyword: 'tuna',       name: 'Салат с тунцом',                    price: 480, category: 'salad', count: '250 г', image: 'Images/tuna.webp',         kind: 'fish' },
  
 // drinks
  { keyword: 'cappuccino', name: 'Капучино',            price: 140, category: 'drink', count: '200 мл', image: 'Images/cofe.jpg',        kind: 'hot'  },
  { keyword: 'lemonade',   name: 'Лимонад с мятой',     price: 120, category: 'drink', count: '300 мл', image: 'Images/lemon.jpg',       kind: 'cold' },
  { keyword: 'tea',        name: 'Холодный чёрный чай', price: 80,  category: 'drink', count: '250 мл', image: 'Images/tea.jpg',         kind: 'cold'  },
  { keyword: 'strawberry', name: 'Клубничный милкшейк', price: 140, category: 'drink', count: '300 мл', image: 'Images/strawberry.webp', kind: 'cold' },
  { keyword: 'latte',      name: 'Латте',               price: 140, category: 'drink', count: '300 мл', image: 'Images/latte.jpg',       kind: 'hot' },
  { keyword: 'matcha',     name: 'Матча',               price: 150, category: 'drink', count: '300 мл', image: 'Images/matcha.jpg',      kind: 'hot' },

 // deserts
  { keyword: 'cheesecake',  name: 'Чизкейк',                      price: 240, category: 'dessert', count: '125 г', image: 'Images/cheesecake.webp',    kind: 'small'  },
  { keyword: 'tvor',        name: 'Творожный десерт с клубникой', price: 220, category: 'dessert', count: '120 г', image: 'Images/tvor.jpg',          kind: 'small'  },
  { keyword: 'shokoladmacar',    name: 'Макаруны шоколадные',     price: 230, category: 'dessert', count: '110 г', image: 'Images/shokoladmakar.jpg',  kind: 'small'  },
  { keyword: 'medov',     name: 'Медовик',                        price: 270, category: 'dessert', count: '140 г', image: 'Images/medov.jpg',         kind: 'medium' },
  { keyword: 'ponch',      name: 'Пончики (3 штуки)',             price: 410, category: 'dessert', count: '350 г', image: 'Images/ponch.jpg',          kind: 'medium' },
  { keyword: 'napaleon',    name: 'Наполеон (большая порция)',    price: 650, category: 'dessert', count: '700 г', image: 'Images/napaleon.png',       kind: 'large'  },
];
