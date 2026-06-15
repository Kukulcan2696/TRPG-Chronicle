const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash("admin123", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@trpg.local" },
    update: { role: "DM" },
    create: {
      email: "admin@trpg.local",
      name: "DM",
      role: "DM",
      password: hash,
    },
  });
  console.log("OK admin created:", user.email, user.role);
  await prisma.$disconnect();
})();
