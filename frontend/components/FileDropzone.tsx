'use client';

import { useCallback, useState, useRef, forwardRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCloudUploadAlt, FaCheckCircle, FaTimesCircle, FaHeart, FaEnvelope } from 'react-icons/fa';
import { formatBytes, isSupportedFileType, isValidFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';

type AcceptProp = {
  [key: string]: string[];
};

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  className?: string;
  accept?: AcceptProp;
}

// Custom wrapper component to handle drag and drop events
const DropzoneMotionDiv = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { children, ...rest } = props;
  return (
    <motion.div
      ref={ref}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

DropzoneMotionDiv.displayName = 'DropzoneMotionDiv';

export default function FileDropzone({
  onFilesAccepted,
  multiple = false,
  maxFiles = 10,
  maxSizeMB = 25,
  className = '',
  accept = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'text/plain': ['.txt'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg']
  }
}: FileDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [showHearts, setShowHearts] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const playChimeSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error('Audio playback failed', err));
    }
  };
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`File ${file.name} is too large (max ${maxSizeMB}MB)`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File ${file.name} has an unsupported format`);
          } else {
            toast.error(`Error with file ${file.name}: ${error.message}`);
          }
        });
      });
    }
    
    // Filter valid files
    const validFiles = acceptedFiles.filter(file => {
      const isValidSize = isValidFileSize(file, maxSizeMB);
      
      if (!isValidSize) {
        toast.error(`File ${file.name} exceeds the ${maxSizeMB}MB limit`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setShowHearts(true);
      playChimeSound();
      
      setTimeout(() => {
        setShowHearts(false);
      }, 2000);
      
      if (multiple) {
        // Check max files limit
        if (files.length + validFiles.length > maxFiles) {
          toast.error(`You can upload a maximum of ${maxFiles} files`);
          const remainingSlots = Math.max(0, maxFiles - files.length);
          const newFiles = [...files, ...validFiles.slice(0, remainingSlots)];
          setFiles(newFiles);
          onFilesAccepted(newFiles);
        } else {
          const newFiles = [...files, ...validFiles];
          setFiles(newFiles);
          onFilesAccepted(newFiles);
        }
      } else {
        // Single file mode
        setFiles([validFiles[0]]);
        onFilesAccepted([validFiles[0]]);
      }
    }
  }, [files, maxFiles, maxSizeMB, multiple, onFilesAccepted]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
    accept
  });
  
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesAccepted(newFiles);
  };
  
  return (
    <div className={`w-full ${className} relative`}>
      {/* Audio element for chime sound */}
      <audio ref={audioRef} src="/sounds/chime.mp3" preload="auto" />
      
      {/* Hearts animation on successful file drop */}
      <AnimatePresence>
        {showHearts && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-primary-500"
                initial={{ 
                  opacity: 1,
                  scale: 0,
                  x: '50%',
                  y: '50%',
                }}
                animate={{ 
                  opacity: 0,
                  scale: Math.random() * 1 + 0.5,
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  rotate: Math.random() * 360,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
              >
                <FaHeart size={Math.random() * 20 + 10} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      <DropzoneMotionDiv
        {...getRootProps()}
        className={`love-letter border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-primary-300 hover:border-primary-400 bg-white'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: isDragActive ? [0, -5, 5, -5, 0] : 0
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        >
          {isDragActive ? (
            <FaEnvelope className="mx-auto text-5xl text-primary-500 mb-4" />
          ) : (
            <FaCloudUploadAlt className="mx-auto text-5xl text-primary-500 mb-4" />
          )}
        </motion.div>
        
        <div className="text-center">
          <p className="text-lg font-medium text-primary-600 mb-2">
            {isDragActive ? (
              "Drop your files here..."
            ) : (
              "Drag & drop your files here"
            )}
          </p>
          <p className="text-sm text-gray-500">
            or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Max file size: {maxSizeMB}MB
          </p>
        </div>
      </DropzoneMotionDiv>
      
      {/* Display uploaded files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary-100"
            >
              <div className="flex items-center">
                <FaCheckCircle className="text-primary-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <FaTimesCircle />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 