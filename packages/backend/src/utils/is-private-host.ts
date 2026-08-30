/** Protocols an externally provided URL is allowed to use. */
export const ALLOWED_URL_PROTOCOLS = ['http:', 'https:'];

const LOCAL_HOST_NAMES = ['localhost', 'localhost.localdomain'];

const IPV4_REGEXP = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Ranges that must never be reachable from a user supplied URL:
 * loopback, private, link-local (including the cloud metadata endpoint
 * 169.254.169.254), CGNAT and reserved space.
 */
function isPrivateIpv4([a, b]: number[]) {
  return (
    a === 0 || // 0.0.0.0/8 "this network"
    a === 10 || // 10.0.0.0/8 private
    a === 127 || // 127.0.0.0/8 loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 CGNAT
    (a === 169 && b === 254) || // 169.254.0.0/16 link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 private
    (a === 192 && b === 0) || // 192.0.0.0/16 IETF protocol assignments
    (a === 192 && b === 168) || // 192.168.0.0/16 private
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 benchmarking
    a >= 224 // multicast and reserved
  );
}

/** Expand an IPv6 address into its eight 16 bit groups, null if malformed.
 * The input comes from `URL.hostname`, so it is already normalized to
 * lowercase hex groups without an embedded dotted-quad tail.
 */
function parseIpv6(address: string) {
  const halves = address.split('::');

  if (halves.length > 2) {
    return null;
  }

  const toGroups = (chunk?: string) =>
    chunk ? chunk.split(':').map((group) => parseInt(group, 16)) : [];

  const headGroups = toGroups(halves[0]);
  const tailGroups = toGroups(halves[1]);
  const groups = [...headGroups, ...tailGroups];

  if (groups.some(Number.isNaN)) {
    return null;
  }

  if (halves.length === 1) {
    return groups.length === 8 ? groups : null;
  }

  const omitted = 8 - groups.length;

  if (omitted < 0) {
    return null;
  }

  return [...headGroups, ...new Array<number>(omitted).fill(0), ...tailGroups];
}

function isPrivateIpv6(groups: number[]) {
  const leadingZeroes = groups.slice(0, 5).every((group) => group === 0);

  // :: unspecified and ::1 loopback
  if (leadingZeroes && groups[5] === 0 && groups[6] === 0 && groups[7] <= 1) {
    return true;
  }

  // ::ffff:a.b.c.d IPv4-mapped and ::a.b.c.d IPv4-compatible
  if (leadingZeroes && (groups[5] === 0xffff || groups[5] === 0)) {
    return isPrivateIpv4([
      Math.floor(groups[6] / 256),
      groups[6] % 256,
      Math.floor(groups[7] / 256),
      groups[7] % 256,
    ]);
  }

  // fc00::/7 unique local
  if (groups[0] >= 0xfc00 && groups[0] <= 0xfdff) {
    return true;
  }

  // fe80::/10 link-local
  return groups[0] >= 0xfe80 && groups[0] <= 0xfebf;
}

/** Whether a `URL.hostname` points at the server itself or at a network that
 * is not reachable from the public internet.
 *
 * Nothing on the backend fetches user supplied URLs today, so this is
 * defense-in-depth against SSRF for whenever something does (link previews,
 * thumbnailing, an image proxy).
 */
export function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();

  if (LOCAL_HOST_NAMES.includes(host)) {
    return true;
  }

  const ipv4Match = host.match(IPV4_REGEXP);

  if (ipv4Match) {
    return isPrivateIpv4(ipv4Match.slice(1).map(Number));
  }

  if (host.startsWith('[') && host.endsWith(']')) {
    const groups = parseIpv6(host.slice(1, -1));

    return groups ? isPrivateIpv6(groups) : true;
  }

  return false;
}
