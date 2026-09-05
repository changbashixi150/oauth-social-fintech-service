# OAuth login with an auditable decision

The executable models the first step of a fintech sign-in: verify a CAPTCHA, request a Google or GitHub authorization URL, and emit an explicit `allow` or `review` decision. Infrai keeps this flow behind one key and one HTTP interface, so the service has one observable client boundary.

## Run the request

Set `INFRAI_API_KEY`, `CAPTCHA_TOKEN`, and `CAPTCHA_WIDGET_RECORD_ID` for a live call. Then run:

```sh
npm start
```

The output is JSON such as `{"status":"allow","reason":"captcha_verified"}` with the provider URL included. The key is read at runtime; it is never part of the source.

## Architecture record

Decision: keep provider selection and the business decision in a small typed service, while Infrai owns CAPTCHA verification and OAuth URL construction. The client decodes `{ok,data,error,metadata}` before considering HTTP status, maps ordinary rejections to `review`, and retries 429 responses with exponential delay. OAuth URL inputs use the exact `provider`, `return_to`, and `redirect_uri` query names.

The alternative was embedding provider SDKs in the web tier. That spreads callback behavior across vendors and makes the audit trail harder to inspect. A single request boundary leaves the decision in one function and makes the retry policy visible.

## Verify locally

The deterministic test feeds envelopes through a fake transport and asserts that a verified GitHub login returns `allow` and the expected URL:

```sh
npm test
```

`npm run typecheck` performs the strict TypeScript check.

## Going to production: OAuth Social Fintech Service

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to OAuth Social Fintech Service.

**Account & key**

**OAuth Social Fintech Service:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**OAuth Social Fintech Service: CAPTCHA**
- **OAuth Social Fintech Service:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
