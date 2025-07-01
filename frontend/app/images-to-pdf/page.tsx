'use client';

import { useState } from 'react';
import { FaImage, FaFilePdf, FaServer, FaLaptop, FaDownload } from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileDropzone from '@/components/FileDropzone';
import ReorderableImageList from '@/components/ReorderableImageList';
import ReactPdfRenderer from '@/components/ReactPdfRenderer';
import Button from '@/components/Button';
import { imagesToPdf, checkMergeJobStatus, MergeJob } from '@/lib/api';
import { getFileExtension } from '@/lib/utils';
import toast from 'react-hot-toast';

type ConversionMethod = 'server' | 'client';

export default function ImagesToPdfPage() {
  const [images, setImages] = useState<File[]>([]);
  const [outputFilename, setOutputFilename] = useState<string>('combined_images');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mergeJob, setMergeJob] = useState<MergeJob | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [conversionMethod, setConversionMethod] = useState<ConversionMethod>('server');
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  
  const handleFilesAccepted = (acceptedFiles: File[]) => {
    // Filter only image files
    const imageFiles = acceptedFiles.filter(file => {
      const ext = getFileExtension(file.name);
      return ['png', 'jpg', 'jpeg'].includes(ext);
    });
    
    if (imageFiles.length === 0) {
      toast.error('Please upload only image files (PNG, JPG, JPEG)');
      return;
    }
    
    setImages(prev => [...prev, ...imageFiles]);
  };
  
  const handleReorder = (reorderedImages: File[]) => {
    setImages(reorderedImages);
  };
  
  const handleRemove = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const handleServerConvert = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    if (!outputFilename) {
      toast.error('Please enter an output filename');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Use the imagesToPdf API function
      const result = await imagesToPdf(images, outputFilename);
      setMergeJob(result);
      toast.success('Images submitted for conversion to PDF');
      
      // Poll for status updates
      if (result.status === 'processing') {
        pollForStatus(result.id);
      }
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      toast.error('Failed to convert images to PDF');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const pollForStatus = async (jobId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const updatedJob = await checkMergeJobStatus(jobId);
        setMergeJob(updatedJob);
        
        if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
          clearInterval(intervalId);
          
          if (updatedJob.status === 'completed') {
            toast.success('PDF created successfully');
          } else if (updatedJob.status === 'failed') {
            toast.error(`Conversion failed: ${updatedJob.error_message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error polling for status:', error);
        clearInterval(intervalId);
      }
    }, 2000);
  };
  
  const handleDownload = () => {
    if (!mergeJob || !mergeJob.id) {
      toast.error('No PDF available to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // For direct download response from the fallback API
      if (mergeJob.id === 'direct-download' && mergeJob.merged_file) {
        // The file has already been downloaded via the fallback mechanism
        toast.success('File already downloaded');
        setIsDownloading(false);
        return;
      }

      // Get the file using the download endpoint
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/download/${mergeJob.id}/`, {
        // Don't include credentials for CORS requests
        credentials: 'omit',
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Use the output filename with the correct extension
        let filename = `${mergeJob.output_filename}.${mergeJob.file_type}`;
        
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started');
        setIsDownloading(false);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
        toast.error('Failed to download file: ' + (error.message || 'Unknown error'));
        setIsDownloading(false);
      });
    } catch (error) {
      console.error('Error initiating download:', error);
      toast.error('Failed to initiate download');
      setIsDownloading(false);
    }
  };
  
  const handleClientConvert = () => {
    setShowPdfPreview(true);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header className="mb-6" />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <section className="mb-12">
            <h1 className="text-4xl font-bold text-center mb-2 text-primary-700">
              Images to PDF
            </h1>
            <p className="text-center text-lg mb-8 text-gray-600">
              Select multiple images, arrange them in the desired order, and convert to a single PDF
            </p>
            
            <div className="bg-white p-6 rounded-hexagon shadow-lg border border-primary-100">
              <h2 className="text-2xl font-semibold mb-4 text-primary-600">Upload Your Images</h2>
              
              <FileDropzone 
                onFilesAccepted={handleFilesAccepted}
                multiple={true}
                maxFiles={20}
                className="mb-6"
                acceptedFileTypes={['png', 'jpg', 'jpeg']}
              />
              
              {images.length > 0 && (
                <>
                  <ReorderableImageList 
                    images={images}
                    onReorder={handleReorder}
                    onRemove={handleRemove}
                  />
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-700">Output Filename</h3>
                    
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={outputFilename}
                        onChange={(e) => setOutputFilename(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter output filename"
                      />
                      <div className="bg-gray-100 p-2 border border-l-0 border-gray-300 rounded-r-lg">
                        .pdf
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-700">Conversion Method</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setConversionMethod('server')}
                        className={`flex items-center p-4 rounded-lg border-2 transition-colors ${
                          conversionMethod === 'server'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <FaServer className="text-2xl text-primary-500 mr-3" />
                        <div className="text-left">
                          <h4 className="font-medium">Server-side Conversion</h4>
                          <p className="text-sm text-gray-600">
                            Better quality for large images, but may take longer
                          </p>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setConversionMethod('client')}
                        className={`flex items-center p-4 rounded-lg border-2 transition-colors ${
                          conversionMethod === 'client'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <FaLaptop className="text-2xl text-primary-500 mr-3" />
                        <div className="text-left">
                          <h4 className="font-medium">Client-side Conversion</h4>
                          <p className="text-sm text-gray-600">
                            Instant conversion in your browser with preview
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    {conversionMethod === 'server' ? (
                      <Button
                        onClick={handleServerConvert}
                        isLoading={isProcessing}
                        disabled={images.length === 0}
                        size="lg"
                        className="px-8"
                      >
                        <FaFilePdf className="mr-2" />
                        Convert to PDF
                      </Button>
                    ) : (
                      <Button
                        onClick={handleClientConvert}
                        disabled={images.length === 0}
                        size="lg"
                        className="px-8"
                      >
                        <FaFilePdf className="mr-2" />
                        Generate PDF Preview
                      </Button>
                    )}
                  </div>
                  
                  {conversionMethod === 'client' && showPdfPreview && (
                    <div className="mt-6">
                      <ReactPdfRenderer 
                        images={images}
                        outputFilename={outputFilename}
                        showPreview={true}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
          
          {mergeJob && conversionMethod === 'server' && (
            <section className="mb-8">
              <div className="bg-white rounded-hexagon shadow-md p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">
                      <FaFilePdf className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">
                        {mergeJob.output_filename}.pdf
                      </h3>
                      <p className="text-sm text-gray-500">
                        {mergeJob.files.length} images combined
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    mergeJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                    mergeJob.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    mergeJob.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {mergeJob.status}
                  </div>
                </div>
                
                {mergeJob.status === 'processing' && (
                  <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                    <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-blue-700">Processing your images...</span>
                  </div>
                )}
                
                {mergeJob.status === 'failed' && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-red-700 text-sm">
                      Error: {mergeJob.error_message || 'An unknown error occurred'}
                    </p>
                  </div>
                )}
                
                {mergeJob && mergeJob.status === 'completed' && (
                  <Button
                    onClick={handleDownload}
                    isLoading={isDownloading}
                    className="w-full"
                    variant="valentine"
                  >
                    <FaDownload className="mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 