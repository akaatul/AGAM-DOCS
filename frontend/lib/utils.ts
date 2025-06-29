import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Checks if a file type is supported
 */
export function isSupportedFileType(filename: string): boolean {
  const supportedExtensions = ['docx', 'pptx', 'xlsx', 'xls', 'txt', 'png', 'jpg', 'jpeg', 'pdf'];
  const extension = getFileExtension(filename);
  return supportedExtensions.includes(extension);
}

/**
 * Gets file icon based on file extension
 */
export function getFileIcon(filename: string): string {
  const extension = getFileExtension(filename);
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'word';
    case 'pptx':
      return 'powerpoint';
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'txt':
      return 'text';
    case 'png':
    case 'jpg':
    case 'jpeg':
      return 'image';
    default:
      return 'file';
  }
}

/**
 * Checks if all files are of the same type
 */
export function areFilesOfSameType(files: File[]): boolean {
  if (files.length <= 1) return true;
  
  const firstExtension = getFileExtension(files[0].name);
  return files.every(file => getFileExtension(file.name) === firstExtension);
}

/**
 * Checks if file type is supported for merging
 */
export function isSupportedForMerging(filename: string): boolean {
  const supportedMergeExtensions = ['pdf', 'docx', 'pptx'];
  const extension = getFileExtension(filename);
  return supportedMergeExtensions.includes(extension);
}

/**
 * Validates file size
 */
export function isValidFileSize(file: File, maxSizeMB: number = 25): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
} 