export function pageRefreshInterval(path: string): number | null {
  if (path === "/news") return 900000;
  if (path === "/" || /^\/(?:standings|calendar|races|drivers|teams|compare)(?:\/|$)/.test(path) || /^\/circuits\/[^/]+$/.test(path)) return 300000;
  return null;
}

export function pageRefreshDue(last: number, now: number, interval: number, visible: boolean, online: boolean, editing: boolean) {
  return visible && online && !editing && now - last >= interval;
}
