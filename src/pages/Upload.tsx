import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, ArrowLeft } from 'lucide-react';
import type { Translations } from '../i18n';
import type { CareerInput, AnalysisResult, ReportData } from '../store';
import { initialInput } from '../store';
import { extractText } from '../lib/resumeExtractor';
import { parseResume } from '../api/parseResume';

interface Props {
  tr: Translations;
  generateAnalysis: (input: CareerInput) => Promise<AnalysisResult>;
  setCareerInput: (input: CareerInput) => void;
  setAnalysis: (result: AnalysisResult | null) => void;
  setReport: (report: ReportData | null) => void;
}

export function Upload({ tr, generateAnalysis, setCareerInput, setAnalysis, setReport }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Reset all state on mount so manual input data doesn't leak in
  useEffect(() => {
    setCareerInput({ ...initialInput });
    setAnalysis(null);
    setReport(null);
  }, [setCareerInput, setAnalysis, setReport]);

  function handleFile(f: File) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(f.type)) return;
    if (f.size > 5 * 1024 * 1024) return;
    setFile(f);
    setError('');
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      setLoadingMsg(tr.upload.parsing);
      const text = await extractText(file);

      setLoadingMsg(tr.upload.analyzing);
      const input = await parseResume(text);
      if (!input) {
        setError(tr.upload.parseError);
        return;
      }

      setCareerInput(input);
      const result = await generateAnalysis(input);
      setAnalysis(result);
      navigate('/preview');
    } catch {
      setError(tr.upload.parseError);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 md:py-24">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-8">{tr.upload.title}</h1>

      <div
        className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText size={40} className="text-primary" />
            <p className="font-medium text-slate-900 text-sm">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadIcon size={40} className="text-slate-300" />
            <p className="font-medium text-slate-600 text-sm">{tr.upload.dragDrop}</p>
            <p className="text-xs text-slate-400">{tr.upload.formats}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => navigate('/start')}
          className="flex items-center gap-1 px-5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 bg-white cursor-pointer"
        >
          <ArrowLeft size={16} />
          {tr.upload.back}
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {loadingMsg || tr.upload.uploading}
            </>
          ) : (
            tr.upload.analyze
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
