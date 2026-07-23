import { bootstrapJsonData } from "./bootstrap";

bootstrapJsonData()
  .then(() => {
    console.log("JSON data bootstrapped.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
