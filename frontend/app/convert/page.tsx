'use client';

import { useState} from 'react';
import { motion } from 'framer-motion';
import { FaFilePdf, FaFileWord, FaFileAlt, FaFilePowerpoint, FaFileExcel, FaHeart, FaTimesCircle } from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/Button';
import FileCard from '@/components/FileCard';
import { convertToPdf, convertPdfToDocx, convertPdfToTxt, convertPdfToPptx, convertExcelToPdf, checkProcessedFileStatus, ProcessedFile } from '@/lib/api';
import { getFileExtension } from '@/lib/utils';
import toast from 'react-hot-toast';

type ConversionType = 'to-pdf' | 'to-docx' | 'to-txt' | 'to-pptx';

export default function ConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>('to-pdf');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFilesAccepted = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Reset all state first
      setProcessedFile(null);
      setError(null);
      setIsProcessing(false);
      setIsDownloading(false);
      
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
    setProcessedFile(null);
    setError(null);
    
    try {
      let result: ProcessedFile;
      const fileExtension = getFileExtension(file.name).toLowerCase();
      
      switch (conversionType) {
        case 'to-pdf':
          if (fileExtension === 'pdf') {
            throw new Error('The file is already a PDF');
          }
          
          if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            result = await convertExcelToPdf(file);
          } else {
            result = await convertToPdf(file);
          }
          break;
          
        case 'to-docx':
          if (fileExtension !== 'pdf') {
            throw new Error('Only PDF files can be converted to DOCX');
          }
          result = await convertPdfToDocx(file);
          break;
          
        case 'to-txt':
          if (fileExtension !== 'pdf') {
            throw new Error('Only PDF files can be converted to TXT');
          }
          result = await convertPdfToTxt(file);
          break;
          
        case 'to-pptx':
          if (fileExtension !== 'pdf') {
            throw new Error('Only PDF files can be converted to PPTX');
          }
          result = await convertPdfToPptx(file);
          break;
          
        default:
          throw new Error('Invalid conversion type');
      }
      
      if (!result || !result.id) {
        throw new Error('Conversion failed. Please try again.');
      }
      
      // Set the initial file state
      setProcessedFile(result);
      
      // Start polling for status if the file is still processing
      if (result.status === 'processing' || result.status === 'pending') {
        // Remove any existing toast
        toast.dismiss('processing');
        
        // Create a reference we can use to track if component unmounts
        let isMounted = true;
        
        // For LibreOffice conversions, show a processing toast
        if (fileExtension === 'xlsx' || fileExtension === 'xls' || 
            fileExtension === 'pptx' || fileExtension === 'docx') {
          toast.loading('Converting with LibreOffice...', { id: 'processing' });
        } else {
          toast.loading('Processing your file...', { id: 'processing' });
        }
        
        let pollCount = 0;
        const maxAttempts = 30; // 30 attempts x 2 seconds = 60 seconds max
        
        const interval = setInterval(async () => {
          // Check if component is still mounted
          if (!isMounted) {
            clearInterval(interval);
            return;
          }
          
          try {
            pollCount++;
            console.log(`Polling attempt ${pollCount}/${maxAttempts}`);
            
            const updatedFile = await checkProcessedFileStatus(result.id);
            console.log('File status update:', updatedFile.status, updatedFile);
            
            // Only update if component is still mounted
            if (isMounted) {
              setProcessedFile(updatedFile);
            }
            
            if (updatedFile.status === 'completed' || updatedFile.status === 'failed' || pollCount >= maxAttempts) {
              clearInterval(interval);
              toast.dismiss('processing');
              
              if (updatedFile.status === 'completed') {
                toast.success('File converted successfully');
              } else if (updatedFile.status === 'failed') {
                toast.error('Conversion failed: ' + (updatedFile.error_message || 'Unknown error'));
              } else if (pollCount >= maxAttempts) {
                toast.error('Conversion is taking longer than expected. Please check back later.');
              }
            }
          } catch (e) {
            console.error('Error checking file status:', e);
            clearInterval(interval);
            toast.dismiss('processing');
            
            if (isMounted) {
              toast.error('Error checking conversion status');
            }
          }
        }, 2000);
        
        // Clean up on component unmount
        return () => {
          isMounted = false;
          clearInterval(interval);
          toast.dismiss('processing');
        };
      } else if (result.status === 'completed') {
        toast.success('File converted successfully');
      }
    } catch (e) {
      console.error('Error converting file:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to convert file';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDownload = async () => {
    if (!processedFile || !processedFile.id) {
      toast.error('No file available to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // First check the current status of the file to get the latest download_url
      let fileWithUrl = processedFile;
      
      if (!processedFile.download_url) {
        try {
          // Fetch the latest status to get the download_url
          fileWithUrl = await checkProcessedFileStatus(processedFile.id);
        } catch (e) {
          console.error('Error fetching file status:', e);
        }
      }
      
      // Get the download URL from the processed file's media URL
      const downloadUrl = fileWithUrl.download_url;
      
      if (!downloadUrl) {
        throw new Error('File is not ready for download yet. Please wait for processing to complete.');
      }
      
      console.log('Using download URL:', downloadUrl);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Use the processed filename with the correct extension
      const filename = processedFile.processed_filename || `${processedFile.original_filename.split('.')[0]}.${getCorrectFileExtension(processedFile)}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (e) {
      console.error('Error downloading file:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to download file';
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Get the correct file extension for display and download
  const getCorrectFileExtension = (file: ProcessedFile): string => {
    if (file.operation === 'pdf_to_docx') return 'docx';
    if (file.operation === 'pdf_to_txt') return 'txt';
    if (file.operation === 'pdf_to_pptx') return 'pptx';
    if (file.operation === 'convert_to_pdf') return 'pdf';
    return file.file_type || 'pdf';
  };
  
  // Check if file is valid for the selected conversion type
  const isConversionValid = (): boolean => {
    if (!file) return false;
    
    const fileExtension = getFileExtension(file.name).toLowerCase();
    
    switch (conversionType) {
      case 'to-pdf':
        return fileExtension !== 'pdf';
      case 'to-docx':
      case 'to-txt':
      case 'to-pptx':
        return fileExtension === 'pdf';
      default:
        return false;
    }
  };
  
  // Floating hearts animation
  const FloatingHearts = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-primary-100"
          style={{
            fontSize: Math.random() * 20 + 10,
            left: `${Math.random() * 100}%`,
            top: -50,
          }}
          animate={{
            y: ['0vh', '100vh'],
            x: [0, Math.random() * 50 - 25],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <FaHeart />
        </motion.div>
      ))}
    </div>
  );
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header className="mb-6" />
      <FloatingHearts />
      
      <main className="flex-grow container mx-auto px-4 py-8 pt-32">
        <div className="max-w-4xl mx-auto">
          <section className="mb-12">
            <h1 className="text-4xl font-bold text-center mb-2 text-primary-700 font-cursive">
              Convert Your Documents
            </h1>
            <p className="text-center text-lg mb-8 text-gray-600">
              Transform your documents into different formats with just a few clicks
            </p>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-primary-200 love-letter">
              <h2 className="text-2xl font-semibold mb-4 text-primary-600 font-cursive">Upload Your File</h2>
              
              <FileDropzone 
                onFilesAccepted={handleFilesAccepted}
                multiple={false}
                className="mb-6"
              />
              
              {file && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4 text-primary-600 font-cursive">Conversion Options</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setConversionType('to-pdf')}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                        conversionType === 'to-pdf'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      } ${getFileExtension(file.name).toLowerCase() === 'pdf' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={getFileExtension(file.name).toLowerCase() !== 'pdf' ? { scale: 1.05 } : {}}
                      whileTap={getFileExtension(file.name).toLowerCase() !== 'pdf' ? { scale: 0.95 } : {}}
                      disabled={getFileExtension(file.name).toLowerCase() === 'pdf'}
                    >
                      <FaFilePdf className="text-3xl text-primary-500 mb-2" />
                      <span className="font-medium">To PDF</span>
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => setConversionType('to-docx')}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                        conversionType === 'to-docx'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      } ${getFileExtension(file.name).toLowerCase() !== 'pdf' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={getFileExtension(file.name).toLowerCase() === 'pdf' ? { scale: 1.05 } : {}}
                      whileTap={getFileExtension(file.name).toLowerCase() === 'pdf' ? { scale: 0.95 } : {}}
                      disabled={getFileExtension(file.name).toLowerCase() !== 'pdf'}
                    >
                      <FaFileWord className="text-3xl text-primary-500 mb-2" />
                      <span className="font-medium">To DOCX</span>
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => setConversionType('to-txt')}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                        conversionType === 'to-txt'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      } ${getFileExtension(file.name).toLowerCase() !== 'pdf' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={getFileExtension(file.name).toLowerCase() === 'pdf' ? { scale: 1.05 } : {}}
                      whileTap={getFileExtension(file.name).toLowerCase() === 'pdf' ? { scale: 0.95 } : {}}
                      disabled={getFileExtension(file.name).toLowerCase() !== 'pdf'}
                    >
                      <FaFileAlt className="text-3xl text-primary-500 mb-2" />
                      <span className="font-medium">To TXT</span>
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => setConversionType('to-pptx')}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                        conversionType === 'to-pptx'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      } ${getFileExtension(file.name).toLowerCase() !== 'pdf' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={getFileExtension(file.name).toLowerCase() === 'pdf' ? { scale: 1.05 } : {}}
                      whileTap={getFileExtension(file.name).toLowerCase() === 'pdf' ? { scale: 0.95 } : {}}
                      disabled={getFileExtension(file.name).toLowerCase() !== 'pdf'}
                    >
                      <FaFilePowerpoint className="text-3xl text-primary-500 mb-2" />
                      <span className="font-medium">To PPTX</span>
                    </motion.button>
                  </div>
                  
                  {!isConversionValid() && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                      <p>
                        {getFileExtension(file.name).toLowerCase() === 'pdf'
                          ? 'PDF files can be converted to DOCX, TXT, or PPTX formats'
                          : 'Non-PDF files can be converted to PDF format'}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button
                  onClick={handleConvert}
                  isLoading={isProcessing}
                  disabled={!file || !isConversionValid()}
                  size="lg"
                  variant="valentine"
                  className="px-8"
                >
                  Convert File
                </Button>
              </div>
            </div>
          </section>
          
          {processedFile && (
            <motion.section 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold mb-4 text-primary-600 font-cursive">
                {processedFile.status === 'completed' ? 'Converted File' : 'Processing File'}
              </h2>
              
              <div className="bg-white rounded-2xl shadow-md p-4 border-2 border-primary-200">
                {processedFile.status === 'processing' || processedFile.status === 'pending' ? (
                  <div className="flex items-center justify-center p-8 text-center">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-primary-500 mb-4"
                      >
                        <FaHeart size={40} />
                      </motion.div>
                      <p className="text-lg font-medium text-primary-600">Processing your file...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {processedFile.original_filename} → {getCorrectFileExtension(processedFile).toUpperCase()}
                      </p>
                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-4">
                        <motion.div 
                          className="bg-primary-500 h-2 rounded-full" 
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ 
                            repeat: Infinity,
                            duration: 2, 
                            ease: "linear" 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : processedFile.status === 'completed' ? (
                  <FileCard
                    filename={processedFile.processed_filename || 
                      `${processedFile.original_filename.split('.')[0]}.${getCorrectFileExtension(processedFile)}`}
                    fileType={getCorrectFileExtension(processedFile)}
                    onDownload={handleDownload}
                    isDownloading={isDownloading}
                  />
                ) : (
                  <div className="flex items-center justify-center p-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-red-500 mb-4">
                        <FaTimesCircle size={40} />
                      </div>
                      <p className="text-lg font-medium text-red-600">Conversion Failed</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {processedFile.error_message || 'An unknown error occurred during conversion'}
                      </p>
                      <Button
                        onClick={() => setFile(null)}
                        variant="valentine"
                        size="sm"
                        className="mt-4"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}
          
          <section className="mb-8">
            <div className="bg-primary-50 p-6 rounded-2xl border-2 border-primary-200">
              <h2 className="text-2xl font-semibold mb-4 text-primary-600 font-cursive">Supported Conversions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <FaFilePdf className="text-2xl text-primary-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium">PDF Conversion</h3>
                    <p className="text-sm text-gray-600">Convert DOCX, PPTX, XLSX, TXT, and images to PDF</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaFileWord className="text-2xl text-primary-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium">DOCX Conversion</h3>
                    <p className="text-sm text-gray-600">Convert PDF documents to editable Word files</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaFileAlt className="text-2xl text-primary-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium">TXT Extraction</h3>
                    <p className="text-sm text-gray-600">Extract plain text from PDF documents</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaFilePowerpoint className="text-2xl text-primary-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium">PPTX Conversion</h3>
                    <p className="text-sm text-gray-600">Convert PDF documents to PowerPoint presentations</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaFileExcel className="text-2xl text-primary-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium">Excel Conversion</h3>
                    <p className="text-sm text-gray-600">Convert Excel spreadsheets to PDF documents</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 