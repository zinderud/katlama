export interface Origami  {
    id: string;
    text?: string;
    name?: string;
    tags?: string[];
    connectedId?: string;
    added: Date;
    mimeType: string | null;
    skylink?: string;
    skylinkResized?: string;
    isPublic?: true;
    isShared?: true;
    shareLink?: string;
  }