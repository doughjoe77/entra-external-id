export const msalConfig = {
  auth: {
    clientId: "404dae9d-aed8-4171-95ae-0e1ab3317a9a",
    authority: "https://jglab2.ciamlogin.com/9cf28bb0-79d1-4ef0-bdc0-170f670708f4",
    redirectUri: "http://localhost:3000",
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"]
};
