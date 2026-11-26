export const DEMO_PASSWORD = "launchpad";

export const DEMO_USERS = [
  {
    email: "akhil@launchpad.dev",
    name: "Akhilendra Singh",
    role: "Owner",
    note: "Platform admin",
  },
  {
    email: "maya@launchpad.dev",
    name: "Maya Chen",
    role: "Admin",
    note: "Northstar",
  },
  {
    email: "jordan@launchpad.dev",
    name: "Jordan Lee",
    role: "Member",
    note: "Northstar",
  },
] as const;

export const DEMO_ORG_SLUG = "northstar";

/** True only on the hosted demo, where visitors share one seeded workspace. */
export function demoMode() {
  return process.env.DEMO_MODE === "true";
}

export const DEMO_SIGN_IN = {
  akhil: "akhil@launchpad.dev",
  maya: "maya@launchpad.dev",
  jordan: "jordan@launchpad.dev",
} as const;
