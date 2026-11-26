import { sql } from "@/db";
import { DEMO_PASSWORD } from "@/lib/demo";
import { seedDemo } from "@/lib/demo-seed";

async function main() {
  await seedDemo();
  console.log("Seeded Northstar. Demo password:", DEMO_PASSWORD);
  await sql.end({ timeout: 5 });
}

main().catch(async (error) => {
  console.error(error);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
