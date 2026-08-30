import { isPrivateHost } from '@utils/is-private-host';

const hostnameOf = (url: string) => new URL(url).hostname;

describe('isPrivateHost', () => {
  it('Should accept public hostnames and public IPs', () => {
    expect(isPrivateHost('cdn.example.com')).toBe(false);
    expect(isPrivateHost('8.8.8.8')).toBe(false);
    expect(isPrivateHost('172.32.0.1')).toBe(false);
    expect(isPrivateHost('[2606:4700:4700::1111]')).toBe(false);
  });

  it('Should reject loopback and the unspecified address', () => {
    expect(isPrivateHost('localhost')).toBe(true);
    expect(isPrivateHost('LOCALHOST')).toBe(true);
    expect(isPrivateHost('127.0.0.1')).toBe(true);
    expect(isPrivateHost('127.255.255.254')).toBe(true);
    expect(isPrivateHost('0.0.0.0')).toBe(true);
    expect(isPrivateHost('[::1]')).toBe(true);
    expect(isPrivateHost('[::]')).toBe(true);
  });

  it('Should reject private, CGNAT and link-local IPv4 ranges', () => {
    expect(isPrivateHost('10.0.0.1')).toBe(true);
    expect(isPrivateHost('172.16.0.1')).toBe(true);
    expect(isPrivateHost('172.31.255.255')).toBe(true);
    expect(isPrivateHost('192.168.1.1')).toBe(true);
    expect(isPrivateHost('100.64.0.1')).toBe(true);
    expect(isPrivateHost('169.254.169.254')).toBe(true);
  });

  it('Should reject unique local and link-local IPv6 ranges', () => {
    expect(isPrivateHost('[fc00::1]')).toBe(true);
    expect(isPrivateHost('[fd12:3456:789a::1]')).toBe(true);
    expect(isPrivateHost('[fe80::1]')).toBe(true);
  });

  it('Should reject IPv4-mapped IPv6 addresses of private ranges', () => {
    expect(isPrivateHost(hostnameOf('http://[::ffff:127.0.0.1]'))).toBe(true);
    expect(isPrivateHost(hostnameOf('http://[::ffff:169.254.169.254]'))).toBe(
      true,
    );
    expect(isPrivateHost(hostnameOf('http://[::ffff:8.8.8.8]'))).toBe(false);
  });

  it('Should reject decimal, octal and hex notations of private IPs', () => {
    expect(isPrivateHost(hostnameOf('http://2130706433'))).toBe(true);
    expect(isPrivateHost(hostnameOf('http://0x7f000001'))).toBe(true);
    expect(isPrivateHost(hostnameOf('http://017700000001'))).toBe(true);
    expect(isPrivateHost(hostnameOf('http://127.1'))).toBe(true);
  });

  it('Should reject malformed IPv6 literals instead of letting them through', () => {
    expect(isPrivateHost('[not:an:address]')).toBe(true);
    expect(isPrivateHost('[::1::2]')).toBe(true);
  });
});
