import api from '@/services/api';
import type { ChatMessage } from '@/types';

export const chatService = {
  async getMessages(colisId: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/chat/${colisId}`);
    return data;
  },

  async sendMessage(colisId: string, content: string): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>('/chat/send', {
      colisId,
      content,
      type: 'TEXT',
    });
    return data;
  },

  // Upload a file (image or audio blob) — returns the hosted file URL
  async uploadFile(uri: string, mimeType: string, filename: string): Promise<string> {
    const formData = new FormData();
    // React Native FormData accepts { uri, type, name } object
    formData.append('file', { uri, type: mimeType, name: filename } as unknown as Blob);

    const { data } = await api.post<string>('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Axios may not parse plain-text response as string by default
      transformResponse: [(d) => d],
    });
    return typeof data === 'string' ? data.trim() : String(data).trim();
  },

  async sendMedia(
    colisId: string,
    type: 'IMAGE' | 'AUDIO',
    fileUrl: string,
  ): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>('/chat/send', {
      colisId,
      type,
      fileUrl,
    });
    return data;
  },
};
