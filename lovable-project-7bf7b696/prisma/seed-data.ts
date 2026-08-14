// -----------------------------------------------------------------------------
// Al-Arab Shawarma — Seed Data (Phase 1)
//
// Single source of truth mirrored from the live site's hardcoded content in
// src/routes/index.tsx (MENU, CATEGORIES, ZONES, constants) plus the page
// copy in the same file. Seeds must never alter source data — only recreate
// it in the database.
// -----------------------------------------------------------------------------

export type SeedSize = { label: string; price: number };
export type SeedMenuItem = {
  name: string;
  description: string | null;
  price: number;
  sizes?: SeedSize[];
};
export type SeedCategory = { name: string; items: SeedMenuItem[] };

export const seedData = {
  // The admin password is intentionally NOT stored here. It is read from the
  // ADMIN_PASSWORD environment variable by prisma/seed.ts and hashed with scrypt.
  user: {
    name: "Al-Arab Shawarma Owner",
    email: "owner@al-arbalshawarma.com",
  },

  hero: {
    status: "ACTIVE" as const,
    badgeText: "Delivery All Over Karachi",
    headline: "Al-Arab",
    headlineHighlight: "Shawarma",
    subheadline:
      "Authentic Arabic Shawarma — Fresh & Delicious. Order now and get it hot at your door.",
    arabicTagline: "ذوق العرب الأصيل",
    badgeTitle: "A Legacy of Flavor",
    badgeSubtitle: "Established in 1991 | Registered in 1998",
    ctaPrimaryText: "View Menu",
    ctaPrimaryHref: "#menu",
    ctaSecondaryText: "Order Now",
    ctaSecondaryHref: "#checkout",
    features: [
      { iconKey: "leaf", label: "Fresh Ingredients" },
      { iconKey: "badge-check", label: "Halal Food" },
      { iconKey: "zap", label: "Fast Delivery" },
      { iconKey: "star", label: "Authentic Taste" },
    ],
  },

  about: {
    status: "ACTIVE" as const,
    badgeLabel: "About Al-Arab",
    heading: "Authentic recipes, ",
    headingHighlight: "premium quality",
    body: "At Al-Arab Shawarma, we bring the streets of Arabia to Karachi. From marinated meats slow-roasted on a vertical spit to house-made sauces and fresh-baked bread — every bite is crafted by experienced chefs in a hygienic kitchen using only the freshest ingredients.",
    imageOverlayTitle: "Hand-shaved. Flame-grilled.",
    imageOverlayText: "Slow-roasted on a vertical spit, just like in Arabia.",
    whyUsHeading: "Karachi's ",
    whyUsHeadingHighlight: "Favorite",
    features: [
      { iconKey: "utensils-crossed", label: "Authentic Arabic Recipes" },
      { iconKey: "leaf", label: "Fresh Ingredients Daily" },
      { iconKey: "shield-check", label: "Hygienic Kitchen" },
      { iconKey: "chef-hat", label: "Experienced Chefs" },
    ],
    whyUsFeatures: [
      {
        iconKey: "star",
        label: "Authentic Arabic Taste",
        description: "Recipes straight from the streets of Arabia.",
      },
      { iconKey: "leaf", label: "Fresh Ingredients", description: "Sourced daily, never frozen." },
      {
        iconKey: "gem",
        label: "Premium Quality",
        description: "Made with care, served with pride.",
      },
      {
        iconKey: "shield-check",
        label: "Hygienic Kitchen",
        description: "Spotless prep area, certified clean.",
      },
      { iconKey: "zap", label: "Fast Delivery", description: "Hot at your door across Karachi." },
      {
        iconKey: "tag",
        label: "Affordable Prices",
        description: "Premium taste, honest pricing.",
      },
    ],
  },

  contact: {
    restaurantName: "Al-Arab Shawarma",
    tagline: "Authentic Arabic Taste · Since 1998",
    phoneDisplay: "0333-3686848",
    phoneTel: "+92-333-3686848",
    whatsappNumber: "923333686848",
    address: "Main Sharfabad Signal, Karachi, Pakistan",
    email: null,
    mapsEmbedUrl: "https://www.google.com/maps?q=Sharfabad+Signal,+Karachi,+Pakistan&output=embed",
    mapsDirectionsUrl: "https://www.google.com/maps/search/?api=1&query=Sharfabad+Signal+Karachi",
  },

  openingHours: [
    { type: "restaurant", openTime: "16:00", closeTime: "04:00" },
    { type: "delivery", openTime: "16:00", closeTime: "02:00" },
  ],

  socialLinks: [
    { platform: "facebook", url: "#", iconKey: "facebook" },
    { platform: "instagram", url: "#", iconKey: "instagram" },
    { platform: "whatsapp", url: "https://wa.me/923333686848", iconKey: "message-circle" },
  ],

  seo: {
    title: "Al-Arab Shawarma — Order Authentic Arabic Shawarma in Karachi",
    description:
      "Order fresh Arabic shawarma, wraps, platters & grill from Al-Arab Shawarma, Sharfabad Karachi. Delivery 4 PM – 2 AM all over Karachi. Easy WhatsApp ordering.",
    keywords:
      "Al-Arab Shawarma, shawarma Karachi, Arabic shawarma, wraps, platters, fast food delivery, Sharfabad, order online",
    robotsIndex: true,
    robotsFollow: true,
    ogTitle: "Al-Arab Shawarma — Order Online in Karachi",
    ogDescription: "Authentic Arabic shawarma delivered across Karachi. Order via WhatsApp.",
    twitterCard: "summary_large_image",
    canonicalUrl: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Al-Arab Shawarma",
      servesCuisine: ["Arabic", "Middle Eastern", "Fast Food"],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Main Sharfabad Signal",
        addressLocality: "Karachi",
        addressRegion: "Sindh",
        addressCountry: "PK",
      },
      telephone: "+92-333-3686848",
      openingHours: "Mo-Su 16:00-04:00",
      priceRange: "Rs. 30 – Rs. 1300",
      areaServed: "Karachi",
      hasMap: "https://www.google.com/maps?q=Sharfabad+Signal,+Karachi,+Pakistan",
      acceptsReservations: "False",
    },
  },

  theme: {
    primaryColor: "#39ff14",
    secondaryColor: "#7cff6b",
    accentColor: "#141a14",
    backgroundColor: "#0b0f0b",
    textColor: "#eaf5e7",
    isActive: true,
  },

  payment: {
    easypaisaNumber: "0333-3686848",
    easypaisaTitle: "Sada Haider Haidri",
    bankName: "Faysal Bank",
    bankTitle: "SADA HAIDER HADERI",
    bankIban: "PK86FAYS3574703000003897",
    paymentNote:
      "Please transfer the total amount, take a screenshot of the receipt, and confirm your order. The details will be forwarded directly to our WhatsApp for verification.",
  },

  categories: [
    {
      name: "Shawarma",
      items: [
        {
          name: "Signature 1998 Shawarma",
          description: "Our classic hand-pressed chicken shawarma with house sauce.",
          price: 450,
        },
        {
          name: "Kids Shawarma",
          description: "Smaller, milder shawarma made just for kids.",
          price: 400,
        },
        {
          name: "Hittler Spicy",
          description: "Fiery hot shawarma for true spice lovers.",
          price: 470,
        },
        {
          name: "Chicken Cheese",
          description: "Melted cheese loaded on smoky grilled chicken.",
          price: 530,
        },
        {
          name: "Tortilla Signature",
          description:
            "Crispy tortilla wrap with our signature filling. (If you want the pure Arabic taste)",
          price: 650,
        },
        {
          name: "Tortilla Cocktail",
          description: "Tortilla wrap with a special tangy cocktail twist.",
          price: 650,
        },
        {
          name: "Tortilla Chipotle",
          description: "Smoky chipotle sauce in a toasted tortilla.",
          price: 650,
        },
      ],
    },
    {
      name: "Wraps",
      items: [
        {
          name: "Champion Wrap",
          description: "Loaded champion-size wrap with grilled chicken, zinger fillet & falafel.",
          price: 700,
        },
        {
          name: "Vegetable Wrap",
          description: "Garden-fresh veggies in a soft warm wrap.",
          price: 300,
        },
        {
          name: "Falafel Wrap",
          description: "Crispy falafel with tahini and pickles.",
          price: 400,
        },
        {
          name: "Grill Chicken Cheese Wrap",
          description: "Flame-grilled chicken with melted cheese.",
          price: 700,
        },
        {
          name: "Zinger Crispy Roll",
          description: "Spicy zinger fillet rolled with sauce.",
          price: 500,
        },
      ],
    },
    {
      name: "Platters",
      items: [
        {
          name: "Large Chicken Special",
          description: "Large platter feast — shareable & loaded.",
          price: 1500,
        },
        {
          name: "Medium Chicken Special",
          description: "Perfect medium platter for two.",
          price: 1000,
        },
        {
          name: "Small Chicken Special",
          description: "Solo platter packed with flavor.",
          price: 700,
        },
        {
          name: "Full Falafel Special",
          description: "Full falafel platter with hummus & sauces.",
          price: 1400,
        },
        {
          name: "Half Falafel Special",
          description: "Half falafel platter, big on taste.",
          price: 750,
        },
      ],
    },
    {
      name: "Fast Food",
      items: [
        {
          name: "Al-Arab Grill Burger",
          description: "Juicy flame-grilled chicken burger.",
          price: 549,
        },
        {
          name: "Al-Arab Crispy Burger",
          description: "Golden crispy fried chicken burger.",
          price: 499,
        },
        {
          name: "Crispy Fried Chicken (Chest)",
          description: "Tender crispy fried chicken breast.",
          price: 699,
        },
        {
          name: "Crispy Fried Chicken (Leg)",
          description: "Juicy crispy fried chicken leg piece.",
          price: 699,
        },
      ],
    },
    {
      name: "Wings",
      items: [
        {
          name: "Crispy Wings (10 pcs)",
          description: "Ten crispy wings with dipping sauce.",
          price: 499,
        },
        {
          name: "Al-Arab Spicy Wings (10 pcs)",
          description: "Fiery spiced wings with house dip.",
          price: 550,
        },
      ],
    },
    {
      name: "Fries",
      items: [
        {
          name: "Loaded Fries",
          description: "Fries loaded with cheese sauce, shredded chicken & toppings.",
          price: 650,
        },
        {
          name: "Pizza Fries",
          description: "Fries topped with pizza sauce, mozzarella, olives & capsicum.",
          price: 650,
        },
        {
          name: "Garlic Fries",
          description: "Crispy fries tossed in garlic butter & toum drizzle.",
          price: 350,
        },
        {
          name: "Masala Fries",
          description: "Spicy desi-style masala fries.",
          price: 299,
        },
        {
          name: "Plain Fries",
          description: "Classic golden plain fries.",
          price: 250,
        },
      ],
    },
    {
      name: "Soup",
      items: [
        {
          name: "Chicken Corn Soup",
          description: "Hot creamy chicken & sweet corn soup.",
          price: 290,
        },
        {
          name: "Hot & Sour Soup",
          description: "Tangy spicy hot & sour chicken soup.",
          price: 340,
        },
      ],
    },
    {
      name: "Extras",
      items: [
        { name: "Olive", description: "Fresh marinated olives.", price: 100 },
        { name: "Cheese", description: "Extra slice of melty cheese.", price: 100 },
        { name: "Pita Bread", description: "Fresh-baked Arabic pita.", price: 30 },
        {
          name: "Mini Hummas Pack",
          description: "Small hummus serving with olive oil.",
          price: 150,
        },
        {
          name: "Garlic Sauce Mini Pack",
          description: "Creamy house-made garlic toum, mini.",
          price: 150,
        },
        {
          name: "Hummas Box with 2 Pita",
          description: "Full hummus box with two pita breads.",
          price: 600,
        },
        {
          name: "Garlic Sauce Box",
          description: "Family-size garlic sauce box.",
          price: 600,
        },
        {
          name: "Hummus Dip Sauce",
          description: "Premium creamy hummus dip, ready to scoop.",
          price: 50,
        },
      ],
    },
    {
      name: "Beverages",
      items: [
        {
          name: "Buddy Pack (Pepsi / 7UP / Mirinda / Dew)",
          description: "Chilled buddy-pack soft drink, your choice.",
          price: 100,
        },
        {
          name: "500ml Regular Bottle",
          description: "500ml Pepsi, 7UP, Mirinda or Dew.",
          price: 150,
        },
        {
          name: "1.5L Family Bottle",
          description: "1.5L Pepsi, 7UP, Mirinda or Dew.",
          price: 250,
        },
        {
          name: "Mineral Water (Small)",
          description: "Small bottled mineral water.",
          price: 60,
        },
        {
          name: "Mineral Water (Large)",
          description: "Large bottled mineral water.",
          price: 120,
        },
        {
          name: "Margarita Mint",
          description: "Premium chilled mint margarita-style drink.",
          price: 350,
        },
      ],
    },
    {
      name: "Limca Flavoured Drinks",
      items: [
        {
          name: "Limca Fresh Lemon",
          description: "Zesty lemon-lime flavoured soda.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Ginger",
          description: "Warm, spicy ginger fizz.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Punch Blueberry",
          description: "Berry-punch blueberry burst.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Blueberry",
          description: "Sweet blueberry soda.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Peach",
          description: "Juicy peach-flavoured fizz.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Pakola",
          description: "Classic creamy Pakola flavour.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Pineapple",
          description: "Tropical pineapple soda.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Lychee",
          description: "Floral lychee soda.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Raspberry",
          description: "Tangy raspberry fizz.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Falsa",
          description: "Authentic desi falsa flavour.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
        {
          name: "Limca Cherry",
          description: "Sweet cherry soda.",
          price: 150,
          sizes: [
            { label: "Small", price: 150 },
            { label: "Large", price: 200 },
          ],
        },
      ],
    },
  ] as SeedCategory[],

  zones: [
    {
      name: "Zone A",
      charge: 140,
      areas: [
        "Bahadurabad",
        "Sharfabad",
        "Dawood Society",
        "Kokan Society",
        "C.P Berar",
        "Dhoraji",
        "Darul Aman",
        "Hill Park",
        "Liaqat National",
        "Agha Khan",
      ],
    },
    {
      name: "Zone B",
      charge: 160,
      areas: [
        "P.E.C.H.S Block 2 & 3",
        "Ameer Khusro Road",
        "Chandni Chowk",
        "K.M.C.H.S",
        "Banglow Town A & B",
        "Shabbirabad",
        "Mohammad Ali Society",
        "Adamjee Nagar",
        "Miran Mohammad Shah Road",
        "K.D.A Scheme 1",
      ],
    },
    {
      name: "Zone C",
      charge: 200,
      areas: [
        "P.I.B",
        "Jamshed Road",
        "Khudadad Colony",
        "Muslimabad",
        "Amil Colony",
        "Gurumandir",
        "S.M.C.H.S Block A & B",
        "P.E.C.H.S Block 6",
        "K.E.C.H.S",
        "Falcon Complex",
        "Darwesh Colony",
        "Al Hilal Society",
      ],
    },
    {
      name: "Zone E",
      charge: 250,
      areas: [
        "Lasbela",
        "Garden East",
        "Soldier Bazar",
        "Parsi Colony",
        "Numaish",
        "Lines Area",
        "Jutt Line",
        "Abbesenia",
        "Jackab Line",
        "Jahangir Road",
        "Patel Para",
        "Purani Sabzi Mandi",
        "Gulshan Block 14-17",
        "K.D.A Officer Society",
        "D.O.H.S",
        "A.O.H.S",
        "Bahria University",
        "Liaquatabad Block 5-9",
        "Lalo Khet Daak Khana",
        "Teen Hatti",
        "Mahmoodabad",
        "Essa Nagri",
      ],
    },
    {
      name: "Zone F",
      charge: 350,
      areas: [
        "Liaquatabad Block 1-4 & 10",
        "Gulbahar Colony",
        "Old Rizvia Society",
        "Garden West",
        "Jinnah Hospital",
        "N.H.S",
        "Gulshan-e-Jamal",
        "Gulshan 18 & 19",
        "Qayyumabad",
        "Akhtar Colony",
        "Manzoor Colony",
        "DHA Phase 1 & 2",
      ],
    },
    {
      name: "Zone G",
      charge: 400,
      areas: [
        "Nazimabad All Blocks",
        "Paposh Nagar",
        "Pak Colony",
        "Gul Plaza",
        "Jama Cloth",
        "Saddar",
        "Regal",
        "Zainab Market",
        "Lucky Star",
        "DHA Phase 4",
        "Cantt Station",
        "Civil Line",
        "Faisal Base",
        "Askari 4",
        "Gulistan-e-Johar Block 14-20",
        "Gulshan Block 5-13",
      ],
    },
    {
      name: "Zone H",
      charge: 450,
      areas: [
        "Gulistan-e-Johar 1-13",
        "Gulshan Block 1,2,3",
        "Federal B Area Block 1-10",
        "North Nazimabad All Blocks",
        "I.I. Chundrigar Road",
        "DHA Phase 5 & 7",
        "Clifton Block 7,8,9",
      ],
    },
    {
      name: "Zone I",
      charge: 500,
      areas: [
        "Shadman Town",
        "Buffer Zone",
        "Federal B Area Block 11-22",
        "Gulshan Block 4",
        "Shah Faisal",
        "DHA Phase 6",
        "DHA Phase 8",
        "Clifton Block 1-6",
      ],
    },
  ],
};
