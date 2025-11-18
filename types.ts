export interface ProcessedImage {
  name: string;
  dataUrl: string;
  blob: Blob;
}

export interface WpConfig {
  url: string;
  username: string;
  password: string;
}

// New types for WP API responses
export interface WpMedia {
    id: number;
    source_url: string;
    link: string;
}

export interface WpCategory {
    id: number;
    name: string;
}

export interface WpPost {
    id: number;
    link: string;
}
