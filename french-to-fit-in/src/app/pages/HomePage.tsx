import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { ProgressHUD } from '../../components/ProgressHUD';
import { useAppMeta } from '../hooks/useAppMeta';
import { useWorkingKnowledge } from '../hooks/useWorkingKnowledge';
import { getDayByNumber } from '../../content/curriculum';
import { WEEK_FIELD_TESTS } from '../../content/curriculum';
import { iconForDay } from '../../content/dayIcons';
import './HomePage.css';

export function HomePage() {
  const { meta } = useAppMeta();
  const knowledge = useWorkingKnowledge(meta?.currentDay);

  if (!meta) return null;

  const day = getDayByNumber(meta.currentDay);
  const nextFieldTest = WEEK_FIELD_TESTS.find((ft) => ft.afterDayNumber >= meta.currentDay);
  const dayIsPlayable = Boolean(day && day.lessonBlocks.length > 0);

  return (
    <div className="home-page">
      <ProgressHUD totalXP={meta.totalXP} currentStreakDays={meta.currentStreakDays} showAchievementsLink />

      <section className="home-hero">
        <p className="home-eyebrow">Day {meta.currentDay} of 30</p>
        <h1>
          <span className="home-hero-icon" aria-hidden="true">
            {day ? iconForDay(day.dayNumber) : '🏁'}
          </span>
          {day ? day.title : 'Course complete'}
        </h1>
        {day && <p className="home-capability">{day.capability}</p>}
        {day ? (
          <Link to={`/session/${day.dayNumber}`}>
            <Button disabled={!dayIsPlayable}>Continue Session</Button>
          </Link>
        ) : (
          <Pill tone="sage">All 30 days complete</Pill>
        )}
        {day && !dayIsPlayable && (
          <p className="home-draft-note">
            This day's content hasn't been authored yet — see Course Map for status.
          </p>
        )}
      </section>

      {knowledge && (
        <Card className="home-knowledge-card">
          <h2 className="home-section-title">Working Knowledge</h2>
          <div className="home-knowledge-stats">
            <div>
              <div className="home-stat-number">{knowledge.introduced}</div>
              <div className="home-stat-label">Introduced</div>
            </div>
            <div>
              <div className="home-stat-number">{knowledge.reliable}</div>
              <div className="home-stat-label">Reliable</div>
            </div>
            <div>
              <div className="home-stat-number">{knowledge.automatic}</div>
              <div className="home-stat-label">Automatic</div>
            </div>
          </div>
        </Card>
      )}

      {nextFieldTest && (
        <Card className="home-field-test-card">
          <h2 className="home-section-title">Next Field Test</h2>
          <p>
            {nextFieldTest.title} &middot; after Day {nextFieldTest.afterDayNumber}
          </p>
          {meta.currentDay > nextFieldTest.afterDayNumber && (
            <Link to={`/field-test/${nextFieldTest.id}`}>
              <Button variant="secondary">Take field test</Button>
            </Link>
          )}
        </Card>
      )}

      {knowledge && knowledge.weakPoints.length > 0 && (
        <Card className="home-weak-points-card">
          <h2 className="home-section-title">Recent Weak Points</h2>
          <ul className="home-weak-points-list">
            {knowledge.weakPoints.map((item) => (
              <li key={item.id}>
                <span className="home-weak-french">{item.canonicalFrench}</span>
                <span className="home-weak-meaning">{item.englishMeaning}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
