// auth.js
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

export const jwtMiddleware = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://9cf28bb0-79d1-4ef0-bdc0-170f670708f4.ciamlogin.com/9cf28bb0-79d1-4ef0-bdc0-170f670708f4/discovery/v2.0/keys" //process.env.JWK_URI
  }),
  audience: "b31552fd-fb5a-4c61-9d87-0b54fa8905a0", //process.env.AUDIENCE,
  issuer: "https://9cf28bb0-79d1-4ef0-bdc0-170f670708f4.ciamlogin.com/9cf28bb0-79d1-4ef0-bdc0-170f670708f4/v2.0", //process.env.ISSUER,
  algorithms: ['RS256'],
  credentialsRequired: false
});
