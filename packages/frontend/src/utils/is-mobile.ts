export function isMobile(): boolean {
  if (window.matchMedia('(max-device-width: 600px)').matches) {
    return true;
  }

  return false;
}
