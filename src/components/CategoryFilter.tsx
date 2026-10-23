import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { CATEGORIES } from '../data/initialProducts';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  categoryCounts: { [key: string]: number };
  availableShelves?: string[];
  selectedShelf?: string;
  onSelectShelf?: (shelf: string) => void;
  shelfCounts?: { [shelf: string]: number };
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  availableShelves = [],
  selectedShelf = 'all',
  onSelectShelf,
  shelfCounts = {},
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  // Merge default CATEGORIES (excluding low-stock) with any custom categories present in products
  const categoryTabs = useMemo(() => {
    const list = CATEGORIES.filter((c) => c.id !== 'low-stock');
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

  const totalProducts = categoryCounts['all'] || 0;

  // Enable horizontal scrolling with mouse wheel when hovering over the filter bar on desktop/web
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Do not start drag if clicking directly on the select dropdown
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'select') return;
    const el = scrollRef.current;
    if (!el) return;
    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDown) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragStateRef.current.startX;
    if (Math.abs(walk) > 5) {
      dragStateRef.current.hasMoved = true;
      setIsDragging(true);
      e.preventDefault();
      el.scrollLeft = dragStateRef.current.scrollLeft - walk * 1.2;
    }
  };

  const handleMouseUpOrLeave = () => {
    dragStateRef.current.isDown = false;
    setTimeout(() => {
      setIsDragging(false);
    }, 0);
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className={`flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* 1. Dropdown Filter Rak (Paling Pertama, Sejajar dengan Kategori) */}
      {onSelectShelf && (
        <div className="relative shrink-0">
          <select
            value={selectedShelf}
            onChange={(e) => onSelectShelf(e.target.value)}
            aria-label="Filter Lokasi Rak"
            className={`min-h-[46px] pl-3.5 pr-9 py-2 rounded-2xl text-sm font-semibold appearance-none transition-all cursor-pointer outline-none border ${
              selectedShelf !== 'all'
                ? 'bg-amber-800 text-white border-amber-900 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs'
            }`}
          >
            <option value="all" className="bg-white text-slate-800 font-semibold">
              🗄️ Semua Rak ({totalProducts})
            </option>
            {availableShelves.map((shelf) => {
              const count = shelfCounts[shelf.toLowerCase()] || 0;
              return (
                <option
                  key={shelf}
                  value={shelf}
                  className="bg-white text-slate-800 font-semibold"
                >
                  🗄️ {shelf} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown
            className={`w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
              selectedShelf !== 'all' ? 'text-white' : 'text-slate-500'
            }`}
          />
        </div>
      )}

      {/* 2. Tombol Kategori (Tanpa Stok Menipis) */}
      {categoryTabs.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
        const count =
          cat.id === 'all'
            ? categoryCounts['all'] || 0
            : categoryCounts[cat.id] || categoryCounts[cat.id.toLowerCase()] || 0;

        // Skip categories with 0 items unless it's "all" or selected
        if (count === 0 && cat.id !== 'all' && !isSelected) {
          return null;
        }

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              if (dragStateRef.current.hasMoved) return;
              onSelectCategory(cat.id);
            }}
            className={`min-h-[46px] px-3.5 sm:px-4 py-2 rounded-2xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              isSelected
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-800/20 scale-[1.02]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className="text-base leading-none">{cat.icon}</span>
            <span className="whitespace-nowrap">{cat.label}</span>
            {count > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-white/25 text-white'
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
