import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
  className?: string;
}

/**
 * Before/after comparison slider with draggable divider
 * Supports touch and mouse interactions
 */
export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  initialPosition = 50,
  className,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Calculate slider position from mouse/touch event
   */
  const calculatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  /**
   * Handle mouse move
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      calculatePosition(e.clientX);
    },
    [isDragging, calculatePosition]
  );

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      calculatePosition(e.touches[0].clientX);
    },
    [isDragging, calculatePosition]
  );

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle mouse down on slider
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    calculatePosition(e.clientX);
  }, [calculatePosition]);

  /**
   * Handle touch start on slider
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    calculatePosition(e.touches[0].clientX);
  }, [calculatePosition]);

  /**
   * Handle click on container to move slider
   */
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    calculatePosition(e.clientX);
  }, [calculatePosition]);

  // Add/remove event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full aspect-square overflow-hidden rounded-xl',
        'bg-aged-paper select-none cursor-col-resize',
        className
      )}
      onClick={handleContainerClick}
    >
      {/* Before image (full width, underneath) */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* After image (clipped based on slider position) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-bone-white shadow-lg cursor-col-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Handle circle */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-10 h-10 rounded-full bg-bone-white shadow-lg',
            'border-2 border-terracotta',
            'flex items-center justify-center',
            'transition-transform duration-150',
            isDragging && 'scale-110'
          )}
        >
          {/* Arrows */}
          <div className="flex items-center gap-0.5">
            <svg
              className="w-3 h-3 text-terracotta"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
            <svg
              className="w-3 h-3 text-terracotta"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-charcoal/70 backdrop-blur-sm">
        <span className="text-sm font-medium text-bone-white">{beforeLabel}</span>
      </div>
      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-charcoal/70 backdrop-blur-sm">
        <span className="text-sm font-medium text-bone-white">{afterLabel}</span>
      </div>
    </div>
  );
}
