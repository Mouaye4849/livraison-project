import api from '@/services/api';
import { API_BASE_URL } from '@/constants/config';
import type { ChatMessage } from '@/types';
import type { AxiosError } from 'axios';

// Spring Boot returns self-referential localhost URLs for uploaded files.
// A physical device on the LAN cannot reach localhost — it refers to the phone itself.
// Strip /api from API_BASE_URL to get the scheme+host (e.g. http://10.x.x.x:8080).
const backendBase = API_BASE_URL.replace(/\/api\/?$/, '');

function normalizeMediaUrl(url: string): string {
  return url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, backendBase);
}

function normalizeMessage(msg: ChatMessage): ChatMessage {
  if (!msg.fileUrl) return msg;
  const fixed = normalizeMediaUrl(msg.fileUrl);
  if (fixed !== msg.fileUrl) {
    console.log('[CHAT-URL] localhost → LAN:', fixed);
  }
  return { ...msg, fileUrl: fixed };
}

export const chatService = {
  async getMessages(colisId: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/chat/${colisId}`);
    return data.map(normalizeMessage);
  },

  async sendMessage(colisId: string, content: string): Promise<ChatMessage> {
    const payload = { colisId, content, type: 'TEXT' as const };

    // Explicit UTF-8 charset: without it, RN's networking layer can mis-encode
    // multi-byte chars (e.g. Arabic), producing invalid UTF-8 the backend rejects with a 500.
    console.log('[CHAT-SEND] → POST /chat/send', JSON.stringify(payload));
    try {
      const { data } = await api.post<ChatMessage>('/chat/send', payload, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
      console.log('[CHAT-SEND] ✓ response', JSON.stringify(data));
      return normalizeMessage(data);
    } catch (err) {
      const axiosErr = err as AxiosError;
      console.error('[CHAT-SEND] ✗ request payload  :', JSON.stringify(payload));
      console.error('[CHAT-SEND] ✗ status            :', axiosErr.response?.status);
      console.error('[CHAT-SEND] ✗ response data     :', JSON.stringify(axiosErr.response?.data));
      console.error('[CHAT-SEND] ✗ response headers  :', JSON.stringify(axiosErr.response?.headers));
      throw err;
    }
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
    const raw = typeof data === 'string' ? data.trim() : String(data).trim();
    const url = normalizeMediaUrl(raw);
    console.log('[DIAG-URL] uploadFile raw=', raw, ' final=', url, ' mime=', mimeType);
    return url;
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
    return normalizeMessage(data);
  },
};
