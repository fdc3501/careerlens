import { onRequestGet as __api_check_subscription_ts_onRequestGet } from "/home/user/careerlens/functions/api/check-subscription.ts"
import { onRequestPost as __api_create_checkout_ts_onRequestPost } from "/home/user/careerlens/functions/api/create-checkout.ts"
import { onRequestPost as __api_delete_account_ts_onRequestPost } from "/home/user/careerlens/functions/api/delete-account.ts"
import { onRequestPost as __api_parse_resume_ts_onRequestPost } from "/home/user/careerlens/functions/api/parse-resume.ts"
import { onRequestPost as __api_polar_webhook_ts_onRequestPost } from "/home/user/careerlens/functions/api/polar-webhook.ts"
import { onRequestPost as __api_report_ts_onRequestPost } from "/home/user/careerlens/functions/api/report.ts"

export const routes = [
    {
      routePath: "/api/check-subscription",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_check_subscription_ts_onRequestGet],
    },
  {
      routePath: "/api/create-checkout",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_create_checkout_ts_onRequestPost],
    },
  {
      routePath: "/api/delete-account",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_account_ts_onRequestPost],
    },
  {
      routePath: "/api/parse-resume",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_parse_resume_ts_onRequestPost],
    },
  {
      routePath: "/api/polar-webhook",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_polar_webhook_ts_onRequestPost],
    },
  {
      routePath: "/api/report",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_report_ts_onRequestPost],
    },
  ]