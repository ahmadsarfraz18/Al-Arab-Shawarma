import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import heroImg from "@/assets/hero-shawarma.jpg";
import platterLargeChickenImg from "@/assets/platter-large-chicken.jpg";
import platterMediumChickenImg from "@/assets/platter-medium-chicken.jpg";
import platterSmallChickenImg from "@/assets/platter-small-chicken.jpg";
import platterFalafelFullImg from "@/assets/platter-falafel-full.jpg";
import platterFalafelHalfImg from "@/assets/platter-falafel-half.jpg";
import burgerGrillImg from "@/assets/burger-grill.jpg";
import burgerCrispyImg from "@/assets/burger-crispy.jpg";

import dynamiteChickenImg from "@/assets/dynamite-chicken.jpg";
import broastChestImg from "@/assets/broast-chest.jpg";
import broastLegImg from "@/assets/broast-leg.jpg";
import olivesImg from "@/assets/olives.jpg";
import cheeseSliceImg from "@/assets/cheese-slice.jpg";
import spitImg from "@/assets/spit.jpg";
import wingsImg from "@/assets/wings.jpg";
import soupImg from "@/assets/soup.jpg";
import pitaFlatbreadStackImg from "@/assets/pita-flatbread-stack.jpg";
import garlicToumWhiteBowlImg from "@/assets/garlic-toum-white-bowl.jpg";
import hummusOliveOilBowlImg from "@/assets/hummus-olive-oil-bowl.jpg";
import beveragesImg from "@/assets/beverages.jpg";
import waterSmallImg from "@/assets/water-small.jpg";
import waterLargeImg from "@/assets/water-large.jpg";
// Shawarma variants
import shawarmaCheeseImg from "@/assets/shawarma-cheese.jpg";
import shawarmaSpicyImg from "@/assets/shawarma-spicy.jpg";
import shawarmaKidsImg from "@/assets/shawarma-kids.jpg";
import tortillaSignatureImg from "@/assets/tortilla-signature.jpg";
import tortillaCocktailImg from "@/assets/tortilla-cocktail.jpg";
import tortillaChipotleImg from "@/assets/tortilla-chipotle.jpg";
// Wraps
import fishWrapImg from "@/assets/fish-wrap.jpg";
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
import logoAsset from "@/assets/logo.jpeg.asset.json";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Al-Arab Shawarma — Order Authentic Arabic Shawarma in Karachi" },
      {
        name: "description",
        content:
          "Order fresh Arabic shawarma, wraps, platters & grill from Al-Arab Shawarma, Sharfabad Karachi. Delivery 4 PM – 2 AM all over Karachi. Easy WhatsApp ordering.",
      },
      { property: "og:title", content: "Al-Arab Shawarma — Order Online in Karachi" },
      { property: "og:description", content: "Authentic Arabic shawarma delivered across Karachi. Order via WhatsApp." },
      { property: "og:image", content: heroImg },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: "Al-Arab Shawarma",
          servesCuisine: ["Arabic", "Middle Eastern", "Fast Food"],
          address: {
            "@type": "PostalAddress",
            streetAddress: "Main Sharfabad Signal",
            addressLocality: "Karachi",
            addressCountry: "PK",
          },
          telephone: "+92-333-3686848",
          openingHours: "Mo-Su 16:00-04:00",
          priceRange: "Rs. 30 – Rs. 1300",
        }),
      },
    ],
  }),
  component: Home,
});

const WHATSAPP_NUMBER = "923333686848";
const TAX_RATE = 0.15;
const EASYPAISA_NUMBER = "0333-3686848";
const EASYPAISA_TITLE = "Sada Haider Haidri";
const BANK_TITLE = "SADA HAIDER HADERI";
const BANK_IBAN = "PK86FAYS3574703000003897";
const BANK_NAME = "Faysal Bank";

type Item = { id: string; name: string; price: number; desc: string; image: string; category: string };

