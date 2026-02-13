import type { CountryAdapter } from "../shell/types.js";
// scaffold-imports-start
import { norwayAdapter } from "./no.js";
import { swedenAdapter } from "./se.js";
// scaffold-imports-end

export const BUILTIN_ADAPTERS: CountryAdapter[] = [
  // scaffold-adapters-start
  swedenAdapter,
  norwayAdapter,
  // scaffold-adapters-end
];
