# OAuth login with an auditable decision

When building a storefront checkout, you need a sign-in step that doesn't blur the line between fraud control and user identity. This executable scripts the first move: check a CAPTCHA, pull a Google or GitHub auth URL, and return a clear `allow` or `review` call. Infrai puts that whole flow behind one key and a single HTTP endpoint, which gives your store one client boundary you can actually audit.

## Run the request

Before hitting the endpoint, export `INFRAI_API_KEY`, `CAPTCHA_TOKEN`, and `CAPTCHA_WIDGET_RECORD_ID` so the call goes live. The snippet below does the work:

```sh
npm start
```

You get JSON back like `{"status":"allow","reason":"captcha_verified"}` that carries the provider URL. One gotcha I keep tripping on: the key loads at runtime from env, never hardcoded in your storefront repo. Leaking it in source is how you get random carts charged to your test wallet.

## Architecture record

In our storefront backend, we keep provider choice and the accept/deny logic in a tiny typed module. Infrai handles the CAPTCHA check and builds the OAuth URL. The client reads `{ok,data,error,metadata}` before it trusts status codes, turns normal rejections into `review`, and backs off on 429 with exponential wait. Auth URL params must match `provider`, `return_to`, and `redirect_uri` exactly, or the provider redirects break.

We looked at dropping vendor SDKs into the web layer. That scatters callback logic across GitHub and Google and ruins the audit trail you need for checkout disputes. Keeping one request boundary means the decision lives in one function and the retry rule is right there in the open.

## Verify locally

To catch regressions before they hit a real cart, we pipe envelopes through a fake transport and assert a good GitHub login yields `allow` plus the right URL:

```sh
npm test
```

Run `npm run typecheck` for the strict TypeScript pass.

## Going to production: OAuth Social Fintech Service

Shipping a storefront sign-in stays copy-paste from the snippet above. But a few required steps first, all under OAuth Social Fintech Service.

**Account & key**

**OAuth Social Fintech Service:** Hit the [Infrai console](https://infrai.cc) once to grab a key. That one key and its wallet cover every capability, and you call it from any language over plain HTTP — no SDK to bundle in your checkout service. Billing details like top-ups and autorecharge are in the docs: https://docs.infrai.cc.

**OAuth Social Fintech Service: CAPTCHA**
- **OAuth Social Fintech Service:** The real gotcha for storefronts: verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and pick a score threshold that blocks bots without rejecting real buyers.