const MENU: Item[] = [
  // Shawarma
  { id: "s1", name: "Signature 1998 Shawarma", price: 450, desc: "Our classic hand-pressed chicken shawarma with house sauce.", image: heroImg, category: "Shawarma" },
  { id: "s2", name: "Kids Shawarma", price: 400, desc: "Smaller, milder shawarma made just for kids.", image: shawarmaKidsImg, category: "Shawarma" },
  { id: "s3", name: "Hittler Spicy", price: 470, desc: "Fiery hot shawarma for true spice lovers.", image: shawarmaSpicyImg, category: "Shawarma" },
  { id: "s4", name: "Chicken Cheese", price: 530, desc: "Melted cheese loaded on smoky grilled chicken.", image: shawarmaCheeseImg, category: "Shawarma" },
  { id: "s5", name: "Tortilla Signature", price: 650, desc: "Crispy tortilla wrap with our signature filling. (If you want the pure Arabic taste)", image: tortillaSignatureImg, category: "Shawarma" },
  { id: "s6", name: "Tortilla Cocktail", price: 650, desc: "Tortilla wrap with a special tangy cocktail twist.", image: tortillaCocktailImg, category: "Shawarma" },
  { id: "s7", name: "Tortilla Chipotle", price: 650, desc: "Smoky chipotle sauce in a toasted tortilla.", image: tortillaChipotleImg, category: "Shawarma" },
  // Wraps / Rolls
  { id: "w1", name: "Fish Wrap", price: 650, desc: "Crispy fish fillet wrapped with tangy slaw.", image: fishWrapImg, category: "Wraps" },
  { id: "w2", name: "Champion Wrap", price: 700, desc: "Loaded champion-size wrap with grilled chicken, zinger fillet & falafel.", image: championWrapImg, category: "Wraps" },
  { id: "w3", name: "Vegetable Wrap", price: 300, desc: "Garden-fresh veggies in a soft warm wrap.", image: veggieWrapImg, category: "Wraps" },
  { id: "w4", name: "Falafel Wrap", price: 400, desc: "Crispy falafel with tahini and pickles.", image: falafelWrapImg, category: "Wraps" },

  { id: "w6", name: "Grill Chicken Cheese Wrap", price: 700, desc: "Flame-grilled chicken with melted cheese.", image: grillCheeseWrapImg, category: "Wraps" },
  { id: "w7", name: "Zinger Crispy Roll", price: 500, desc: "Spicy zinger fillet rolled with sauce.", image: zingerRollImg, category: "Wraps" },
  // Platters
  { id: "p1", name: "Large Chicken Special", price: 1500, desc: "Large platter feast — shareable & loaded.", image: platterLargeChickenImg, category: "Platters" },
  { id: "p2", name: "Medium Chicken Special", price: 1000, desc: "Perfect medium platter for two.", image: platterMediumChickenImg, category: "Platters" },
  { id: "p3", name: "Small Chicken Special", price: 700, desc: "Solo platter packed with flavor.", image: platterSmallChickenImg, category: "Platters" },
  { id: "p4", name: "Full Falafel Special", price: 1400, desc: "Full falafel platter with hummus & sauces.", image: platterFalafelFullImg, category: "Platters" },
  { id: "p5", name: "Half Falafel Special", price: 750, desc: "Half falafel platter, big on taste.", image: platterFalafelHalfImg, category: "Platters" },
  // Fast Food
  { id: "f1", name: "Al-Arab Grill Burger", price: 549, desc: "Juicy flame-grilled chicken burger.", image: burgerGrillImg, category: "Fast Food" },
  { id: "f2", name: "Al-Arab Crispy Burger", price: 499, desc: "Golden crispy fried chicken burger.", image: burgerCrispyImg, category: "Fast Food" },
  { id: "f5", name: "Dinamite Chicken", price: 600, desc: "Spicy crispy dynamite chicken bites.", image: dynamiteChickenImg, category: "Fast Food" },
  { id: "f6", name: "Crispy Fried Chicken (Chest)", price: 699, desc: "Tender crispy fried chicken breast.", image: broastChestImg, category: "Fast Food" },
  { id: "f7", name: "Crispy Fried Chicken (Leg)", price: 699, desc: "Juicy crispy fried chicken leg piece.", image: broastLegImg, category: "Fast Food" },
  // Wings
  { id: "wg1", name: "Crispy Wings (10 pcs)", price: 499, desc: "Ten crispy wings with dipping sauce.", image: wingsImg, category: "Wings" },
  { id: "wg2", name: "Al-Arab Spicy Wings (10 pcs)", price: 550, desc: "Fiery spiced wings with house dip.", image: wingsImg, category: "Wings" },
  // Fries
  { id: "fr1", name: "Loaded Fries", price: 749, desc: "Fries loaded with cheese sauce, shredded chicken & toppings.", image: loadedFriesImg, category: "Fries" },
  { id: "fr2", name: "Pizza Fries", price: 749, desc: "Fries topped with pizza sauce, mozzarella, olives & capsicum.", image: pizzaFriesImg, category: "Fries" },
  { id: "fr3", name: "Garlic Fries", price: 350, desc: "Crispy fries tossed in garlic butter & toum drizzle.", image: garlicFriesImg, category: "Fries" },
  { id: "fr4", name: "Masala Fries", price: 299, desc: "Spicy desi-style masala fries.", image: masalaFriesImg, category: "Fries" },
  { id: "fr5", name: "Plain Fries", price: 250, desc: "Classic golden plain fries.", image: plainFriesImg, category: "Fries" },
  // Soup
  { id: "sp1", name: "Chicken Corn Soup", price: 290, desc: "Hot creamy chicken & sweet corn soup.", image: soupImg, category: "Soup" },
  { id: "sp2", name: "Hot & Sour Soup", price: 340, desc: "Tangy spicy hot & sour chicken soup.", image: soupImg, category: "Soup" },
  // Extras
  { id: "e1", name: "Olive", price: 100, desc: "Fresh marinated olives.", image: olivesImg, category: "Extras" },
  { id: "e2", name: "Cheese", price: 100, desc: "Extra slice of melty cheese.", image: cheeseSliceImg, category: "Extras" },
  { id: "e3", name: "Pita Bread", price: 30, desc: "Fresh-baked Arabic pita.", image: pitaFlatbreadStackImg, category: "Extras" },
  { id: "e4", name: "Mini Hummas Pack", price: 150, desc: "Small hummus serving with olive oil.", image: hummusOliveOilBowlImg, category: "Extras" },
  { id: "e5", name: "Garlic Sauce Mini Pack", price: 150, desc: "Creamy house-made garlic toum, mini.", image: garlicToumWhiteBowlImg, category: "Extras" },
  { id: "e6", name: "Hummas Box with 2 Pita", price: 600, desc: "Full hummus box with two pita breads.", image: hummusOliveOilBowlImg, category: "Extras" },
  { id: "e7", name: "Garlic Sauce Box", price: 600, desc: "Family-size garlic sauce box.", image: garlicToumWhiteBowlImg, category: "Extras" },
  // Beverages
  { id: "b1", name: "Buddy Pack (Pepsi / 7UP / Mirinda / Dew)", price: 100, desc: "Chilled buddy-pack soft drink, your choice.", image: beveragesImg, category: "Beverages" },
  { id: "b2", name: "500ml Regular Bottle", price: 150, desc: "500ml Pepsi, 7UP, Mirinda or Dew.", image: beveragesImg, category: "Beverages" },
  { id: "b3", name: "1.5L Family Bottle", price: 250, desc: "1.5L Pepsi, 7UP, Mirinda or Dew.", image: beveragesImg, category: "Beverages" },
  { id: "b4", name: "Mineral Water (Small)", price: 60, desc: "Small bottled mineral water.", image: waterSmallImg, category: "Beverages" },
  { id: "b5", name: "Mineral Water (Large)", price: 120, desc: "Large bottled mineral water.", image: waterLargeImg, category: "Beverages" },
];

