<!-- task 1 - Enable Supabase Auth Provider began: 2026-04-16 | completed: 2026-04-16 -->

# Task 1: Enable Supabase Auth Provider

---

## Engineering Context & Rationale

### What Supabase Auth Actually Is

Supabase Auth is a standalone authentication service layered over PostgreSQL. When a user signs in,
Supabase issues a **JWT (JSON Web Token)** containing the user's identity and any custom claims you
attach — including the `app_metadata.role` claim this phase relies on. That JWT is then forwarded
by the browser on every authenticated request, and Supabase's Row Level Security (RLS) engine reads
it server-side to decide what data each user can see.

This means authentication is not just a "login screen" concern. The JWT that Supabase issues in
this task propagates through every layer of the stack: it is forwarded by the Apollo auth link
(Task 5), evaluated by RLS on every GraphQL query, and decoded by Next.js middleware to enforce
route protection (Task 8). Getting the auth provider configured correctly here is the load-bearing
prerequisite for every task that follows.

### Why Email-Only, No OAuth

A portfolio site has one administrator: you. OAuth (GitHub, Google) adds a redirect-based
token exchange that requires redirect URIs to be registered on both the OAuth provider's side
and Supabase's side — two configuration surfaces to maintain, two places for misconfiguration, and
a more complex local dev setup. Email + password has none of that overhead. For a single admin on
a personal project, it is the strictly correct choice.

### Why Disable Public Sign-Ups

Supabase enables public sign-ups by default. If left enabled, anyone who discovers the site's
Supabase endpoint can create an account. Those accounts would initially have no elevated
permissions (RLS prevents it), but they pollute the user table, create noise in auth logs, and
represent an unnecessary attack surface. The admin account is created manually via the Supabase
dashboard — no signup flow is needed.

### URL Configuration — Why It Matters

After authentication, Supabase redirects the browser back to your application. If the redirect
URL is not in the dashboard's allowlist, Supabase rejects the redirect and the sign-in fails.
This is a security control: it prevents an attacker from replacing the redirect URL with a URL
they control and capturing your auth token (an open redirect attack).

Three environments need to be covered:

| Environment                | URL                                                       |
| -------------------------- | --------------------------------------------------------- |
| Local development          | `http://localhost:3000`                                   |
| Vercel preview deployments | `https://*.vercel.app` (wildcard covers all preview URLs) |
| Vercel production          | Your canonical `*.vercel.app` production URL              |

The Site URL is the _default_ redirect destination. The Additional Redirect URLs are an explicit
allowlist for every other valid destination. Both must be set before testing sign-in — a missing
entry causes a cryptic "invalid redirect URL" error that is easy to misdiagnose as a code bug.

### Email Confirmation — Disabled for Development

By default, Supabase sends a confirmation email before activating a new account. For the admin
account created via the dashboard, this is unnecessary noise — you are the person creating the
account, confirmation proves nothing. Disable it now. It can be re-evaluated if the site ever
adds user-facing features.

---

## Step-by-Step Implementation

### Step 1 — Open the Supabase Auth Settings

In the Supabase dashboard for your project, navigate to:

```
Authentication → Providers
```

### Step 2 — Verify Email Provider Is Enabled

The **Email** provider should already be listed. Confirm it is enabled. If it is not, toggle it on.

Within the Email provider settings, make two changes:

1. **Disable "Confirm email"** — toggle off. The admin account will be created manually; email
   confirmation adds no security here and breaks the flow in a development environment with no
   email service configured.

2. **Disable "Secure email change"** — toggle off. This is only relevant when users can change
   their own email, which no user can in this project.

Click **Save**.

### Step 3 — Disable Public Sign-Ups

Still in Authentication settings, navigate to:

```
Authentication → Providers → Email → (scroll to) Sign Ups
```

Toggle **"Allow new users to sign up"** to **off**.

This does not affect the admin account you will create manually. It only blocks the API endpoint
that creates accounts via `supabase.auth.signUp()` — which you will never call from application
code.

### Step 4 — Configure URL Settings

Navigate to:

```
Authentication → URL Configuration
```

Set the following:

**Site URL:**

```
http://localhost:3000
```

**Additional Redirect URLs** (one per line):

```
http://localhost:3000/**
https://*.vercel.app/**
```

The `/**` wildcard allows any path on those origins, not just the root. This is necessary because
the login page redirects to the path the user was attempting to access before being redirected to
sign in — that path is not always `/`.

