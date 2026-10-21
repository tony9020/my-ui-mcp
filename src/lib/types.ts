export interface Author {
  username: string;
  name: string;
  avatar: string;
}

export interface ComponentRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: Author;
  tags: string[];
  categories: string[];
  previewUrl: string | null;
  previewLight: string | null;
  previewDark: string | null;
  videoUrl: string | null;
  videoUrlDark: string | null;
  downloads: number;
  likes: number;
  bookmarks: number;
  views: number;
  createdAt: string | null;
  updatedAt: string | null;
  license: string;
  registry: string;
  dependencies: Record<string, string>;
  websiteUrl: string | null;
  sourceUrl: string | null;
  demoCode: string | null;
  componentCode: string | null;
  generated: boolean;
  gradient: [string, string];
}

export interface ComponentDataset {
  meta: { generatedAt: string; real: number; generated: number; total: number };
  categories: { slug: string; name: string; count: number | null }[];
  components: ComponentRecord[];
}

export interface CreatorProfile {
  username: string;
  name: string;
  avatar: string;
  components: ComponentRecord[];
  totalViews: number;
  totalBookmarks: number;
  totalDownloads: number;
  since: string | null;
}
