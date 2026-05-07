import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-20"
    >
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-6 rounded-full bg-brand-crimson/10 border border-brand-crimson/30">
            <WifiOff className="w-12 h-12 text-brand-crimson" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-bold text-brand-gold">
            {isAr ? 'فشل الاتصال' : 'Connection Failed'}
          </h3>
          <p className="font-body text-muted-foreground">
            {message ||
              (isAr
                ? 'تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.'
                : 'Unable to connect to the server. Please try again.')}
          </p>
        </div>

        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gold hover:bg-brand-amber text-brand-charcoal font-body font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          {isAr ? 'إعادة المحاولة' : 'Try Again'}
        </button>

        <p className="text-xs text-muted-foreground/60 font-body">
          {isAr
            ? 'سيتم عرض البيانات الثابتة في حالة استمرار المشكلة'
            : 'Static data will be shown if the issue persists'}
        </p>
      </div>
    </motion.div>
  );
}
