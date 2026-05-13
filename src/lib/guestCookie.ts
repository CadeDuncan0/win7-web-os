const COOKIE_NAME = 'portfolio.guest'

export function writeGuestCookie(): void {
  // SameSite gets set by default to Lax
  // Set Max-Age to an hour, change as needed
  document.cookie = `Path=${COOKIE_NAME}; Max-Age=${3600}`
}

export function clearGuestCookie(): void {
  // Using 0 for Max-Age delets cookie
  document.cookie = `Path=${COOKIE_NAME}; Max-Age=${0}`
}

export const GUEST_COOKIE_NAME = COOKIE_NAME
