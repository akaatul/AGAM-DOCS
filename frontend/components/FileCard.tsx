'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileExcel, 
  FaFileAlt, FaFileImage, FaFile, FaDownload, FaSpinner,
  FaObjectGroup, FaHeart
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ProcessedFile } from '@/lib/api';
import Button from './Button';
import { truncateText } from '@/lib/utils';

interface ProcessedFileCardProps {
  file: ProcessedFile;
  onDownload: (file: ProcessedFile) => void;
  isDownloading: boolean;
}

interface SimpleFileCardProps {
  filename: string;
  fileType: string;
  onDownload: () => void;
  isDownloading: boolean;
}

interface NavigationCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

type FileCardProps = ProcessedFileCardProps | NavigationCardProps | SimpleFileCardProps;

// Helper function to determine if it's a processed file card
const isProcessedFileCard = (props: FileCardProps): props is ProcessedFileCardProps => {
  return 'file' in props && typeof props.file === 'object' && props.file !== null;
};

// Helper function to determine if it's a navigation card
const isNavigationCard = (props: FileCardProps): props is NavigationCardProps => {
  return 'href' in props;
};

// Helper function to determine if it's a simple file card
const isSimpleFileCard = (props: FileCardProps): props is SimpleFileCardProps => {
  return 'filename' in props && 'fileType' in props;
};

export default function FileCard(props: FileCardProps) {
  // For navigation cards
  if (isNavigationCard(props)) {
    const { title, description, icon, href } = props;
    
    const getNavIcon = () => {
      switch (icon) {
        case 'pdf':
          return <FaFilePdf className="text-red-500" />;
        case 'word':
          return <FaFileWord className="text-blue-500" />;
        case 'text':
          return <FaFileAlt className="text-gray-500" />;
        case 'merge':
          return <FaObjectGroup className="text-purple-500" />;
        case 'image':
          return <FaFileImage className="text-green-500" />;
        default:
          return <FaFile className="text-gray-500" />;
      }
    };
    
    return (
      <Link href={href} className="block">
        <div className="bg-white rounded-lg shadow-md p-5 border-2 border-primary-200 hover:border-primary-300 transition-colors h-full">
          <div className="flex items-center mb-3">
            <div className="text-3xl mr-3">
              {getNavIcon()}
            </div>
            <h3 className="text-lg font-medium text-gray-800 font-cursive">
              {title}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {description}
          </p>
        </div>
      </Link>
    );
  }
  
  // For simple file cards
  if (isSimpleFileCard(props)) {
    const { filename, fileType, onDownload, isDownloading } = props;
    
    // Get the appropriate icon based on file type
    const getFileIcon = () => {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return <FaFilePdf className="text-red-500" />;
        case 'docx':
          return <FaFileWord className="text-blue-500" />;
        case 'pptx':
          return <FaFilePowerpoint className="text-orange-500" />;
        case 'xlsx':
        case 'xls':
          return <FaFileExcel className="text-green-500" />;
        case 'txt':
          return <FaFileAlt className="text-gray-500" />;
        case 'png':
        case 'jpg':
        case 'jpeg':
          return <FaFileImage className="text-purple-500" />;
        default:
          return <FaFile className="text-gray-500" />;
      }
    };
    
    return (
      <motion.div 
        className="bg-white rounded-lg shadow-md p-4 border-2 border-primary-200 transition-colors"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center mb-3">
          <div className="text-3xl mr-3">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-primary-600 truncate font-cursive" title={filename}>
              {truncateText(filename, 25)}
            </h3>
            <p className="text-sm text-gray-500">
              {fileType.toUpperCase()} file
            </p>
          </div>
        </div>
        
        <div className="mt-3">
          <Button
            onClick={onDownload}
            isLoading={isDownloading}
            className="w-full"
            variant="valentine"
            size="sm"
          >
            {isDownloading ? (
              <FaHeart className="animate-heartbeat mr-2" />
            ) : (
              <FaDownload className="mr-2" />
            )}
            Download File
          </Button>
        </div>
      </motion.div>
    );
  }
  
  // For processed file cards
  if (isProcessedFileCard(props)) {
    const { file, onDownload, isDownloading } = props;
    
    // Get the appropriate icon based on file type
    const getFileIcon = () => {
      if (!file || !file.file_type) return <FaFile className="text-gray-500" />;
      
      switch (file.file_type) {
        case 'pdf':
          return <FaFilePdf className="text-red-500" />;
        case 'docx':
          return <FaFileWord className="text-blue-500" />;
        case 'pptx':
          return <FaFilePowerpoint className="text-orange-500" />;
        case 'xlsx':
          return <FaFileExcel className="text-green-500" />;
        case 'txt':
          return <FaFileAlt className="text-gray-500" />;
        case 'png':
        case 'jpg':
        case 'jpeg':
          return <FaFileImage className="text-purple-500" />;
        default:
          return <FaFile className="text-gray-500" />;
      }
    };
    
    // Get the status color
    const getStatusColor = () => {
      if (!file || !file.status) return 'bg-gray-100 text-gray-800';
      
      switch (file.status) {
        case 'completed':
          return 'bg-green-100 text-green-800';
        case 'processing':
          return 'bg-blue-100 text-blue-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'failed':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-2 border-primary-200 hover:border-primary-300 transition-colors">
        <div className="flex items-center mb-3">
          <div className="text-3xl mr-3">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-primary-600 truncate font-cursive" title={file.original_filename}>
              {truncateText(file.original_filename, 25)}
            </h3>
            <p className="text-sm text-gray-500">
              {file.operation === 'convert_to_pdf' ? 'Convert to PDF' : 
               file.operation === 'pdf_to_docx' ? 'PDF to DOCX' : 
               file.operation === 'pdf_to_txt' ? 'PDF to TXT' : 
               file.operation === 'pdf_to_pptx' ? 'PDF to PPTX' : file.operation}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {file.status}
          </div>
        </div>
        
        {file.status === 'processing' && (
          <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
            <FaHeart className="animate-heartbeat text-primary-500 mr-2" />
            <span className="text-primary-700">Processing your file...</span>
          </div>
        )}
        
        {file.status === 'failed' && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-red-700 text-sm">
              Error: {file.error_message || 'An unknown error occurred'}
            </p>
          </div>
        )}
        
        {file.status === 'completed' && file.download_url && (
          <div className="mt-3">
            <Button
              onClick={() => onDownload(file)}
              isLoading={isDownloading}
              className="w-full"
              variant="valentine"
              size="sm"
            >
              <FaDownload className="mr-2" />
              Download {file.processed_filename || 'File'}
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback
  return <div className="p-4 border border-gray-300 rounded-lg">Invalid file card props</div>;
} 