import { seedJsonData, seedSummary } from "./seed-data";

seedJsonData({ preserveUsers: true, ifEmpty: false })
  .then(() => {
    const counts = seedSummary();
    console.log("Seed complete (users preserved):");
    for (const [key, count] of Object.entries(counts)) {
      console.log(`  ${key}: ${count}`);
    }
    console.log("  user-linked files: cleared (empty — fill after sign-in)");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
