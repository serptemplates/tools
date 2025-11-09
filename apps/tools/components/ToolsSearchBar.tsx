"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  count: number;
};

type ToolsSearchBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
};

export function ToolsSearchBar({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
}: ToolsSearchBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || "All Tools";

  return (
    <div className="mb-8">
      {/* Search and Filters Bar - All on one line */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[48px]"
          />
        </div>

        {/* Category Dropdown */}
        <div ref={dropdownRef} className="relative w-full lg:w-64">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full h-[48px] px-4 py-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors flex items-center justify-between"
          >
            <span className={selectedCategory === 'all' ? 'text-gray-500' : 'text-gray-900'}>
              {selectedCategoryName}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''
              }`} />
          </div>

          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedCategory === category.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                >
                  <span>{category.name}</span>
                  <span className="text-sm text-gray-500">({category.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters Button - only show if filters active */}
        {(searchQuery || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      {(searchQuery || selectedCategory !== 'all') && (
        <div className="mt-4 text-sm text-gray-600">
          Showing results for: {searchQuery && <span className="font-medium">&ldquo;{searchQuery}&rdquo;</span>}
          {searchQuery && selectedCategory !== 'all' && ' in '}
          {selectedCategory !== 'all' && <span className="font-medium">{selectedCategoryName}</span>}
        </div>
      )}
    </div>
  );
}