import { ALLOWED_PICTURE_EXTENSIONS } from '@constants/index';
import { isValidExternalImageUrl } from '@utils/is-valid-external-image-url';

describe('isValidExternalImageUrl', () => {
  it('Should accept external HTTP and HTTPS urls with allowed image extensions', () => {
    for (const extension of ALLOWED_PICTURE_EXTENSIONS) {
      expect(
        isValidExternalImageUrl(
          `https://cdn.example.com/uploads/picture.${extension}`,
        ),
      ).toBe(true);
      expect(
        isValidExternalImageUrl(
          `http://images.example.com/uploads/picture.${extension}`,
        ),
      ).toBe(true);
    }
  });

  it('Should accept uppercase allowed image extensions and urls with query params', () => {
    expect(
      isValidExternalImageUrl(
        'https://cdn.example.com/uploads/picture.JPEG?width=800#preview',
      ),
    ).toBe(true);
  });

  it('Should reject unsupported protocols', () => {
    expect(isValidExternalImageUrl('ftp://cdn.example.com/picture.jpg')).toBe(
      false,
    );
    expect(isValidExternalImageUrl('data:image/png;base64,abc')).toBe(false);
  });

  it('Should reject localhost urls', () => {
    expect(isValidExternalImageUrl('http://localhost/picture.jpg')).toBe(false);
    expect(isValidExternalImageUrl('http://127.0.0.1/picture.jpg')).toBe(false);
    expect(isValidExternalImageUrl('http://[::1]/picture.jpg')).toBe(false);
  });

  it('Should reject private IPv4 urls', () => {
    expect(isValidExternalImageUrl('http://10.0.0.1/picture.jpg')).toBe(false);
    expect(isValidExternalImageUrl('http://172.16.0.1/picture.jpg')).toBe(
      false,
    );
    expect(isValidExternalImageUrl('http://172.31.255.255/picture.jpg')).toBe(
      false,
    );
    expect(isValidExternalImageUrl('http://192.168.1.1/picture.jpg')).toBe(
      false,
    );
  });

  it('Should reject urls without allowed image extensions', () => {
    expect(isValidExternalImageUrl('https://cdn.example.com/picture.txt')).toBe(
      false,
    );
    expect(isValidExternalImageUrl('https://cdn.example.com/picture')).toBe(
      false,
    );
    expect(isValidExternalImageUrl('https://cdn.example.com/')).toBe(false);
  });

  it('Should reject invalid urls', () => {
    expect(isValidExternalImageUrl('not-a-url')).toBe(false);
    expect(isValidExternalImageUrl('')).toBe(false);
  });
});
