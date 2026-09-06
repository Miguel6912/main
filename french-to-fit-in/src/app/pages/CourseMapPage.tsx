import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { useAppMeta } from '../hooks/useAppMeta';
import { CURRICULUM } from '../../content/curriculum';
import { iconForDay } from '../../content/dayIcons';
import type { Week } from '../../types';
import './CourseMapPage.css';

const WEEK_TITLES: Record<Week, string> = {
  1: 'Week 1 — Control the Interaction',
  2: 'Week 2 — Expand the World',
  3: 'Week 3 — Become Socially Conversational',
  4: 'Week 4 — Independence',
};

export function CourseMapPage() {
  const { meta } = useAppMeta();
  if (!meta) return null;

  const weeks: Week[] = [1, 2, 3, 4];

  return (
    <div className="course-map-page">
      <h1>Course Map</h1>
      <p className="course-map-intro">
        The 30-day sequence is locked and cannot be reordered. Days ahead of your current progress stay closed during
        normal use.
      </p>
      {weeks.map((week) => (
        <section key={week} className="course-map-week">
          <h2>{WEEK_TITLES[week]}</h2>
          <ul className="course-map-list">
            {CURRICULUM.filter((d) => d.week === week).map((d) => {
              const unlocked = d.dayNumber <= meta.currentDay || meta.curriculumPreviewEnabled;
              const hasContent = d.lessonBlocks.length > 0 || d.applicationMissions.length > 0;
              return (
                <li key={d.id} className={unlocked ? '' : 'course-map-locked'}>
                  <Card className="course-map-day-card">
                    <div className="course-map-day-row">
                      <span className="course-map-day-icon" aria-hidden="true">
                        {iconForDay(d.dayNumber)}
                      </span>
                      <span className="course-map-day-number">Day {d.dayNumber}</span>
                      <span className="course-map-day-title">{d.title}</span>
                      {!hasContent && <Pill tone="gold">Draft</Pill>}
                      {d.dayNumber === meta.currentDay && <Pill tone="accent">Current</Pill>}
                      {d.dayNumber < meta.currentDay && <Pill tone="sage">Done</Pill>}
                    </div>
                    {unlocked ? (
                      <Link to={`/session/${d.dayNumber}`}>Open</Link>
                    ) : (
                      <span className="course-map-locked-label">Locked</span>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
