import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../routes/LandingPage';
import { LegacyPage } from '../routes/LegacyPage';
import { PlayPage } from '../routes/PlayPage';
import { PrivacyPage } from '../routes/PrivacyPage';
import { ResultPage } from '../routes/ResultPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/r/:token" element={<ResultPage />} />
      <Route path="/legacy" element={<LegacyPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
