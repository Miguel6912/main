/**
 * THE LOCKED 30-DAY CURRICULUM SHELL.
 *
 * Day numbers, titles, weeks and ordering below are LOCKED and must never be
 * added to, removed, reordered, or have prerequisite capabilities invented
 * for them (see src/engine/curriculumGuard.ts for automated enforcement and
 * tests/curriculumOrder.test.ts for the proof).
 *
 * Only Day 1 carries real lesson/exercise content, as a demonstration of the
 * architecture end to end. Every other day is an editable DRAFT shell with
 * the locked title/week/capability statement and empty content arrays --
 * ready for a curriculum author to populate. All content in this file,
 * Day 1 included, is `status: 'DRAFT'`: none of it should be presented to a
 * learner as canonical, curriculum-author-approved French teaching. See
 * README "How to add approved lesson content".
 */
import type { DayDefinition, WeekFieldTest } from '../types';

function shellDay(params: {
  dayNumber: number;
  title: string;
  week: 1 | 2 | 3 | 4;
  capability: string;
  fieldTestId?: string;
}): DayDefinition {
  return {
    id: `day-${params.dayNumber}`,
    dayNumber: params.dayNumber,
    title: params.title,
    week: params.week,
    capability: params.capability,
    learningOutcome:
      '[DRAFT PLACEHOLDER -- awaiting curriculum author. This day\'s learning outcome has not been authored yet.]',
    dependencies:
      params.dayNumber > 1
        ? [{ dayNumber: params.dayNumber - 1, reason: 'Sequential curriculum order (locked).' }]
        : [],
    newEngines: [],
    newVocabulary: [],
    retrievalPool: [],
    lessonBlocks: [],
    applicationMissions: [],
    fieldTestId: params.fieldTestId,
    estimatedMinutes: 15,
    status: 'DRAFT',
  };
}

