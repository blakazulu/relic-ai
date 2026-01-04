import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
}

export interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Reusable tab navigation component
 *
 * Features:
 * - Accepts tabs array with id, label, icon, badge
 * - Controlled activeTab prop
 * - onTabChange callback
 * - Horizontal scrollable on mobile
 * - Active tab indicated with terracotta underline
 * - Badge display for content indicators
 */
export function TabNav({ tabs, activeTab, onTabChange, className }: TabNavProps) {
  return (
    <div
      className={cn(
        'flex border-b border-desert-sand overflow-x-auto scrollbar-hide',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const displayBadge = tab.badge !== undefined
          ? typeof tab.badge === 'number' && tab.badge > 9
            ? '9+'
            : String(tab.badge)
          : null;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            className={cn(
              'flex-1 min-w-[80px] flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all border-b-2',
              isActive
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-stone-gray hover:text-charcoal hover:bg-aged-paper/50'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {displayBadge && (
                <span
                  className="absolute -top-1 -right-2 bg-terracotta text-bone-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center"
                  aria-label={`${tab.badge} items`}
                >
                  {displayBadge}
                </span>
              )}
            </div>
            <span className="truncate w-full text-center">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
