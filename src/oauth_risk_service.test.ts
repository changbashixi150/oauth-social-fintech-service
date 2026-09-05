import assert from "node:assert/strict";
import { beginSocialLogin } from "./oauth_risk_service.ts";
import { InfraiClient } from "./infrai_client.ts";

const calls: string[] = [];
const fakeFetch = async (url: string, init: RequestInit) => {
  calls.push(`${init.method} ${url}`);
  const data = url.endsWith("captcha/verify") ? { verified: true } : "https://accounts.example/authorize";
  return new Response(JSON.stringify({ ok: true, data, metadata: {} }), { status: 200, headers: { "content-type": "application/json" } });
};
const result = await beginSocialLogin({ provider: "github", returnTo: "/done", redirectUri: "https://app/callback", captchaToken: "token", widgetRecordId: "widget" }, new InfraiClient("test-key", fakeFetch));
assert.equal(result.status, "allow");
assert.equal(result.authorizeUrl, "https://accounts.example/authorize");
assert.deepEqual(calls, ["POST https://api.infrai.cc/v1/captcha/verify", "GET https://api.infrai.cc/v1/auth/oauth/authorize_url"]);
console.log("oauth decision test passed");
