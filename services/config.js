"use strict";

require("dotenv").config();

module.exports = {
  appId: process.env.APP_ID,
  pageId: process.env.PAGE_ID,
  appSecret: process.env.APP_SECRET || "",
  verifyToken: process.env.VERIFY_TOKEN || "",
  pageAccesToken: process.env.PAGE_ACCESS_TOKEN,
  appUrl: process.env.APP_URL || "",
  webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/webhook` : "",
  port: process.env.PORT || 3000,
  whitelistedDomains: process.env.WHITELISTED_DOMAINS
    ? process.env.WHITELISTED_DOMAINS.split(",").map((d) => d.trim())
    : [],
  personas: {},
  personaBilling: { id: process.env.PERSONA_BILLING },
  personaCare: { id: process.env.PERSONA_CARE },
  personaOrder: { id: process.env.PERSONA_ORDER },
  personaSales: { id: process.env.PERSONA_SALES },

  checkEnvVariables() {
    const required = [
      "APP_ID",
      "APP_SECRET",
      "PAGE_ID",
      "PAGE_ACCESS_TOKEN",
      "VERIFY_TOKEN"
    ];
    required.forEach((key) => {
      if (!process.env[key]) {
        console.warn(`[config] Warning: missing environment variable ${key}`);
      }
    });
  }
};
