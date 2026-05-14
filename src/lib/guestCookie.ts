const COOKIE_NAME = 'portfolio.guest'

export function writeGuestCookie(): void {
  // SameSite gets set by default to Lax
  // Set Max-Age to an hour, change as needed
  // Production: add ; Secure
  document.cookie = `${COOKIE_NAME}=1; Path=/; Max-Age=${3600}`
}

export function clearGuestCookie(): void {
  // Using 0 for Max-Age deletes cookie
  document.cookie = `${COOKIE_NAME}=0; Path=/; Max-Age=${0}`
}

export const GUEST_COOKIE_NAME = COOKIE_NAME
