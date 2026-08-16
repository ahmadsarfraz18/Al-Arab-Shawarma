import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import heroImg from "@/assets/hero-shawarma.jpg";
import platterImg from "@/assets/platter.jfif";
import falafelPlatterImg from "@/assets/falafel-platter.jfif";
import burgerGrillImg from "@/assets/burger-grill.jpg";
import burgerCrispyImg from "@/assets/burger-crispy.jpg";

import broastChestImg from "@/assets/broast-chest.jpg";
import broastLegImg from "@/assets/broast-leg.jpg";
import olivesImg from "@/assets/olives.jpg";
import cheeseSliceImg from "@/assets/cheese-slice.jpg";
import spitImg from "@/assets/spit.jpg";
import wingsImg from "@/assets/wings.jpg";
import cornSoupImg from "@/assets/corn-soup.jfif";
import soupImg from "@/assets/soup.jpg";
import pitaFlatbreadStackImg from "@/assets/pita-flatbread-stack.jpg";
import garlicToumWhiteBowlImg from "@/assets/garlic-toum-white-bowl.jpg";
import hummusOliveOilBowlImg from "@/assets/hummus-olive-oil-bowl.jpg";
import beveragesImg from "@/assets/beverages.jpg";
import waterSmallImg from "@/assets/water-500ml.png";
import waterLargeImg from "@/assets/water-1.5-ltr.webp";
import hummusDipImg from "@/assets/hummus-dip.jpg";
import margaritaMintImg from "@/assets/margarita-mint.jpg";
// Limca flavoured drinks
import limcaLemonImg from "@/assets/limca-lemon.jpg";
import limcaGingerImg from "@/assets/limca-ginger.jpg";
import limcaPunchBlueberryImg from "@/assets/limca-punch-blueberry.jpg";
import limcaBlueberryImg from "@/assets/limca-blueberry.jpg";
import limcaPeachImg from "@/assets/limca-peach.jpg";
import limcaPakolaImg from "@/assets/limca-pakola.jpg";
import limcaPineappleImg from "@/assets/limca-pineapple.jpg";
import limcaLycheeImg from "@/assets/limca-lychee.jpg";
import limcaRaspberryImg from "@/assets/limca-raspberry.jpg";
import limcaFalsaImg from "@/assets/limca-falsa.jpg";
import limcaCherryImg from "@/assets/limca-cherry.jpg";
// Shawarma variants
import shawarmaCheeseImg from "@/assets/shawarma-cheese.jpg";
import shawarmaSpicyImg from "@/assets/shawarma-spicy.jpg";
import shawarmaKidsImg from "@/assets/shawarma-kids.jpg";
import tortillaSignatureImg from "@/assets/tortilla-signature.jpg";
import tortillaCocktailImg from "@/assets/tortilla-cocktail.jpg";
import tortillaChipotleImg from "@/assets/tortilla-chipotle.jpg";
// Wraps
import championWrapImg from "@/assets/champion-wrap.jpg";
import veggieWrapImg from "@/assets/veggie-wrap.jpg";
import falafelWrapImg from "@/assets/falafel-wrap.jpg";

import grillCheeseWrapImg from "@/assets/grill-cheese-wrap.jpg";
import zingerRollImg from "@/assets/zinger-roll.jpg";
// Fries
import loadedFriesImg from "@/assets/loaded-fries.jpg";
import pizzaFriesImg from "@/assets/pizza-fries.jpg";
import garlicFriesImg from "@/assets/garlic-fries.jpg";
import masalaFriesImg from "@/assets/masala-fries.jpg";
import plainFriesImg from "@/assets/plain-fries.jpg";
import logoSrc from "@/assets/logo.jfif";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Toaster, toast } from "sonner";

import { getPublicMenu } from "@/lib/api/menu.functions";
import {
  getPublicSeoSettings,
  getPublicSiteSettings,
  type PublicOpeningHours,
} from "@/lib/api/site-settings.functions";
import {
  getPublicSiteContent,
  type PublicAboutContent,
  type PublicHeroContent,
} from "@/lib/api/site-content.functions";
import {
  ALL_AREAS,
  resolveArea,
  suggestAreas,
  type DeliveryArea,
  ZONES,
} from "@/lib/delivery-areas";
import { getPublicDeliveryZones, type PublicDeliveryZone } from "@/lib/api/delivery.functions";
import {
  buildOpeningHoursLd,
  hoursClose,
  hoursFrequencyLabel,
  hoursRange,
  isOpenNow,
} from "@/lib/opening-hours";
import { buildOrderMessage } from "@/lib/order-message";
import { buildThemeCss } from "@/lib/theme";
import { buildHomeSeoHead, FALLBACK_SEO } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-url";

import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  ShoppingBag,
  X,
  Menu,
  Truck,
  Clock as ClockIcon,
  UtensilsCrossed,
  ArrowRight,
  Leaf,
  BadgeCheck,
  Zap,
  Star,
  ShieldCheck,
  ChefHat,
  Search,
  User,
  Phone,
  MapPin,
  Pen,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Info,
  Check,
  Trash2,
  Plus,
  Minus,
  Copy,
  ArrowUp,
  Gem,
  Tag,
  Award,
  MessageCircle,
  Facebook,
  Instagram,
  ArrowRightFromLine,
  Bike,
  Loader,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "fa-user": User,
  "fa-phone": Phone,
  "fa-location-dot": MapPin,
  "fa-clock": ClockIcon,
  "fa-motorcycle": Bike,
  "fa-leaf": Leaf,
  "fa-certificate": BadgeCheck,
  "fa-bolt": Zap,
  "fa-star": Star,
  "fa-utensils": UtensilsCrossed,
  "fa-shield-heart": ShieldCheck,
  "fa-user-chef": ChefHat,
  "fa-gem": Gem,
  "fa-tag": Tag,
  "fa-money-bill-wave": Banknote,
  "fa-mobile-screen": Smartphone,
  "fa-building-columns": Building2,
  "fa-diamond-turn-right": ArrowRightFromLine,
  "fa-map-location-dot": MapPin,
  "fa-pen": Pen,
  // Site content feature icons (iconKey values stored in the database)
  leaf: Leaf,
  "badge-check": BadgeCheck,
  zap: Zap,
  star: Star,
  "utensils-crossed": UtensilsCrossed,
  "shield-check": ShieldCheck,
  "chef-hat": ChefHat,
  gem: Gem,
  tag: Tag,
};

// Social platform → footer icon mapping (mirrors prisma/seed-data.ts iconKeys).
const SOCIAL_PLATFORM_ICONS = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
} as const;

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name];
  if (!Comp) return null;
  return <Comp className={className} />;
}

export const Route = createFileRoute("/")({
  loader: async () => {
    const [settings, content, seo, delivery] = await Promise.all([
      getPublicSiteSettings(),
      getPublicSiteContent(),
      getPublicSeoSettings(),
      getPublicDeliveryZones(),
    ]);
    return { settings, content, seo, delivery, baseUrl: getSiteBaseUrl() };
  },
  head: ({ loaderData }) => {
    const settings = loaderData?.settings;
    const seo = loaderData?.seo ?? FALLBACK_SEO;
    const baseUrl = loaderData?.baseUrl ?? "";
    const restaurant = settings?.openingHours.restaurant ?? FALLBACK_OPENING_HOURS.restaurant;
    const ldOpeningHours = buildOpeningHoursLd(restaurant);
    const themeCss = buildThemeCss(settings?.theme);

    const seoHead = buildHomeSeoHead(
      seo,
      {
        contact: settings?.contact ?? {
          restaurantName: FALLBACK_RESTAURANT_NAME,
          address: FALLBACK_ADDRESS,
          phoneTel: "+92-333-3686848",
        },
        socialLinks: settings?.socialLinks ?? [],
      },
      ldOpeningHours,
      baseUrl,
    );

    return {
      meta: seoHead.meta,
      links: seoHead.links,
      styles: [{ children: themeCss }],
      scripts: seoHead.scripts,
    };
  },
  component: Home,
});

