# Learning LaunchPad

This is the map Akhil can use to explain the app in an interview. Read it next to the code. Each section names the file that owns the behavior, then asks you to change something small and say what would break.

## 1. A request, from the edge to the row

1. `src/proxy.ts` runs before the page. If `/app` or `/admin` has no session cookie, it redirects to `/login?next=...`. It does not read the database. A copied cookie name would get past this check.
2. The page or server action calls `requireSession()` in `src/server/context.ts`. That asks Better Auth for the session from the cookie and the `session` table.
3. `requireWorkspace()` loads memberships for that user and picks the active organisation from the `lp_org` cookie, falling back to Northstar, then the first membership.
4. `requirePermission(action)` calls `assertCan(role, action)` from `src/lib/rbac.ts`. A member who posts the invite form still gets refused.
5. Resource reads add the organisation id. `launchInOrg()` is `where launch.id = ? and launch.organization_id = ?`. The id in the URL is not enough.

**Exercise.** Sign in as Jordan and open `/app/audit`. The nav link is visible on purpose. Explain why the page is still empty of other people's events, and which function you would show an interviewer first.

**Exercise.** In `safeNextPath` (`src/lib/slug.ts`), say what `//evil.example` would do if the check was only `startsWith("/")`.

## 2. Sessions

Better Auth owns `user`, `session`, `account`, and `verification` (`src/db/auth-schema.ts`). Email sign-up creates a user and a credential account whose `accountId` is the user id and whose `password` is a scrypt hash. The browser keeps a session cookie. The server keeps the session row so it can expire or revoke it.

`src/lib/auth.ts` turns on email/password always. GitHub and Google are added only when both the client id and secret are present, so the process boots with an empty `.env`. `platformRole` is an additional user field with `input: false`, which means a signup request cannot set it. The seed script sets Akhil's role to `admin` after the account exists.

On user create, `provisionPersonalOrg()` inserts an organisation and an owner membership. That is why a brand-new account lands in a workspace instead of an empty screen.

**Exercise.** Trace one demo login from the button in `src/components/auth-form.tsx` to the `session` row. What is stored in the cookie, and what is stored in Postgres?

**Exercise.** Why is the proxy check described as optimistic in the Next.js docs, and what attack does it fail to stop?

## 3. Multi-tenancy

An organisation is the tenant. Members are the join table. The active tenant is not a column on the user, because one person can belong to several pads (Akhil has a personal pad and Northstar).

The cookie is a preference. It is never trusted alone: `getOrgContext()` only selects it if that user has a membership. Switching organisation is `switchOrganization()`, which checks the membership and then sets the cookie.

Invites are rows with a random token, an email, a role, and an expiry. Accepting (`acceptInvitation`) requires the signed-in email to match. A token in someone else's inbox does not add them to the org if they are logged in as a different user.

**Exercise.** Akhil opens Jordan's launch URL while Akhil's active org is his personal pad. What does `launchInOrg` return, and is that the behavior you want? How would you let an owner open a link that switches org instead of 404ing, without creating an IDOR?

**Exercise.** Two tabs, two orgs. What bug appears if the organisation id is taken from a hidden form field instead of the session?

## 4. RBAC

The matrix is data, not a pile of `if` statements scattered through components:

| Action | Owner | Admin | Member |
| --- | --- | --- | --- |
| Update org, invite, billing, audit | yes | yes | no |
| Delete org, change roles | yes | no | no |
| Create or edit a launch | yes | yes | yes |
| Delete a launch | yes | yes | no |

`canRemoveMember` adds rules the matrix cannot express: nobody removes the owner, nobody removes themselves through that action, and an admin cannot remove another admin.

Making someone else the owner demotes the current owner to admin inside one transaction, so the organisation never has zero owners or two.

The UI hides the invite form for members. That is a courtesy. The server action is the control.

**Exercise.** Add a `viewer` role that can read launches and nothing else. List every file you would touch. Which test in `src/lib/rbac.test.ts` would you extend first?

