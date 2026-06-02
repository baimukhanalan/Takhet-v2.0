import * as tus from 'tus-js-client';

type ResumableUploadSession = {
  bucket: string;
  path: string;
  token: string;
  endpoint: string;
  chunkSize: number;
};

type UploadResult = {
  bucket: string;
  path: string;
  url: string | null;
};

export const uploadMedicalFileResumable = (
  file: File,
  session: ResumableUploadSession,
  onProgress: (percentage: number, uploadedBytes: number, totalBytes: number) => void
) =>
  new Promise<UploadResult>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: session.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: session.chunkSize || 6 * 1024 * 1024,
      headers: {
        'x-signature': session.token,
        'x-upsert': 'false'
      },
      metadata: {
        bucketName: session.bucket,
        objectName: session.path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        metadata: JSON.stringify({
          originalName: file.name,
          uploadedFrom: 'takhet-medical-archive'
        })
      },
      onProgress: (uploadedBytes, totalBytes) => {
        const percentage = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
        onProgress(percentage, uploadedBytes, totalBytes);
      },
      onError: (error) => {
        reject(error);
      },
      onSuccess: () => {
        resolve({
          bucket: session.bucket,
          path: session.path,
          url: upload.url || null
        });
      }
    });

    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      })
      .catch(reject);
  });
