export interface MenuImage {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  categorySlug: string;
  featured: boolean;
}

export const menuImages: MenuImage[] = [
  {
    id: "m1",
    titleAr: "دجاجة الشوايه على الفحم",
    titleEn: "Charcoal Rotisserie Chicken",
    descriptionAr: "دجاجة كاملة مشوية ببطء على الفحم الطبيعي، مدخنة حتى تصبح ذهبية مقرمشة من الخارج وطرية تذوب في الفم من الداخل. وصفة سرية موروثة.",
    descriptionEn: "Whole chicken slow-roasted over natural charcoal, smoked until golden crispy outside and melt-in-your-mouth tender inside. A secret family recipe passed down through generations.",
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=900&q=85",
    categorySlug: "grills",
    featured: true,
  },
  {
    id: "m2",
    titleAr: "دجاج مقلي مقرمش",
    titleEn: "Crispy Broasted Chicken",
    descriptionAr: "قطع دجاج مقلية بالخلطة السرية، مقرمشة ومحمرة بشكل مثالي",
    descriptionEn: "Chicken pieces fried in our secret blend, perfectly crispy and golden brown",
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c7?auto=format&fit=crop&w=700&q=85",
    categorySlug: "grills",
    featured: true,
  },
  {
    id: "m3",
    titleAr: "بطاطس ذهبية مقرمشة",
    titleEn: "Golden Crispy Fries",
    descriptionAr: "بطاطس مقلية بزيت نباتي نقي حتى تصبح ذهبية مقرمشة، مرشوشة بملح البحر",
    descriptionEn: "Fried in pure vegetable oil to golden perfection, seasoned with sea salt",
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=85",
    categorySlug: "appetizers",
    featured: false,
  },
  {
    id: "m4",
    titleAr: "وجبة عائلية للأربعة",
    titleEn: "Family Feast for Four",
    descriptionAr: "وجبة مميزة تكفي أربعة أشخاص: دجاجتان مشويتان، أرز مبهر، سلطة طازجة، وخبز عربي. الخيار الأمثل لتجمعات العائلة.",
    descriptionEn: "A generous spread for four: two rotisserie chickens, fragrant spiced rice, fresh salad and pita bread. The perfect choice for family gatherings.",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85",
    categorySlug: "family",
    featured: true,
  },
  {
    id: "m5",
    titleAr: "حمص بالطحينة وزيت الزيتون",
    titleEn: "Hummus with Tahini & Olive Oil",
    descriptionAr: "حمص ناعم محضر يومياً بالطحينة وعصير الليمون وزيت الزيتون البكر",
    descriptionEn: "Silky smooth hummus made fresh daily with tahini, lemon and extra virgin olive oil",
    imageUrl: "https://images.unsplash.com/photo-1577303935007-0d306ee638cf?auto=format&fit=crop&w=700&q=85",
    categorySlug: "appetizers",
    featured: false,
  },
  {
    id: "m6",
    titleAr: "عصير ليمون نعناع طازج",
    titleEn: "Fresh Mint Lemonade",
    descriptionAr: "ليمون طازج معصور مع النعناع البلدي الطازج والسكر، مثلج ومنعش في كل رشفة",
    descriptionEn: "Freshly squeezed lemon with garden-fresh mint and sugar over crushed ice — refreshing with every sip",
    imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=700&q=85",
    categorySlug: "drinks",
    featured: true,
  },
  {
    id: "m7",
    titleAr: "كنافة بالجبن العكاوي",
    titleEn: "Cheese Kunafa",
    descriptionAr: "كنافة ذهبية محضرة بالجبن العكاوي الطازج، مسقية بالقطر العطر ومزينة بالفستق الحلبي",
    descriptionEn: "Golden shredded pastry filled with fresh Akkawi cheese, drenched in fragrant rose syrup and topped with pistachios",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85",
    categorySlug: "desserts",
    featured: true,
  },
  {
    id: "m8",
    titleAr: "سلطة خضراء طازجة",
    titleEn: "Fresh Garden Salad",
    descriptionAr: "خضار طازجة موسمية مع تتبيلة الليمون وزيت الزيتون، مقدمة مبردة",
    descriptionEn: "Fresh seasonal vegetables with lemon and olive oil dressing, served chilled",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=85",
    categorySlug: "appetizers",
    featured: false,
  },
  {
    id: "m9",
    titleAr: "ساندويتش الدجاج المشوي",
    titleEn: "Grilled Chicken Sandwich",
    descriptionAr: "دجاج مشوي على الفحم في خبز طازج مع المخللات وصلصة الثوم",
    descriptionEn: "Charcoal grilled chicken in fresh bread with pickles and creamy garlic sauce",
    imageUrl: "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=700&q=85",
    categorySlug: "grills",
    featured: false,
  },
];