const CATEGORIES = ["All", "Shawarma", "Wraps", "Platters", "Fast Food", "Wings", "Fries", "Soup", "Extras", "Beverages"];

type Zone = { name: string; charge: number; areas: string[] };
const ZONES: Zone[] = [
  { name: "Zone A", charge: 140, areas: ["Bahadurabad","Sharfabad","Dawood Society","Kokan Society","C.P Berar","Dhoraji","Darul Aman","Hill Park","Liaqat National","Agha Khan"] },
  { name: "Zone B", charge: 160, areas: ["P.E.C.H.S Block 2 & 3","Ameer Khusro Road","Chandni Chowk","K.M.C.H.S","Banglow Town A & B","Shabbirabad","Mohammad Ali Society","Adamjee Nagar","Miran Mohammad Shah Road","K.D.A Scheme 1"] },
  { name: "Zone C", charge: 200, areas: ["P.I.B","Jamshed Road","Khudadad Colony","Muslimabad","Amil Colony","Gurumandir","S.M.C.H.S Block A & B","P.E.C.H.S Block 6","K.E.C.H.S","Falcon Complex","Darwesh Colony","Al Hilal Society"] },
  { name: "Zone E", charge: 250, areas: ["Lasbela","Garden East","Soldier Bazar","Parsi Colony","Numaish","Lines Area","Jutt Line","Abbesenia","Jackab Line","Jahangir Road","Patel Para","Purani Sabzi Mandi","Gulshan Block 14-17","K.D.A Officer Society","D.O.H.S","A.O.H.S","Bahria University","Liaquatabad Block 5-9","Lalo Khet Daak Khana","Teen Hatti","Mahmoodabad","Essa Nagri"] },
  { name: "Zone F", charge: 350, areas: ["Liaquatabad Block 1-4 & 10","Gulbahar Colony","Old Rizvia Society","Garden West","Jinnah Hospital","N.H.S","Gulshan-e-Jamal","Gulshan 18 & 19","Qayyumabad","Akhtar Colony","Manzoor Colony","DHA Phase 1 & 2"] },
  { name: "Zone G", charge: 400, areas: ["Nazimabad All Blocks","Paposh Nagar","Pak Colony","Gul Plaza","Jama Cloth","Saddar","Regal","Zainab Market","Lucky Star","DHA Phase 4","Cantt Station","Civil Line","Faisal Base","Askari 4","Gulistan-e-Johar Block 14-20","Gulshan Block 5-13"] },
  { name: "Zone H", charge: 450, areas: ["Gulistan-e-Johar 1-13","Gulshan Block 1,2,3","Federal B Area Block 1-10","North Nazimabad All Blocks","I.I. Chundrigar Road","DHA Phase 5 & 7","Clifton Block 7,8,9"] },
  { name: "Zone I", charge: 500, areas: ["Shadman Town","Buffer Zone","Federal B Area Block 11-22","Gulshan Block 4","Shah Faisal","DHA Phase 6","DHA Phase 8","Clifton Block 1-6"] },
];

const ALL_AREAS = ZONES.flatMap((z) => z.areas.map((a) => ({ area: a, zone: z.name, charge: z.charge })));

type CartLine = { item: Item; qty: number };
type PaymentMethod = "cod" | "easypaisa" | "bank";

function fmt(n: number) {
  return "Rs. " + n.toLocaleString("en-PK");
}

