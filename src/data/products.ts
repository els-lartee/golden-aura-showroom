export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  isNew: boolean;
  material: string;
  weight: string;
  dimensions?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Aurora Diamond Ring",
    price: 4500,
    description: "A stunning 18k gold ring featuring a brilliant-cut diamond centerpiece surrounded by delicate pavé diamonds. Perfect for engagements or special occasions.",
    category: "Rings",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80",
      "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&q=80",
    ],
    isNew: true,
    material: "18k Gold, Diamond",
    weight: "4.2g",
  },
  {
    id: "2",
    name: "Celestial Pearl Necklace",
    price: 3200,
    description: "An elegant strand of South Sea pearls with an 18k gold clasp adorned with sapphires. Each pearl is hand-selected for its lustrous quality.",
    category: "Necklaces",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80",
    ],
    isNew: false,
    material: "18k Gold, South Sea Pearls, Sapphire",
    weight: "28g",
    dimensions: "45cm length",
  },
  {
    id: "3",
    name: "Soleil Drop Earrings",
    price: 2800,
    description: "Inspired by the golden rays of the sun, these drop earrings feature intricate filigree work in 22k gold with citrine gemstones.",
    category: "Earrings",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80",
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
    ],
    isNew: true,
    material: "22k Gold, Citrine",
    weight: "8.5g",
    dimensions: "5cm drop",
  },
  {
    id: "4",
    name: "Serpentine Gold Bracelet",
    price: 5800,
    description: "A bold statement piece featuring an articulated serpent design in polished gold with emerald eyes. Handcrafted by master artisans.",
    category: "Bracelets",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
    ],
    isNew: false,
    material: "18k Gold, Emerald",
    weight: "45g",
    dimensions: "18cm circumference",
  },
  {
    id: "5",
    name: "Infinity Band Ring",
    price: 1800,
    description: "A timeless infinity band crafted in rose gold, symbolizing eternal love. Features micro-pavé diamonds along the twisted design.",
    category: "Rings",
    images: [
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
      "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=600&q=80",
    ],
    isNew: false,
    material: "18k Rose Gold, Diamond",
    weight: "3.8g",
  },
  {
    id: "6",
    name: "Moonstone Pendant",
    price: 2400,
    description: "A mesmerizing moonstone cabochon set in an ornate gold frame with delicate chain. The stone displays an ethereal blue adularescence.",
    category: "Necklaces",
    images: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80",
    ],
    isNew: true,
    material: "18k Gold, Moonstone",
    weight: "12g",
    dimensions: "50cm chain, 3cm pendant",
  },
  {
    id: "7",
    name: "Baroque Pearl Studs",
    price: 1600,
    description: "Unique baroque pearls paired with 14k gold posts. Each pair is one-of-a-kind due to the natural formation of the pearls.",
    category: "Earrings",
    images: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80",
    ],
    isNew: false,
    material: "14k Gold, Baroque Pearl",
    weight: "4g",
  },
  {
    id: "8",
    name: "Woven Gold Cuff",
    price: 4200,
    description: "An architectural masterpiece featuring woven gold strands in a contemporary cuff design. Lightweight yet structurally impressive.",
    category: "Bracelets",
    images: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
    ],
    isNew: true,
    material: "18k Gold",
    weight: "38g",
    dimensions: "6cm width",
  },
  {
    id: "9",
    name: "Pavé Diamond Bangle",
    price: 7200,
    description: "A luxurious bangle encrusted with brilliant-cut diamonds set in 18k white gold. The epitome of understated glamour.",
    category: "Bracelets",
    images: [
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
    ],
    isNew: true,
    material: "18k White Gold, Diamond",
    weight: "52g",
    dimensions: "17cm circumference",
  },
  {
    id: "10",
    name: "Twisted Rope Bracelet",
    price: 3400,
    description: "A classic twisted rope design reimagined in polished yellow gold. The perfect blend of tradition and modernity.",
    category: "Bracelets",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
    ],
    isNew: false,
    material: "18k Yellow Gold",
    weight: "28g",
    dimensions: "19cm circumference",
  },
  {
    id: "11",
    name: "Charm Link Bracelet",
    price: 2900,
    description: "A delicate chain bracelet with interchangeable gold charms. Personalize your story with our curated charm collection.",
    category: "Bracelets",
    images: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    ],
    isNew: false,
    material: "14k Gold",
    weight: "15g",
    dimensions: "18cm length",
  },
  {
    id: "12",
    name: "Tennis Bracelet",
    price: 8500,
    description: "The ultimate symbol of elegance. A continuous line of brilliant-cut diamonds set in platinum, catching light from every angle.",
    category: "Bracelets",
    images: [
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    ],
    isNew: true,
    material: "Platinum, Diamond",
    weight: "22g",
    dimensions: "17.5cm circumference",
  },
];

export const categories = ["All", "Rings", "Necklaces", "Earrings", "Bracelets"];

export const clientImages = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
    name: "Ama K.",
    product: "Aurora Diamond Ring",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
    name: "Efua M.",
    product: "Celestial Pearl Necklace",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80",
    name: "Abena T.",
    product: "Soleil Drop Earrings",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    name: "Akosua D.",
    product: "Serpentine Gold Bracelet",
  },
];
