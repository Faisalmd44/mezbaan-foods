import { Category, MenuItem, Staff } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Burgers', displayOrder: 1 },
  { id: 2, name: 'Pizza', displayOrder: 2 },
  { id: 3, name: 'Wraps', displayOrder: 3 },
  { id: 4, name: 'Sides & Momos', displayOrder: 4 },
  { id: 5, name: 'Sandwiches', displayOrder: 5 },
  { id: 6, name: 'Fries', displayOrder: 6 },
  { id: 7, name: 'Drinks', displayOrder: 7 },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // 1. BURGERS
  {
    id: 1,
    categoryId: 1,
    name: 'Veg Patty Burger',
    price: 60.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 1,
    stockQuantity: 25,
    imageUrl: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500&q=80'
  },
  {
    id: 2,
    categoryId: 1,
    name: 'Paneer Burger',
    price: 80.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 2,
    stockQuantity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'
  },
  {
    id: 3,
    categoryId: 1,
    name: 'Chicken Patty Burger',
    price: 90.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 3,
    stockQuantity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&q=80'
  },
  {
    id: 4,
    categoryId: 1,
    name: 'Chicken Zinger Burger',
    price: 100.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 4,
    stockQuantity: 22,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80'
  },
  {
    id: 5,
    categoryId: 1,
    name: 'American Chicken Burger',
    price: 130.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 5,
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80'
  },

  // 2. PIZZA
  {
    id: 6,
    categoryId: 2,
    name: 'Veg Classic Corn & Cheese Pizza',
    price: 100.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 1,
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80'
  },
  {
    id: 7,
    categoryId: 2,
    name: 'Farmhouse Delight Pizza',
    price: 120.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 2,
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80'
  },
  {
    id: 8,
    categoryId: 2,
    name: 'Mezbaan Royal Paneer Pizza',
    price: 130.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 3,
    stockQuantity: 12,
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80'
  },
  {
    id: 9,
    categoryId: 2,
    name: 'Mezbaan Tandoori Pizza',
    price: 180.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 4,
    stockQuantity: 14,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80'
  },
  {
    id: 10,
    categoryId: 2,
    name: 'Mezbaan Loaded Chicken Pizza',
    price: 220.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 5,
    stockQuantity: 10,
    imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&q=80'
  },

  // 3. WRAPS
  {
    id: 11,
    categoryId: 3,
    name: 'Chicken Wrap',
    price: 80.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 1,
    stockQuantity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=80'
  },
  {
    id: 12,
    categoryId: 3,
    name: 'Chicken Cheesy Wrap',
    price: 90.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 2,
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80'
  },
  {
    id: 13,
    categoryId: 3,
    name: 'American Hot Cheesy Wrap',
    price: 100.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 3,
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&q=80'
  },

  // 4. SIDES & MOMOS
  {
    id: 14,
    categoryId: 4,
    name: 'Chicken Popcorn',
    price: 100.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 1,
    stockQuantity: 25,
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80'
  },
  {
    id: 15,
    categoryId: 4,
    name: 'Wings',
    price: 120.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 2,
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1527477378474-064e432c74d8?w=500&q=80'
  },
  {
    id: 16,
    categoryId: 4,
    name: 'Kurkure Momos',
    price: 100.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 3,
    stockQuantity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=80'
  },

  // 5. SANDWICHES
  {
    id: 17,
    categoryId: 5,
    name: 'Veg Sandwich',
    price: 70.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 1,
    stockQuantity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80'
  },
  {
    id: 18,
    categoryId: 5,
    name: 'Veg Cheese Sandwich',
    price: 90.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 2,
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=500&q=80'
  },
  {
    id: 19,
    categoryId: 5,
    name: 'Chicken Grill Sandwich',
    price: 90.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 3,
    stockQuantity: 16,
    imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=500&q=80'
  },
  {
    id: 20,
    categoryId: 5,
    name: 'Chicken Tandoori Sandwich',
    price: 100.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 4,
    stockQuantity: 14,
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80'
  },

  // 6. FRIES
  {
    id: 21,
    categoryId: 6,
    name: 'Salted Fries',
    price: 50.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 1,
    stockQuantity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&q=80'
  },
  {
    id: 22,
    categoryId: 6,
    name: 'Peri Peri Fries',
    price: 60.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 2,
    stockQuantity: 25,
    imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&q=80'
  },
  {
    id: 23,
    categoryId: 6,
    name: 'Loaded Fries',
    price: 70.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 3,
    stockQuantity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1585238341267-1cf923a1a5b8?w=500&q=80'
  },
  {
    id: 24,
    categoryId: 6,
    name: 'Chicken Loaded Fries',
    price: 120.0,
    isVeg: false,
    isAvailable: true,
    sortOrder: 4,
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&q=80'
  },

  // 7. DRINKS
  {
    id: 25,
    categoryId: 7,
    name: 'Thums Up Can',
    price: 30.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 1,
    stockQuantity: 35,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80'
  },
  {
    id: 26,
    categoryId: 7,
    name: 'Coke Can',
    price: 30.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 2,
    stockQuantity: 35,
    imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&q=80'
  },
  {
    id: 27,
    categoryId: 7,
    name: 'Fanta Can',
    price: 30.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 3,
    stockQuantity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=500&q=80'
  },
  {
    id: 28,
    categoryId: 7,
    name: 'Campa 10',
    price: 10.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 4,
    stockQuantity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=500&q=80'
  },
  {
    id: 29,
    categoryId: 7,
    name: 'Campa 20',
    price: 20.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 5,
    stockQuantity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=500&q=80'
  },
  {
    id: 30,
    categoryId: 7,
    name: 'Campa Energy',
    price: 30.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 6,
    stockQuantity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=500&q=80'
  },
  {
    id: 31,
    categoryId: 7,
    name: 'Red Bull',
    price: 140.0,
    isVeg: true,
    isAvailable: true,
    sortOrder: 7,
    stockQuantity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80'
  },
];

export const INITIAL_STAFF: Staff[] = [
  { id: 1, name: 'Admin', pin: '1234', role: 'ADMIN', isActive: true },
  { id: 2, name: 'Cashier 1', pin: '0000', role: 'CASHIER', isActive: true },
  { id: 3, name: 'Cashier 2', pin: '1111', role: 'CASHIER', isActive: true },
];
