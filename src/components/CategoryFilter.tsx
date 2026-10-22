import React, { useMemo } from 'react';
import { CATEGORIES } from '../data/initialProducts';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  categoryCounts: { [key: string]: number };
  lowStockCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  lowStockCount,
}) => {
  // Merge default CATEGORIES with any custom categories present in products
  const categoryTabs = useMemo(() => {
    const list = [...CATEGORIES];
    const existingIds = new Set(CATEGORIES.map((c) => c.id.toLowerCase()));

    Object.keys(categoryCounts).forEach((catKey) => {
      if (catKey === 'all' || catKey === 'low-stock') return;
      if (!existingIds.has(catKey.toLowerCase()) && categoryCounts[catKey] > 0) {
        list.push({
          id: catKey,
          label: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/-/g, ' '),
          icon: '🏷️',
        });
      }
    });

    return list;
  }, [categoryCounts]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
      {categoryTabs.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
        const isLowStock = cat.id === 'low-stock';
        const count = isLowStock
          ? lowStockCount
          : cat.id === 'all'
          ? categoryCounts['all'] || 0
          : categoryCounts[cat.id] || categoryCounts[cat.id.toLowerCase()] || 0;

        // Skip categories with 0 items unless it's "all", "low-stock", or selected
        if (count === 0 && cat.id !== 'all' && cat.id !== 'low-stock' && !isSelected) {
          return null;
        }

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              isSelected
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-800/20 scale-[1.02]'
                : isLowStock && lowStockCount > 0
                ? 'bg-amber-100/80 text-amber-900 hover:bg-amber-100 border border-amber-300'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className="text-base leading-none">{cat.icon}</span>
            <span className="whitespace-nowrap">{cat.label}</span>
            {count > 0 && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : isLowStock
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