const FALLBACK_WHATSAPP_NUMBER = "923333686848";
const FALLBACK_EASYPAISA_NUMBER = "0333-3686848";
const FALLBACK_EASYPAISA_TITLE = "Sada Haider Haidri";
const FALLBACK_BANK_TITLE = "SADA HAIDER HADERI";
const FALLBACK_BANK_IBAN = "PK86FAYS3574703000003897";
const FALLBACK_BANK_NAME = "Faysal Bank";
const FALLBACK_RESTAURANT_NAME = "Al-Arab Shawarma";
const FALLBACK_TAGLINE = "Authentic Arabic Taste · Since 1998";
const FALLBACK_PHONE_DISPLAY = "0333-3686848";
const FALLBACK_ADDRESS = "Main Sharfabad Signal, Karachi, Pakistan";
const FALLBACK_MAPS_EMBED_URL =
  "https://www.google.com/maps?q=Sharfabad+Signal,+Karachi,+Pakistan&output=embed";
const FALLBACK_MAPS_DIRECTIONS_URL =
  "https://www.google.com/maps/search/?api=1&query=Sharfabad+Signal+Karachi";
const FALLBACK_PAYMENT_NOTE =
  "Please transfer the total amount, take a screenshot of the receipt, and confirm your order. The details will be forwarded directly to our WhatsApp for verification.";

const FALLBACK_OPENING_HOURS: PublicOpeningHours = {
  restaurant: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    type: "restaurant",
    openTime: "16:00",
    closeTime: "04:00",
    isClosed: false,
  })),
  delivery: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    type: "delivery",
    openTime: "16:00",
    closeTime: "02:00",
    isClosed: false,
  })),
};

const FALLBACK_HERO: PublicHeroContent = {
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
};

const FALLBACK_ABOUT: PublicAboutContent = {
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
    {
      iconKey: "leaf",
      label: "Fresh Ingredients",
      description: "Sourced daily, never frozen.",
    },
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
    {
      iconKey: "zap",
      label: "Fast Delivery",
      description: "Hot at your door across Karachi.",
    },
    {
      iconKey: "tag",
      label: "Affordable Prices",
      description: "Premium taste, honest pricing.",
    },
  ],
};

type ItemSize = { label: string; price: number };
type Item = {
  id: string;
  name: string;
  price: number;
  desc: string;
  image: string;
  category: string;
  sizes?: ItemSize[];
};

const LIMCA_SIZES: ItemSize[] = [
  { label: "Small", price: 150 },
  { label: "Large", price: 200 },
];

