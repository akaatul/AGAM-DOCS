import axios from 'axios';

// API client setup
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // For CORS requests, set to false unless you need to send cookies
  withCredentials: false
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log CORS errors for debugging
    if (error.message === 'Network Error') {
      console.error('CORS or network error:', error);
      console.log('Check if backend CORS settings are properly configured');
    }
    return Promise.reject(error);
  }
);

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
  file: string;
  processed_file: string | null;
}

export interface MergeFile {
  id: string;
  original_filename: string;
  file: string;
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
  merged_file: string | null;
  files: MergeFile[];
}

// File upload and conversion functions
export const uploadFile = async (file: File, operation: string): Promise<ProcessedFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operation', operation);

  try {
    const response = await apiClient.post<ProcessedFile>('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error with primary upload endpoint, trying fallback', error);
    
    // Use the no-DB fallback endpoint
    return uploadFileNoDb(file, operation);
  }
};

// Helper functions for specific conversion operations
export const uploadFileForConversion = async (file: File, operation: string): Promise<ProcessedFile> => {
  return uploadFile(file, operation);
};

export const convertToPdf = async (file: File): Promise<ProcessedFile> => {
  return uploadFile(file, 'convert_to_pdf');
};

export const pdfToDocx = async (file: File): Promise<ProcessedFile> => {
  return uploadFile(file, 'pdf_to_docx');
};

export const pdfToTxt = async (file: File): Promise<ProcessedFile> => {
  return uploadFile(file, 'pdf_to_txt');
};

export const convertPdfToPptx = async (file: File): Promise<ProcessedFile> => {
  return uploadFile(file, 'pdf_to_pptx');
};

export const convertExcelToPdf = async (file: File): Promise<ProcessedFile> => {
  return uploadFile(file, 'convert_to_pdf');
};

// For backward compatibility with existing code
export const convertPdfToDocx = pdfToDocx;
export const convertPdfToTxt = pdfToTxt;

// File merging functions
export const mergeFiles = async (files: File[], outputFilename: string): Promise<MergeJob> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('output_filename', outputFilename);

  try {
    const response = await apiClient.post<MergeJob>('/merge/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error with primary merge endpoint, trying fallback', error);
    
    // Use the no-DB fallback endpoint
    return mergeFilesNoDb(files, outputFilename);
  }
};

// Images to PDF function
export const imagesToPdf = async (files: File[], outputFilename: string): Promise<MergeJob> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('output_filename', outputFilename);

  try {
    const response = await apiClient.post<MergeJob>('/images-to-pdf/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error with primary images-to-pdf endpoint, trying fallback', error);
    
    // Use the no-DB fallback endpoint
    return imagesToPdfNoDb(files, outputFilename);
  }
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

// No-DB fallback for file upload
export const uploadFileNoDb = async (file: File, operation: string): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operation', operation);

  try {
    // This will return the file directly as a blob
    const response = await apiClient.post('/upload-no-db/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    
    // Get filename from content-disposition if available
    let filename = file.name;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    } else {
      // Generate a filename based on operation
      if (operation === 'convert_to_pdf') {
        filename = `${file.name.split('.')[0]}.pdf`;
      } else if (operation === 'pdf_to_docx') {
        filename = `${file.name.split('.')[0]}.docx`;
      } else if (operation === 'pdf_to_txt') {
        filename = `${file.name.split('.')[0]}.txt`;
      } else if (operation === 'pdf_to_pptx') {
        filename = `${file.name.split('.')[0]}.pptx`;
      }
    }
    
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Return a mock object to maintain compatibility with the API
    return {
      id: 'direct-download',
      original_filename: file.name,
      processed_filename: filename,
      file_type: file.name.split('.').pop() || '',
      operation: operation,
      status: 'completed',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file: '',
      processed_file: url,
    };
  } catch (error) {
    console.error('Fallback upload also failed', error);
    throw error;
  }
};

// No-DB fallback for file merging
export const mergeFilesNoDb = async (files: File[], outputFilename: string): Promise<any> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('output_filename', outputFilename);

  try {
    // This will return the file directly as a blob
    const response = await apiClient.post('/merge-no-db/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    
    // Get filename from content-disposition if available
    let filename = `${outputFilename}.${files[0].name.split('.').pop()}`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Return a mock object to maintain compatibility with the API
    return {
      id: 'direct-download',
      output_filename: outputFilename,
      file_type: files[0].name.split('.').pop() || '',
      status: 'completed',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      merged_file: url,
      files: files.map((file, index) => ({
        id: `file-${index}`,
        original_filename: file.name,
        file: '',
        order: index,
        created_at: new Date().toISOString(),
      })),
    };
  } catch (error) {
    console.error('Fallback merge also failed', error);
    throw error;
  }
};

// No-DB fallback for images to PDF
export const imagesToPdfNoDb = async (files: File[], outputFilename: string): Promise<any> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('output_filename', outputFilename);

  try {
    // This will return the file directly as a blob
    const response = await apiClient.post('/images-to-pdf-no-db/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    
    // Get filename from content-disposition if available
    let filename = `${outputFilename}.pdf`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Return a mock object to maintain compatibility with the API
    return {
      id: 'direct-download',
      output_filename: outputFilename,
      file_type: 'pdf',
      status: 'completed',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      merged_file: url,
      files: files.map((file, index) => ({
        id: `file-${index}`,
        original_filename: file.name,
        file: '',
        order: index,
        created_at: new Date().toISOString(),
      })),
    };
  } catch (error) {
    console.error('Fallback images-to-pdf also failed', error);
    throw error;
  }
};

// Get file status
export const getFileStatus = async (fileId: string): Promise<ProcessedFile | MergeJob> => {
  try {
    // Try to get as a processed file
    const response = await apiClient.get<ProcessedFile>(`/processed-files/${fileId}/`);
    return response.data;
  } catch (error) {
    // If not a processed file, try as a merge job
    const response = await apiClient.get<MergeJob>(`/merge-jobs/${fileId}/`);
    return response.data;
  }
};

// Download file
export const downloadFile = async (fileId: string): Promise<Blob> => {
  const response = await apiClient.get(`/download/${fileId}/`, {
    responseType: 'blob',
  });
  return response.data;
}; 