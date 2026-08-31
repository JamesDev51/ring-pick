import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../routes/LandingPage';
import { PlayPage } from '../routes/PlayPage';
import { ResultPage } from '../routes/ResultPage';
import { PrivacyPage } from '../routes/PrivacyPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
