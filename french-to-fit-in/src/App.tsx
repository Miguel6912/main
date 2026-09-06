import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './app/pages/HomePage';
import { SessionPage } from './app/pages/SessionPage';
import { CourseMapPage } from './app/pages/CourseMapPage';
import { SettingsPage } from './app/pages/SettingsPage';
import { PilotDashboardPage } from './app/pages/PilotDashboardPage';
import { FieldTestPage } from './app/pages/FieldTestPage';
import { AchievementsPage } from './app/pages/AchievementsPage';
import { AvatarPage } from './app/pages/AvatarPage';
import { ensureLedgerSeeded } from './storage/ledgerStore';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureLedgerSeeded().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/session/:dayNumber" element={<SessionPage />} />
          <Route path="/field-test/:fieldTestId" element={<FieldTestPage />} />
          <Route path="/course-map" element={<CourseMapPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="/pilot" element={<PilotDashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
