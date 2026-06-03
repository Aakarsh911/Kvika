const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const integrations = await prisma.integration.findMany({
    include: {
      user: true
    }
  });
  console.log('🔌 Found Integrations in DB:');
  integrations.forEach(i => {
    console.log(`- User: ${i.user.email} (ID: ${i.userId}), Provider: ${i.provider}, Has Tokens: ${!!i.accessToken}`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
