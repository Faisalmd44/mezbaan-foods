import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Pizza,
  Sandwich,
  CupSoda,
  Drumstick,
  Flame,
  Layers,
  Sparkles,
  LucideIcon
} from 'lucide-react';

interface FoodItemImageProps {
  name: string;
  isVeg: boolean;
  categoryId?: number;
  imageUrl?: string;
  className?: string;
  aspectRatio?: 'banner' | 'square' | 'thumb';
  showVegIndicator?: boolean;
  children?: React.ReactNode;
}

interface CategoryTheme {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  label: string;
  Icon: LucideIcon;
}

const CATEGORY_THEMES: Record<number, CategoryTheme> = {
  1: {
    // Burgers
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50/60',
    border: 'border-orange-200/70',
    iconBg: 'bg-orange-100/80',
    iconColor: 'text-amber-700',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    label: 'BURGER',
    Icon: UtensilsCrossed
  },
  2: {
    // Pizza
    bg: 'bg-gradient-to-br from-rose-50 to-red-50/60',
    border: 'border-rose-200/70',
    iconBg: 'bg-rose-100/80',
    iconColor: 'text-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    label: 'PIZZA',
    Icon: Pizza
  },
  3: {
    // Wraps
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/60',
    border: 'border-emerald-200/70',
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    label: 'WRAP',
    Icon: Layers
  },
  4: {
    // Sides & Momos
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50/60',
    border: 'border-amber-200/70',
    iconBg: 'bg-amber-100/80',
    iconColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    label: 'SIDES & MOMOS',
    Icon: Drumstick
  },
  5: {
    // Sandwiches
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-50/60',
    border: 'border-purple-200/70',
    iconBg: 'bg-purple-100/80',
    iconColor: 'text-purple-700',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    label: 'SANDWICH',
    Icon: Sandwich
  },
  6: {
    // Fries
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50/60',
    border: 'border-yellow-200/70',
    iconBg: 'bg-yellow-100/80',
    iconColor: 'text-yellow-700',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    label: 'FRIES',
    Icon: Flame
  },
  7: {
    // Drinks
    bg: 'bg-gradient-to-br from-sky-50 to-cyan-50/60',
    border: 'border-sky-200/70',
    iconBg: 'bg-sky-100/80',
    iconColor: 'text-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    label: 'DRINK',
    Icon: CupSoda
  }
};

const DEFAULT_THEME: CategoryTheme = {
  bg: 'bg-neutral-50',
  border: 'border-neutral-200',
  iconBg: 'bg-neutral-100',
  iconColor: 'text-neutral-700',
  badgeBg: 'bg-neutral-100',
  badgeText: 'text-neutral-700',
  label: 'MEZBAAN',
  Icon: Sparkles
};

function resolveCategoryTheme(categoryId?: number, name: string = ''): CategoryTheme {
  if (categoryId && CATEGORY_THEMES[categoryId]) {
    return CATEGORY_THEMES[categoryId];
  }
  const lower = name.toLowerCase();
  if (lower.includes('burger')) return CATEGORY_THEMES[1];
  if (lower.includes('pizza')) return CATEGORY_THEMES[2];
  if (lower.includes('wrap')) return CATEGORY_THEMES[3];
  if (lower.includes('momo') || lower.includes('popcorn') || lower.includes('wing')) return CATEGORY_THEMES[4];
  if (lower.includes('sandwich')) return CATEGORY_THEMES[5];
  if (lower.includes('fries')) return CATEGORY_THEMES[6];
  if (lower.includes('can') || lower.includes('coke') || lower.includes('fanta') || lower.includes('campa') || lower.includes('bull') || lower.includes('drink')) return CATEGORY_THEMES[7];
  return DEFAULT_THEME;
}

export const FoodItemImage: React.FC<FoodItemImageProps> = ({
  name,
  isVeg,
  categoryId,
  imageUrl,
  className = '',
  aspectRatio = 'banner',
  showVegIndicator = true,
  children
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const theme = resolveCategoryTheme(categoryId, name);
  const CategoryIcon = theme.Icon;

  const hasCustomImage = Boolean(imageUrl && imageUrl.trim().length > 0 && !hasError);

  const aspectClass =
    aspectRatio === 'banner'
      ? 'h-28 sm:h-32 w-full'
      : aspectRatio === 'thumb'
      ? 'w-12 h-12 shrink-0 rounded-xl'
      : 'w-full h-full';

  return (
    <div
      className={`relative overflow-hidden select-none border-b ${theme.bg} ${aspectClass} ${className}`}
    >
      {/* 1. Crossfade Image Loader with subtle shimmer placeholder (AsyncImage pattern) */}
      {hasCustomImage ? (
        <>
          {/* Subtle placeholder shimmer while loading */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center animate-pulse z-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center opacity-40 ${theme.iconBg}`}>
                <CategoryIcon className={`w-4 h-4 ${theme.iconColor}`} />
              </div>
            </div>
          )}

          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ease-out group-hover:scale-105 transition-transform ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        /* Minimalist Fallback Placeholder */
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          {aspectRatio === 'thumb' ? (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.iconBg}`}>
              <CategoryIcon className={`w-4 h-4 ${theme.iconColor}`} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 text-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xs border ${theme.border} ${theme.iconBg}`}>
                <CategoryIcon className={`w-5 h-5 ${theme.iconColor}`} />
              </div>
              <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                {theme.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Authentic FSSAI Veg / Non-Veg Indicator Badge */}
      {showVegIndicator && (
        <div
          className="absolute top-2 left-2 z-10 w-4 h-4 rounded-xs bg-white/95 p-0.5 flex items-center justify-center shadow-xs border border-[#D5D7DC] backdrop-blur-xs"
          title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
        >
          <div
            className={`w-2.5 h-2.5 rounded-xs flex items-center justify-center border ${
              isVeg ? 'border-emerald-600' : 'border-red-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isVeg ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            />
          </div>
        </div>
      )}

      {/* Optional Overlay Children (stock warning badges, steppers) */}
      {children}
    </div>
  );
};

