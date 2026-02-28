import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
      <Link href="/">
        <a className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="h-4 w-4" />
          <span className="arabic-text">الرئيسية</span>
        </a>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link href={item.href}>
              <a className="hover:text-foreground transition-colors arabic-text">
                {item.label}
              </a>
            </Link>
          ) : (
            <span className="text-foreground font-medium arabic-text">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
