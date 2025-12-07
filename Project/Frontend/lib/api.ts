// Configure your backend URL here
const API_BASE_URL = 'http://localhost:8000';

export interface TextShareResponse {
  pin: string;
  expires_in_min: number;
  qr_code_base64: string;
}

export interface TextRetrieveResponse {
  message: string;
}

export interface FileShareResponse {
  pin: string;
  expires_in_min: number;
  qr_code_base64: string;
}

export interface FileListResponse {
  files: string[];
}

// Text API
export const textApi = {
  share: async (message: string): Promise<TextShareResponse> => {
    const formData = new FormData();
    formData.append('message', message);

    const response = await fetch(`${API_BASE_URL}/api/text/share`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to share text');
    }

    return response.json();
  },

  retrieve: async (pin: string): Promise<TextRetrieveResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/text/${pin}`);

    if (!response.ok) {
      throw new Error('Invalid or expired PIN');
    }

    return response.json();
  },

  update: async (pin: string, message: string): Promise<void> => {
    const formData = new FormData();
    formData.append('message', message);

    const response = await fetch(`${API_BASE_URL}/api/text/${pin}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update text');
    }
  },
};

// File API
export const fileApi = {
  share: async (files: File[]): Promise<FileShareResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/file/share`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload files');
    }

    return response.json();
  },

  list: async (pin: string): Promise<FileListResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/file/${pin}`);

    if (!response.ok) {
      throw new Error('Invalid or expired PIN');
    }

    return response.json();
  },

  download: async (pin: string, filename: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/file/${pin}/${filename}`);

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  },
};