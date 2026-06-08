"use strict";

module.exports = class User {
  constructor(psid) {
    this.psid = psid;
    this.firstName = "";
    this.lastName = "";
    this.locale = "en_US";
    this.timezone = 0;
    this.gender = "neutral";
  }

  setProfile(profile) {
    this.firstName = profile.first_name || "";
    this.lastName = profile.last_name || "";
    this.locale = profile.locale || "en_US";
    this.timezone = profile.timezone || 0;
    this.gender = profile.gender || "neutral";
  }
};
