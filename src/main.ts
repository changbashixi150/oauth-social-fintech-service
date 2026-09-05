import { InfraiClient } from "./infrai_client.ts";
import { beginSocialLogin } from "./oauth_risk_service.ts";

const result = await beginSocialLogin({
  provider: (process.env.OAUTH_PROVIDER as "google" | "github") ?? "google",
  returnTo: "https://fintech.example.com/login/done",
  redirectUri: "https://fintech.example.com/oauth/callback",
  captchaToken: process.env.CAPTCHA_TOKEN ?? "local-token",
  widgetRecordId: process.env.CAPTCHA_WIDGET_RECORD_ID ?? "local-widget"
}, new InfraiClient());
console.log(JSON.stringify(result));
