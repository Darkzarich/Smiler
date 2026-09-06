/** Protocols an externally provided URL is allowed to use. */
export const ALLOWED_URL_PROTOCOLS = ['http:', 'https:'];

const LOCAL_HOST_NAMES = ['localhost', 'localhost.localdomain'];

/** Suffixes that never belong to a public address: `.localhost` is reserved for
 * loopback by RFC 6761, `.local` is mDNS on the local link, and `.localdomain`
 * is what a stock resolver appends to an unqualified name.
 */
const LOCAL_HOST_SUFFIXES = ['.localhost', '.local', '.localdomain'];

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
 * A trailing dotted-quad — `::ffff:127.0.0.1`, the form a DNS lookup hands
 * back — is folded into the two groups it stands for before parsing.
 */
function parseIpv6(address: string) {
  const dottedQuad = address.match(/:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);

  if (dottedQuad) {
    const octets = dottedQuad[1].split('.').map(Number);

    if (octets.some((octet) => octet > 255)) {
      return null;
    }

    const head = address.slice(0, address.length - dottedQuad[1].length);
    const groups = [octets[0] * 256 + octets[1], octets[2] * 256 + octets[3]];

    return parseIpv6(
      `${head}${groups.map((group) => group.toString(16)).join(':')}`,
    );
  }

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

/** Whether a bare IP address — no brackets, as a DNS lookup returns it — sits
 * in a range the server must never open a connection to.
 *
 * Anything that does not parse as an address is reported private: the callers
 * are deciding whether to dial it, and an address they cannot understand is
 * not one they should be dialing.
 */
export function isPrivateIp(address: string) {
  const ipv4Match = address.match(IPV4_REGEXP);

  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);

    return octets.some((octet) => octet > 255) || isPrivateIpv4(octets);
  }

  const groups = parseIpv6(address.toLowerCase());

  return groups ? isPrivateIpv6(groups) : true;
}

/** Whether a `URL.hostname` points at the server itself or at a network that
 * is not reachable from the public internet.
 *
 * This only ever sees the name, so it cannot say where that name will resolve
 * to at connect time — `fetch-external-image` pins the resolved address with
 * `isPrivateIp` for that. Use this to turn away a url before opening a socket,
 * not as the only thing standing between a url and a request.
 */
export function isPrivateHost(hostname: string) {
  // A trailing dot makes a name fully qualified and resolves to exactly the
  // same address, but `URL` keeps it on names (it does normalize it away on
  // IPv4 literals), so `localhost.` would walk straight past an equality check.
  const host = hostname.toLowerCase().replace(/\.+$/, '');

  if (LOCAL_HOST_NAMES.includes(host)) {
    return true;
  }

  if (LOCAL_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }

  if (host.startsWith('[') && host.endsWith(']')) {
    return isPrivateIp(host.slice(1, -1));
  }

  if (IPV4_REGEXP.test(host)) {
    return isPrivateIp(host);
  }

  return false;
}
