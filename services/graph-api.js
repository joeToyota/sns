"use strict";

const fetch = require("node-fetch");
const config = require("./config");

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

module.exports = {
  async callSendAPI(requestBody) {
    const url = `${GRAPH_API_BASE}/me/messages?access_token=${config.pageAccesToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();
    if (data.error) {
      console.error("[graph-api] Send API error:", JSON.stringify(data.error));
    }
    return data;
  },

  async getUserProfile(psid) {
    const fields = "first_name,last_name,gender,locale,timezone";
    const url = `${GRAPH_API_BASE}/${psid}?fields=${fields}&access_token=${config.pageAccesToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw data.error;
    return data;
  },

  async callNLPConfigsAPI() {
    const url = `${GRAPH_API_BASE}/me/nlp_configs?nlp_enabled=true&access_token=${config.pageAccesToken}`;
    const res = await fetch(url, { method: "POST" });
    return res.json();
  }
};
