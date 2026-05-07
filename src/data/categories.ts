export interface Category {
  slug: string;
  labelAr: string;
  labelEn: string;
  icon: string;
}

export const categories: Category[] = [
  { slug: 'grills', labelAr: 'المشويات', labelEn: 'Grills', icon: '🔥' },
  { slug: 'family', labelAr: 'وجبات عائلية', labelEn: 'Family Meals', icon: '👨‍👩‍👧‍👦' },
  { slug: 'appetizers', labelAr: 'المقبلات', labelEn: 'Appetizers', icon: '🥗' },
  { slug: 'drinks', labelAr: 'المشروبات', labelEn: 'Drinks', icon: '🥤' },
  { slug: 'desserts', labelAr: 'الحلويات', labelEn: 'Desserts', icon: '🍮' },
];
