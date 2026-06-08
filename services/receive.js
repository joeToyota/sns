"use strict";

const GraphApi = require("./graph-api");
const i18n = require("../i18n.config");

module.exports = class Receive {
  constructor(user, webhookEvent, isUserRef) {
    this.user = user || null;
    this.webhookEvent = webhookEvent || null;
    this.isUserRef = isUserRef || false;
  }

  handleMessage() {
    const event = this.webhookEvent;
    if (!event) return;

    if ("message" in event) {
      return this.handleTextMessage();
    } else if ("postback" in event) {
      return this.handlePostback();
    }
  }

  handleTextMessage() {
    const message = this.webhookEvent.message;
    const text = (message.text || "").trim().toLowerCase();

    let response;
    if (text === "help") {
      response = { text: i18n.__("help.message") };
    } else {
      const name = this.user ? this.user.firstName : "";
      response = name
        ? { text: i18n.__("echo.with_name", name, message.text) }
        : { text: i18n.__("echo.no_name", message.text) };
    }

    return this.sendMessage(response);
  }

  handlePostback() {
    const payload = this.webhookEvent.postback.payload;

    if (payload === "GET_STARTED") {
      const name = this.user ? this.user.firstName : "";
      const response = name
        ? { text: i18n.__("get_started.greeting", name) }
        : { text: i18n.__("get_started.greeting_no_name") };
      return this.sendMessage(response);
    }

    return this.sendMessage({ text: i18n.__("postback.unknown", payload) });
  }

  handlePrivateReply(type, id) {
    const requestBody = {
      recipient: { [type]: id },
      message: { text: i18n.__("private_reply.message") }
    };
    return GraphApi.callSendAPI(requestBody);
  }

  sendMessage(response, delay = 0) {
    if (!this.user) return Promise.resolve();

    const recipient = this.isUserRef
      ? { user_ref: this.user.psid }
      : { id: this.user.psid };

    const requestBody = { recipient, message: response };

    return new Promise((resolve) => {
      setTimeout(() => resolve(GraphApi.callSendAPI(requestBody)), delay);
    });
  }
};
