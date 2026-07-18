"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/capture", label: "Capturar" },
  { href: "/preguntar", label: "Preguntar" },
  { href: "/proximos", label: "Próximos" },
  { href: "/entities", label: "Entidades" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4 text-sm">
        <Link href="/" className="flex items-center gap-2 font-medium tracking-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          vida-os
        </Link>
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
