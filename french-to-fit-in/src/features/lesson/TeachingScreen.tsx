import { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { audioProvider } from '../../providers/audio';
import type { LessonBlock } from '../../types';
import './TeachingScreen.css';

interface TeachingScreenProps {
  lessonBlocks: LessonBlock[];
  onDone: () => void;
}

/**
 * One teaching block at a time -- never a wall of content. See project
 * brief LESSON UI ("one cognitive task at a time").
 */
export function TeachingScreen({ lessonBlocks, onDone }: TeachingScreenProps) {
  const [index, setIndex] = useState(0);
  const block = lessonBlocks[index];

  if (!block) {
    return (
      <Card className="teaching-card">
        <p>Nothing new to introduce today — straight to practice.</p>
        <Button onClick={onDone}>Begin practice</Button>
      </Card>
    );
  }

  const isLast = index === lessonBlocks.length - 1;

  function playAudio(text: string) {
    audioProvider.speak(text, { difficulty: 'CLEAN' });
  }

  return (
    <Card className="teaching-card">
      <p className="teaching-progress">
        Today's material &middot; {index + 1} of {lessonBlocks.length}
      </p>
      <p className="teaching-text">{block.text}</p>

      {block.soundAnchor && (
        <div className="sound-anchor">
          <div className="sound-anchor-label">Sound: {block.soundAnchor.sound}</div>
          <p>{block.soundAnchor.anchor}</p>
          <p className="sound-anchor-articulation">{block.soundAnchor.articulation}</p>
        </div>
      )}

      {block.modelFrench && block.modelFrench.length > 0 && (
        <ul className="model-sentence-list">
          {block.modelFrench.map((sentence) => (
            <li key={sentence}>
              <span className="model-sentence-text">{sentence}</span>
              <button
                type="button"
                className="play-audio-btn"
                onClick={() => playAudio(sentence)}
                aria-label={`Play audio: ${sentence}`}
              >
                &#9658; Listen
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="teaching-actions">
        {isLast ? (
          <Button onClick={onDone}>Begin practice</Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>Continue</Button>
        )}
      </div>
    </Card>
  );
}