**Exercise.** An admin invites another admin. Which line refuses it, and why is that rule not in the matrix?

## 5. Plan gating

`src/lib/plans.ts` is the product rule: Free is 1 launch and 3 seats, Pro is 10 and 15, Team is unbounded. `createLaunch` counts launches for the organisation and refuses the insert when the count is already at the cap. The message is the one the free-plan Playwright test looks for.

Seats are members plus pending invites at invite time, so you cannot flood the outbox past the cap. Accepting an invite counts only members, because the pending invite is turning into a member and should not be counted twice.

**Exercise.** Free has 2 members and 1 pending invite. Can you send another invite? Can that pending person accept? Walk the two functions and say the numbers out loud.

**Exercise.** Where would a race let two parallel requests both pass `canCreateLaunch` on the Free plan? What would you lock or constrain to close it?

## 6. Webhooks and idempotency

Stripe will deliver the same event more than once. `persistBillingEvent` inserts the event id into `webhook_event` with `on conflict do nothing`. If no row comes back, the event was already seen and the function returns `duplicate` without touching the organisation.

The pure part is `reduceBillingEvent` in `src/lib/billing-events.ts`. Tests cover checkout completion, a duplicate id, a subscription update resolved from a price id, and deletion back to Free. The route in `src/app/api/stripe/webhook/route.ts` verifies the signature before any of that runs. Without Stripe keys the route returns 501, and the UI uses `confirmStubCheckout`, which calls the same `persistBillingEvent` with a synthetic event. One write path, two front doors.

**Exercise.** Draw the duplicate delivery on a whiteboard: two requests, one event id, one plan change. Which request writes the audit row?

**Exercise.** The local stub mints a new event id every confirm. What happens if you confirm Pro twice? Is that the same as Stripe retrying one event?

## 7. Email

`src/emails/messages.tsx` is React Email. `sendWelcomeEmail`, `sendInviteEmail`, and `sendBillingEmail` render HTML, insert an outbox row, and call Resend only when `RESEND_API_KEY` is set. `/dev/emails` renders the templates and the outbox. It is on when `EMAIL_PREVIEW=true`, or in development. Leave it unset on a public deploy: the outbox contains invite links.

**Exercise.** Why is the welcome email in a try/catch inside `provisionPersonalOrg`? What should happen to signup if Resend is down?

## 8. Rate limiting

`src/lib/rate-limit.ts` is a fixed window in process memory. Sign-in and sign-up are limited per IP in the auth route. Invites are limited per user. The unit test uses its own `Map` so it does not share state with the app.

This is correct for one Node process and wrong for several serverless instances. Say that in the interview, then say you would move the same function onto Redis INCR with a TTL.

**Exercise.** The limit is 2 per 1000ms. Hits land at t=1000, t=1100, t=1200, t=2200. Which call is rejected, and why does t=2200 succeed? The test already encodes the answer. Explain it without reading the assertion first.

## 9. Interview prompts

Use these as spoken answers, with the file open.

1. Where is authorization enforced, and why is middleware not enough?
2. How does a user belong to two organisations without a `current_org` column on `user`?
3. What stops a member from granting themselves admin by editing the form?
4. Show me the idempotency key for billing. What is stored, and what is the unique constraint?
5. How does the app boot in CI and on a laptop with zero third-party secrets?
6. What would you change before charging a real card? (Secret, webhook secret, price ids, no demo seed, preview route off, rate-limit store outside the process.)

## 10. Suggested order to read the code

1. `src/db/schema.ts` and `src/db/auth-schema.ts`
2. `src/lib/auth.ts` and `src/lib/provision.ts`
3. `src/lib/rbac.ts` and `src/lib/plans.ts`
4. `src/server/context.ts`, then one action file
5. `src/lib/billing-events.ts` and `src/lib/billing.ts`
6. `src/app/api/stripe/webhook/route.ts`
7. `e2e/launchpad.spec.ts`, which is the story the UI is supposed to tell
