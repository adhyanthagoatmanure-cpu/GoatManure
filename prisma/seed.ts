import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ADHYANTHA database…");

  // ── Categories ────────────────────────────────────────────────────────
  const manureCategory = await prisma.category.upsert({
    where: { slug: "manure-compost" },
    update: {},
    create: { name: "Manure & Compost", slug: "manure-compost", description: "Organic manure and compost fertilizers." },
  });
  const soilCategory = await prisma.category.upsert({
    where: { slug: "soil-amendments" },
    update: {},
    create: { name: "Soil Amendments", slug: "soil-amendments", description: "Products that improve soil structure and fertility." },
  });

  // ── Flagship product: Organic Goat Manure ───────────────────────────────
  // Pricing exactly as specified by the client.
  const goatManure = await prisma.product.upsert({
    where: { slug: "organic-goat-manure-fertilizer" },
    update: {},
    create: {
      name: "Organic Goat Manure Fertilizer",
      slug: "organic-goat-manure-fertilizer",
      shortDescription: "100% natural, sun-dried goat manure for healthier soil and stronger plants.",
      description:
        "ADHYANTHA's Organic Goat Manure Fertilizer is sourced, sun-dried, and carefully processed to give your garden pure, natural nutrition — no synthetic chemicals, no shortcuts.\n\nGoat manure is naturally rich in nitrogen, phosphorus, and potassium along with beneficial micronutrients, making it one of the most balanced organic fertilizers available. Unlike raw manure, ours is properly aged and processed, so it is safe to use directly without burning roots.\n\nSuitable for vegetable gardens, flowering plants, fruit trees, lawns, and potted plants alike.",
      howToUse:
        "For potted plants: Mix 100-150g per 10-inch pot into the top layer of soil and water thoroughly.\n\nFor garden beds: Spread 1-2 kg per square meter and work into the top 5-10cm of soil before planting.\n\nFor established plants: Apply around the base (avoiding direct stem contact) every 3-4 weeks during the growing season.\n\nAlways water well after application.",
      shippingInfo:
        "Dispatched within 1-2 business days. Delivered in 4-7 business days depending on your location. Free shipping on orders above ₹499; a flat ₹49 fee applies below that. Cash on Delivery is available across serviceable pincodes.",
      images: [
        "/images/products/organic-goat-manure-fertilizer-front.svg",
        "/images/products/organic-goat-manure-fertilizer-label.svg",
        "/images/products/organic-goat-manure-fertilizer-lifestyle.svg",
      ],
      status: "ACTIVE",
      featured: true,
      sku: "ADYA-GM",
      categoryId: manureCategory.id,
      avgRating: 4.7,
      reviewCount: 3,
      benefits: {
        create: [
          { title: "100% Organic", icon: "Leaf", sortOrder: 0 },
          { title: "Improves Soil Structure", icon: "Mountain", sortOrder: 1 },
          { title: "Odourless When Dry", icon: "Wind", sortOrder: 2 },
          { title: "Safe for All Plants", icon: "ShieldCheck", sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { weightLabel: "1 KG", weightValue: 1, originalPrice: 200, offerPrice: 149, stock: 120, isDefault: true, sortOrder: 0, sku: "ADYA-GM-1KG" },
          { weightLabel: "2 KG", weightValue: 2, originalPrice: 250, offerPrice: 199, stock: 90, sortOrder: 1, sku: "ADYA-GM-2KG" },
          { weightLabel: "3 KG", weightValue: 3, originalPrice: 300, offerPrice: 249, stock: 70, sortOrder: 2, sku: "ADYA-GM-3KG" },
          { weightLabel: "4 KG", weightValue: 4, originalPrice: 350, offerPrice: 299, stock: 45, sortOrder: 3, sku: "ADYA-GM-4KG" },
          { weightLabel: "5 KG", weightValue: 5, originalPrice: 400, offerPrice: 349, stock: 8, lowStockThreshold: 10, sortOrder: 4, sku: "ADYA-GM-5KG" },
        ],
      },
    },
  });

  // ── Demo catalog products (populate the grid/filtering; NOT part of the
  //    client's specified pricing — swap or remove freely) ────────────────
  await prisma.product.upsert({
    where: { slug: "vermicompost-organic-fertilizer" },
    update: {},
    create: {
      name: "Vermicompost Organic Fertilizer",
      slug: "vermicompost-organic-fertilizer",
      shortDescription: "Earthworm-processed compost, rich in humus and beneficial microbes.",
      description:
        "A fine, nutrient-dense compost created through vermicomposting — organic matter broken down by earthworms into a rich, dark, humus-like fertilizer. Excellent for improving water retention and microbial activity in soil.",
      howToUse: "Mix 200-300g per 10-inch pot, or 2kg per square meter for garden beds. Reapply every 4-6 weeks.",
      images: [
        "/images/products/vermicompost-organic-fertilizer-front.svg",
        "/images/products/vermicompost-organic-fertilizer-label.svg",
      ],
      status: "ACTIVE",
      featured: true,
      sku: "ADYA-VC",
      categoryId: manureCategory.id,
      variants: {
        create: [
          { weightLabel: "1 KG", weightValue: 1, originalPrice: 180, offerPrice: 139, stock: 60, isDefault: true, sortOrder: 0 },
          { weightLabel: "5 KG", weightValue: 5, originalPrice: 750, offerPrice: 599, stock: 25, sortOrder: 1 },
          { weightLabel: "10 KG", weightValue: 10, originalPrice: 1400, offerPrice: 1099, stock: 12, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "neem-cake-organic-fertilizer" },
    update: {},
    create: {
      name: "Neem Cake Organic Fertilizer",
      slug: "neem-cake-organic-fertilizer",
      shortDescription: "Natural soil conditioner and pest deterrent, cold-pressed from neem seeds.",
      description:
        "Neem cake is a by-product of cold-pressed neem oil extraction, valued by organic gardeners both as a slow-release fertilizer and a natural deterrent against soil-borne pests and nematodes.",
      howToUse: "Mix 50-100g per 10-inch pot into the topsoil, or 500g per square meter for beds. Use every 6-8 weeks.",
      images: [
        "/images/products/neem-cake-organic-fertilizer-front.svg",
        "/images/products/neem-cake-organic-fertilizer-lifestyle.svg",
      ],
      status: "ACTIVE",
      featured: false,
      sku: "ADYA-NC",
      categoryId: soilCategory.id,
      variants: {
        create: [
          { weightLabel: "1 KG", weightValue: 1, originalPrice: 220, offerPrice: 179, stock: 40, isDefault: true, sortOrder: 0 },
          { weightLabel: "5 KG", weightValue: 5, originalPrice: 950, offerPrice: 799, stock: 15, sortOrder: 1 },
        ],
      },
    },
  });

  // ── Coupon ───────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: "ADYA50" },
    update: {},
    create: {
      code: "ADYA50",
      discountType: "FIXED",
      value: 50,
      minOrderAmount: 0,
      perUserLimit: 1,
      isActive: true,
    },
  });

  // ── Admin user ───────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@adhyantha.com" },
    update: {},
    create: {
      name: "ADHYANTHA Admin",
      email: "admin@adhyantha.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  // ── Demo customer (handy for testing the account section) ──────────────
  const demoPasswordHash = await bcrypt.hash("Demo@12345", 12);
  await prisma.user.upsert({
    where: { email: "demo@adhyantha.com" },
    update: {},
    create: {
      name: "Demo Customer",
      email: "demo@adhyantha.com",
      phone: "9876543210",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER",
    },
  });

  // ── Demo testimonials — clearly flagged, per spec ───────────────────────
  const testimonials = [
    { customerName: "Ramesh K.", location: "Coimbatore, TN", rating: 5, review: "My tomato plants have never looked better. Switched from chemical fertilizer three months ago and the difference in soil texture alone is remarkable.", sortOrder: 0 },
    { customerName: "Ananya S.", location: "Bengaluru, KA", rating: 5, review: "Easy to use, no bad smell once it dries, and my balcony garden is thriving. Delivery was quick too.", sortOrder: 1 },
    { customerName: "Vikram P.", location: "Pune, MH", rating: 4, review: "Good quality manure, noticeably improved my rose bushes. Would like to see a bigger bulk size option in future.", sortOrder: 2 },
  ];
  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { customerName: t.customerName } });
    if (!existing) await prisma.testimonial.create({ data: { ...t, isDemo: true, isPublished: true } });
  }

  // ── Demo blog posts, matching the spec's example titles ─────────────────
  const posts = [
    {
      title: "How to Use Goat Manure in Your Garden",
      slug: "how-to-use-goat-manure-in-your-garden",
      category: "Guides",
      excerpt: "A practical, no-nonsense guide to applying goat manure for potted plants, garden beds, and established trees.",
      content:
        "Goat manure is one of the easiest organic fertilizers to work with, largely thanks to its pelletized, low-odour form. Here's how to get the most out of it.\n\nFor potted plants, mix a handful into the top layer of soil every few weeks and water thoroughly afterward — this helps release nutrients gradually. For garden beds, work it into the top few centimetres of soil before planting, or side-dress established plants by sprinkling it around the base, away from direct stem contact.\n\nUnlike fresh manure, properly processed goat manure won't burn your plants' roots, which makes it forgiving even for beginners. As with any fertilizer, consistency matters more than quantity — little and often beats one large dose.",
    },
    {
      title: "Benefits of Organic Fertilizer",
      slug: "benefits-of-organic-fertilizer",
      category: "Education",
      excerpt: "Why organic fertilizers like goat manure outperform synthetic alternatives in the long run.",
      content:
        "Synthetic fertilizers deliver a quick nutrient hit, but organic fertilizers play a longer game — one that pays off in soil health, not just plant appearance.\n\nOrganic matter feeds the soil's microbial life, which in turn makes nutrients more available to plant roots over time. It also improves soil structure, helping both water retention and drainage — a balance synthetic fertilizers can't offer. And because organic fertilizers release nutrients slowly, there's little risk of the nutrient burn that comes with over-applying chemical alternatives.\n\nThe result: healthier plants season after season, and soil that keeps improving rather than depleting.",
    },
    {
      title: "How to Improve Soil Health Naturally",
      slug: "how-to-improve-soil-health-naturally",
      category: "Guides",
      excerpt: "Simple, sustainable habits that build better soil over time — no chemicals required.",
      content:
        "Healthy soil is alive — full of microbes, fungi, and organic matter working together. Here are a few natural ways to support that ecosystem.\n\nAdd organic matter regularly, whether through compost, manure, or mulch — this feeds soil biology directly. Avoid over-tilling, which disrupts soil structure and the fungal networks that help plants absorb nutrients. Keep soil covered with mulch or ground cover to prevent erosion and moisture loss. And rotate what you grow in a given spot to avoid depleting the same nutrients season after season.\n\nNone of this requires synthetic inputs — just consistency and a bit of patience.",
    },
    {
      title: "Sustainable Gardening Tips",
      slug: "sustainable-gardening-tips",
      category: "Lifestyle",
      excerpt: "Small changes that make your garden kinder to the planet — and often easier to maintain.",
      content:
        "Sustainable gardening isn't about doing everything perfectly — it's about making better choices where you can.\n\nStart with your soil: organic fertilizers like goat manure build long-term fertility instead of just feeding this season's growth. Collect rainwater where possible, and water in the early morning or evening to reduce evaporation loss. Choose plants suited to your local climate, which need less intervention to thrive. And compost your kitchen scraps — it's one of the simplest ways to close the loop in your own backyard.\n\nEvery small habit adds up, both for your garden and for the environment around it.",
    },
  ];
  for (const p of posts) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, status: "PUBLISHED", publishedAt: new Date(), author: "ADHYANTHA Team" },
    });
  }

  console.log("Seed complete.");
  console.log(`  Products: ${goatManure.name} + 2 more`);
  console.log("  Coupon: ADYA50 (₹50 flat)");
  console.log("  Admin login: admin@adhyantha.com / Admin@12345  (change this immediately)");
  console.log("  Demo customer: demo@adhyantha.com / Demo@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
