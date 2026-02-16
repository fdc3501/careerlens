import { HashRouter, Routes, Route } from 'react-router-dom';
import { useAppState } from './store';
import { t } from './i18n';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Journey } from './pages/Journey';
import { DirectInput } from './pages/DirectInput';
import { Upload } from './pages/Upload';
import { Preview } from './pages/Preview';
import { Report } from './pages/Report';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Refund } from './pages/Refund';

function App() {
  const state = useAppState();
  const tr = t(state.lang);

  return (
    <HashRouter>
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
                generateAnalysis={state.generateMockAnalysis}
                setAnalysis={state.setAnalysis}
              />
            }
          />
          <Route
            path="/upload"
            element={
              <Upload
                tr={tr}
                generateAnalysis={state.generateMockAnalysis}
                setCareerInput={state.setCareerInput}
                setAnalysis={state.setAnalysis}
              />
            }
          />
          <Route
            path="/preview"
            element={<Preview tr={tr} analysis={state.analysis} />}
          />
          <Route
            path="/report"
            element={<Report tr={tr} analysis={state.analysis} careerInput={state.careerInput} />}
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
