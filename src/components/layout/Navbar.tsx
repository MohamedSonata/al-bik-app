import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { Menu, Globe } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { t } = useTranslation();
  const { toggle, lang } = useLanguage();

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/menu', label: t('nav.menu') },
    { href: '/#about', label: t('nav.about') },
    { href: '/#contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{ background: 'hsl(355,65%,4%)', borderColor: 'hsl(43,60%,22%)' }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
          <div className="relative overflow-hidden rounded-lg border-2" style={{ width: '46px', height: '46px', borderColor: 'hsl(43,100%,52%)' }}>
            <img
              src="/images/al-baik-logo-poster.jpg"
              alt="Al-Baik"
              style={{
                position: 'absolute',
                width: '180%',
                maxWidth: 'none',
                top: '-4%',
                left: '-2%',
              }}
            />
          </div>
          <span
            className="font-heading font-bold text-xl tracking-wider hidden sm:block"
            style={{ background: 'linear-gradient(90deg, hsl(0,85%,55%), hsl(43,100%,52%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            AL-BAIK
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-body uppercase tracking-wider transition-colors hover:text-brand-gold"
              style={{ color: 'hsl(40,30%,80%)' }}
              data-testid={`link-${link.label}`}
            >
              {link.label}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle language"
            data-testid="btn-lang-toggle"
            className="hover:bg-brand-gold/10 border border-brand-gold/30 rounded-full px-4 gap-2"
          >
            <Globe className="w-4 h-4 text-brand-gold" />
            <span className="font-body font-bold text-brand-gold text-sm">{lang === 'en' ? 'عربي' : 'EN'}</span>
          </Button>
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle language" data-testid="btn-lang-toggle-mobile" className="border border-brand-gold/30">
            <Globe className="w-5 h-5 text-brand-gold" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" data-testid="btn-mobile-menu">
                <Menu className="w-6 h-6 text-brand-gold" />
              </Button>
            </SheetTrigger>
            <SheetContent side={lang === 'ar' ? 'right' : 'left'} style={{ background: 'hsl(355,65%,5%)', borderColor: 'hsl(43,55%,18%)' }}>
              <div className="flex items-center gap-3 mb-10 mt-2">
                <div className="relative overflow-hidden rounded-lg border-2" style={{ width: '42px', height: '42px', borderColor: 'hsl(43,100%,52%)' }}>
                  <img
                    src="/images/al-baik-logo-poster.jpg"
                    alt="Al-Baik"
                    style={{ position: 'absolute', width: '180%', maxWidth: 'none', top: '-4%', left: '-2%' }}
                  />
                </div>
                <span className="font-heading font-bold text-lg" style={{ color: 'hsl(43,100%,52%)' }}>AL-BAIK</span>
              </div>
              <nav className="flex flex-col gap-6">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xl font-heading hover:text-brand-gold transition-colors"
                    style={{ color: 'hsl(40,30%,85%)' }}
                    data-testid={`link-mobile-${link.label}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
