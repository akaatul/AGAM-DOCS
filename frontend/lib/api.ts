import axios from 'axios';

const API_BASE_URL = 'https://agam-backend.onrender.com/api';


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ProcessedFile {
  id: string;
  original_filename: string;
  processed_filename: string | null;
  file_type: string;
  operation: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  download_url: string | null;
}

export interface MergeFile {
  id: string;
  original_filename: string;
  order: number;
  created_at: string;
}

export interface MergeJob {
  id: string;
  output_filename: string;
  file_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  files: MergeFile[];
  download_url: string | null;
}

// File conversion functions
export const uploadFileForConversion = async (file: File, operation: string): Promise<ProcessedFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operation', operation);

  const response = await apiClient.post<ProcessedFile>('/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const convertToPdf = async (file: File): Promise<ProcessedFile> => {
  return uploadFileForConversion(file, 'convert_to_pdf');
};

export const convertPdfToDocx = async (file: File): Promise<ProcessedFile> => {
  return uploadFileForConversion(file, 'pdf_to_docx');
};

export const convertPdfToTxt = async (file: File): Promise<ProcessedFile> => {
  return uploadFileForConversion(file, 'pdf_to_txt');
};

export const convertPdfToPptx = async (file: File): Promise<ProcessedFile> => {
  return uploadFileForConversion(file, 'pdf_to_pptx');
};

export const convertExcelToPdf = async (file: File): Promise<ProcessedFile> => {
  return uploadFileForConversion(file, 'convert_to_pdf');
};

// File merging functions
export const mergeFiles = async (files: File[], outputFilename: string): Promise<MergeJob> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('output_filename', outputFilename);

  const response = await apiClient.post<MergeJob>('/merge/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Images to PDF function
export const imagesToPdf = async (images: File[], outputFilename: string): Promise<MergeJob> => {
  const formData = new FormData();
  
  images.forEach(image => {
    formData.append('files', image);
  });
  
  formData.append('output_filename', outputFilename);

  const response = await apiClient.post<MergeJob>('/images-to-pdf/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// File status check functions
export const checkProcessedFileStatus = async (fileId: string): Promise<ProcessedFile> => {
  const response = await apiClient.get<ProcessedFile>(`/processed-files/${fileId}/`);
  return response.data;
};

export const checkMergeJobStatus = async (jobId: string): Promise<MergeJob> => {
  const response = await apiClient.get<MergeJob>(`/merge-jobs/${jobId}/`);
  return response.data;
}; 