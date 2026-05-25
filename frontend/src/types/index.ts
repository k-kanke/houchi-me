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

export interface Message {
  id: string;
  role: 'user' | 'clone';
  text: string;
  createdAt: string;
}

export interface Feedback {
  topicId: string;
  kind: FeedbackKind;
  createdAt: string;
}

export type CameraMode = 'follow' | 'orbit' | 'top' | 'cinema';
export type ViewTab = 'note' | 'world' | 'chat';

export interface WorldAvatarState {
  id: 'mira' | 'sage' | 'echo';
  name: string;
  position: [number, number, number];
  rotationY: number;
  activity: string;
}
