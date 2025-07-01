'use client';

import { useState, useEffect } from 'react';
import { FaObjectGroup, FaFileAlt, FaHeart, FaExclamationTriangle, FaFilePdf, FaFileWord, FaFilePowerpoint, FaDownload } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/Button';
import { mergeFiles, checkMergeJobStatus, MergeJob } from '@/lib/api';
import { areFilesOfSameType, getFileExtension, isSupportedForMerging } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [outputFilename, setOutputFilename] = useState<string>('merged_file');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mergeJobs, setMergeJobs] = useState<MergeJob[]>([]);
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleFilesAccepted = (acceptedFiles: File[]) => {
    setErrorMessage(null);
    
    // Check if all files are of the same type
    if (!areFilesOfSameType(acceptedFiles)) {
      toast.error('All files must be of the same type for merging');
      setErrorMessage('All files must be of the same type for merging');
      return;
    }
    
    // Check if file type is supported for merging
    if (acceptedFiles.length > 0 && !isSupportedForMerging(acceptedFiles[0].name)) {
      const errorMsg = 'This file type is not supported for merging. Only PDF, DOCX, and PPTX are supported.';
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }
    
    setFiles(acceptedFiles);
    
    // Set default output filename based on first file
    if (acceptedFiles.length > 0) {
      const firstFile = acceptedFiles[0];
      const nameWithoutExt = firstFile.name.split('.').slice(0, -1).join('.');
      setOutputFilename(`${nameWithoutExt}_merged`);
    }
  };
  
  const handleMerge = async () => {
    if (files.length < 2) {
      const errorMsg = 'Please select at least two files to merge';
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }
    
    if (!outputFilename || outputFilename.trim() === '') {
      const errorMsg = 'Please enter an output filename';
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // Ensure all files are the same type
      if (!areFilesOfSameType(files)) {
        throw new Error('All files must be of the same type for merging');
      }
      
      // Validate file sizes
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('Total file size exceeds the 50MB limit');
      }
      
      // Make sure all files have valid names
      const hasInvalidNames = files.some(file => {
        const name = file.name;
        return name.includes('\\') || name.includes('/') || name.includes(':') || 
               name.includes('*') || name.includes('?') || name.includes('"') || 
               name.includes('<') || name.includes('>') || name.includes('|');
      });
      
      if (hasInvalidNames) {
        throw new Error('Some files have invalid characters in their names');
      }
      
      // Proceed with merge
      const mergeJob = await mergeFiles(files, outputFilename);
      setMergeJobs(prev => [mergeJob, ...prev]);
      toast.success('Files submitted for merging');
      
      // Start a loading toast
      toast.loading('Processing your merge job...', { id: `merge-${mergeJob.id}` });
      
      // Poll for status updates
      let pollCount = 0;
      const maxAttempts = 60; // 2 minutes max (60 * 2 seconds)
      let isMounted = true;
      
      const intervalId = setInterval(async () => {
        if (!isMounted) {
          clearInterval(intervalId);
          return;
        }
        
        try {
          pollCount++;
          
          if (pollCount > maxAttempts) {
            toast.dismiss(`merge-${mergeJob.id}`);
            toast.error('Merge operation is taking longer than expected');
            clearInterval(intervalId);
            return;
          }
          
          const updatedJob = await checkMergeJobStatus(mergeJob.id);
          
          if (isMounted) {
            setMergeJobs(prev => 
              prev.map(job => job.id === updatedJob.id ? updatedJob : job)
            );
          }
          
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            clearInterval(intervalId);
            toast.dismiss(`merge-${mergeJob.id}`);
            
            if (updatedJob.status === 'completed') {
              toast.success('Files merged successfully');
            } else if (updatedJob.status === 'failed') {
              toast.error(`Merge failed: ${updatedJob.error_message || 'Unknown error'}`);
            }
          }
        } catch (error) {
          console.error('Error polling for status:', error);
        }
      }, 2000);
      
      // Cleanup function
      return () => {
        isMounted = false;
        clearInterval(intervalId);
        toast.dismiss(`merge-${mergeJob.id}`);
      };
      
    } catch (error) {
      console.error('Error merging files:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit files for merging';
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDownload = (job: MergeJob) => {
    if (!job || !job.id) {
      toast.error('No file available to download');
      return;
    }
    
    setDownloadingJobId(job.id);
    
    try {
      // For direct download response from the fallback API
      if (job.id === 'direct-download' && job.merged_file) {
        // The file has already been downloaded via the fallback mechanism
        toast.success('File already downloaded');
        setDownloadingJobId(null);
        return;
      }

      // Get the file using the download endpoint
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/download/${job.id}/`, {
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
        const filename = `${job.output_filename}.${job.file_type}`;
        
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started');
        setDownloadingJobId(null);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
        toast.error('Failed to download file: ' + (error.message || 'Unknown error'));
        setDownloadingJobId(null);
      });
    } catch (error) {
      console.error('Error initiating download:', error);
      toast.error('Failed to initiate download');
      setDownloadingJobId(null);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header className="mb-6" />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <section className="mb-12">
            <h1 className="text-4xl font-bold text-center mb-2 text-primary-700 font-cursive">
              Merge Multiple Files
            </h1>
            <p className="text-center text-lg mb-8 text-gray-600">
              Combine multiple files of the same type into a single document
            </p>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-primary-200 love-letter">
              <h2 className="text-2xl font-semibold mb-4 text-primary-600 font-cursive">Upload Your Files</h2>
              
              <FileDropzone 
                onFilesAccepted={handleFilesAccepted}
                multiple={true}
                maxFiles={10}
                className="mb-6"
                acceptedFileTypes={['pdf', 'docx', 'pptx']}
              />
              
              {errorMessage && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <p className="text-red-700">{errorMessage}</p>
                </div>
              )}
              
              {files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2 text-primary-600 font-cursive">Output Filename</h3>
                  
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={outputFilename}
                      onChange={(e) => setOutputFilename(e.target.value)}
                      className="flex-1 p-2 border border-primary-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter output filename"
                    />
                    <div className="bg-primary-50 p-2 border border-l-0 border-primary-200 rounded-r-lg">
                      .{files.length > 0 ? getFileExtension(files[0].name) : 'pdf'}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button
                  onClick={handleMerge}
                  isLoading={isProcessing}
                  disabled={files.length < 2}
                  size="lg"
                  variant="valentine"
                  className="px-8"
                >
                  Merge Files
                </Button>
              </div>
            </div>
          </section>
          
          {mergeJobs.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary-600 font-cursive">Your Merge Jobs</h2>
              
              <div className="space-y-4">
                {mergeJobs.map(job => (
                  <div className="bg-white p-4 rounded-xl shadow-md border-2 border-primary-200 transition-colors hover:border-primary-300 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {job.file_type === 'pdf' && <FaFilePdf className="text-2xl text-primary-500 mr-3" />}
                        {job.file_type === 'docx' && <FaFileWord className="text-2xl text-primary-500 mr-3" />}
                        {job.file_type === 'pptx' && <FaFilePowerpoint className="text-2xl text-primary-500 mr-3" />}
                        <h3 className="text-lg font-medium text-primary-600 font-cursive" title={`${job.output_filename}.${job.file_type}`}>
                          {job.output_filename}.{job.file_type}
                        </h3>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.status}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      {job.files.length} files merged • {new Date(job.created_at).toLocaleString()}
                    </div>
                    
                    {job.status === 'completed' && (
                      <Button
                        onClick={() => handleDownload(job)}
                        isLoading={downloadingJobId === job.id}
                        className="w-full"
                        size="sm"
                        variant="valentine"
                      >
                        <FaDownload className="mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          <section className="mb-8">
            <div className="bg-primary-50 p-6 rounded-2xl border-2 border-primary-200">
              <h2 className="text-2xl font-semibold mb-4 text-primary-600 font-cursive">Supported File Types</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start">
                  <div className="text-2xl text-primary-500 mt-1 mr-3">
                    <FaFileAlt />
                  </div>
                  <div>
                    <h3 className="font-medium">PDF</h3>
                    <p className="text-sm text-gray-600">Combine multiple PDF documents into one</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-2xl text-primary-500 mt-1 mr-3">
                    <FaFileAlt />
                  </div>
                  <div>
                    <h3 className="font-medium">DOCX</h3>
                    <p className="text-sm text-gray-600">Merge Word documents together</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-2xl text-primary-500 mt-1 mr-3">
                    <FaFileAlt />
                  </div>
                  <div>
                    <h3 className="font-medium">PPTX</h3>
                    <p className="text-sm text-gray-600">Combine PowerPoint presentations</p>
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