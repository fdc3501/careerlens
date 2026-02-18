import { onRequestPost as __api_parse_resume_ts_onRequestPost } from "/home/user/careerlens/functions/api/parse-resume.ts"
import { onRequestPost as __api_report_ts_onRequestPost } from "/home/user/careerlens/functions/api/report.ts"

export const routes = [
    {
      routePath: "/api/parse-resume",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_parse_resume_ts_onRequestPost],
    },
  {
      routePath: "/api/report",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_report_ts_onRequestPost],
    },
  ]