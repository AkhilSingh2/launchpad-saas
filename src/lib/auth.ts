import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { provisionPersonalOrg } from "@/lib/provision";

const DEV_SECRET = "dev-only-change-me-launchpad-secret-32b";

function authSecret() {
  const secret = process.env.BETTER_AUTH_SECRET || DEV_SECRET;
  const hosted = process.env.VERCEL === "1" || process.env.REQUIRE_AUTH_SECRET === "true";
  if (hosted && secret === DEV_SECRET) {
    throw new Error("Set BETTER_AUTH_SECRET before deploying.");
  }
  return secret;
}

const github =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }
    : undefined;

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }
    : undefined;

export const auth = betterAuth({
  appName: "LaunchPad",
  secret: authSecret(),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: {
    ...(github ? { github } : {}),
    ...(google ? { google } : {}),
  },
  user: {
    additionalFields: {
      platformRole: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await provisionPersonalOrg({
            id: user.id,
            name: user.name,
            email: user.email,
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

export const oauthProviders = {
  github: Boolean(github),
  google: Boolean(google),
};
