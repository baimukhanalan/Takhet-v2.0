import React, { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle2, ChevronRight, Download, FileText, Loader2, Search, ShieldAlert, Upload, X } from 'lucide-react';
import { roleApi } from '../../services/roleApi';

type PatientCase = {
  id: string;
  status: 'open' | 'active' | 'in_review' | 'closed';
  summary: string | null;
  createdAt: string;
};

type ConsultationTranscriptEntry = {
  speaker: 'patient' | 'doctor' | 'ai' | 'system';
  text: string;
  createdAt: string;
};

type UploadedDoc = {
  name: string;
  analysis: string;
};

type ConsultationReport = {
  status: 'draft' | 'awaiting_doctor' | 'confirmed';
  aiSummary: string;
  doctorRecommendations: string;
  finalReport: string;
  pdfBase64: string | null;
  uploadedDocs: UploadedDoc[];
  transcript: ConsultationTranscriptEntry[];
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const formatStatus = (value: PatientCase['status']) =>
  value === 'closed' ? 'Завершено' : value === 'in_review' ? 'На проверке' : value === 'active' ? 'В работе' : 'Открыто';

const formatSummary = (value: string | null) => {
  if (!value) return 'Описание не добавлено';
  const normalized = value.trim();
  if (!normalized) return 'Описание не добавлено';
  if (normalized === 'AI consultation request' || normalized === 'Запрос на AI-консультацию') return 'Запрос на ИИ консультацию';
  if (normalized === 'Feedback runtime verification case') return 'Завершенная консультация с отзывом пациента';
  if (normalized === 'Smoke test case from Codex runtime validation') return 'Служебное обращение';
  if (normalized === 'Test payment case from runtime validation') return 'Проверка оплаты';
  if (/^\?+$/.test(normalized) || normalized.includes('????')) return 'Описание обращения требует уточнения';
  if (normalized.startsWith('Doctor response:')) {
    const response = normalized.slice('Doctor response:'.length).trim();
    return response ? `Ответ врача: ${response}` : 'Ответ врача добавлен';
  }
  if (normalized.startsWith('AI consultation request:')) {
    const details = normalized.slice('AI consultation request:'.length).trim();
    return details ? `Запрос на ИИ консультацию: ${details}` : 'Запрос на ИИ консультацию';
  }
  return normalized;
};

const speakerLabel: Record<ConsultationTranscriptEntry['speaker'], string> = {
  patient: 'Пациент',
  doctor: 'Врач',
  ai: 'ИИ',
  system: 'Система'
};

const downloadBase64Pdf = (base64: string, fileName: string) => {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadJson = (payload: unknown, fileName: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const MedicalArchive: React.FC = () => {
  const [records, setRecords] = useState<PatientCase[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PatientCase | null>(null);
  const [selectedReport, setSelectedReport] = useState<ConsultationReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exportingCaseId, setExportingCaseId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const cases = await roleApi.patientCases();
        setRecords(cases);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить архив');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!selectedRecord) {
      setSelectedReport(null);
      return;
    }

    const loadReport = async () => {
      setReportLoading(true);
      try {
        const report = await roleApi.patientConsultationReport(selectedRecord.id);
        setSelectedReport(report);
      } catch {
        setSelectedReport(null);
      } finally {
        setReportLoading(false);
      }
    };

    void loadReport();
  }, [selectedRecord]);

  const filtered = useMemo(
    () =>
      records.filter((record) =>
        (`обращение ${record.id} ${record.summary || ''}`).toLowerCase().includes(search.toLowerCase())
      ),
    [records, search]
  );

  const handleDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const uploadSession = await roleApi.createMedicalResumableUpload({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size
      });
      const { uploadMedicalFileResumable } = await import('../services/resumableUpload');
      const uploaded = await uploadMedicalFileResumable(file, uploadSession, (percentage) => {
        setUploadProgress(percentage);
      });
      const created = await roleApi.patientCreateCase(`Медархив: загружен файл ${file.name}`);
      const analysis = [
        'Файл загружен пациентом напрямую в медицинский архив через Supabase Storage resumable upload.',
        `Хранилище: ${uploaded.bucket}/${uploaded.path}`,
        uploaded.url ? `TUS URL: ${uploaded.url}` : '',
        `Размер: ${file.size} байт`,
        'Материал доступен для будущих консультаций и разбора врачом.'
      ].filter(Boolean).join('\n');
      await roleApi.patientSaveConsultationDraft(created.id, {
        transcript: [],
        uploadedDocs: [{ name: file.name, analysis }],
        aiSummary: `Пациент загрузил файл в медицинский архив: ${file.name}`
      });
      setRecords((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSelectedRecord(created);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить файл в архив');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleExportCase = async (record: PatientCase) => {
    setExportingCaseId(record.id);
    setError(null);
    try {
      const context = await roleApi.patientExportCase(record.id);
      downloadJson(context, `takhet-case-${record.id.slice(0, 8)}.json`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Не удалось экспортировать кейс');
    } finally {
      setExportingCaseId(null);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка архива</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20 animate-in fade-in duration-700 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Медицинский архив</h1>
          <p className="text-muted-foreground font-medium text-base md:text-lg">Здесь хранится история обращений, итоговые PDF и материалы консультаций.</p>
        </div>
        <div className="space-y-3">
          <label className={`inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? `Загрузка ${uploadProgress}%` : 'Загрузить данные'}
            <input type="file" className="hidden" onChange={handleDirectUpload} disabled={uploading} />
          </label>
          {uploading && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[3.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4 md:gap-6">
          <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по обращению или описанию..."
            className="bg-transparent border-none outline-none text-base md:text-lg w-full font-bold placeholder:opacity-30"
          />
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.length > 0 ? (
            filtered.map((record) => (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary gap-4 md:gap-6"
              >
                <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.8rem] flex items-center justify-center shadow-inner shrink-0 bg-blue-50 text-primary">
                    <FileText className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-base md:text-2xl text-foreground tracking-tight break-words leading-tight">Обращение #{record.id.slice(0, 8)}</h4>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 md:mt-2">
                      <p className="text-[8px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{formatDate(record.createdAt)}</p>
                      <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
                      <p className="text-[8px] md:text-xs font-black text-primary uppercase tracking-widest">{formatStatus(record.status)}</p>
                    </div>
                    <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 font-medium line-clamp-2 italic">{formatSummary(record.summary)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6 shrink-0">
                  <span
                    className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg border ${
                      record.status === 'closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-primary border-primary/10'
                    }`}
                  >
                    {formatStatus(record.status)}
                  </span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedRecord(record);
                    }}
                    className="p-2.5 md:p-4 bg-white border border-border rounded-lg md:rounded-2xl text-primary"
                  >
                    <ChevronRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 md:py-32 text-center space-y-4">
              <Archive className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto" />
              <p className="font-black text-base md:text-xl uppercase tracking-widest text-slate-300">Архив пока пуст</p>
            </div>
          )}
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-3xl md:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
            <header className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between shrink-0 gap-4">
              <div className="flex items-center gap-4 md:gap-6 min-w-0">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-2xl font-black text-slate-900 leading-tight tracking-tight break-words">Обращение #{selectedRecord.id.slice(0, 8)}</h3>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {formatDate(selectedRecord.createdAt)} · {formatStatus(selectedRecord.status)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl hover:bg-slate-100 transition-all shrink-0">
                <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 no-scrollbar">
              <section className="space-y-4">
                <h4 className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em]">Описание</h4>
                <div className="bg-primary/5 p-6 md:p-8 rounded-2xl md:rounded-[3rem] text-base md:text-lg font-medium text-slate-800 border border-primary/10 leading-relaxed">
                  {formatSummary(selectedRecord.summary)}
                </div>
                <button
                  onClick={() => handleExportCase(selectedRecord)}
                  disabled={exportingCaseId === selectedRecord.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {exportingCaseId === selectedRecord.id ? 'Экспорт...' : 'Экспорт кейса'}
                </button>
              </section>

              <section className="space-y-4 md:space-y-6">
                <h4 className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Статус</h4>
                <div className="p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-xl md:rounded-[2rem] flex items-start gap-3 md:gap-4">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="font-medium text-sm md:text-base text-slate-600 leading-relaxed">{formatStatus(selectedRecord.status)}</span>
                </div>
              </section>

              {reportLoading ? (
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 px-6 py-8 text-sm font-bold text-slate-500">Загрузка материалов консультации...</div>
              ) : selectedReport ? (
                <>
                  {selectedReport.pdfBase64 ? (
                    <section className="space-y-4">
                      <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Итоговый PDF</h4>
                      <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-sm md:text-base font-medium text-emerald-800">Финальный PDF сформирован и доступен для скачивания из архива.</p>
                        </div>
                        <button
                          onClick={() => downloadBase64Pdf(selectedReport.pdfBase64 as string, `takhet-consultation-${selectedRecord.id.slice(0, 8)}.pdf`)}
                          className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs inline-flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Скачать PDF
                        </button>
                      </div>
                    </section>
                  ) : null}

                  {selectedReport.uploadedDocs.length > 0 ? (
                    <section className="space-y-4">
                      <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Материалы консультации</h4>
                      <div className="space-y-3">
                        {selectedReport.uploadedDocs.map((doc, index) => (
                          <div key={`${doc.name}-${index}`} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 space-y-2">
                            <div className="font-black text-slate-900 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              {doc.name}
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{doc.analysis}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {selectedReport.finalReport || selectedReport.aiSummary ? (
                    <section className="space-y-4">
                      <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Отчет консультации</h4>
                      <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 text-sm md:text-base text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                        {selectedReport.finalReport || selectedReport.aiSummary}
                      </div>
                    </section>
                  ) : null}

                  {selectedReport.transcript.length > 0 ? (
                    <section className="space-y-4">
                      <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ход консультации</h4>
                      <div className="space-y-3">
                        {selectedReport.transcript.map((item, index) => (
                          <div key={`${item.createdAt}-${index}`} className="rounded-[1.5rem] border border-slate-100 bg-white p-4">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{speakerLabel[item.speaker]}</span>
                              <span className="text-[10px] font-bold text-slate-400">{formatDateTime(item.createdAt)}</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalArchive;
