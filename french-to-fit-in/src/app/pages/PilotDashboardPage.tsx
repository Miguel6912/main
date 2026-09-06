import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { computePilotSummary, type PilotSummary } from '../../features/pilot/pilotAnalytics';
import { getAllPilotEvents } from '../../storage/pilotStore';
import { toCSV, downloadTextFile } from '../../utils/csv';
import { useAppMeta } from '../hooks/useAppMeta';
import './PilotDashboardPage.css';

export function PilotDashboardPage() {
  const { meta } = useAppMeta();
  const [summary, setSummary] = useState<PilotSummary | null>(null);

  useEffect(() => {
    computePilotSummary().then(setSummary);
  }, []);

  if (!meta) return null;

  if (!meta.pilotModeEnabled) {
    return (
      <Card>
        <h1>Pilot Dashboard</h1>
        <p>Pilot Mode is off, so no interaction data is being captured. Turn it on in Settings to start collecting data.</p>
      </Card>
    );
  }

  if (!summary) return <p>Loading...</p>;

  async function exportCSV() {
    const events = await getAllPilotEvents();
    const rows = events.map((e) => ({
      id: e.id,
      type: e.type,
      timestamp: e.timestamp,
      dayNumber: e.dayNumber,
      itemId: e.itemId ?? '',
      exerciseId: e.exerciseId ?? '',
      responseLatencyMs: e.responseLatencyMs ?? '',
    }));
    downloadTextFile(toCSV(rows), 'pilot-events.csv', 'text/csv');
  }

  async function exportJSON() {
    const events = await getAllPilotEvents();
    downloadTextFile(JSON.stringify({ summary, events }, null, 2), 'pilot-export.json', 'application/json');
  }

  return (
    <div className="pilot-dashboard">
      <h1>Pilot Dashboard</h1>
      <p className="pilot-dashboard-note">
        Private research view. All data stays on this device -- nothing here is ever transmitted externally.
      </p>

      <div className="pilot-dashboard-actions">
        <Button onClick={exportCSV}>Export CSV</Button>
        <Button variant="secondary" onClick={exportJSON}>
          Export JSON
        </Button>
      </div>

      <Card>
        <h2>Sessions</h2>
        <p>
          {summary.completedSessions} completed / {summary.totalSessions} started
        </p>
        {summary.dropOffPoints.length > 0 && (
          <>
            <h3>Drop-off points</h3>
            <ul>
              {summary.dropOffPoints.map((d) => (
                <li key={d.sessionId}>
                  Day {d.dayNumber} &middot; started {new Date(d.startedAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <h2>Retrieval success by day</h2>
        {summary.retrievalByDay.length === 0 ? (
          <p>No retrieval data yet.</p>
        ) : (
          <ul className="pilot-list">
            {summary.retrievalByDay.map((r) => (
              <li key={r.dayNumber}>
                <span>Day {r.dayNumber}</span>
                <span>
                  {r.successes}/{r.attempts} ({Math.round(r.successRate * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2>Average response latency</h2>
        <p>
          {summary.averageResponseLatencyMs !== null
            ? `${Math.round(summary.averageResponseLatencyMs)} ms`
            : 'No timed responses yet.'}
        </p>
      </Card>

      <Card>
        <h2>Remediation frequency</h2>
        <p>{summary.remediationEventCount} remediation events recorded.</p>
      </Card>

      <Card>
        <h2>Weak vocabulary</h2>
        {summary.weakVocabulary.length === 0 ? (
          <p>Nothing flagged yet.</p>
        ) : (
          <ul className="pilot-list">
            {summary.weakVocabulary.map((i) => (
              <li key={i.id}>
                <span>{i.canonicalFrench}</span>
                <Pill tone="rose">{Math.round(i.automaticityScore * 100)}%</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2>Weak engines</h2>
        {summary.weakEngines.length === 0 ? (
          <p>Nothing flagged yet.</p>
        ) : (
          <ul className="pilot-list">
            {summary.weakEngines.map((i) => (
              <li key={i.id}>
                <span>{i.canonicalFrench}</span>
                <Pill tone="rose">{Math.round(i.automaticityScore * 100)}%</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2>Field-test scores</h2>
        {summary.fieldTestResults.length === 0 ? (
          <p>No field tests taken yet.</p>
        ) : (
          <ul className="pilot-list pilot-field-test-list">
            {summary.fieldTestResults.map((r) => (
              <li key={r.fieldTestId}>
                <span>{r.fieldTestId}</span>
                <span>
                  {r.dimensionResults.map((d) => `${d.dimension[0]}:${d.score}`).join(' ')} &middot;{' '}
                  {r.progressionJustified ? 'justified' : 'not yet'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
