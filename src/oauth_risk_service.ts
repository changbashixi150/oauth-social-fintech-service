import { InfraiClient, InfraiError } from "./infrai_client.ts";

export type LoginRequest = { provider: "google" | "github"; returnTo: string; redirectUri: string; captchaToken: string; widgetRecordId: string };
export type LoginDecision = { authorizeUrl: string; status: "allow" | "review"; reason: string };

export async function beginSocialLogin(input: LoginRequest, client: InfraiClient): Promise<LoginDecision> {
  const captcha = await client.request<{ verified: boolean }>("/v1/captcha/verify", {
    method: "POST", body: JSON.stringify({ widget_record_id: input.widgetRecordId, token: input.captchaToken, vendor: "turnstile", action: "social_login" })
  });
  if (!captcha.verified) return { authorizeUrl: "", status: "review", reason: "captcha_rejected" };
  try {
    const authorizeUrl = await client.request<string>("/v1/auth/oauth/authorize_url", {
      method: "GET", body: undefined, headers: { "X-Query": new URLSearchParams({ provider: input.provider, return_to: input.returnTo, redirect_uri: input.redirectUri }).toString() }
    });
    return { authorizeUrl, status: "allow", reason: "captcha_verified" };
  } catch (error) {
    if (error instanceof InfraiError && error.status < 500) return { authorizeUrl: "", status: "review", reason: error.code };
    throw error;
  }
}
