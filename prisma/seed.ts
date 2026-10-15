import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const offerings: Prisma.GrowthOfferingCreateInput[] = [
  { code: "product-reach-500", name: "Product Spotlight · 500", category: "PROMOTION", targetType: "PRODUCT", description: "Promote one product to a targeted slice of marketplace shoppers.", price: 100, targetReach: 500, reachMode: "FIXED", durationDays: 7, features: ["Product spotlight placement", "Campaign reach tracking", "Campaign history in analytics"], active: true, sortOrder: 10 },
  { code: "product-reach-1000", name: "Product Spotlight · 1,000", category: "PROMOTION", targetType: "PRODUCT", description: "Give one product more visibility across the marketplace.", price: 180, targetReach: 1000, reachMode: "FIXED", durationDays: 7, features: ["Product spotlight placement", "Campaign reach tracking", "Campaign history in analytics"], active: true, sortOrder: 20 },
  { code: "product-reach-2500", name: "Product Spotlight · 2,500", category: "PROMOTION", targetType: "PRODUCT", description: "A larger reach target for a product listing.", price: 400, targetReach: 2500, reachMode: "FIXED", durationDays: 7, features: ["Product spotlight placement", "Campaign reach tracking", "Campaign history in analytics"], active: true, sortOrder: 30 },
  { code: "product-all-users", name: "Product Spotlight · Full Audience", category: "PROMOTION", targetType: "PRODUCT", description: "Set the reach target to the current registered marketplace audience.", price: 2500, targetReach: 0, reachMode: "ALL_USERS", durationDays: 7, features: ["Reach target adjusts to registered marketplace users", "Product spotlight placement", "Campaign reach tracking"], active: true, sortOrder: 40 },
  { code: "store-reach-1000", name: "Shop Spotlight · 1,000", category: "PROMOTION", targetType: "STORE", description: "Promote the shop and its eligible listings.", price: 250, targetReach: 1000, reachMode: "FIXED", durationDays: 7, features: ["Shop promotion placement", "Campaign reach tracking", "Campaign history in analytics"], active: true, sortOrder: 50 },
  { code: "store-all-users", name: "Shop Spotlight · Full Audience", category: "PROMOTION", targetType: "STORE", description: "Set the reach target to the current registered marketplace audience.", price: 3500, targetReach: 0, reachMode: "ALL_USERS", durationDays: 7, features: ["Reach target adjusts to registered marketplace users", "Shop promotion placement", "Campaign reach tracking"], active: true, sortOrder: 60 },
  { code: "verified", name: "Verified Shop", category: "GROWTH", targetType: null, description: "Marketplace verification review and verified profile badge.", price: 999, targetReach: 0, reachMode: "FIXED", durationDays: 365, features: ["Verified badge on the shop", "Trust-focused profile indicator", "Admin verification review"], active: true, sortOrder: 10 },
  { code: "pro", name: "Pro Seller", category: "GROWTH", targetType: null, description: "A Pro Seller membership with extra visibility and seller tools.", price: 499, targetReach: 0, reachMode: "FIXED", durationDays: 30, features: ["Pro Seller badge", "Seller analytics", "Priority growth features"], active: true, sortOrder: 20 },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const userEmail = (process.env.SEED_USER_EMAIL || "customer@example.com").trim().toLowerCase();
  const userPassword = process.env.SEED_USER_PASSWORD || "Customer123!";
  const userName = process.env.SEED_USER_NAME || "Demo Customer";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Marketplace Admin", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12) },
    create: { email: adminEmail, name: "Marketplace Admin", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12) },
  });
  await prisma.user.upsert({
    where: { email: userEmail },
    update: { name: userName, role: "USER", passwordHash: await bcrypt.hash(userPassword, 12) },
    create: { email: userEmail, name: userName, role: "USER", passwordHash: await bcrypt.hash(userPassword, 12) },
  });

  for (const offering of offerings) {
    await prisma.growthOffering.upsert({
      where: { code: offering.code },
      update: {
        name: offering.name, category: offering.category, targetType: offering.targetType,
        description: offering.description, price: offering.price, targetReach: offering.targetReach,
        reachMode: offering.reachMode, durationDays: offering.durationDays, features: offering.features,
        active: offering.active, sortOrder: offering.sortOrder,
      },
      create: offering,
    });
  }

  console.log("Seeded admin:", adminEmail);
  console.log("Seeded customer:", userEmail);
  console.log(`Seeded ${offerings.length} promotion and growth offerings.`);
  console.log("Use the passwords from your environment variables.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
