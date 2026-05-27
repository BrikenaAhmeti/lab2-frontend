import { env } from '@/config/env';
import type { ChatMessagePreview, ChatParticipant, ChatRoom } from './chatTypes';

export function participantId(participant: ChatParticipant) {
  return typeof participant === 'string' ? participant : participant.userId ?? participant.id ?? '';
}

export function participantName(participant: ChatParticipant) {
  if (typeof participant === 'string') return `User ${participant.slice(0, 8)}`;

  const fullName = [participant.firstName, participant.lastName].filter(Boolean).join(' ');
  return participant.name || fullName || participant.email || `User ${(participant.userId ?? participant.id ?? '').slice(0, 8)}`;
}

export function roomTitle(room: ChatRoom, currentUserId?: string) {
  const other = room.participants.find((participant) => participantId(participant) !== currentUserId);
  return other ? participantName(other) : 'Chat room';
}

export function previewText(message: ChatMessagePreview | null, currentUserId?: string) {
  if (!message) return 'No messages yet';

  const label = message.senderId === currentUserId ? 'You: ' : '';
  if (message.type === 'image') return `${label}Image attachment`;
  if (message.type === 'file') return `${label}File attachment`;
  return `${label}${message.content}`;
}

export function timeLabel(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export function chatFileUrl(fileUrl: string) {
  if (/^https?:\/\//.test(fileUrl)) return fileUrl;

  const base = env.NOTIFICATION_API_URL.replace(/\/$/, '');
  return fileUrl.startsWith('/') ? `${base}${fileUrl}` : `${base}/${fileUrl}`;
}
