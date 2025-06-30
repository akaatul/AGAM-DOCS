'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaFilePdf, FaFileWord, FaFileAlt, FaFilePowerpoint, FaFileExcel, FaHeart, FaTimesCircle } from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/Button';
import FileCard from '@/components/FileCard';
import { convertToPdf, convertPdfToDocx, convertPdfToTxt, convertPdfToPptx } from '@/lib/api';
import { getFileExtension } from '@/lib/utils';
import toast from 'react-hot-toast';

type ConversionType = 'to-pdf' | 'to-docx' | 'to-txt' | 'to-pptx';

export default function ConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>('to-pdf');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFilesAccepted = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Reset all state
      setError(null);
      setIsProcessing(false);
      
      // Set the new file
      setFile(acceptedFiles[0]);
      
      // Auto-detect conversion type based on file extension
      const extension = getFileExtension(acceptedFiles[0].name).toLowerCase();
      if (extension === 'pdf') {
        setConversionType('to-docx');
      } else {
        setConversionType('to-pdf');
      }
    }
  };
  
  const handleConvert = async () => {
    if (!file) {
      toast.error('Please upload a file first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const fileExtension = getFileExtension(file.name).toLowerCase();
      const loadingToast = toast.loading('Converting your file...');
      
      switch (conversionType) {
        case 'to-pdf':
          if (fileExtension === 'pdf') {
            throw new Error('The file is already a PDF');
          }
          await convertToPdf(file);
          break;
          
        case 'to-docx':
          if (fileExtension !== 'pdf') {
            throw new Error('Only PDF files can be converted to DOCX');
          }
          await convertPdfToDocx(file);
          break;
          
        case 'to-txt':
          if (fileExtension !== 'pdf') {
            throw new Error('Only PDF files can be converted to TXT');
          }
          await convertPdfToTxt(file);
          break;
          
        case 'to-pptx':
          if (fileExtension !== 'pdf') {
            throw new Error('Only PDF files can be converted to PPTX');
          }
          await convertPdfToPptx(file);
          break;
          
        default:
          throw new Error('Invalid conversion type');
      }
      
      toast.dismiss(loadingToast);
      toast.success('File converted successfully');
      
    } catch (e) {
      console.error('Error converting file:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to convert file';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const isConversionValid = (): boolean => {
    if (!file) return false;
    
    const extension = getFileExtension(file.name).toLowerCase();
    
    switch (conversionType) {
      case 'to-pdf':
        return extension !== 'pdf';
      case 'to-docx':
      case 'to-txt':
      case 'to-pptx':
        return extension === 'pdf';
      default:
        return false;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Convert Your Files</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <FileDropzone
              onFilesAccepted={handleFilesAccepted}
              accept={{
                'application/pdf': ['.pdf'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'text/plain': ['.txt']
              }}
              maxFiles={1}
              maxSizeMB={25}
            />
            
            {file && (
              <div className="mt-6">
                <FileCard
                  file={file}
                  onRemove={() => setFile(null)}
                />
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Convert to:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button
                      className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                        conversionType === 'to-pdf' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                      onClick={() => setConversionType('to-pdf')}
                      disabled={getFileExtension(file.name).toLowerCase() === 'pdf'}
                    >
                      <FaFilePdf className="text-2xl text-red-500" />
                      <span className="ml-2">PDF</span>
                    </button>
                    
                    <button
                      className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                        conversionType === 'to-docx' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                      onClick={() => setConversionType('to-docx')}
                      disabled={getFileExtension(file.name).toLowerCase() !== 'pdf'}
                    >
                      <FaFileWord className="text-2xl text-blue-500" />
                      <span className="ml-2">DOCX</span>
                    </button>
                    
                    <button
                      className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                        conversionType === 'to-txt' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                      onClick={() => setConversionType('to-txt')}
                      disabled={getFileExtension(file.name).toLowerCase() !== 'pdf'}
                    >
                      <FaFileAlt className="text-2xl text-gray-500" />
                      <span className="ml-2">TXT</span>
                    </button>
                    
                    <button
                      className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                        conversionType === 'to-pptx' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                      onClick={() => setConversionType('to-pptx')}
                      disabled={getFileExtension(file.name).toLowerCase() !== 'pdf'}
                    >
                      <FaFilePowerpoint className="text-2xl text-orange-500" />
                      <span className="ml-2">PPTX</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
                    onClick={handleConvert}
                    disabled={!isConversionValid() || isProcessing}
                    loading={isProcessing}
                  >
                    {isProcessing ? 'Converting...' : 'Convert Now'}
                  </Button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <FaTimesCircle className="flex-shrink-0 mr-2" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 