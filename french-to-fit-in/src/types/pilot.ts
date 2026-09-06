export type PilotEventType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'ANSWER_ATTEMPT'
  | 'RETRIEVAL_SUCCESS'
  | 'RETRIEVAL_FAILURE'
  | 'RESPONSE_TIME'
  | 'REMEDIATION_EVENT'
  | 'HINT_USE'
  | 'FIELD_TEST_SCORE'
  | 'ITEM_BECAME_AUTOMATIC'
  | 'ITEM_LOST_AUTOMATICITY';

export interface PilotEvent {
  id: string;
  type: PilotEventType;
  timestamp: string;
  dayNumber: number;
  itemId?: string;
  exerciseId?: string;
  responseLatencyMs?: number;
  /** Free-form payload specific to the event type, JSON-serialisable only. */
  detail?: Record<string, string | number | boolean | null>;
}