function Home() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<{ area: string; zone: string; charge: number } | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [showTop, setShowTop] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const lines: CartLine[] = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ item: MENU.find((m) => m.id === id)!, qty })).filter((l) => l.item),
    [cart],
  );
  const itemCount = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.item.price * l.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const delivery = selectedArea?.charge ?? 0;
  const grand = subtotal + tax + delivery;

  const filtered = MENU.filter(
    (m) =>
      (category === "All" || m.category === category) &&
      (search === "" || m.name.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredAreas = areaQuery
    ? ALL_AREAS.filter((a) => a.area.toLowerCase().includes(areaQuery.toLowerCase())).slice(0, 8)
    : ALL_AREAS.slice(0, 8);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id: string) =>
    setCart((c) => {
      const n = (c[id] || 0) - 1;
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });
  const remove = (id: string) =>
    setCart((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });

  const paymentLabel: Record<PaymentMethod, string> = {
    cod: "Cash on Delivery",
    easypaisa: `Easypaisa Transfer (${EASYPAISA_NUMBER} — ${EASYPAISA_TITLE})`,
    bank: `Bank Transfer — ${BANK_NAME} · ${BANK_TITLE} · IBAN ${BANK_IBAN}`,
  };

  const placeOrder = () => {
    if (!form.name.trim() || !form.phone.trim() || !selectedArea || !form.address.trim() || lines.length === 0) {
      alert("Please complete your name, phone, delivery area, address, and add items to your cart.");
      return;
    }
    const itemsTxt = lines.map((l) => `• ${l.qty} × ${l.item.name} — ${fmt(l.item.price * l.qty)}`).join("\n");
    const payNote = payment === "cod"
      ? ""
      : `\n_Please share the payment screenshot here on WhatsApp for verification._`;
    const msg = `*Al-Arab Shawarma — New Order*\n\n*Customer:* ${form.name}\n*Phone:* ${form.phone}\n*Area:* ${selectedArea.area} (${selectedArea.zone})\n*Address:* ${form.address}\n${form.notes ? `*Notes:* ${form.notes}\n` : ""}\n*Items:*\n${itemsTxt}\n\n*Subtotal:* ${fmt(subtotal)}\n*Sales Tax (15%):* ${fmt(tax)}\n*Delivery:* ${fmt(delivery)}\n*Grand Total:* ${fmt(grand)}\n\n*Payment Method:* ${paymentLabel[payment]}${payNote}\n\nThank you!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
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
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            <a href="#home" className="flex min-w-0 items-center gap-4">
              <img
                src={logoAsset.url}
                alt="Al-Arab Shawarma logo"
                className="h-10 sm:h-11 w-auto aspect-square shrink-0 rounded-full object-cover ring-2 ring-gold/60 shadow-brand bg-ink"
              />
              <span className="min-w-0 flex flex-col justify-center leading-none">
                <span className="block truncate font-display text-lg sm:text-xl font-extrabold leading-tight">
                  Al-Arab <span className="text-gradient-gold">Shawarma</span>
                </span>
                <span className="mt-1 hidden sm:block text-[10px] uppercase tracking-[0.2em] text-gold/80 font-semibold">
                  Authentic Arabic · Since 1998
                </span>
              </span>
            </a>
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-foreground/80">
              {navLinks.map((n) => (
                <a key={n.h} href={n.h} className="hover:text-brand transition-colors">{n.l}</a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-brand hover:scale-105 transition-transform"
              >
                <i className="fa-solid fa-bag-shopping" />
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
                <i className={`fa-solid ${mobileNav ? "fa-xmark" : "fa-bars"}`} />
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
          <img src={heroImg} alt="Arabic shawarma" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.08_0.02_30_/_0.75)_100%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[92vh] flex items-center">
          <div className="max-w-2xl py-24 text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur-sm">
              <i className="fa-solid fa-truck-fast" /> Delivery All Over Karachi
            </span>
            <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] sm:text-7xl lg:text-8xl">
              Al-Arab
              <span className="block text-gradient-gold">Shawarma</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/85 max-w-xl">
              Authentic Arabic Shawarma — Fresh & Delicious. Order now and get it hot at your door.
            </p>
            <p className="mt-2 font-arabic text-2xl text-gold/90" dir="rtl">ذوق العرب الأصيل</p>

            {/* Heritage Badge */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-gold/50 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent px-5 py-3 backdrop-blur-sm shadow-gold-glow">
              <i className="fa-solid fa-award text-gold text-2xl" />
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-[0.28em] text-gold/80 font-semibold">A Legacy of Flavor</div>
                <div className="font-display text-base sm:text-lg font-black text-gradient-gold">
                  Established in 1991 <span className="text-white/60 font-normal mx-1">|</span> Registered in 1998
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/85">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur"><i className="fa-solid fa-clock text-gold" /> Open 4 PM – 4 AM</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur"><i className="fa-solid fa-motorcycle text-gold" /> Delivery till 2 AM</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#menu" className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-base font-bold text-gold-foreground shadow-gold-glow hover:scale-105 transition-transform">
                <i className="fa-solid fa-utensils" /> View Menu
                <i className="fa-solid fa-arrow-right transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#checkout" className="inline-flex items-center gap-3 rounded-full border-2 border-white/30 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur-sm hover:bg-white hover:text-brand transition-colors">
                <i className="fa-solid fa-bag-shopping" /> Order Now
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
              {[
                { i: "fa-leaf", t: "Fresh Ingredients" },
                { i: "fa-certificate", t: "Halal Food" },
                { i: "fa-bolt", t: "Fast Delivery" },
                { i: "fa-star", t: "Authentic Taste" },
              ].map((b) => (
                <div key={b.t} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur border border-white/10">
                  <i className={`fa-solid ${b.i} text-gold`} />
                  <span className="text-xs font-semibold">{b.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-card-soft aspect-[4/3]">
            <img src={spitImg} alt="Live shawarma spit" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="font-display text-3xl font-bold">Hand-shaved. Flame-grilled.</div>
              <div className="text-sm opacity-80">Slow-roasted on a vertical spit, just like in Arabia.</div>
            </div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">About Al-Arab</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black text-ink">
              Authentic recipes, <span className="text-gradient-gold">premium quality</span>
            </h2>
            <p className="mt-5 text-foreground/75 text-lg leading-relaxed">
              At Al-Arab Shawarma, we bring the streets of Arabia to Karachi. From marinated meats slow-roasted on a vertical spit to house-made sauces and fresh-baked bread — every bite is crafted by experienced chefs in a hygienic kitchen using only the freshest ingredients.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { i: "fa-utensils", t: "Authentic Arabic Recipes" },
                { i: "fa-leaf", t: "Fresh Ingredients Daily" },
                { i: "fa-shield-heart", t: "Hygienic Kitchen" },
                { i: "fa-user-chef", t: "Experienced Chefs" },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border shadow-card-soft">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-brand text-brand-foreground"><i className={`fa-solid ${f.i}`} /></span>
                  <span className="text-sm font-semibold">{f.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">Our Menu</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black">
              Crafted with <span className="text-gradient-gold">Real Arabic</span> Soul
            </h2>
            <p className="mt-4 text-muted-foreground">Add items to your cart and check out in seconds.</p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
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
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu…"
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-card border border-border focus:border-brand focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MenuCard key={m.id} item={m} qty={cart[m.id] || 0} onAdd={() => add(m.id)} onDec={() => dec(m.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERY */}
      <section id="delivery" className="py-24 bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold">Delivery</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black">
              Delivery <span className="text-gradient-gold">All Over Karachi</span>
            </h2>
            <p className="mt-4 text-cream/70">Daily 4:00 PM – 2:00 AM · Area-wise charges below. <span className="text-gold">Emaar is not included.</span></p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ZONES.map((z) => (
              <div key={z.name} className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-gold/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-gold">{z.name}</span>
                  <span className="text-sm font-bold rounded-full bg-gold text-gold-foreground px-3 py-1">{fmt(z.charge)}</span>
                </div>
                <p className="mt-3 text-xs text-cream/65 leading-relaxed line-clamp-4">{z.areas.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHECKOUT */}
      <section id="checkout" className="py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">Checkout</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black text-ink">
              Complete Your <span className="text-gradient-gold">Order</span>
            </h2>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-8">
              <div className="rounded-3xl bg-card p-6 sm:p-8 shadow-card-soft border border-border">
                <h3 className="font-display text-2xl font-bold">Delivery Details</h3>
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name" icon="fa-user">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" placeholder="Ahmed Ali" maxLength={80} />
                  </Field>
                  <Field label="Mobile Number" icon="fa-phone">
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" placeholder="03XX-XXXXXXX" maxLength={20} />
                  </Field>
                  <div className="sm:col-span-2 relative">
                    <Field label="Delivery Area" icon="fa-location-dot">
                      <input
                        value={selectedArea ? `${selectedArea.area} — ${selectedArea.zone} (${fmt(selectedArea.charge)})` : areaQuery}
                        onChange={(e) => { setAreaQuery(e.target.value); setSelectedArea(null); setAreaOpen(true); }}
                        onFocus={() => setAreaOpen(true)}
                        className="field"
                        placeholder="Search your area…"
                      />
                    </Field>
                    {areaOpen && (
                      <div className="absolute z-10 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-2xl bg-card border border-border shadow-card-soft">
                        {filteredAreas.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">No matching area. We may not deliver here.</div>
                        ) : (
                          filteredAreas.map((a) => (
                            <button
                              key={a.area}
                              onClick={() => { setSelectedArea(a); setAreaQuery(""); setAreaOpen(false); }}
                              className="w-full text-left px-4 py-3 hover:bg-muted flex items-center justify-between"
                            >
                              <span className="text-sm font-medium">{a.area}</span>
                              <span className="text-xs text-muted-foreground">{a.zone} · {fmt(a.charge)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Complete Address" icon="fa-map-location-dot">
                      <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field min-h-20" placeholder="House #, street, landmark" maxLength={300} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Order Notes (optional)" icon="fa-pen">
                      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field min-h-16" placeholder="Extra sauce, no onions, etc." maxLength={300} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* PAYMENT */}
              <div className="rounded-3xl bg-card p-6 sm:p-8 shadow-card-soft border border-border">
                <h3 className="font-display text-2xl font-bold flex items-center gap-3">
                  <i className="fa-solid fa-credit-card text-brand" /> Payment Method
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">Choose how you'd like to pay. Online payment details below.</p>

                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  {([
                    { id: "cod" as const, t: "Cash on Delivery", i: "fa-money-bill-wave" },
                    { id: "easypaisa" as const, t: "Easypaisa", i: "fa-mobile-screen" },
                    { id: "bank" as const, t: "Bank Transfer", i: "fa-building-columns" },
                  ]).map((p) => (
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
                        <span className={`grid h-10 w-10 place-items-center rounded-xl ${payment === p.id ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-foreground"}`}>
                          <i className={`fa-solid ${p.i}`} />
                        </span>
                        <div>
                          <div className="font-bold text-sm">{p.t}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {p.id === "cod" ? "Pay rider in cash" : p.id === "easypaisa" ? "Mobile wallet" : "QR / IBAN"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {payment === "easypaisa" && (
                  <div className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5">
                    <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
                      <i className="fa-solid fa-mobile-screen" /> Easypaisa Details
                    </div>
                    <div className="mt-4 space-y-3">
                      <CopyRow label="Account Number" value={EASYPAISA_NUMBER} onCopy={() => copy(EASYPAISA_NUMBER, "easy-num")} copied={copied === "easy-num"} mono />
                      <CopyRow label="Account Title" value={EASYPAISA_TITLE} onCopy={() => copy(EASYPAISA_TITLE, "easy-t")} copied={copied === "easy-t"} />
                    </div>
                    <PaymentNote />
                  </div>
                )}

                {payment === "bank" && (
                  <div className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5">
                    <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
                      <i className="fa-solid fa-building-columns" /> Bank Transfer Details
                    </div>
                    <div className="mt-4 grid sm:grid-cols-[auto_1fr] gap-5 items-start">
                      <div className="mx-auto sm:mx-0">
                        <div className="rounded-2xl bg-white p-4 border-4 border-brand shadow-brand">
                          <QRCodeSVG
                            value={`Bank: ${BANK_NAME}\nTitle: ${BANK_TITLE}\nIBAN: ${BANK_IBAN}`}
                            size={192}
                            level="H"
                            marginSize={0}
                            bgColor="#ffffff"
                            fgColor="#000000"
                          />
                        </div>
                        <div className="mt-2 text-center text-[11px] text-muted-foreground">Scan to pay</div>
                      </div>
                      <div className="space-y-3">
                        <CopyRow label="Bank Name" value={BANK_NAME} onCopy={() => copy(BANK_NAME, "bn")} copied={copied === "bn"} />
                        <CopyRow label="Account Title" value={BANK_TITLE} onCopy={() => copy(BANK_TITLE, "bt")} copied={copied === "bt"} />
                        <CopyRow label="IBAN" value={BANK_IBAN} onCopy={() => copy(BANK_IBAN, "iban")} copied={copied === "iban"} mono />
                      </div>
                    </div>
                    <PaymentNote />
                  </div>
                )}
              </div>
            </div>

            <aside className="lg:col-span-2 rounded-3xl bg-ink text-cream p-6 sm:p-8 shadow-card-soft sticky top-24 self-start">
              <h3 className="font-display text-2xl font-bold">Order Summary</h3>
              {lines.length === 0 ? (
                <p className="mt-6 text-cream/60 text-sm">Your cart is empty. Add items from the menu.</p>
              ) : (
                <ul className="mt-5 space-y-3 max-h-60 overflow-auto pr-1">
                  {lines.map((l) => (
                    <li key={l.item.id} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate"><span className="text-gold font-bold">{l.qty}×</span> {l.item.name}</span>
                      <span className="shrink-0 font-semibold">{fmt(l.item.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 border-t border-white/10 pt-4 space-y-2 text-sm">
                <Row k="Subtotal" v={fmt(subtotal)} />
                <Row k="Sales Tax (15%)" v={fmt(tax)} />
                <Row k={`Delivery${selectedArea ? ` · ${selectedArea.zone}` : ""}`} v={selectedArea ? fmt(delivery) : "—"} />
                <Row k="Payment" v={payment === "cod" ? "Cash on Delivery" : payment === "easypaisa" ? "Easypaisa" : "Bank Transfer"} />
                <div className="flex justify-between pt-3 border-t border-white/10 text-lg">
                  <span className="font-bold">Grand Total</span>
                  <span className="font-display font-black text-gold">{fmt(grand)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp py-4 font-bold text-white hover:scale-[1.02] transition-transform shadow-2xl"
              >
                <i className="fa-brands fa-whatsapp text-xl" /> Confirm via WhatsApp
              </button>
              <p className="mt-3 text-xs text-cream/60 text-center">No app needed. Order confirmation via WhatsApp.</p>
            </aside>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">Why Choose Us</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black">
              Karachi's <span className="text-gradient-gold">Favorite</span> Shawarma
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: "fa-star", t: "Authentic Arabic Taste", d: "Recipes straight from the streets of Arabia." },
              { i: "fa-leaf", t: "Fresh Ingredients", d: "Sourced daily, never frozen." },
              { i: "fa-gem", t: "Premium Quality", d: "Made with care, served with pride." },
              { i: "fa-shield-heart", t: "Hygienic Kitchen", d: "Spotless prep area, certified clean." },
              { i: "fa-bolt", t: "Fast Delivery", d: "Hot at your door across Karachi." },
              { i: "fa-tag", t: "Affordable Prices", d: "Premium taste, honest pricing." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl bg-card border border-border p-6 shadow-card-soft hover:shadow-brand hover:-translate-y-1 transition-all">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-brand-foreground shadow-brand"><i className={`fa-solid ${f.i} text-lg`} /></span>
                <h3 className="mt-4 font-display text-xl font-bold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section id="location" className="py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-brand font-bold">Visit Us</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black text-ink">
              Find Al-Arab in <span className="text-gradient-gold">Karachi</span>
            </h2>
          </div>
          <div className="mt-14 grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[
                { i: "fa-location-dot", t: "Our Address", v: "Main Sharfabad Signal, Karachi, Pakistan" },
                { i: "fa-clock", t: "Restaurant Hours", v: "4:00 PM – 4:00 AM · Daily" },
                { i: "fa-motorcycle", t: "Delivery Hours", v: "4:00 PM – 2:00 AM · Daily" },
                { i: "fa-phone", t: "Call Us", v: "0333-3686848" },
              ].map((c) => (
                <div key={c.t} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card-soft hover:border-brand/40 transition-colors">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-brand-foreground shadow-brand"><i className={`fa-solid ${c.i} text-lg`} /></span>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.t}</div>
                    <div className="mt-1 font-semibold text-foreground">{c.v}</div>
                  </div>
                </div>
              ))}
              <a href="https://www.google.com/maps/search/?api=1&query=Sharfabad+Signal+Karachi" target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 font-bold text-gold-foreground shadow-gold-glow hover:scale-[1.02] transition-transform">
                <i className="fa-solid fa-diamond-turn-right" /> Get Directions
              </a>
            </div>
            <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-border shadow-card-soft min-h-[400px]">
              <iframe title="Al-Arab Shawarma Map" src="https://www.google.com/maps?q=Sharfabad+Signal,+Karachi,+Pakistan&output=embed" className="w-full h-full min-h-[400px]" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-ink text-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold">Contact</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black">Get in <span className="text-gradient-gold">Touch</span></h2>
          </div>
          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <ContactRow i="fa-phone" t="Phone" v="0333-3686848" />
              <ContactRow i="fa-location-dot" t="Address" v="Main Sharfabad Signal, Karachi" />
              <ContactRow i="fa-clock" t="Hours" v="4:00 PM – 4:00 AM Daily" />
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-4 font-bold text-white hover:scale-[1.01] transition-transform">
                <i className="fa-brands fa-whatsapp text-xl" /> Chat on WhatsApp
              </a>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const msg = `*Contact from Website*\n\nName: ${f.get("name")}\nPhone: ${f.get("phone")}\nMessage: ${f.get("message")}`;
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4"
            >
              <input name="name" required maxLength={80} placeholder="Your name" className="field-dark" />
              <input name="phone" required maxLength={20} placeholder="Phone number" className="field-dark" />
              <textarea name="message" required maxLength={500} placeholder="Your message" className="field-dark min-h-28" />
              <button className="w-full rounded-full bg-gradient-brand py-3.5 font-bold text-brand-foreground hover:opacity-95">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background border-t border-border pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src={logoAsset.url} alt="Al-Arab Shawarma logo" className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/60 bg-ink" />
              <div>
                <div className="font-display text-2xl font-extrabold">Al-Arab <span className="text-gradient-gold">Shawarma</span></div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Authentic Arabic Taste · Since 1998</div>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm text-muted-foreground">Bringing the streets of Arabia to Karachi — one fresh shawarma at a time. Halal, handcrafted, and hot off the grill.</p>
          </div>
          <div>
            <h4 className="font-display text-lg">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {navLinks.map((n) => (<li key={n.h}><a className="hover:text-brand" href={n.h}>{n.l}</a></li>))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg">Delivery & Hours</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><i className="fa-solid fa-location-dot text-brand mr-2" />Main Sharfabad Signal</li>
              <li><i className="fa-solid fa-clock text-brand mr-2" />4 PM – 4 AM</li>
              <li><i className="fa-solid fa-motorcycle text-brand mr-2" />Delivery till 2 AM</li>
              <li><i className="fa-solid fa-phone text-brand mr-2" />0333-3686848</li>
            </ul>
            <div className="mt-4 flex gap-3">
              {[
                { i: "fa-facebook-f", h: "#" },
                { i: "fa-instagram", h: "#" },
                { i: "fa-tiktok", h: "#" },
                { i: "fa-whatsapp", h: `https://wa.me/${WHATSAPP_NUMBER}` },
              ].map((s) => (
                <a key={s.i} href={s.h} target="_blank" rel="noreferrer" aria-label={s.i} className="grid h-10 w-10 place-items-center rounded-full bg-muted hover:bg-gold hover:text-gold-foreground transition-colors">
                  <i className={`fa-brands ${s.i}`} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Al-Arab Shawarma. All rights reserved. · Made with <i className="fa-solid fa-heart text-brand" /> in Karachi
        </div>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display text-2xl font-bold">Your Cart <span className="text-muted-foreground text-base">({itemCount})</span></h3>
              <button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted"><i className="fa-solid fa-xmark text-lg" /></button>
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-3">
              {lines.length === 0 ? (
                <div className="text-center py-20">
                  <i className="fa-solid fa-bag-shopping text-5xl text-muted-foreground/40" />
                  <p className="mt-4 text-muted-foreground">Your cart is empty.</p>
                  <button onClick={() => setCartOpen(false)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand text-brand-foreground px-5 py-2.5 text-sm font-semibold">Browse menu</button>
                </div>
              ) : (
                lines.map((l) => (
                  <div key={l.item.id} className="flex gap-3 rounded-2xl border border-border p-3">
                    <img src={l.item.image} alt={l.item.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div className="font-semibold truncate">{l.item.name}</div>
                        <button onClick={() => remove(l.item.id)} className="text-muted-foreground hover:text-destructive"><i className="fa-solid fa-trash text-sm" /></button>
                      </div>
                      <div className="text-sm text-brand font-bold mt-1">{fmt(l.item.price)}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <QtyControl qty={l.qty} onAdd={() => add(l.item.id)} onDec={() => dec(l.item.id)} />
                        <div className="font-bold">{fmt(l.item.price * l.qty)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {lines.length > 0 && (
              <div className="p-5 border-t border-border space-y-3">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span>Tax (15%)</span><span className="font-semibold">{fmt(tax)}</span></div>
                <a href="#checkout" onClick={() => setCartOpen(false)} className="block text-center rounded-full bg-gradient-brand text-brand-foreground py-3.5 font-bold shadow-brand hover:scale-[1.02] transition-transform">
                  Checkout — {fmt(subtotal + tax)}
                </a>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* CONFIRMATION */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-2xl">
            <div className="grid h-20 w-20 mx-auto place-items-center rounded-full bg-whatsapp text-white text-4xl"><i className="fa-solid fa-check" /></div>
            <h3 className="mt-5 font-display text-3xl font-bold">Order Sent!</h3>
            <p className="mt-2 text-muted-foreground">Your order has been opened in WhatsApp. Hit send to confirm and we'll get it on the grill.</p>
            <button onClick={() => { setConfirmOpen(false); setCart({}); }} className="mt-6 w-full rounded-full bg-gradient-brand text-brand-foreground py-3.5 font-bold">Done</button>
          </div>
        </div>
      )}

      {/* FLOATING BUTTONS */}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white text-2xl shadow-2xl hover:scale-110 transition-transform animate-float">
        <i className="fa-brands fa-whatsapp" />
        <span className="absolute inset-0 rounded-full ring-4 ring-whatsapp/40 animate-ping" />
      </a>
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-ink text-cream shadow-2xl hover:scale-110 transition-transform">
          <i className="fa-solid fa-arrow-up" />
        </button>
      )}

      <style>{`
        .field { width:100%; padding:.75rem 1rem; border-radius:.75rem; background:var(--card); border:1px solid var(--border); color:var(--foreground); font-size:.95rem; }
        .field:focus { outline:none; border-color:var(--brand); box-shadow:0 0 0 3px oklch(0.48 0.20 25 / .15); }
        .field-dark { width:100%; padding:.85rem 1rem; border-radius:.75rem; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--cream); font-size:.95rem; }
        .field-dark:focus { outline:none; border-color:var(--gold); }
        .field-dark::placeholder { color: oklch(0.97 0.02 85 / .5); }
      `}</style>
    </div>
  );
}

function MenuCard({ item, qty, onAdd, onDec }: { item: Item; qty: number; onAdd: () => void; onDec: () => void }) {
  return (
    <article className="group rounded-3xl bg-card border border-border shadow-card-soft overflow-hidden hover:shadow-brand hover:-translate-y-1 transition-all">
      <div className="relative h-48 overflow-hidden">
        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <span className="absolute top-3 left-3 rounded-full bg-ink/70 text-cream text-[10px] uppercase tracking-wider px-2.5 py-1 backdrop-blur">{item.category}</span>
        <span className="absolute top-3 right-3 rounded-full bg-gold text-gold-foreground font-bold text-sm px-3 py-1 shadow-gold-glow">{fmt(item.price)}</span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-bold">{item.name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{item.desc}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          {qty > 0 ? <QtyControl qty={qty} onAdd={onAdd} onDec={onDec} /> : <span className="text-xs text-muted-foreground">Tap to add</span>}
          <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full bg-gradient-brand text-brand-foreground px-4 py-2.5 text-sm font-bold shadow-brand hover:scale-105 transition-transform">
            <i className="fa-solid fa-plus" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

function QtyControl({ qty, onAdd, onDec }: { qty: number; onAdd: () => void; onDec: () => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background">
      <button onClick={onDec} className="grid h-9 w-9 place-items-center hover:text-brand"><i className="fa-solid fa-minus text-sm" /></button>
      <span className="w-8 text-center font-bold">{qty}</span>
      <button onClick={onAdd} className="grid h-9 w-9 place-items-center hover:text-brand"><i className="fa-solid fa-plus text-sm" /></button>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><i className={`fa-solid ${icon} text-brand`} /> {label}</span>
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

function ContactRow({ i, t, v }: { i: string; t: string; v: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground"><i className={`fa-solid ${i} text-lg`} /></span>
      <div>
        <div className="text-xs uppercase tracking-wider text-cream/60">{t}</div>
        <div className="mt-1 font-semibold">{v}</div>
      </div>
    </div>
  );
}

function CopyRow({ label, value, onCopy, copied, mono }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-background/80 border border-border p-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className={`mt-0.5 truncate font-bold text-foreground ${mono ? "font-mono text-sm tracking-tight" : "text-sm"}`}>{value}</div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
          copied ? "bg-whatsapp text-white" : "bg-gradient-brand text-brand-foreground hover:scale-105"
        }`}
      >
        <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function PaymentNote() {
  return (
    <p className="mt-4 text-xs leading-relaxed text-foreground/75 rounded-lg bg-background/60 border border-border p-3">
      <i className="fa-solid fa-circle-info text-brand mr-1.5" />
      Please transfer the total amount, take a screenshot of the receipt, and confirm your order. The details will be forwarded directly to our WhatsApp for verification.
    </p>
  );
}