Click **Save**.

### Step 5 — Create the Admin User

Navigate to:

```
Authentication → Users → Add user → Create new user
```

Enter your email address and a strong password. Click **Create user**.

This account is the sole administrator. Do not create additional accounts. The password you set
here is what Task 7's login form will authenticate against.

> After creating the user, record the password in a secure location (password manager). Supabase
> does not display it again, and the "forgot password" flow requires email delivery to be
> configured.

### Step 6 — Verify the User Exists

The user table should now show one row with:

- **Email:** your email address
- **Provider:** email
- **Created:** today's date
- **Status:** (no "Unconfirmed" flag, since email confirmation is disabled)

If the status shows "Unconfirmed," email confirmation was not successfully disabled in Step 2.
Return to the Email provider settings, disable it, and use the Supabase dashboard's "Resend
confirmation" or "Confirm" shortcut on the user row.

---

## Verification Checklist

```
| # | Check                                                          | Status |
| - | -------------------------------------------------------------- | ------ |
| 1 | Email provider enabled in Authentication → Providers           |   ✅  |
| 2 | "Confirm email" disabled                                       |   ✅  |
| 3 | Public sign-ups disabled                                       |   ✅  |
| 4 | Site URL set to http://localhost:3000                          |   ✅  |
| 5 | Redirect URLs include localhost:3000/** and *.vercel.app/**    |   ✅  |
| 6 | Admin user created, status confirmed (no Unconfirmed flag)     |   ✅  |
```

---

## Challenge & Review

**1.** Supabase's default behavior sends a confirmation email after `signUp()` is called. You
disabled that here. Without referencing the documentation, explain what the purpose of email
confirmation is in a user-facing signup flow — and then explain precisely why it provides
zero security value for an admin account created directly through the Supabase dashboard.

```
[Answer]: Confirmation is used to prevent spam account creation. If users can sign up without needing to verify the information they use to sign up with, then they can spam the database with unwanted, unused data. This could have adverse effects, such as database storage overflow. Needing confirmation inserts the data into the table, but can be safely cleared if the status is never updated. This poses 0 security value in the case of this project / an admin account, because this account is being added manually through Supabase itself, requiring a dev with admin privileges to be able to do so. Confirming has no value since the account being made has essentially already been validated through creating directly from Supabase.
```

**2.** You configured `https://*.vercel.app/**` as an allowed redirect URL using a wildcard.
A teammate raises a concern: "wildcard redirect URLs are a security risk." They are partially
correct. Without referencing any external source, explain what class of attack a wildcard redirect
URL could enable in a **public OAuth flow**, and then explain why that same attack vector does
not apply to email + password authentication (the flow you are using).

```
[Answer]: Because the wildcard could apply to *any* vercel domain, an attacker could use an open redirect attack to set up their own vercel deployment and redirect the authorization back to their custom URL, gaining access to sensitive auth data (like an admin JWT). Using an email + password authentication, however, requires the attacker to directly input the login information to gain access to auth data, and with a strong password that mathematically could take hundreds of years to crack.
```

**3.** The admin account you created has no `app_metadata.role` claim yet — that gets set in
Task 6. For now, it is a plain Supabase user with default metadata. Without referencing the
documentation, describe what a JWT issued by Supabase for this user would currently look like
at the `app_metadata` field — and explain what consequence that has for Task 5's Apollo auth
link, which will forward this JWT to Supabase's GraphQL endpoint.

```
[Answer]: Currently, the `app_metadata` field would include the `"raw_app_meta_data"` section from the raw json Supabase provides:
{
  "id": "",
  "email": "",
  "banned_until": null,
  "created_at": "",
  "confirmed_at": "",
  "confirmation_sent_at": null,
  "is_anonymous": false,
  "is_sso_user": false,
  "invited_at": null,
  "last_sign_in_at": null,
  "phone": null,
  "raw_app_meta_data": {
    "provider": "email",
    "providers": [
      "email"
    ]
  },
  "raw_user_meta_data": {
    "email_verified": true
  },
  "updated_at": "",
  "providers": [
    "email"
  ]
}
Apolloclient, without the role metadata, can't provide GraphQL with the necessary RLS information it needs in order to filter the results down based on auth status. Likely, the value would be passed in as undefined or null, which would cause either a response error, or return default data (which should be setup to only return guest data by default). In the case of default data, an admin logging in would not see the correct data.
```