const DAY_1: DayDefinition = {
  id: 'day-1',
  dayNumber: 1,
  title: 'Enter the Conversation',
  week: 1,
  capability: 'Open, sustain briefly, and close a first interaction without switching to English.',
  learningOutcome:
    'By the end of the session, the learner can greet someone, give their name, receive a name in return, and close the exchange politely -- entirely in French.',
  dependencies: [],
  newEngines: ['engine.je-mappelle'],
  newVocabulary: [
    'vocab.bonjour',
    'vocab.enchante',
    'vocab.et-vous',
    'vocab.merci',
    'vocab.sil-vous-plait',
    'vocab.excusez-moi',
    'vocab.au-revoir',
    'vocab.oui',
    'vocab.non',
  ],
  retrievalPool: [],
  lessonBlocks: [
    {
      id: 'day1-block-1',
      kind: 'EXPLANATION',
      text:
        'Almost every French interaction opens the same way, whatever happens next. Learn this one opening and you can walk into any shop, desk, or doorway in France without hesitating.',
      introducesItemIds: ['vocab.bonjour'],
    },
    {
      id: 'day1-block-2',
      kind: 'MODEL_SENTENCE',
      text: 'To give your name, French uses a fixed phrase -- not "I am", but "I call myself".',
      modelFrench: ["Bonjour, je m'appelle Alex."],
      introducesItemIds: ['engine.je-mappelle'],
    },
    {
      id: 'day1-block-3',
      kind: 'SOUND_ANCHOR',
      text: 'The "on" in "bonjour" is a nasal sound with no equivalent in English.',
      soundAnchor: {
        sound: 'on (nasal)',
        anchor: 'Say "paw" but stop before your tongue or lips close -- let the air go through your nose.',
        articulation: 'Drop the jaw slightly, round the lips a little, and let air escape through the nose, not the mouth.',
      },
    },
    {
      id: 'day1-block-4',
      kind: 'MODEL_SENTENCE',
      text: 'To hand the conversation back after introducing yourself, add a two-word question.',
      modelFrench: ['Et vous ?'],
      introducesItemIds: ['vocab.et-vous'],
    },
    {
      id: 'day1-block-5',
      kind: 'MODEL_SENTENCE',
      text: 'Meeting someone for the first time has its own polite close, and "au revoir" ends any exchange cleanly.',
      modelFrench: ['Enchanté.', 'Merci, au revoir.'],
      introducesItemIds: ['vocab.enchante', 'vocab.merci', 'vocab.au-revoir'],
    },
    {
      id: 'day1-block-6',
      kind: 'EXPLANATION',
      text:
        "Three small words carry a lot of weight: \"oui\"/\"non\" answer almost any yes/no question, and \"excusez-moi\" both apologises and gets someone's attention -- useful the moment anything goes slightly wrong.",
      introducesItemIds: ['vocab.oui', 'vocab.non', 'vocab.excusez-moi'],
    },
  ],
  applicationMissions: [
    {
      id: 'day1-mission-1',
      title: 'Introductions',
      description: 'Greet, give your name, receive a name, and close politely.',
      usesItemIds: [
        'vocab.bonjour',
        'engine.je-mappelle',
        'vocab.et-vous',
        'vocab.enchante',
        'vocab.merci',
        'vocab.au-revoir',
        'vocab.oui',
        'vocab.non',
        'vocab.excusez-moi',
      ],
      exercises: [
        {
          id: 'day1-ex-1',
          kind: 'RetrievalProduction',
          level: 1,
          promptEnglish: "How do you say \"hello\" in French?",
          usesItemIds: ['vocab.bonjour'],
          acceptableAnswers: ['bonjour'],
        },
        {
          id: 'day1-ex-2',
          kind: 'MeaningRecognition',
          level: 1,
          promptFrench: 'Enchanté.',
          promptEnglish: 'What does this mean?',
          usesItemIds: ['vocab.enchante'],
          acceptableAnswers: ['pleased to meet you', 'nice to meet you'],
        },
        {
          id: 'day1-ex-3',
          kind: 'SentenceCompletion',
          level: 2,
          promptFrench: 'Bonjour, ___ Marie.',
          promptEnglish: 'Complete the introduction.',
          usesItemIds: ['engine.je-mappelle'],
          acceptableAnswers: ["je m'appelle"],
        },
        {
          id: 'day1-ex-4',
          kind: 'ControlledTransformation',
          level: 2,
          promptFrench: "Je m'appelle Paul.",
          promptEnglish: 'Hand the question back to Paul in two words.',
          usesItemIds: ['vocab.et-vous'],
          acceptableAnswers: ['et vous', 'et vous ?'],
        },
        {
          id: 'day1-ex-5',
          kind: 'ListenAndRespond',
          level: 3,
          audioDifficulty: 'CLEAN',
          audioScript: "Bonjour, je m'appelle Sophie.",
          promptEnglish: 'Respond: greet back, give your own name, then ask hers in return.',
          usesItemIds: ['vocab.bonjour', 'engine.je-mappelle', 'vocab.et-vous'],
          acceptableAnswers: [
            "bonjour, je m'appelle",
            "bonjour je m'appelle",
          ],
        },
        {
          id: 'day1-ex-6',
          kind: 'MicroDialogue',
          level: 4,
          promptEnglish:
            'You approach the reception desk at a small hotel. Greet the receptionist, introduce yourself, respond to their reply, and close the exchange -- all in French.',
          scenarioGoal: 'Complete a full greet -> introduce -> close exchange without switching to English.',
          usesItemIds: [
            'vocab.bonjour',
            'engine.je-mappelle',
            'vocab.enchante',
            'vocab.merci',
            'vocab.au-revoir',
          ],
          acceptableAnswers: [],
        },
        {
          id: 'day1-ex-7',
          kind: 'RepairScenario',
          level: 5,
          promptEnglish:
            'The receptionist didn\'t catch your name and looks confused. Stay in French: get their attention politely and repeat yourself.',
          scenarioGoal: 'Repair a misunderstanding without reverting to English.',
          usesItemIds: ['vocab.excusez-moi', 'engine.je-mappelle'],
          acceptableAnswers: [],
        },
      ],
    },
  ],
  estimatedMinutes: 12,
  status: 'DRAFT',
};

const WEEK1_REST: DayDefinition[] = [
  shellDay({ dayNumber: 2, title: 'Express What Matters', week: 1, capability: '[DRAFT] Say what you need, want, or feel.' }),
  shellDay({ dayNumber: 3, title: 'Take Control With Questions', week: 1, capability: '[DRAFT] Ask the questions that keep an interaction moving.' }),
  shellDay({ dayNumber: 4, title: 'Stay in French When It Breaks', week: 1, capability: '[DRAFT] Recover from a misunderstanding without switching to English.' }),
  shellDay({ dayNumber: 5, title: 'Turn Sentences Into Thoughts', week: 1, capability: '[DRAFT] Link ideas into a fuller thought.' }),
  shellDay({ dayNumber: 6, title: 'Control Your World', week: 1, capability: '[DRAFT] Talk about possessions, people, and surroundings.' }),
  shellDay({ dayNumber: 7, title: 'Make Plans', week: 1, capability: '[DRAFT] Propose and agree on a plan.', fieldTestId: 'field-test-week-1' }),
];

