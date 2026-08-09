import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";

interface EventCardProps {
  slug: string;
  title: string;
  city: string;
  startDate: string;
  imageUrl?: string | null;
  isFree: boolean;
  category: { name: string };
  minPrice?: number;
}

export default function EventCard({ slug, title, city, startDate, imageUrl, isFree, category, minPrice }: EventCardProps) {
  const date = new Date(startDate);
  const formattedDate = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <Link
      href={`/evenements/${slug}`}
      className="group block bg-panel rounded-bubble border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-40 bg-gradient-to-br from-wa-teal to-wa-deep">
        {imageUrl && (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        )}
        <span className="absolute top-3 right-3 bg-white/95 text-wa-deep text-xs font-semibold px-3 py-1 rounded-full">
          {isFree ? "Gratuit" : minPrice ? `${minPrice.toLocaleString()} FCFA` : "Payant"}
        </span>
        <span className="absolute bottom-3 left-3 bg-wa-deep/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {formattedDate}
        </span>
      </div>

      <div className="p-4">
        <span className="text-xs font-semibold text-wa-teal uppercase tracking-wide">{category.name}</span>
        <h3 className="font-display font-bold text-ink mt-1 line-clamp-2 group-hover:text-wa-teal transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-muted text-sm mt-2">
          <MapPin size={14} />
          {city}
        </div>
      </div>
    </Link>
  );
}