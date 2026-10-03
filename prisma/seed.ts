import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma=new PrismaClient();

async function main(){
  const adminEmail=(process.env.ADMIN_EMAIL||"admin@example.com").trim().toLowerCase();
  const adminPassword=process.env.ADMIN_PASSWORD||"Admin123!";
  const userEmail=(process.env.SEED_USER_EMAIL||"customer@example.com").trim().toLowerCase();
  const userPassword=process.env.SEED_USER_PASSWORD||"Customer123!";
  const userName=process.env.SEED_USER_NAME||"Demo Customer";

  await prisma.user.upsert({
    where:{email:adminEmail},
    update:{name:"Marketplace Admin",role:"ADMIN",passwordHash:await bcrypt.hash(adminPassword,12)},
    create:{email:adminEmail,name:"Marketplace Admin",role:"ADMIN",passwordHash:await bcrypt.hash(adminPassword,12)}
  });

  await prisma.user.upsert({
    where:{email:userEmail},
    update:{name:userName,role:"USER",passwordHash:await bcrypt.hash(userPassword,12)},
    create:{email:userEmail,name:userName,role:"USER",passwordHash:await bcrypt.hash(userPassword,12)}
  });

  console.log("Seeded admin:",adminEmail);
  console.log("Seeded customer:",userEmail);
  console.log("Use the passwords from your environment variables.");
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
