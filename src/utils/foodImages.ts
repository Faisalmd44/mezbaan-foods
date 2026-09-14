// Intelligent food imagery mapping using high-res Unsplash food photography

const FOOD_IMAGE_MAP: { keywords: string[]; url: string }[] = [
  // Specific Burgers
  {
    keywords: ['aloo tikki'],
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['paneer burger', 'cottage cheese burger'],
    url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['chicken peri peri', 'peri peri chicken burger', 'spicy chicken burger'],
    url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['cheese burger', 'double cheese'],
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['burger'],
    url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80'
  },

  // Specific Pizzas
  {
    keywords: ['margherita'],
    url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['paneer tikka pizza', 'paneer pizza'],
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['farm fresh', 'veggie pizza', 'vegetable pizza'],
    url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['chicken pizza', 'bbq chicken pizza', 'pepperoni'],
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['pizza'],
    url: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80'
  },

  // Wraps / Rolls / Shawarma
  {
    keywords: ['paneer wrap', 'paneer roll', 'paneer kathi'],
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['chicken wrap', 'chicken roll', 'shawarma', 'kathi roll'],
    url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['wrap', 'roll', 'burrito'],
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80'
  },

  // Fries
  {
    keywords: ['peri peri fries'],
    url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['cheese loaded fries', 'loaded fries', 'cheese fries'],
    url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['fries', 'french fries'],
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80'
  },

  // Momos / Popcorn / Fried snacks
  {
    keywords: ['momo', 'dumpling', 'dim sum'],
    url: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['chicken popcorn', 'popcorn chicken', 'crispy chicken'],
    url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['nugget', 'wings', 'tenders'],
    url: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80'
  },

  // Drinks / Mojitos / Shakes
  {
    keywords: ['mojito', 'mint mojito', 'lemonade'],
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['cold coffee', 'iced coffee'],
    url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['shake', 'chocolate shake', 'milkshake', 'smoothie'],
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['coke', 'cola', 'pepsi', 'soda'],
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['drink', 'beverage', 'juice'],
    url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80'
  },

  // Sandwiches
  {
    keywords: ['sandwich', 'club sandwich', 'toast'],
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'
  },

  // Combos / Meal Platter
  {
    keywords: ['combo', 'meal'],
    url: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=600&q=80'
  }
];

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';

/**
 * Returns a high-res food photo matching the item name or its specified imageUrl.
 */
export function getFoodImageUrl(itemName: string, explicitUrl?: string): string {
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl;
  }

  const lower = itemName.toLowerCase();

  for (const entry of FOOD_IMAGE_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.url;
    }
  }

  return DEFAULT_FOOD_IMAGE;
}
