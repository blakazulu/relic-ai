import { ArrowLeft, MoreVertical, Edit3, Trash2, Download, Share2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DetailHeaderProps {
  name: string;
  backTo: string;
  backLabel?: string;
  status?: string;
  statusVariant?: 'default' | 'success' | 'warning' | 'error';
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  editable?: boolean;
  onNameChange?: (newName: string) => void;
}

function StatusBadge({ variant, children }: { variant: 'default' | 'success' | 'warning' | 'error'; children: React.ReactNode }) {
  const variantClasses = {
    default: 'bg-stone-gray/10 text-stone-gray border-stone-gray/30',
    success: 'bg-oxidized-bronze/10 text-oxidized-bronze border-oxidized-bronze/30',
    warning: 'bg-gold-ochre/10 text-gold-ochre border-gold-ochre/30',
    error: 'bg-rust-red/10 text-rust-red border-rust-red/30',
  };

  return (
    <span className={cn('px-2 py-1 rounded-full border text-xs font-medium whitespace-nowrap', variantClasses[variant])}>
      {children}
    </span>
  );
}

export function DetailHeader({
  name,
  backTo,
  backLabel = 'Gallery',
  status,
  statusVariant = 'default',
  onEdit,
  onDelete,
  onExport,
  onShare,
  editable = false,
  onNameChange,
}: DetailHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync editedName when name prop changes
  useEffect(() => {
    setEditedName(name);
  }, [name]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== name) {
      onNameChange?.(editedName.trim());
    } else {
      setEditedName(name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') {
      setEditedName(name);
      setIsEditing(false);
    }
  };

  const hasActions = onEdit || onDelete || onExport || onShare;

  return (
    <div className="sticky top-14 z-40 bg-parchment border-b border-desert-sand">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Left: Back button and breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            to={backTo}
            className="flex-shrink-0 rounded-full p-2 hover:bg-aged-paper transition-colors"
            aria-label={`Back to ${backLabel}`}
          >
            <ArrowLeft className="h-5 w-5 text-charcoal" />
          </Link>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to={backTo} className="text-sm text-stone-gray hover:text-terracotta transition-colors flex-shrink-0">
              {backLabel}
            </Link>
            <span className="text-stone-gray">/</span>

            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveName}
                autoFocus
                className="flex-1 min-w-0 font-heading font-semibold text-charcoal bg-aged-paper px-2 py-1 rounded border border-terracotta focus:outline-none"
              />
            ) : (
              <h1
                className={cn(
                  'font-heading font-semibold text-charcoal truncate',
                  editable && 'cursor-pointer hover:text-terracotta'
                )}
                onClick={() => editable && setIsEditing(true)}
                title={name}
              >
                {name}
              </h1>
            )}
          </div>
        </div>

        {/* Right: Status and Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status && <StatusBadge variant={statusVariant}>{status}</StatusBadge>}

          {hasActions && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-full p-2 hover:bg-aged-paper transition-colors"
                aria-label="More actions"
              >
                {isMenuOpen ? <X className="h-5 w-5 text-charcoal" /> : <MoreVertical className="h-5 w-5 text-charcoal" />}
              </button>

              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-parchment border border-desert-sand shadow-lg overflow-hidden z-50">
                  {onEdit && (
                    <button
                      onClick={() => { onEdit(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-charcoal hover:bg-aged-paper text-left"
                    >
                      <Edit3 className="h-4 w-4" /> Edit Details
                    </button>
                  )}
                  {onExport && (
                    <button
                      onClick={() => { onExport(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-charcoal hover:bg-aged-paper text-left"
                    >
                      <Download className="h-4 w-4" /> Export
                    </button>
                  )}
                  {onShare && (
                    <button
                      onClick={() => { onShare(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-charcoal hover:bg-aged-paper text-left"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </button>
                  )}
                  {onDelete && (
                    <>
                      {(onEdit || onExport || onShare) && <div className="border-t border-desert-sand" />}
                      <button
                        onClick={() => { onDelete(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rust-red hover:bg-rust-red/10 text-left"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
