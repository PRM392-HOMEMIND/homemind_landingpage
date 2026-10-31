// Same API origin already used by the existing admin client. Public requests
// have a separate adapter: no admin session, cookies, CSRF or authorization.
export const publicApiOrigin = process.env.NEXT_PUBLIC_HOMEMIND_API_ORIGIN || "https://api.homemind.vn";
