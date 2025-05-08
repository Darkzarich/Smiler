/** TODO: Think about sharing these types with backend */
export enum POST_SECTION_TYPES {
  PICTURE = 'pic',
  VIDEO = 'vid',
  TEXT = 'text',
}

export interface PostPictureSection {
  type: POST_SECTION_TYPES.PICTURE;
  hash: string;
  url: string;
  isFile?: boolean;
}

export interface PostVideoSection {
  type: POST_SECTION_TYPES.VIDEO;
  hash: string;
  url: string;
}

export interface PostTextSection {
  type: POST_SECTION_TYPES.TEXT;
  content: string;
  hash: string;
}

export type PostSection =
  | PostPictureSection
  | PostVideoSection
  | PostTextSection;
