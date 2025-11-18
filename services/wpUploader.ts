import { WpConfig, ProcessedImage, WpMedia, WpCategory, WpPost } from '../types';

const getAuthHeader = (config: WpConfig) => `Basic ${btoa(`${config.username}:${config.password}`)}`;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    const errorMessage = errorBody?.message || 'Unknown API error';
    throw new Error(`WordPress API Error (${response.status}): ${errorMessage}`);
  }
  // Handle cases like 204 No Content which might not have a JSON body
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  return {};
}

export const testConnection = async (config: WpConfig): Promise<boolean> => {
    // This endpoint requires authentication and is a good, lightweight way to check credentials.
    const response = await fetch(`${config.url.replace(/\/$/, '')}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(config),
      },
    });
    await handleResponse(response); // This will throw an error on failure
    return true; // If it doesn't throw, the connection is successful
};

export const uploadImage = async (image: ProcessedImage, config: WpConfig): Promise<WpMedia> => {
  const response = await fetch(`${config.url.replace(/\/$/, '')}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(config),
      'Content-Disposition': `attachment; filename="${image.name}"`,
      'Content-Type': image.blob.type,
    },
    body: image.blob,
  });
  return handleResponse(response);
};

export const findOrCreateCategory = async (categoryName: string, config: WpConfig): Promise<number | null> => {
    if (!categoryName.trim()) return null;
    try {
        const baseUrl = `${config.url.replace(/\/$/, '')}/wp-json/wp/v2/categories`;
        
        // Search for existing category
        let response = await fetch(`${baseUrl}?search=${encodeURIComponent(categoryName)}`, {
            headers: { 'Authorization': getAuthHeader(config) },
        });
        let categories: WpCategory[] = await handleResponse(response);

        const exactMatch = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
        if (exactMatch) {
            return exactMatch.id;
        }

        // Create new category if not found
        response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': getAuthHeader(config),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: categoryName }),
        });
        const newCategory: WpCategory = await handleResponse(response);
        return newCategory.id;
    } catch (error) {
        console.error("Could not find or create category:", error);
        return null; // Fail gracefully, post will be uncategorized
    }
};

interface PostPayload {
    title: string;
    content: string;
    status: 'draft' | 'publish';
    categories?: number[];
    tags?: string; // API can handle comma-separated string for tags
}

export const createPost = async (payload: PostPayload, config: WpConfig): Promise<WpPost> => {
    const response = await fetch(`${config.url.replace(/\/$/, '')}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(config),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const deleteMedia = async (mediaIds: number[], config: WpConfig): Promise<void> => {
    const deletePromises = mediaIds.map(id => {
      // `force=true` is required to permanently delete, otherwise it goes to trash
      return fetch(`${config.url.replace(/\/$/, '')}/wp-json/wp/v2/media/${id}?force=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(config),
        },
      }).then(async response => {
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: response.statusText }));
          const errorMessage = errorBody?.message || 'Unknown API error';
          throw new Error(`Failed to delete media with ID ${id}: ${errorMessage}`);
        }
      });
    });
  
    // This will throw an error if any of the deletions fail
    await Promise.all(deletePromises);
};