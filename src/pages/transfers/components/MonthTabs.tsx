import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Month {
  month: number;
  year: number;
  label: string;
  shortLabel: string;
}

interface MonthTabsProps {
  months: Month[];
  selectedMonth: { month: number; year: number };
  onSelectMonth: (month: number, year: number) => void;
}

export function MonthTabs({
  months,
  selectedMonth,
  onSelectMonth,
}: MonthTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  useEffect(() => {
    // Scroll to selected month on initial load
    const selectedIdx = months.findIndex(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year,
    );
    if (selectedIdx !== -1 && scrollRef.current) {
      const el = scrollRef.current.children[selectedIdx] as HTMLElement;
      if (el) {
        scrollRef.current.scrollTo({
          left: Math.max(0, el.offsetLeft - 10),
          behavior: "smooth",
        });
      }
    }
  }, [selectedMonth, months]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.6;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group flex items-center flex-1 max-w-full">
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mr-1 rounded-md hover:bg-background"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-end gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 h-full pt-1"
      >
        {months.map((m) => {
          const isSelected =
            m.month === selectedMonth.month && m.year === selectedMonth.year;

          return (
            <button
              key={`${m.year}-${m.month}`}
              onClick={() => onSelectMonth(m.month, m.year)}
              className={cn(
                "relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                isSelected
                  ? "text-foreground border-b border-b-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="capitalize">{m.shortLabel}</span>
              {isSelected && (
                <motion.div
                  layoutId="activeMonth"
                  className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-accent"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-1 rounded-md hover:bg-background"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}
