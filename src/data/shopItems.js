// Bramble's General Store catalog. Buying and selling both read this file,
// so adding a new tradeable item is a one-line addition here.

export const ITEMS = {
  wild_berries: { name: 'Wild Berries', icon: '\u{1F347}', sellPrice: 4 },
  moon_mushroom: { name: 'Moon Mushroom', icon: '\u{1F344}', sellPrice: 6 },
  silverleaf_herb: { name: 'Silverleaf Herb', icon: '\u{1F33F}', sellPrice: 5 },
  honey_root: { name: 'Honey Root', icon: '\u{1F955}', sellPrice: 7 },
  basket_of_bread: { name: 'Basket of Bread', icon: '\u{1F35E}', sellPrice: 0, questItem: true },
  sealed_letter: { name: 'Sealed Letter', icon: '✉️', sellPrice: 0, questItem: true },
  pressed_flower: { name: 'Pressed Flower', icon: '\u{1F337}', sellPrice: 0, giftItem: true, buyPrice: 6 },
  fine_ribbon: { name: 'Fine Ribbon', icon: '\u{1F380}', sellPrice: 0, giftItem: true, buyPrice: 10 },
  forage_basket_upgrade: { name: 'Sturdy Basket', icon: '\u{1F9FA}', sellPrice: 0, buyPrice: 60, oneTime: true },
  silver_mane_hair: { name: 'Silver Mane Hair', icon: '✨', sellPrice: 45, rare: true },
  dragon_scale: { name: 'Dragon Scale', icon: '\u{1F409}', sellPrice: 60, rare: true },
  apple: { name: 'Apple', icon: '\u{1F34E}', sellPrice: 2 },
};

// What the shop offers to sell to the player (buyPrice items only).
export const SHOP_BUY_LIST = ['pressed_flower', 'fine_ribbon', 'forage_basket_upgrade'];

// What the shop will purchase from the player (sellPrice > 0, non-rare
// items sell at Bramble's; rare items are worth more but Bramble still
// buys them -- there's simply nowhere else to sell them in Phase 1).
export const SHOP_SELL_LIST = [
  'wild_berries',
  'moon_mushroom',
  'silverleaf_herb',
  'honey_root',
  'apple',
  'silver_mane_hair',
  'dragon_scale',
];
