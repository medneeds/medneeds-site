import { cn } from "@/lib/utils";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import banner1 from "@/assets/images/banners/1.jpeg";
import banner2 from "@/assets/images/banners/2.jpeg";
import banner3 from "@/assets/images/banners/3.jpeg";
import banner4 from "@/assets/images/banners/4.jpeg";
import { useTheme } from "@/ui";

interface Banner {
  id: string;
  image: string;
  link: string;
  isExternal?: boolean;
}

const banners: Banner[] = [
  { id: "1", image: banner1, link: "/ofertas" },
  { id: "2", image: banner2, link: "/agenda" },
  { id: "3", image: banner3, link: "/recebimentos" },
  { 
    id: "4", 
    image: banner4, 
    link: import.meta.env.VITE_BANNER_FORM_URL || "#",
    isExternal: true 
  },
];

export function BannerCarousel() {
  const {isDark} = useTheme();

  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      nextSlide();
    } else if (info.offset.x > swipeThreshold) {
      prevSlide();
    }
  };

  const BannerContent = ({ banner }: { banner: Banner }) => (
    <motion.div
      key={banner.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="relative aspect-[16/9] lg:aspect-[21/9] xl:aspect-[3/1] w-full cursor-grab active:cursor-grabbing"
    >
      <img
        src={banner.image}
        alt={`Banner ${banner.id}`}
        className="w-full h-full object-cover rounded-xl pointer-events-none"
      />
    </motion.div>
  );

  return (
    <div 
      className="relative overflow-hidden rounded-xl mx-4 md:mx-0 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {banners[current].isExternal ? (
          <a
            href={banners[current].link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <BannerContent banner={banners[current]} />
          </a>
        ) : (
          <Link to={banners[current].link} className="block">
            <BannerContent banner={banners[current]} />
          </Link>
        )}
      </AnimatePresence>

      {/* Navigation Arrows for Desktop */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 hidden md:flex z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 hidden md:flex z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrent(index);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === current
                ? (isDark ? "bg-accent w-3" : "bg-primary w-3")
                : "bg-foreground"
            )}
          />
        ))}
      </div>
    </div>
  );
}
