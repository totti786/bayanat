import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.SECRET);
const token = await new SignJWT({})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(process.env.USER_ID)
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(secret);
console.log(token);
