
import React, { useState } from 'react';
import { Upload, BrainCircuit, ShieldCheck, FileSearch, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeHealthData } from '../services/gemini';

const AIAnalysisCenter: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMockUpload = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    // Simulated data for demo if API fails
    const mockData = "Blood Test: Hemoglobin 14.2, Cholesterol 210 (High), Vitamin D 18 (Low). Blood Pressure 135/85.";
    
    try {
      const data = await analyzeHealthData("Blood Test Panel", mockData);
      if (data) {
        setResult(data);
      } else {
        throw new Error("Analysis failed");
      }
    } catch (err) {
      setError("We couldn't analyze the data right now. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Takhet+ AI Health Lab</h1>
        <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
          Upload your lab results, EEG scans, or medical reports for instant, free interpretation by our medical AI.
        </p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50">
        {!result && !isAnalyzing ? (
          <div className="space-y-8">
            <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center group hover:border-blue-400 transition-all cursor-pointer bg-slate-50/50">
              <input type="file" className="hidden" id="health-upload" />
              <label htmlFor="health-upload" className="cursor-pointer block">
                <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-lg font-bold text-slate-700">Drop your files here</p>
                <p className="text-sm text-slate-400 mt-2">Support PDF, PNG, JPG (Max 10MB)</p>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-slate-600">Privacy Guaranteed</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                <FileSearch className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-slate-600">Instant Breakdown</span>
              </div>
            </div>

            <button 
              onClick={handleMockUpload}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              Analyze Demo Report
            </button>
          </div>
        ) : isAnalyzing ? (
          <div className="py-20 text-center space-y-6">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <div className="space-y-2">
              <p className="text-xl font-bold">Scanning Medical Terminology...</p>
              <p className="text-slate-400 animate-pulse">Our AI is correlating your data with global health standards</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Analysis Complete</h3>
                  <p className="text-sm text-slate-500">Based on provided Blood Test Panel</p>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                ${result.riskLevel === 'Low' ? 'bg-green-100 text-green-700' : 
                  result.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                Risk: {result.riskLevel}
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Executive Summary</h4>
                <div className="bg-slate-50 p-6 rounded-3xl text-slate-700 leading-relaxed">
                  {result.summary}
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Key Recommendations</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">{i+1}</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested Next Steps</h4>
                  <div className="p-4 border-2 border-blue-100 bg-blue-50/30 rounded-3xl text-sm font-medium text-blue-800">
                    {result.nextSteps}
                  </div>
                </section>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex gap-4">
              <button onClick={() => setResult(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">
                Analyze Another
              </button>
              <button className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">
                Book Specialist Review
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 text-sm">Medical Disclaimer</h4>
          <p className="text-xs text-amber-800 leading-relaxed opacity-80">
            Takhet+ AI is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health providers with any questions you may have regarding a medical condition.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisCenter;
