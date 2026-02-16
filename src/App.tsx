import { HashRouter, Routes, Route } from 'react-router-dom';
import { useAppState } from './store';
import { t } from './i18n';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Journey } from './pages/Journey';
import { DirectInput } from './pages/DirectInput';
import { Upload } from './pages/Upload';
import { Preview } from './pages/Preview';
import { Report } from './pages/Report';
import { Login } from './pages/Login';
import { MyPage } from './pages/MyPage';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Refund } from './pages/Refund';

function App() {
  const state = useAppState();
  const tr = t(state.lang);

  return (
    <HashRouter>
      <AuthProvider>
        <Layout lang={state.lang} setLang={state.setLang} tr={tr}>
          <Routes>
            <Route path="/" element={<Landing tr={tr} />} />
            <Route path="/start" element={<Journey tr={tr} />} />
            <Route
              path="/input"
              element={
                <DirectInput
                  tr={tr}
                  careerInput={state.careerInput}
                  setCareerInput={state.setCareerInput}
                  generateAnalysis={state.generateAnalysis}
                  setAnalysis={state.setAnalysis}
                  setReport={state.setReport}
                />
              }
            />
            <Route
              path="/upload"
              element={
                <Upload
                  tr={tr}
                  generateAnalysis={state.generateAnalysis}
                  setCareerInput={state.setCareerInput}
                  setAnalysis={state.setAnalysis}
                  setReport={state.setReport}
                />
              }
            />
            <Route
              path="/preview"
              element={<Preview tr={tr} analysis={state.analysis} />}
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <Report
                    tr={tr}
                    analysis={state.analysis}
                    careerInput={state.careerInput}
                    report={state.report}
                    reportLoading={state.reportLoading}
                    generateReport={state.generateReport}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login tr={tr} />} />
            <Route
              path="/mypage"
              element={
                <ProtectedRoute>
                  <MyPage tr={tr} />
                </ProtectedRoute>
              }
            />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
