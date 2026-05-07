import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export function ContactSection() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <section id="contact" className="py-20 bg-brand-surface relative border-t border-brand-gold/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12 items-stretch">

          {/* Info Side */}
          <div className="w-full lg:w-1/2 bg-brand-charcoal p-8 md:p-12 rounded-3xl border border-brand-gold/20 shadow-2xl">
            <h2 className="font-heading text-4xl text-brand-gold mb-8">{t('contact.title')}</h2>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-3 bg-brand-crimson/10 rounded-full text-brand-crimson border border-brand-crimson/20 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-body font-bold text-foreground text-lg mb-1">
                    {isAr ? t('contact.addressAr') : t('contact.address')}
                  </h3>
                  {!isAr && (
                    <p className="text-muted-foreground text-sm font-body">{t('contact.addressAr')}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-3 bg-brand-crimson/10 rounded-full text-brand-crimson border border-brand-crimson/20 shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-body font-bold text-foreground text-lg mb-1">
                    <a
                      href="tel:0793540333"
                      className="hover:text-brand-gold transition-colors"
                      dir="ltr"
                      data-testid="link-phone"
                    >
                      {t('contact.phone')}
                    </a>
                  </h3>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-3 bg-brand-crimson/10 rounded-full text-brand-crimson border border-brand-crimson/20 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="w-full">
                  <h3 className="font-body font-bold text-foreground text-lg mb-4">{t('contact.hours')}</h3>
                  <div className="bg-brand-surface rounded-xl border border-brand-gold/10 overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow className="border-b border-brand-gold/10 hover:bg-brand-charcoal/50">
                          <TableCell className="font-body">{t('contact.sunday')}</TableCell>
                          <TableCell className="text-right text-brand-gold" dir="ltr">{t('contact.sundayTime')}</TableCell>
                        </TableRow>
                        <TableRow className="border-0 hover:bg-brand-charcoal/50">
                          <TableCell className="font-body">{t('contact.fridaySaturday')}</TableCell>
                          <TableCell className="text-right text-brand-gold" dir="ltr">{t('contact.fridaySaturdayTime')}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offer poster side */}
          <div className="w-full lg:w-1/2 min-h-[400px] rounded-3xl border border-brand-gold/20 overflow-hidden relative">
            <img
              src="/images/al-baik-logo-poster.jpg"
              alt="Al-Baik Special Offer — Charcoal Smoked Chicken"
              className="w-full h-full object-cover"
              style={{ minHeight: '400px' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="font-heading text-brand-gold text-lg font-bold drop-shadow-lg">
                {isAr ? 'عرض فقط لنهاية الليلة!' : "Tonight's Special Offer!"}
              </p>
              <p className="text-white/90 font-body text-sm mt-1">
                {isAr ? 'دجاجة الشوايه مدخنة على الفحم' : 'Charcoal Smoked Rotisserie Chicken'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
