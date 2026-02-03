import jwt from "jsonwebtoken";

export const ACCESS_TTL_SECONDS = Number(
  process.env.DRIVERAPP_ACCESS_TTL_SECONDS || 900
);
export const REFRESH_TTL_DAYS = Number(
  process.env.DRIVERAPP_REFRESH_TTL_DAYS || 30
);

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function signDriverAccessToken(payload: object) {
  return jwt.sign(payload, mustEnv("DRIVERAPP_JWT_SECRET"), {
    expiresIn: ACCESS_TTL_SECONDS,
  });
}

export function signDriverRefreshToken(payload: object) {
  return jwt.sign(payload, mustEnv("DRIVERAPP_JWT_REFRESH_SECRET"), {
    expiresIn: `${REFRESH_TTL_DAYS}d`,
  });
}

export function verifyDriverRefreshToken(token: string) {
  return jwt.verify(
    token,
    mustEnv("DRIVERAPP_JWT_REFRESH_SECRET")
  ) as jwt.JwtPayload;
}

export function verifyDriverAccessToken(token: string) {
  return jwt.verify(token, mustEnv("DRIVERAPP_JWT_SECRET")) as jwt.JwtPayload;
}
