export interface CloneRecord {
  id: string;
  name: string;
  mbti: string;
  likes: string[] | null;
  dislikes: string[] | null;
  self_description: string;
  ideal_self: string;
  personality_shift: string;
  exploration_type: string;
  sync_rate: number;
  vitals?: {
    focus?: number;
    energy?: number;
    curiosity?: number;
  } | null;
  created_at: string;
}

export interface TopicRecord {
  id: string;
  clone_id: string;
  date_key: string;
  title: string;
  reasoning: string;
  exploration_path: string[] | null;
  related_concepts: string[] | null;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  clone_id: string;
  role: 'user' | 'clone';
  text: string;
  created_at: string;
}

export interface GeneratedTopicPayload {
  title: string;
  reasoning: string;
  explorationPath: string[];
  relatedConcepts: string[];
}

export interface GeneratedActivityPayload {
  occurredAt: string;
  location: string;
  activityType: string;
  summary: string;
}

export interface GeneratedNotePayload {
  title: string;
  body: string;
  tags: string[];
}

export interface GeneratedDayPayload extends GeneratedTopicPayload {
  activities: GeneratedActivityPayload[];
  note: GeneratedNotePayload;
}

export interface EncounterDialogueLine {
  speaker: string;
  text: string;
}

export interface GeneratedEncounterPayload {
  dialogue: EncounterDialogueLine[];
  crossTopic: string;
}

export interface DailyAnswerInput {
  questionKey: string;
  answer: string;
}

export interface GeneratedDailyAnswerPayload {
  syncRateDelta: number;
  vitals: {
    focus: number;
    energy: number;
    curiosity: number;
  };
  explorationType?: string;
  personalityShift?: string;
  summary: string;
}

export interface ParsedCloneCommandPayload {
  action:
    | 'move'
    | 'summarize_day'
    | 'plan_next'
    | 'switch_mode'
    | 'chat';
  targetLocation?: 'central-desk' | 'east-shelf' | 'skylight' | 'west-shelf' | 'assembly';
  mode?: 'reflection' | 'social' | 'explore' | 'focus';
  messageToClone?: string;
  summary: string;
}
