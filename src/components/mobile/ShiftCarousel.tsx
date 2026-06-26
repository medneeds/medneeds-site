import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileShiftCard, MobileShiftData } from "./MobileShiftCard";

interface ShiftCarouselProps {
  title: string;
  shifts: MobileShiftData[];
  linkTo?: string;
  linkText?: string;
}

export function ShiftCarousel({ title, shifts, linkTo, linkText = "Abrir calendário" }: ShiftCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (shifts.length === 0) {
    return null;
  }

  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {linkTo && (
          <Link 
            to={linkTo} 
            className="text-sm text-accent font-medium flex items-center gap-1"
          >
            {linkText}
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {shifts.map((shift) => (
          <div key={shift.id} className="flex-shrink-0 w-[85%] snap-start">
            <MobileShiftCard shift={shift} showDate />
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {shifts.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full ${
              index === 0 ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
