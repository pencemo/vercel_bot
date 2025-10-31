import { ADMIN_ID } from "../config.js";

export const isAdmin = (id) => {
  const admin = ADMIN_ID == id
  return admin
}

export function isPrivateChat(ctx) {
  return ctx.chat?.type === "private";
}

