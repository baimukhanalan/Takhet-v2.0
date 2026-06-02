type SpeechRecognitionResultHandler = (text: string) => void;

type StartVoiceInputOptions = {
  lang?: string;
  onResult: SpeechRecognitionResultHandler;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: {
    results: ArrayLike<{
      isFinal: boolean;
      0?: {
        transcript?: string;
      };
    }>;
  }) => void) | null;
  start: () => void;
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      resolve(value.includes(',') ? value.split(',')[1] : value);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const startRecordedVoiceInput = async ({
  onResult,
  onStart,
  onEnd,
  onError
}: StartVoiceInputOptions) => {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    onError?.('Голосовой ввод не поддерживается этим браузером.');
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const audio = await blobToBase64(blob);
        const response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio, mimeType: blob.type || 'audio/webm' })
        });
        const payload = await response.json();
        if (!response.ok || !payload.text) throw new Error(payload.error || 'TRANSCRIBE_FAILED');
        onResult(payload.text);
      } catch {
        onError?.('Не удалось распознать голос. Попробуйте ещё раз.');
      } finally {
        stream.getTracks().forEach((track) => track.stop());
        onEnd?.();
      }
    };
    onStart?.();
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, 5200);
    return recorder;
  } catch {
    onEnd?.();
    onError?.('Разрешите доступ к микрофону для голосового ввода.');
    return null;
  }
};

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  return (
    (window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
    (window as typeof window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition ||
    null
  );
};

export const isVoiceInputSupported = () => Boolean(getSpeechRecognition());

export const startVoiceInput = ({
  lang = 'ru-RU',
  onResult,
  onStart,
  onEnd,
  onError
}: StartVoiceInputOptions) => {
  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    void startRecordedVoiceInput({ lang, onResult, onStart, onEnd, onError });
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => onStart?.();
  recognition.onend = () => onEnd?.();
  recognition.onerror = (event) => {
    onEnd?.();
    onError?.(
      event.error === 'not-allowed'
        ? 'Разрешите доступ к микрофону для голосового ввода.'
        : 'Не удалось распознать голос. Попробуйте ещё раз.'
    );
  };
  recognition.onresult = (event) => {
    const finalResults = Array.from(event.results).filter((result) => result.isFinal);
    const source = finalResults.length > 0 ? finalResults : Array.from(event.results);
    const text = source
      .map((result) => result[0]?.transcript || '')
      .join(' ')
      .trim();
    if (text && finalResults.length > 0) onResult(text);
  };

  recognition.start();
  return recognition;
};
