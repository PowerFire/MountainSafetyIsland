export const MOBILE_QUERY = '(max-width:800px), (max-height:500px)'
export function isMobileLayout() { return window.matchMedia(MOBILE_QUERY).matches }
