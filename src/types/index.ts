export type Symptom =
  | 'jaw_pain'
  | 'jaw_clicking'
  | 'teeth_grinding'
  | 'headaches'
  | 'neck_tension'
  | 'ear_pain'
  | 'jaw_locking'
  | 'facial_pain';

export type Trigger =
  | 'stress'
  | 'poor_sleep'
  | 'food'
  | 'weather'
  | 'caffeine'
  | 'alcohol';

export type SubscriptionStatus = 'free' | 'trial' | 'premium' | 'expired';

export type Difficulty = 'easy' | 'moderate' | 'challenging';

export type ExerciseCategory =
  | 'stretch'
  | 'strengthen'
  | 'massage'
  | 'relaxation'
  | 'posture';

export type InsightType =
  | 'streak'
  | 'improvement'
  | 'trigger'
  | 'exercise_impact';

export interface UserProfile {
  name?: string;
  email?: string;
  symptoms: Symptom[];
  baselinePain: number;
  difficulty: Difficulty;
  reminderEnabled?: boolean;
  reminderTime?: string;
  subscriptionStatus?: SubscriptionStatus;
  createdAt?: string;
}

export interface PainLog {
  id: string;
  date: string;
  painLevel: number; // 0-10
  triggers?: Trigger[];
  notes?: string;
}

export interface ExerciseSession {
  id: string;
  date: string;
  exercises: CompletedExercise[];
  totalDuration: number;
  painBefore: number;
  painAfter: number;
}

export interface CompletedExercise {
  exerciseId: string;
  durationSeconds: number;
  repsCompleted: number;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  category: ExerciseCategory;
  durationSeconds: number;
  reps: number;
  holdSeconds: number;
  difficulty: number;
  illustration: string;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  date: string;
}
