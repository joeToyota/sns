"use strict";

const fetch = require("node-fetch");
const config = require("./config");

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

module.exports = class Profile {
  setWebhook() {
    console.log(
      "[profile] Webhook subscription is managed via the Facebook App Dashboard."
    );
  }

  setThread() {
    const body = {
      get_started: { payload: "GET_STARTED" },
      greeting: [
        {
          locale: "default",
          text: "Hi {{user_first_name}}! How can I help you today?"
        }
      ]
    };
    return this.callMessengerProfileAPI(body);
  }

  setPersonas() {
    console.log("[profile] No personas configured.");
  }

  setWhitelistedDomains() {
    if (!config.whitelistedDomains.length) {
      console.log("[profile] No whitelisted domains configured.");
      return Promise.resolve();
    }
    return this.callMessengerProfileAPI({
      whitelisted_domains: config.whitelistedDomains
    });
  }

  setPageFeedWebhook() {
    console.log(
      "[profile] Page feed webhook is configured via the Facebook App Dashboard."
    );
  }

  async callMessengerProfileAPI(body) {
    const url = `${GRAPH_API_BASE}/me/messenger_profile?access_token=${config.pageAccesToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error) {
      console.error("[profile] API error:", JSON.stringify(data.error));
    }
    return data;
  }
};
