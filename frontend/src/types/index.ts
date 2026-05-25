export type PersonalityShift =
  | 'stay'
  | 'outgoing'
  | 'adventurous'
  | 'craft'
  | 'creative'
  | 'social'
  | 'stoic';

export type ExplorationType = 'depth' | 'breadth' | 'social' | 'reverse';

export type FeedbackKind = 'interested' | 'different' | 'more';

export interface CloneVitals {
  focus: number;
  energy: number;
  curiosity: number;
}

export interface Clone {
  id: string;
  name: string;
  mbti: string;
  likes: string[];
  dislikes: string[];
  selfDescription: string;
  idealSelf: string;
  personalityShift: PersonalityShift;
  explorationType: ExplorationType;
  syncRate: number;
  vitals?: CloneVitals;
  createdAt: string;
}

export interface Topic {
  id: string;
  dateKey: string;
  title: string;
  reasoning: string;
  explorationPath: string[];
  relatedConcepts: string[];
  createdAt: string;
}

export interface CloneActivity {
  id: string;
  cloneId: string;
  occurredAt: string;
  location: string;
  activityType: string;
  summary: string;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'clone';
  text: string;
  createdAt: string;
}

export interface EncounterLogLine {
  speaker: string;
  text: string;
}

export interface EncounterLog {
  id: string;
  partnerName: string;
  location: string;
  crossTopic: string;
  dialogue: EncounterLogLine[];
  createdAt: string;
  isMock?: boolean;
}

export interface Feedback {
  topicId: string;
  kind: FeedbackKind;
  createdAt: string;
}

export interface DailyAnswerInput {
  questionKey: string;
  answer: string;
}

export interface DailyAnswersResult {
  syncRate: number;
  vitals: CloneVitals;
  explorationType: ExplorationType;
  personalityShift: PersonalityShift;
  summary: string;
}

export type ViewTab = 'note' | 'world' | 'chat';
export type ControlMode = 'auto' | 'manual';
export type CameraMode = 'third' | 'first';

export interface HumanFriend {
  id: string;
  friendId: string; // ユーザー間で共有するコード
  name: string;
  bio: string;
  addedAt: string;
}

export type ChatTarget =
  | { type: 'self' }
  | {
      type: 'agent';
      id: string;
      name: string;
      palette: string;
      topic: string;
    }
  | { type: 'human'; id: string; name: string; friendId: string };

export interface ManualInput {
  x: number; // -1..1
  z: number; // -1..1
}

export interface WorldAvatarState {
  id: 'mira' | 'sage' | 'echo';
  name: string;
  position: [number, number, number];
  rotationY: number;
  activity: string;
}