const WEEK2: DayDefinition[] = [
  shellDay({ dayNumber: 8, title: 'Find Your Way Through a Place', week: 2, capability: '[DRAFT] Navigate a physical space and ask for directions.' }),
  shellDay({ dayNumber: 9, title: 'Describe What You Cannot Name', week: 2, capability: '[DRAFT] Describe around a gap in vocabulary.' }),
  shellDay({ dayNumber: 10, title: 'Make Yourself Precise', week: 2, capability: '[DRAFT] Add precision to a description or request.' }),
  shellDay({ dayNumber: 11, title: 'Talk About What Happened', week: 2, capability: '[DRAFT] Narrate a recent event in the past.' }),
  shellDay({ dayNumber: 12, title: "Talk About Where You've Been", week: 2, capability: '[DRAFT] Describe past experience and travel.' }),
  shellDay({ dayNumber: 13, title: 'Explain Your Normal Life', week: 2, capability: '[DRAFT] Describe habitual routines.' }),
  shellDay({ dayNumber: 14, title: 'Choose, Compare and Recommend', week: 2, capability: '[DRAFT] Compare options and make a recommendation.', fieldTestId: 'field-test-week-2' }),
];

const WEEK3: DayDefinition[] = [
  shellDay({ dayNumber: 15, title: 'Keep a Conversation Alive', week: 3, capability: '[DRAFT] Sustain a conversation past the first exchange.' }),
  shellDay({ dayNumber: 16, title: 'React Like a Human', week: 3, capability: '[DRAFT] Produce natural reactions and interjections.' }),
  shellDay({ dayNumber: 17, title: 'Turn Conversation Into Social Life', week: 3, capability: '[DRAFT] Move from talk to a social invitation or plan.' }),
  shellDay({ dayNumber: 18, title: 'Have an Opinion', week: 3, capability: '[DRAFT] State and mildly defend an opinion.' }),
  shellDay({ dayNumber: 19, title: 'Tell a Story Worth Hearing', week: 3, capability: '[DRAFT] Narrate a short story with shape.' }),
  shellDay({ dayNumber: 20, title: 'Recognise the French People Actually Speak', week: 3, capability: '[DRAFT] Recognise casual/connected spoken French.' }),
  shellDay({ dayNumber: 21, title: 'Join the Conversation', week: 3, capability: '[DRAFT] Enter and contribute to a group conversation.', fieldTestId: 'field-test-week-3' }),
];

const WEEK4: DayDefinition[] = [
  shellDay({ dayNumber: 22, title: 'Solve a Problem', week: 4, capability: '[DRAFT] Work through an unexpected problem in French.' }),
  shellDay({ dayNumber: 23, title: 'Survive Without Seeing the Other Person', week: 4, capability: '[DRAFT] Handle a phone-only interaction.' }),
  shellDay({ dayNumber: 24, title: 'Navigate Systems and Paperwork', week: 4, capability: '[DRAFT] Handle forms, bureaucracy, and official requests.' }),
  shellDay({ dayNumber: 25, title: 'Explain What Is Wrong With You', week: 4, capability: '[DRAFT] Describe a health complaint.' }),
  shellDay({ dayNumber: 26, title: 'Explain What You Do', week: 4, capability: '[DRAFT] Describe your work/studies in conversation.' }),
  shellDay({ dayNumber: 27, title: 'Handle Friction Without Losing the Conversation', week: 4, capability: '[DRAFT] Manage disagreement or friction without shutting down.' }),
  shellDay({ dayNumber: 28, title: 'Hear Through the Noise', week: 4, capability: '[DRAFT] Comprehend speech under real-world noise.' }),
  shellDay({ dayNumber: 29, title: 'Say What You Mean Without Knowing the Words', week: 4, capability: '[DRAFT] Circumlocute around missing vocabulary.' }),
  shellDay({ dayNumber: 30, title: 'Live Here', week: 4, capability: '[DRAFT] Sustain an independent day-in-the-life interaction chain.', fieldTestId: 'field-test-final' }),
];

export const CURRICULUM: DayDefinition[] = [DAY_1, ...WEEK1_REST, ...WEEK2, ...WEEK3, ...WEEK4];

export const WEEK_FIELD_TESTS: WeekFieldTest[] = [
  { id: 'field-test-week-1', afterDayNumber: 7, title: 'Week 1 Field Test' },
  { id: 'field-test-week-2', afterDayNumber: 14, title: 'Week 2 Field Test' },
  { id: 'field-test-week-3', afterDayNumber: 21, title: 'Week 3 Field Test' },
  { id: 'field-test-final', afterDayNumber: 30, title: 'Final Mission' },
];

export function getDayByNumber(dayNumber: number): DayDefinition | undefined {
  return CURRICULUM.find((d) => d.dayNumber === dayNumber);
}

export function getAllItemIdsUpToDay(dayNumber: number): Set<string> {
  const ids = new Set<string>();
  for (const day of CURRICULUM) {
    if (day.dayNumber <= dayNumber) {
      day.newEngines.forEach((id) => ids.add(id));
      day.newVocabulary.forEach((id) => ids.add(id));
    }
  }
  return ids;
}