const MENU: Item[] = [
  // Shawarma
  {
    id: "s1",
    name: "Signature 1998 Shawarma",
    price: 450,
    desc: "Our classic hand-pressed chicken shawarma with house sauce.",
    image: heroImg,
    category: "Shawarma",
  },
  {
    id: "s2",
    name: "Kids Shawarma",
    price: 400,
    desc: "Smaller, milder shawarma made just for kids.",
    image: shawarmaKidsImg,
    category: "Shawarma",
  },
  {
    id: "s3",
    name: "Hittler Spicy",
    price: 470,
    desc: "Fiery hot shawarma for true spice lovers.",
    image: shawarmaSpicyImg,
    category: "Shawarma",
  },
  {
    id: "s4",
    name: "Chicken Cheese",
    price: 530,
    desc: "Melted cheese loaded on smoky grilled chicken.",
    image: shawarmaCheeseImg,
    category: "Shawarma",
  },
  {
    id: "s5",
    name: "Tortilla Signature",
    price: 650,
    desc: "Crispy tortilla wrap with our signature filling. (If you want the pure Arabic taste)",
    image: tortillaSignatureImg,
    category: "Shawarma",
  },
  {
    id: "s6",
    name: "Tortilla Cocktail",
    price: 650,
    desc: "Tortilla wrap with a special tangy cocktail twist.",
    image: tortillaCocktailImg,
    category: "Shawarma",
  },
  {
    id: "s7",
    name: "Tortilla Chipotle",
    price: 650,
    desc: "Smoky chipotle sauce in a toasted tortilla.",
    image: tortillaChipotleImg,
    category: "Shawarma",
  },
  // Wraps / Rolls
  {
    id: "w2",
    name: "Champion Wrap",
    price: 700,
    desc: "Loaded champion-size wrap with grilled chicken, zinger fillet & falafel.",
    image: championWrapImg,
    category: "Wraps",
  },
  {
    id: "w3",
    name: "Vegetable Wrap",
    price: 300,
    desc: "Garden-fresh veggies in a soft warm wrap.",
    image: veggieWrapImg,
    category: "Wraps",
  },
  {
    id: "w4",
    name: "Falafel Wrap",
    price: 400,
    desc: "Crispy falafel with tahini and pickles.",
    image: falafelWrapImg,
    category: "Wraps",
  },
  {
    id: "w6",
    name: "Grill Chicken Cheese Wrap",
    price: 700,
    desc: "Flame-grilled chicken with melted cheese.",
    image: grillCheeseWrapImg,
    category: "Wraps",
  },
  {
    id: "w7",
    name: "Zinger Crispy Roll",
    price: 500,
    desc: "Spicy zinger fillet rolled with sauce.",
    image: zingerRollImg,
    category: "Wraps",
  },
  // Platters
  {
    id: "p1",
    name: "Large Chicken Special",
    price: 1500,
    desc: "Large platter feast — shareable & loaded.",
    image: platterImg,
    category: "Platters",
  },
  {
    id: "p2",
    name: "Medium Chicken Special",
    price: 1000,
    desc: "Perfect medium platter for two.",
    image: platterImg,
    category: "Platters",
  },
  {
    id: "p3",
    name: "Small Chicken Special",
    price: 700,
    desc: "Solo platter packed with flavor.",
    image: platterImg,
    category: "Platters",
  },
  {
    id: "p4",
    name: "Full Falafel Special",
    price: 1400,
    desc: "Full falafel platter with hummus & sauces.",
    image: falafelPlatterImg,
    category: "Platters",
  },
  {
    id: "p5",
    name: "Half Falafel Special",
    price: 750,
    desc: "Half falafel platter, big on taste.",
    image: falafelPlatterImg,
    category: "Platters",
  },
  // Fast Food
  {
    id: "f1",
    name: "Al-Arab Grill Burger",
    price: 549,
    desc: "Juicy flame-grilled chicken burger.",
    image: burgerGrillImg,
    category: "Fast Food",
  },
  {
    id: "f2",
    name: "Al-Arab Crispy Burger",
    price: 499,
    desc: "Golden crispy fried chicken burger.",
    image: burgerCrispyImg,
    category: "Fast Food",
  },
  {
    id: "f6",
    name: "Crispy Fried Chicken (Chest)",
    price: 699,
    desc: "Tender crispy fried chicken breast.",
    image: broastChestImg,
    category: "Fast Food",
  },
  {
    id: "f7",
    name: "Crispy Fried Chicken (Leg)",
    price: 699,
    desc: "Juicy crispy fried chicken leg piece.",
    image: broastLegImg,
    category: "Fast Food",
  },
  // Wings
  {
    id: "wg1",
    name: "Crispy Wings (10 pcs)",
    price: 499,
    desc: "Ten crispy wings with dipping sauce.",
    image: wingsImg,
    category: "Wings",
  },
  {
    id: "wg2",
    name: "Al-Arab Spicy Wings (10 pcs)",
    price: 550,
    desc: "Fiery spiced wings with house dip.",
    image: wingsImg,
    category: "Wings",
  },
  // Fries
  {
    id: "fr1",
    name: "Loaded Fries",
    price: 650,
    desc: "Fries loaded with cheese sauce, shredded chicken & toppings.",
    image: loadedFriesImg,
    category: "Fries",
  },
  {
    id: "fr2",
    name: "Pizza Fries",
    price: 650,
    desc: "Fries topped with pizza sauce, mozzarella, olives & capsicum.",
    image: pizzaFriesImg,
    category: "Fries",
  },
  {
    id: "fr3",
    name: "Garlic Fries",
    price: 350,
    desc: "Crispy fries tossed in garlic butter & toum drizzle.",
    image: garlicFriesImg,
    category: "Fries",
  },
  {
    id: "fr4",
    name: "Masala Fries",
    price: 299,
    desc: "Spicy desi-style masala fries.",
    image: masalaFriesImg,
    category: "Fries",
  },
  {
    id: "fr5",
    name: "Plain Fries",
    price: 250,
    desc: "Classic golden plain fries.",
    image: plainFriesImg,
    category: "Fries",
  },
  // Soup
  {
    id: "sp1",
    name: "Chicken Corn Soup",
    price: 290,
    desc: "Hot creamy chicken & sweet corn soup.",
    image: cornSoupImg,
    category: "Soup",
  },
  {
    id: "sp2",
    name: "Hot & Sour Soup",
    price: 340,
    desc: "Tangy spicy hot & sour chicken soup.",
    image: soupImg,
    category: "Soup",
  },
  // Extras
  {
    id: "e1",
    name: "Olive",
    price: 100,
    desc: "Fresh marinated olives.",
    image: olivesImg,
    category: "Extras",
  },
  {
    id: "e2",
    name: "Cheese",
    price: 100,
    desc: "Extra slice of melty cheese.",
    image: cheeseSliceImg,
    category: "Extras",
  },
  {
    id: "e3",
    name: "Pita Bread",
    price: 30,
    desc: "Fresh-baked Arabic pita.",
    image: pitaFlatbreadStackImg,
    category: "Extras",
  },
  {
    id: "e4",
    name: "Mini Hummas Pack",
    price: 150,
    desc: "Small hummus serving with olive oil.",
    image: hummusOliveOilBowlImg,
    category: "Extras",
  },
  {
    id: "e5",
    name: "Garlic Sauce Mini Pack",
    price: 150,
    desc: "Creamy house-made garlic toum, mini.",
    image: garlicToumWhiteBowlImg,
    category: "Extras",
  },
  {
    id: "e6",
    name: "Hummas Box with 2 Pita",
    price: 600,
    desc: "Full hummus box with two pita breads.",
    image: hummusOliveOilBowlImg,
    category: "Extras",
  },
  {
    id: "e7",
    name: "Garlic Sauce Box",
    price: 600,
    desc: "Family-size garlic sauce box.",
    image: garlicToumWhiteBowlImg,
    category: "Extras",
  },
  {
    id: "e8",
    name: "Hummus Dip Sauce",
    price: 50,
    desc: "Premium creamy hummus dip, ready to scoop.",
    image: hummusDipImg,
    category: "Extras",
  },
  // Beverages
  {
    id: "b1",
    name: "Buddy Pack (Pepsi / 7UP / Mirinda / Dew)",
    price: 100,
    desc: "Chilled buddy-pack soft drink, your choice.",
    image: beveragesImg,
    category: "Beverages",
  },
  {
    id: "b2",
    name: "500ml Regular Bottle",
    price: 150,
    desc: "500ml Pepsi, 7UP, Mirinda or Dew.",
    image: beveragesImg,
    category: "Beverages",
  },
  {
    id: "b3",
    name: "1.5L Family Bottle",
    price: 250,
    desc: "1.5L Pepsi, 7UP, Mirinda or Dew.",
    image: beveragesImg,
    category: "Beverages",
  },
  {
    id: "b4",
    name: "Mineral Water (Small)",
    price: 60,
    desc: "Small bottled mineral water.",
    image: waterSmallImg,
    category: "Beverages",
  },
  {
    id: "b5",
    name: "Mineral Water (Large)",
    price: 120,
    desc: "Large bottled mineral water.",
    image: waterLargeImg,
    category: "Beverages",
  },
  {
    id: "b6",
    name: "Margarita Mint",
    price: 350,
    desc: "Premium chilled mint margarita-style drink.",
    image: margaritaMintImg,
    category: "Beverages",
  },
  // Limca Flavoured Drinks
  {
    id: "l1",
    name: "Limca Fresh Lemon",
    price: 150,
    desc: "Zesty lemon-lime flavoured soda.",
    image: limcaLemonImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l2",
    name: "Limca Ginger",
    price: 150,
    desc: "Warm, spicy ginger fizz.",
    image: limcaGingerImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l3",
    name: "Limca Punch Blueberry",
    price: 150,
    desc: "Berry-punch blueberry burst.",
    image: limcaPunchBlueberryImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l4",
    name: "Limca Blueberry",
    price: 150,
    desc: "Sweet blueberry soda.",
    image: limcaBlueberryImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l5",
    name: "Limca Peach",
    price: 150,
    desc: "Juicy peach-flavoured fizz.",
    image: limcaPeachImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l6",
    name: "Limca Pakola",
    price: 150,
    desc: "Classic creamy Pakola flavour.",
    image: limcaPakolaImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l7",
    name: "Limca Pineapple",
    price: 150,
    desc: "Tropical pineapple soda.",
    image: limcaPineappleImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l8",
    name: "Limca Lychee",
    price: 150,
    desc: "Floral lychee soda.",
    image: limcaLycheeImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l9",
    name: "Limca Raspberry",
    price: 150,
    desc: "Tangy raspberry fizz.",
    image: limcaRaspberryImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l10",
    name: "Limca Falsa",
    price: 150,
    desc: "Authentic desi falsa flavour.",
    image: limcaFalsaImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
  {
    id: "l11",
    name: "Limca Cherry",
    price: 150,
    desc: "Sweet cherry soda.",
    image: limcaCherryImg,
    category: "Limca Flavoured Drinks",
    sizes: LIMCA_SIZES,
  },
];

const CATEGORIES = [
  "All",
  "Shawarma",
  "Wraps",
  "Platters",
  "Fast Food",
  "Wings",
  "Fries",
  "Soup",
  "Extras",
  "Beverages",
  "Limca Flavoured Drinks",
];

// Maps a menu item's name to its existing static artwork. The public menu is
// served from the database, and images are matched by name so database-driven
// items keep their original photos (new items fall back to the hero image).
const IMAGE_BY_NAME = new Map<string, string>(MENU.map((m) => [m.name, m.image]));

type CartLine = { item: Item; size?: string; qty: number; key: string };
type PaymentMethod = "cod" | "easypaisa" | "bank";

function fmt(n: number) {
  return "Rs. " + n.toLocaleString("en-PK");
}

function lineUnitPrice(item: Item, size?: string): number {
  if (!item.sizes) return item.price;
  return item.sizes.find((s) => s.label === size)?.price ?? item.sizes[0]?.price ?? item.price;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  phone: z.string().min(1, "Phone is required").max(20),
  address: z.string().min(1, "Address is required").max(300),
  notes: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof formSchema>;

function Home() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<{
    label: string;
    zone: string;
    charge: number;
  } | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [txnRef, setTxnRef] = useState("");
  const [showTop, setShowTop] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  // Client-only "open right now" indicator (Pakistan time). null during SSR /
  // first paint so hydration output is identical to the server render.
  const [openNow, setOpenNow] = useState<boolean | null>(null);

  // Serve the menu from the database so admin changes reflect publicly.
  // Falls back to the built-in MENU while loading or if the DB is unreachable.
  const liveMenuQuery = useQuery({
    queryKey: ["public-menu"],
    queryFn: () => getPublicMenu(),
    staleTime: 60_000,
  });

  const {
    settings: ssrSettings,
    content: ssrContent,
    delivery: ssrDelivery,
  } = Route.useLoaderData();

  const siteSettingsQuery = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: () => getPublicSiteSettings(),
    initialData: ssrSettings,
    staleTime: 60_000,
  });

  const siteContentQuery = useQuery({
    queryKey: ["public-site-content"],
    queryFn: () => getPublicSiteContent(),
    initialData: ssrContent,
    staleTime: 60_000,
  });

  // Serve delivery zones/areas from the database (admin-managed). The built-in
  // ZONES/ALL_AREAS remain only as a fallback while loading or when no zone is
  // configured yet — matching logic is unchanged.
  const deliveryQuery = useQuery({
    queryKey: ["public-delivery-zones"],
    queryFn: () => getPublicDeliveryZones(),
    initialData: ssrDelivery,
    staleTime: 60_000,
  });

  const deliveryZones: PublicDeliveryZone[] | typeof ZONES =
    deliveryQuery.data && deliveryQuery.data.zones.length > 0 ? deliveryQuery.data.zones : ZONES;
  const deliveryAreas: DeliveryArea[] =
    deliveryQuery.data && deliveryQuery.data.areas.length > 0
      ? deliveryQuery.data.areas
      : ALL_AREAS;

  const siteContent = siteContentQuery.data;
  const hero = siteContent?.hero ?? FALLBACK_HERO;
  const about = siteContent?.about ?? FALLBACK_ABOUT;

  const siteSettings = siteSettingsQuery.data;
  const theme = siteSettings?.theme;
  const whatsappNumber = siteSettings?.contact.whatsappNumber ?? FALLBACK_WHATSAPP_NUMBER;
  const socialLinks = siteSettings?.socialLinks ?? [];
  const easypaisaNumber = siteSettings?.payment.easypaisaNumber ?? FALLBACK_EASYPAISA_NUMBER;
  const easypaisaTitle = siteSettings?.payment.easypaisaTitle ?? FALLBACK_EASYPAISA_TITLE;
  const bankName = siteSettings?.payment.bankName ?? FALLBACK_BANK_NAME;
  const bankTitle = siteSettings?.payment.bankTitle ?? FALLBACK_BANK_TITLE;
  const bankIban = siteSettings?.payment.bankIban ?? FALLBACK_BANK_IBAN;
  const paymentNote = siteSettings?.payment.paymentNote ?? FALLBACK_PAYMENT_NOTE;
  const phoneDisplay = siteSettings?.contact.phoneDisplay ?? FALLBACK_PHONE_DISPLAY;
  const address = siteSettings?.contact.address ?? FALLBACK_ADDRESS;
  const mapsEmbedUrl = siteSettings?.contact.mapsEmbedUrl ?? FALLBACK_MAPS_EMBED_URL;
  const mapsDirectionsUrl = siteSettings?.contact.mapsDirectionsUrl ?? FALLBACK_MAPS_DIRECTIONS_URL;
  const restaurantName = siteSettings?.contact.restaurantName ?? FALLBACK_RESTAURANT_NAME;
  const tagline = siteSettings?.contact.tagline ?? FALLBACK_TAGLINE;

  const restaurantHours =
    siteSettings?.openingHours.restaurant ?? FALLBACK_OPENING_HOURS.restaurant;
  const deliveryHours = siteSettings?.openingHours.delivery ?? FALLBACK_OPENING_HOURS.delivery;

  const restaurantOpen = restaurantHours.some((s) => !s.isClosed);
  const deliveryOpen = deliveryHours.some((s) => !s.isClosed);
  const heroOpenLabel = restaurantOpen
    ? `Open ${hoursRange(restaurantHours, false)}`
    : "Currently Closed";
  const deliveryTillLabel = deliveryOpen
    ? `Delivery till ${hoursClose(deliveryHours, false)}`
    : "Delivery unavailable";
  const deliverySummary = deliveryOpen
    ? `${hoursFrequencyLabel(deliveryHours)} ${hoursRange(deliveryHours, true)} · Area-wise charges below.`
    : "Delivery currently unavailable · Area-wise charges below.";
  const restaurantHoursLabel = hoursRange(restaurantHours, true);
  const deliveryHoursLabel = hoursRange(deliveryHours, true);
  const restaurantFrequency = hoursFrequencyLabel(restaurantHours);
  const deliveryFrequency = hoursFrequencyLabel(deliveryHours);
  const footerHoursLabel = hoursRange(restaurantHours, false);
  const footerDeliveryLabel = deliveryOpen
    ? `Delivery till ${hoursClose(deliveryHours, false)}`
    : "Delivery unavailable";

  useEffect(() => {
    const refresh = () => setOpenNow(isOpenNow(restaurantHours));
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [restaurantHours]);

  const menuItems: Item[] = useMemo(() => {
    const live = liveMenuQuery.data;
    if (!live || live.categories.length === 0) return MENU;
    return live.categories.flatMap((cat) =>
      cat.items.map((it) => ({
        id: `db-${it.id}`,
        name: it.name,
        price: it.basePrice,
        desc: it.description ?? "",
        image: IMAGE_BY_NAME.get(it.name) ?? heroImg,
        category: cat.name,
        sizes: it.variants.length
          ? it.variants.map((v) => ({ label: v.label, price: v.price }))
          : undefined,
      })),
    );
  }, [liveMenuQuery.data]);

  const categories: string[] = useMemo(() => {
    const live = liveMenuQuery.data;
    if (!live || live.categories.length === 0) return CATEGORIES;
    return ["All", ...live.categories.map((c) => c.name)];
  }, [liveMenuQuery.data]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone: "", address: "", notes: "" },
  });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copy = (text: string, label: string) => {
    const done = () => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    };
    const promise = navigator.clipboard?.writeText(text);
    if (promise) {
      promise.then(done);
    } else {
      done();
    }
  };

  const resolveItem = useCallback(
    (id: string): Item | undefined =>
      menuItems.find((m) => m.id === id) ?? MENU.find((m) => m.id === id),
    [menuItems],
  );

  const lines: CartLine[] = useMemo(() => {
    const result: CartLine[] = [];
    for (const [key, qty] of Object.entries(cart)) {
      const sep = key.indexOf("|");
      const id = sep === -1 ? key : key.slice(0, sep);
      const size = sep === -1 ? undefined : key.slice(sep + 1);
      const item = resolveItem(id);
      if (item) result.push({ key, item, size, qty });
    }
    return result;
  }, [cart, resolveItem]);
  const itemCount = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + lineUnitPrice(l.item, l.size) * l.qty, 0);
  const delivery = selectedArea?.charge ?? 0;
  const grand = subtotal + delivery;

  const filtered = menuItems.filter(
    (m) =>
      (category === "All" || m.category === category) &&
      (search === "" || m.name.toLowerCase().includes(search.toLowerCase())),
  );

  // Suggestions resolve typed blocks against their grouped range on the fly
  // (e.g. "Clifton Block 4" -> "Clifton Block 4" · "Clifton Block 1-6" · Zone I).
  const suggestions = suggestAreas(deliveryAreas, areaQuery);

  const add = (key: string) => setCart((c) => ({ ...c, [key]: (c[key] || 0) + 1 }));
  const dec = (key: string) =>
    setCart((c) => {
      const n = (c[key] || 0) - 1;
      const next = { ...c };
      if (n <= 0) delete next[key];
      else next[key] = n;
      return next;
    });
  const remove = (key: string) =>
    setCart((c) => {
      const n = { ...c };
      delete n[key];
      return n;
    });

  const paymentLabel: Record<PaymentMethod, string> = {
    cod: "Cash on Delivery",
    easypaisa: `Easypaisa Transfer (${easypaisaNumber} — ${easypaisaTitle})`,
    bank: `Bank Transfer — ${bankName} · ${bankTitle} · IBAN ${bankIban}`,
  };

  const onOrder = (data: FormValues) => {
    if (!selectedArea) {
      toast.error("Please select a delivery area");
      return;
    }
    if (lines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (payment !== "cod" && !txnRef.trim()) {
      toast.error("Please enter the transaction ID / reference to confirm your payment");
      return;
    }
    setOrdering(true);
    const itemsTxt = lines
      .map(
        (l) =>
          `• ${l.qty} × ${l.item.name}${l.size ? ` (${l.size})` : ""} — ${fmt(lineUnitPrice(l.item, l.size) * l.qty)}`,
      )
      .join("\n");
    const payNote =
      payment === "cod"
        ? ""
        : `\n_Please share the payment screenshot here on WhatsApp for verification._`;
    const msg = buildOrderMessage({
      customer: data.name,
      phone: data.phone,
      areaLabel: selectedArea.label,
      address: data.address,
      notes: data.notes,
      items: itemsTxt,
      subtotal,
      delivery,
      grand,
      paymentLabel: paymentLabel[payment],
      transactionRef: payment === "cod" ? undefined : txnRef.trim(),
      paymentNote: payNote,
    });
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
    let opened = false;
    try {
      opened = !!window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      opened = false;
    }
    if (!opened) {
      setOrdering(false);
      toast.warning(
        "Pop-up blocked by the browser — please allow pop-ups for WhatsApp, or place the order manually.",
      );
    } else {
      setOrdering(false);
    }
    setConfirmOpen(true);
  };

  const navLinks = [
    { h: "#home", l: "Home" },
    { h: "#about", l: "About" },
    { h: "#menu", l: "Menu" },
    { h: "#delivery", l: "Delivery" },
    { h: "#location", l: "Location" },
    { h: "#contact", l: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style data-theme>{buildThemeCss(theme)}</style>
      <Toaster position="top-center" richColors closeButton />

      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            <a href="#home" className="flex min-w-0 items-center gap-4">
              <img
                src={logoSrc}
                alt={`${restaurantName} logo`}
                className="h-10 sm:h-11 w-auto aspect-square shrink-0 rounded-full object-cover ring-2 ring-gold/60 shadow-brand bg-ink"
                loading="lazy"
              />
              <span className="min-w-0 flex flex-col justify-center leading-none">
                <span className="block truncate font-display text-lg sm:text-xl font-extrabold leading-tight">
                  <Brand name={restaurantName} />
                </span>
                <span className="mt-1 hidden sm:block truncate text-[10px] uppercase tracking-[0.2em] text-gold/80 font-semibold">
                  {tagline}
                </span>
              </span>
            </a>
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-foreground/80">
              {navLinks.map((n) => (
                <a key={n.h} href={n.h} className="hover:text-brand transition-colors">
                  {n.l}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-brand hover:scale-105 transition-transform"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 px-1 place-items-center rounded-full bg-gold text-gold-foreground text-[11px] font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileNav(!mobileNav)}
                className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border"
                aria-label="Menu"
              >
                {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {mobileNav && (
            <div className="lg:hidden pb-4 grid gap-1">
              {navLinks.map((n) => (
                <a
                  key={n.h}
                  href={n.h}
                  onClick={() => setMobileNav(false)}
                  className="px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium"
                >
                  {n.l}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Fresh Arabic shawarma served by Al-Arab Shawarma"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.05_0.02_145_/_0.75)_100%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[88svh] sm:min-h-[92vh] flex items-center">
          <div className="max-w-2xl py-14 sm:py-20 lg:py-24 text-left text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur-sm">
              <Truck className="h-3.5 w-3.5" /> {hero.badgeText}
            </span>
            <h1 className="mt-4 sm:mt-6 font-display text-4xl font-black leading-[1.05] sm:text-7xl lg:text-8xl">
              {hero.headline}
              {hero.headlineHighlight ? (
                <span className="block text-gradient-gold">{hero.headlineHighlight}</span>
              ) : null}
            </h1>
            <p className="mt-3 sm:mt-5 text-base sm:text-xl text-white/85 max-w-xl">
              {hero.subheadline}
            </p>
            {hero.arabicTagline ? (
              <p className="mt-1.5 sm:mt-2 font-arabic text-xl sm:text-2xl text-gold/90" dir="rtl">
                {hero.arabicTagline}
              </p>
            ) : null}

            {/* Heritage Badge */}
            <div className="mt-4 sm:mt-6 inline-flex items-center gap-3 rounded-2xl border border-gold/50 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent px-4 py-2.5 sm:px-5 sm:py-3 backdrop-blur-sm shadow-gold-glow">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-gold" />
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-[0.28em] text-gold/80 font-semibold">
                  {hero.badgeTitle}
                </div>
                <div className="font-display text-sm sm:text-lg font-black text-gradient-gold">
                  {hero.badgeSubtitle
                    ? hero.badgeSubtitle.split(/\s*\|\s*/).map((part, i) => (
                        <span key={`${part}-${i}`}>
                          {i > 0 && <span className="text-white/60 font-normal mx-1">|</span>}
                          {part}
                        </span>
                      ))
                    : null}
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-wrap gap-3 text-xs sm:text-sm text-white/85">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${
                    openNow === null
                      ? "bg-white/40"
                      : openNow
                        ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"
                        : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.9)]"
                  }`}
                />
                <ClockIcon className="h-3.5 w-3.5 text-gold" /> {heroOpenLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                <Bike className="h-3.5 w-3.5 text-gold" /> {deliveryTillLabel}
              </span>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
              <a
                href={hero.ctaPrimaryHref ?? "#menu"}
                className="group inline-flex items-center gap-3 rounded-full bg-gold px-6 py-3.5 text-sm font-bold text-gold-foreground shadow-gold-glow hover:scale-105 transition-transform sm:px-7 sm:py-4 sm:text-base"
              >
                <UtensilsCrossed className="h-5 w-5" /> {hero.ctaPrimaryText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={hero.ctaSecondaryHref ?? "#checkout"}
                className="inline-flex items-center gap-3 rounded-full border-2 border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white hover:text-brand transition-colors sm:px-7 sm:py-4 sm:text-base"
              >
                <ShoppingBag className="h-5 w-5" /> {hero.ctaSecondaryText}
              </a>
            </div>

            <div className="mt-6 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-xl">
              {hero.features.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur border border-white/10"
                >
                  <Icon name={b.iconKey} className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs font-semibold">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-16 lg:py-24 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-card-soft aspect-[4/3]">
            <img
              src={spitImg}
              alt="Shawarma roasting on a vertical spit at Al-Arab Shawarma in Karachi"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="font-display text-3xl font-bold">{about.imageOverlayTitle}</div>
              <div className="text-sm opacity-80">{about.imageOverlayText}</div>
            </div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">
              {about.badgeLabel}
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black text-foreground">
              {about.heading}
              {about.headingHighlight ? (
                <span className="text-gradient-gold">{about.headingHighlight}</span>
              ) : null}
            </h2>
            <p className="mt-4 text-foreground/75 text-base sm:text-lg leading-relaxed">
              {about.body}
            </p>
            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-4">
              {about.features.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border shadow-card-soft"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
                    <Icon name={f.iconKey} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 text-sm font-semibold leading-snug">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-16 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">
              Our Menu
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black">
              Crafted with <span className="text-gradient-gold">Real Arabic</span> Soul
            </h2>
            <p className="mt-4 text-muted-foreground">
              Add items to your cart and check out in seconds.
            </p>
          </div>

          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    category === c
                      ? "bg-gradient-brand text-brand-foreground border-transparent shadow-brand"
                      : "bg-card text-foreground border-border hover:border-brand/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu…"
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-card border border-border focus:border-brand focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="mt-6 sm:mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MenuCard
                key={m.id}
                item={m}
                getQty={(k) => cart[k] || 0}
                onAdd={(k) => add(k)}
                onDec={(k) => dec(k)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERY */}
      <section id="delivery" className="py-16 lg:py-24 bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold">Delivery</span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black">
              Delivery <span className="text-gradient-gold">All Over Karachi</span>
            </h2>
            <p className="mt-4 text-cream/70">
              {deliverySummary} <span className="text-gold">Emaar is not included.</span>
            </p>
          </div>

          <div className="mt-8 sm:mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {deliveryZones.map((z) => (
              <div
                key={z.name}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-gold/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-gold">{z.name}</span>
                  <span className="text-sm font-bold rounded-full bg-gold text-gold-foreground px-3 py-1">
                    {fmt(z.charge)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-cream/65 leading-relaxed line-clamp-4">
                  {z.areas.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHECKOUT */}
      <section id="checkout" className="py-16 lg:py-24 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">
              Checkout
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black text-foreground">
              Complete Your <span className="text-gradient-gold">Order</span>
            </h2>
          </div>

          <div className="mt-8 sm:mt-12 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-8">
              <div className="rounded-3xl bg-card p-6 sm:p-8 shadow-card-soft border border-border">
                <h3 className="font-display text-2xl font-bold">Delivery Details</h3>
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name" icon="fa-user">
                    <input
                      {...register("name")}
                      className={`field ${errors.name ? "field-error" : ""}`}
                      placeholder="Ahmed Ali"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </Field>
                  <Field label="Mobile Number" icon="fa-phone">
                    <input
                      {...register("phone")}
                      className={`field ${errors.phone ? "field-error" : ""}`}
                      placeholder="03XX-XXXXXXX"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </Field>
                  <div className="sm:col-span-2 relative">
                    <Field label="Delivery Area" icon="fa-location-dot">
                      <input
                        value={areaQuery}
                        onChange={(e) => {
                          const q = e.target.value;
                          setAreaQuery(q);
                          setSelectedArea(resolveArea(deliveryAreas, q));
                          setAreaOpen(q.trim() !== "");
                        }}
                        onFocus={() => setAreaOpen(true)}
                        onBlur={() => setAreaOpen(false)}
                        className="field"
                        placeholder="Search your area…"
                      />
                    </Field>
                    {areaOpen && (
                      <div className="absolute z-10 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-2xl bg-card border border-border shadow-card-soft">
                        {suggestions.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            No matching area. We may not deliver here.
                          </div>
                        ) : (
                          suggestions.map((a) => (
                            <button
                              key={a.area}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedArea({
                                  label: a.label,
                                  zone: a.zone,
                                  charge: a.charge,
                                });
                                setAreaQuery(a.label);
                                setAreaOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-muted flex items-center justify-between gap-3"
                            >
                              <span className="text-sm font-medium">{a.label}</span>
                              <span className="text-xs text-muted-foreground text-right shrink-0">
                                {a.label !== a.area ? `${a.area} · ` : ""}
                                {a.zone} · {fmt(a.charge)}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Complete Address" icon="fa-map-location-dot">
                      <textarea
                        {...register("address")}
                        className={`field min-h-20 ${errors.address ? "field-error" : ""}`}
                        placeholder="House #, street, landmark"
                      />
                      {errors.address && (
                        <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
                      )}
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Order Notes (optional)" icon="fa-pen">
                      <textarea
                        {...register("notes")}
                        className="field min-h-16"
                        placeholder="Extra sauce, no onions, etc."
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* PAYMENT */}
              <div className="rounded-3xl bg-card p-6 sm:p-8 shadow-card-soft border border-border">
                <h3 className="font-display text-2xl font-bold flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-brand" /> Payment Method
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose how you'd like to pay. Online payment details below.
                </p>

                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  {[
                    { id: "cod" as const, t: "Cash on Delivery", Icon: Banknote },
                    { id: "easypaisa" as const, t: "Easypaisa", Icon: Smartphone },
                    { id: "bank" as const, t: "Bank Transfer", Icon: Building2 },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPayment(p.id)}
                      className={`text-left rounded-2xl p-4 border-2 transition-all ${
                        payment === p.id
                          ? "border-brand bg-brand/5 shadow-brand"
                          : "border-border hover:border-brand/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-10 w-10 place-items-center rounded-xl ${payment === p.id ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-foreground"}`}
                        >
                          <p.Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="font-bold text-sm">{p.t}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {p.id === "cod"
                              ? "Pay rider in cash"
                              : p.id === "easypaisa"
                                ? "Mobile wallet"
                                : "QR / IBAN"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {payment === "easypaisa" && (
                  <div className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5">
                    <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
                      <Smartphone className="h-4 w-4" /> Easypaisa Details
                    </div>
                    <div className="mt-4 space-y-3">
                      <CopyRow
                        label="Account Number"
                        value={easypaisaNumber}
                        onCopy={() => copy(easypaisaNumber, "easy-num")}
                        copied={copied === "easy-num"}
                        mono
                      />
                      <CopyRow
                        label="Account Title"
                        value={easypaisaTitle}
                        onCopy={() => copy(easypaisaTitle, "easy-t")}
                        copied={copied === "easy-t"}
                      />
                    </div>
                    <PaymentNote note={paymentNote} />
                  </div>
                )}

                {payment === "bank" && (
                  <div className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5">
                    <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
                      <Building2 className="h-4 w-4" /> Bank Transfer Details
                    </div>
                    <div className="mt-4 grid sm:grid-cols-[auto_1fr] gap-5 items-start">
                      <div className="mx-auto sm:mx-0">
                        <div className="rounded-2xl bg-white p-4 border-4 border-brand shadow-brand">
                          <QRCodeSVG
                            value={`Bank: ${bankName}\nTitle: ${bankTitle}\nIBAN: ${bankIban}`}
                            size={192}
                            level="H"
                            marginSize={0}
                            bgColor="#ffffff"
                            fgColor="#000000"
                          />
                        </div>
                        <div className="mt-2 text-center text-[11px] text-muted-foreground">
                          Scan to pay
                        </div>
                      </div>
                      <div className="space-y-3">
                        <CopyRow
                          label="Bank Name"
                          value={bankName}
                          onCopy={() => copy(bankName, "bn")}
                          copied={copied === "bn"}
                        />
                        <CopyRow
                          label="Account Title"
                          value={bankTitle}
                          onCopy={() => copy(bankTitle, "bt")}
                          copied={copied === "bt"}
                        />
                        <CopyRow
                          label="IBAN"
                          value={bankIban}
                          onCopy={() => copy(bankIban, "iban")}
                          copied={copied === "iban"}
                          mono
                        />
                      </div>
                    </div>
                    <PaymentNote note={paymentNote} />
                  </div>
                )}

                {payment !== "cod" && (
                  <div className="mt-6 rounded-2xl border border-brand/40 bg-brand/5 p-5">
                    <div className="flex items-center gap-2 text-brand font-bold text-sm uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" /> Payment Confirmation
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      After you've made the transfer, enter the transaction ID / reference shown in
                      your payment app so we can verify the order.
                    </p>
                    <label className="mt-4 block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                        Transaction ID / Reference <span className="text-destructive">*</span>
                      </span>
                      <input
                        type="text"
                        value={txnRef}
                        onChange={(e) => setTxnRef(e.target.value)}
                        placeholder="e.g. 1234567890 (from your payment app)"
                        className="field mt-2"
                        autoComplete="off"
                      />
                    </label>
                    <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      Please also share the payment screenshot here on WhatsApp for verification.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="lg:col-span-2 rounded-3xl bg-ink text-cream p-6 sm:p-8 shadow-card-soft sticky top-24 self-start">
              <h3 className="font-display text-2xl font-bold">Order Summary</h3>
              {lines.length === 0 ? (
                <p className="mt-6 text-cream/60 text-sm">
                  Your cart is empty. Add items from the menu.
                </p>
              ) : (
                <ul className="mt-5 space-y-3 max-h-60 overflow-auto pr-1">
                  {lines.map((l) => (
                    <li key={l.key} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="text-gold font-bold">{l.qty}×</span> {l.item.name}
                        {l.size ? ` · ${l.size}` : ""}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {fmt(lineUnitPrice(l.item, l.size) * l.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 border-t border-white/10 pt-4 space-y-2 text-sm">
                <Row k="Subtotal" v={fmt(subtotal)} />
                <Row
                  k={`Delivery${selectedArea ? ` · ${selectedArea.zone}` : ""}`}
                  v={selectedArea ? fmt(delivery) : "—"}
                />
                <Row
                  k="Payment"
                  v={
                    payment === "cod"
                      ? "Cash on Delivery"
                      : payment === "easypaisa"
                        ? "Easypaisa"
                        : "Bank Transfer"
                  }
                />
                <div className="flex justify-between pt-3 border-t border-white/10 text-lg">
                  <span className="font-bold">Grand Total</span>
                  <span className="font-display font-black text-gold">{fmt(grand)}</span>
                </div>
              </div>
              <button
                onClick={handleSubmit(onOrder)}
                disabled={ordering || (payment !== "cod" && !txnRef.trim())}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp py-4 font-bold text-white hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed shadow-2xl"
              >
                {ordering ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
                {ordering ? "Sending..." : "Confirm via WhatsApp"}
              </button>
              <p className="mt-3 text-xs text-cream/60 text-center">
                {payment !== "cod" && !txnRef.trim()
                  ? "Enter your transaction ID / reference above to enable the order button."
                  : "No app needed. Order confirmation via WhatsApp."}
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">
              Why Choose Us
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black">
              {about.whyUsHeading}
              {about.whyUsHeadingHighlight ? (
                <span className="text-gradient-gold">{about.whyUsHeadingHighlight}</span>
              ) : null}
            </h2>
          </div>
          <div className="mt-8 sm:mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {about.whyUsFeatures.map((f) => (
              <div
                key={f.label}
                className="rounded-2xl bg-card border border-border p-6 shadow-card-soft hover:shadow-brand hover:-translate-y-1 transition-all"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-brand-foreground shadow-brand">
                  <Icon name={f.iconKey} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold sm:text-xl">{f.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section id="location" className="py-16 lg:py-24 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">
              Visit Us
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black text-foreground">
              Find Al-Arab in <span className="text-gradient-gold">Karachi</span>
            </h2>
          </div>
          <div className="mt-8 sm:mt-14 grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[
                { Icon: MapPin, t: "Our Address", v: address },
                {
                  Icon: ClockIcon,
                  t: "Restaurant Hours",
                  v: `${restaurantHoursLabel} · ${restaurantFrequency}`,
                },
                {
                  Icon: Bike,
                  t: "Delivery Hours",
                  v: `${deliveryHoursLabel} · ${deliveryFrequency}`,
                },
                { Icon: Phone, t: "Call Us", v: phoneDisplay },
              ].map((c) => (
                <div
                  key={c.t}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card-soft hover:border-brand/40 transition-colors"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-brand-foreground shadow-brand">
                    <c.Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {c.t}
                    </div>
                    <div className="mt-1 font-semibold text-foreground">{c.v}</div>
                  </div>
                </div>
              ))}
              <a
                href={mapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 font-bold text-gold-foreground shadow-gold-glow hover:scale-[1.02] transition-transform"
              >
                <ArrowRightFromLine className="h-4 w-4" /> Get Directions
              </a>
            </div>
            <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-border shadow-card-soft min-h-[400px]">
              <iframe
                title={`${restaurantName} Map`}
                src={mapsEmbedUrl}
                className="w-full h-full min-h-[400px]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 lg:py-24 bg-ink text-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold">Contact</span>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-black">
              Get in <span className="text-gradient-gold">Touch</span>
            </h2>
          </div>
          <div className="mt-8 sm:mt-12 grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <ContactRow Icon={Phone} t="Phone" v={phoneDisplay} />
              <ContactRow Icon={MapPin} t="Address" v={address} />
              <ContactRow
                Icon={ClockIcon}
                t="Hours"
                v={`${restaurantHoursLabel} ${restaurantFrequency}`}
              />
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-4 font-bold text-white hover:scale-[1.01] transition-transform"
              >
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </a>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const msg = `*Contact from Website*\n\nName: ${f.get("name")}\nPhone: ${f.get("phone")}\nMessage: ${f.get("message")}`;
                window.open(
                  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`,
                  "_blank",
                );
              }}
              className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4"
            >
              <input
                name="name"
                required
                maxLength={80}
                placeholder="Your name"
                className="field-dark"
              />
              <input
                name="phone"
                required
                maxLength={20}
                placeholder="Phone number"
                className="field-dark"
              />
              <textarea
                name="message"
                required
                maxLength={500}
                placeholder="Your message"
                className="field-dark min-h-28"
              />
              <button className="w-full rounded-full bg-gradient-brand py-3.5 font-bold text-brand-foreground hover:opacity-95">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background border-t border-border pt-12 lg:pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt={`${restaurantName} logo`}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/60 bg-ink"
                loading="lazy"
              />
              <div>
                <div className="font-display text-2xl font-extrabold">
                  <Brand name={restaurantName} />
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {tagline}
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm text-muted-foreground">
              Bringing the streets of Arabia to Karachi — one fresh shawarma at a time. Halal,
              handcrafted, and hot off the grill.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {navLinks.map((n) => (
                <li key={n.h}>
                  <a className="hover:text-brand" href={n.h}>
                    {n.l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg">Delivery & Hours</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <MapPin className="h-3.5 w-3.5 inline text-brand mr-2" />
                {address}
              </li>
              <li>
                <ClockIcon className="h-3.5 w-3.5 inline text-brand mr-2" />
                {footerHoursLabel}
              </li>
              <li>
                <Bike className="h-3.5 w-3.5 inline text-brand mr-2" />
                {footerDeliveryLabel}
              </li>
              <li>
                <Phone className="h-3.5 w-3.5 inline text-brand mr-2" />
                {phoneDisplay}
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              {socialLinks.map((s) => {
                const Icon = SOCIAL_PLATFORM_ICONS[s.platform];
                if (!Icon) return null;
                const href = s.url.trim();
                if (!href || href === "#") return null;
                return (
                  <a
                    key={s.platform}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${s.platform} link`}
                    className="grid h-10 w-10 place-items-center rounded-full bg-muted hover:bg-gold hover:text-gold-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-8 lg:mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground space-y-1.5">
          <div>© {new Date().getFullYear()} Al-Arab Shawarma. All rights reserved.</div>
          <div>
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 text-muted-foreground/70 hover:text-brand transition-colors"
            >
              <ShieldCheck className="h-3 w-3" />
              Admin Portal
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-4">
            <span>Developed with ❤️ by</span>
            <span className="font-semibold text-foreground/80">Mahar Ahmad Sarfraz</span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span>Contact:</span>
            <a
              href="tel:03121281814"
              className="font-semibold text-foreground/80 hover:text-brand transition-colors"
            >
              0312-1281814
            </a>
          </div>
        </div>
      </footer>

      {/* CART DRAWER */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full max-w-md p-0 flex flex-col [&>button:first-child]:hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <SheetTitle className="font-display text-2xl font-bold">
              Your Cart <span className="text-muted-foreground text-base">({itemCount})</span>
            </SheetTitle>
            <SheetClose className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted cursor-pointer">
              <X className="h-5 w-5" />
            </SheetClose>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-3">
            {lines.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">Your cart is empty.</p>
                <SheetClose className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand text-brand-foreground px-5 py-2.5 text-sm font-semibold">
                  Browse menu
                </SheetClose>
              </div>
            ) : (
              lines.map((l) => (
                <div key={l.key} className="flex gap-3 rounded-2xl border border-border p-3">
                  <img
                    src={l.item.image}
                    alt={l.item.name}
                    className="h-16 w-16 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="font-semibold truncate">
                        {l.item.name}
                        {l.size ? ` · ${l.size}` : ""}
                      </div>
                      <button
                        onClick={() => remove(l.key)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-brand font-bold mt-1">
                      {fmt(lineUnitPrice(l.item, l.size))}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <QtyControl qty={l.qty} onAdd={() => add(l.key)} onDec={() => dec(l.key)} />
                      <div className="font-bold">{fmt(lineUnitPrice(l.item, l.size) * l.qty)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {lines.length > 0 && (
            <div className="p-5 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{fmt(subtotal)}</span>
              </div>
              <a
                href="#checkout"
                onClick={() => setCartOpen(false)}
                className="block text-center rounded-full bg-gradient-brand text-brand-foreground py-3.5 font-bold shadow-brand hover:scale-[1.02] transition-transform"
              >
                Checkout — {fmt(subtotal)}
              </a>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CONFIRMATION */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="grid h-20 w-20 mx-auto place-items-center rounded-full bg-whatsapp text-white">
              <Check className="h-8 w-8" />
            </div>
            <DialogTitle className="font-display text-3xl font-bold text-center mt-5">
              Order Sent!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center mt-2">
              Your order has been opened in WhatsApp. Hit send to confirm and we'll get it on the
              grill.
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => {
              setConfirmOpen(false);
              setCart({});
            }}
            className="w-full rounded-full bg-gradient-brand text-brand-foreground py-3.5 font-bold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </DialogContent>
      </Dialog>

      {/* FLOATING BUTTONS */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-2xl hover:scale-110 transition-transform animate-float"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full ring-4 ring-whatsapp/40 animate-ping" />
      </a>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-ink text-cream shadow-2xl hover:scale-110 transition-transform"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function MenuCard({
  item,
  getQty,
  onAdd,
  onDec,
}: {
  item: Item;
  getQty: (key: string) => number;
  onAdd: (key: string) => void;
  onDec: (key: string) => void;
}) {
  const [size, setSize] = useState<string | undefined>(item.sizes?.[0]?.label);
  const key = item.id + (size ? `|${size}` : "");
  const qty = getQty(key);

  return (
    <article className="group flex flex-col rounded-3xl bg-card border border-border shadow-card-soft overflow-hidden hover:shadow-brand hover:-translate-y-1 transition-all">
      <div className="relative h-48 overflow-hidden bg-muted/50">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 rounded-full bg-ink/70 text-cream text-[10px] uppercase tracking-wider px-2.5 py-1 backdrop-blur">
          {item.category}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-gold text-gold-foreground font-bold text-sm px-3 py-1 shadow-gold-glow">
          {item.sizes ? `From ${fmt(item.sizes[0].price)}` : fmt(item.price)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold sm:text-xl">{item.name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{item.desc}</p>
        {item.sizes && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.sizes.map((s) => (
              <button
                key={s.label}
                onClick={() => setSize(s.label)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-all ${
                  size === s.label
                    ? "bg-gradient-brand text-brand-foreground border-transparent shadow-brand"
                    : "bg-card text-foreground border-border hover:border-brand/40"
                }`}
              >
                {s.label} · {fmt(s.price)}
              </button>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {qty > 0 ? (
            <QtyControl qty={qty} onAdd={() => onAdd(key)} onDec={() => onDec(key)} />
          ) : (
            <span className="text-xs text-muted-foreground">Tap to add</span>
          )}
          <button
            onClick={() => onAdd(key)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-brand text-brand-foreground px-4 py-3 text-sm font-bold shadow-brand hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

function QtyControl({ qty, onAdd, onDec }: { qty: number; onAdd: () => void; onDec: () => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background">
      <button onClick={onDec} className="grid h-9 w-9 place-items-center hover:text-brand">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center font-bold">{qty}</span>
      <button onClick={onAdd} className="grid h-9 w-9 place-items-center hover:text-brand">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Icon name={icon} className="h-3.5 w-3.5 text-brand" /> {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-cream/70 min-w-0 truncate">{k}</span>
      <span className="font-semibold text-right shrink-0">{v}</span>
    </div>
  );
}

function ContactRow({
  Icon: IconComp,
  t,
  v,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  t: string;
  v: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground">
        <IconComp className="h-5 w-5" />
      </span>
      <div>
        <div className="text-xs uppercase tracking-wider text-cream/60">{t}</div>
        <div className="mt-1 font-semibold">{v}</div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-background/80 border border-border p-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </div>
        <div
          className={`mt-0.5 truncate font-bold text-foreground ${mono ? "font-mono text-sm tracking-tight" : "text-sm"}`}
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
          copied
            ? "bg-whatsapp text-white"
            : "bg-gradient-brand text-brand-foreground hover:scale-105"
        }`}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function splitBrand(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { first: name, rest: "" };
  return { first: parts[0], rest: parts.slice(1).join(" ") };
}

function Brand({ name }: { name: string }) {
  const { first, rest } = splitBrand(name);
  return (
    <>
      {first} {rest ? <span className="text-gradient-gold">{rest}</span> : null}
    </>
  );
}

function PaymentNote({ note }: { note: string }) {
  return (
    <p className="mt-4 text-xs leading-relaxed text-foreground/75 rounded-lg bg-background/60 border border-border p-3">
      <Info className="h-3.5 w-3.5 inline text-brand mr-1.5" />
      {note}
    </p>
  );
}
