import os
import threading
import logging
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection

from .models import ProcessedFile, MergeJob, MergeFile
from .serializers import (
    ProcessedFileSerializer, MergeJobSerializer,
    FileUploadSerializer, MergeFilesSerializer
)
from .utils import (
    get_file_extension, convert_to_pdf, pdf_to_docx,
    pdf_to_txt, merge_files, clean_temp_files, 
    merge_images_to_pdf, pdf_to_pptx,
    process_file_without_db, process_images_to_pdf_without_db,
    merge_files_without_db
)

# Configure logging
logger = logging.getLogger(__name__)


class FileUploadView(APIView):
    """View for handling file uploads and conversions - Direct streaming version"""
    
    def post(self, request):
        logger.info("FileUploadView: Received POST request")
        
        serializer = FileUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"FileUploadView: Invalid data - {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = serializer.validated_data['file']
        operation = serializer.validated_data['operation']
        
        logger.info(f"FileUploadView: Processing file '{uploaded_file.name}' with operation '{operation}'")
        
        try:
            # Skip database completely and process the file directly
            logger.info("FileUploadView: Processing file without database")
            output_path, output_filename = process_file_without_db(uploaded_file, operation)
            
            logger.info(f"FileUploadView: Processing complete, sending response with file: {output_filename}")
            
            # Return the file directly as a streaming response
            response = FileResponse(
                open(output_path, 'rb'),
                content_type='application/octet-stream',
                as_attachment=True,
                filename=output_filename
            )
            
            # Clean up after sending
            response.close_callback = lambda: self._cleanup_file(output_path)
            
            return response
            
        except Exception as e:
            logger.error(f"FileUploadView: Error processing file - {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _cleanup_file(self, file_path):
        """Clean up the file after it's been sent"""
        logger.debug(f"FileUploadView: Cleaning up temporary file {file_path}")
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.error(f"FileUploadView: Error cleaning up file {file_path} - {str(e)}")


class FileProcessNoDBView(APIView):
    """View for handling file processing without database dependency"""
    
    def post(self, request):
        logger.info("FileProcessNoDBView: Received POST request")
        
        serializer = FileUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"FileProcessNoDBView: Invalid data - {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = serializer.validated_data['file']
        operation = serializer.validated_data['operation']
        
        try:
            # Process the file without database
            logger.info(f"FileProcessNoDBView: Processing file '{uploaded_file.name}' with operation '{operation}'")
            output_path, output_filename = process_file_without_db(uploaded_file, operation)
            
            logger.info(f"FileProcessNoDBView: Processing complete, sending response with file: {output_filename}")
            
            # Return the file directly
            response = FileResponse(
                open(output_path, 'rb'),
                content_type='application/octet-stream',
                as_attachment=True,
                filename=output_filename
            )
            
            # Clean up after sending
            response.close_callback = lambda: self._cleanup_file(output_path)
            
            return response
            
        except Exception as e:
            logger.error(f"FileProcessNoDBView: Error processing file - {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _cleanup_file(self, file_path):
        """Clean up the file after it's been sent"""
        logger.debug(f"FileProcessNoDBView: Cleaning up temporary file {file_path}")
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.error(f"FileProcessNoDBView: Error cleaning up file {file_path} - {str(e)}")
            pass


class MergeFilesView(APIView):
    """View for handling file merging - Direct streaming version"""
    
    def post(self, request):
        logger.info("MergeFilesView: Received POST request")
        
        serializer = MergeFilesSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"MergeFilesView: Invalid data - {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        files = serializer.validated_data['files']
        output_filename = serializer.validated_data['output_filename']
        
        logger.info(f"MergeFilesView: Merging {len(files)} files with output filename '{output_filename}'")
        
        # Validate files
        if not files or len(files) < 2:
            logger.warning("MergeFilesView: Not enough files for merging")
            return Response(
                {'error': 'At least two files are required for merging'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure all files are of the same type
        file_types = {get_file_extension(file.name) for file in files}
        if len(file_types) > 1:
            logger.warning(f"MergeFilesView: Files of different types - {file_types}")
            return Response(
                {'error': 'All files must be of the same type for merging'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get file type from the first file
        file_type = get_file_extension(files[0].name).lower()
        
        # Check if file type is supported
        if file_type not in ['pdf', 'docx', 'pptx']:
            logger.warning(f"MergeFilesView: Unsupported file type - {file_type}")
            return Response(
                {'error': f'File type {file_type} is not supported for merging. Only PDF, DOCX, and PPTX are supported.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sanitize output filename
        safe_output_filename = os.path.basename(output_filename)
        if safe_output_filename != output_filename:
            logger.info(f"MergeFilesView: Sanitized output filename from '{output_filename}' to '{safe_output_filename}'")
            output_filename = safe_output_filename
        
        try:
            # Process the merge without database
            logger.info("MergeFilesView: Merging files without database")
            output_path, output_filename = merge_files_without_db(files, output_filename, file_type)
            
            logger.info(f"MergeFilesView: Merge complete, sending response with file: {output_filename}")
            
            # Return the file directly
            response = FileResponse(
                open(output_path, 'rb'),
                content_type='application/octet-stream',
                as_attachment=True,
                filename=output_filename
            )
            
            # Clean up after sending
            response.close_callback = lambda: self._cleanup_file(output_path)
            
            return response
            
        except Exception as e:
            logger.error(f"MergeFilesView: Error merging files - {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _cleanup_file(self, file_path):
        """Clean up the file after it's been sent"""
        logger.debug(f"MergeFilesView: Cleaning up temporary file {file_path}")
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.error(f"MergeFilesView: Error cleaning up file {file_path} - {str(e)}")


class ImagesToPdfView(APIView):
    """View for handling images to PDF conversion - Direct streaming version"""
    
    def post(self, request):
        logger.info("ImagesToPdfView: Received POST request")
        
        # Check if files are provided
        if 'files' not in request.FILES:
            logger.warning("ImagesToPdfView: No files provided")
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        files = request.FILES.getlist('files')
        
        logger.info(f"ImagesToPdfView: Processing {len(files)} images")
        
        # Check if all files are images
        for file in files:
            ext = get_file_extension(file.name)
            if ext not in ['png', 'jpg', 'jpeg']:
                logger.warning(f"ImagesToPdfView: Unsupported file format - {ext}")
                return Response(
                    {'error': f'Unsupported file format: {ext}. Only PNG, JPG, and JPEG are supported'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get output filename
        output_filename = request.data.get('output_filename', 'combined_images')
        logger.info(f"ImagesToPdfView: Using output filename '{output_filename}'")
        
        try:
            # Process images to PDF without database
            logger.info("ImagesToPdfView: Converting images to PDF without database")
            output_path, output_filename = process_images_to_pdf_without_db(files, output_filename)
            
            logger.info(f"ImagesToPdfView: Conversion complete, sending response with file: {output_filename}")
            
            # Return the file directly
            response = FileResponse(
                open(output_path, 'rb'),
                content_type='application/octet-stream',
                as_attachment=True,
                filename=output_filename
            )
            
            # Clean up after sending
            response.close_callback = lambda: self._cleanup_file(output_path)
            
            return response
            
        except Exception as e:
            logger.error(f"ImagesToPdfView: Error converting images to PDF - {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _cleanup_file(self, file_path):
        """Clean up the file after it's been sent"""
        logger.debug(f"ImagesToPdfView: Cleaning up temporary file {file_path}")
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.error(f"ImagesToPdfView: Error cleaning up file {file_path} - {str(e)}")
            pass


class ProcessedFileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for processed files"""
    queryset = ProcessedFile.objects.all().order_by('-created_at')
    serializer_class = ProcessedFileSerializer


class MergeJobViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for merge jobs"""
    queryset = MergeJob.objects.all().order_by('-created_at')
    serializer_class = MergeJobSerializer


class FileDownloadView(APIView):
    """View for downloading processed files"""
    
    def get(self, request, file_id):
        try:
            # Try to get a processed file
            processed_file = get_object_or_404(ProcessedFile, id=file_id)
            
            if processed_file.status != 'completed':
                return Response(
                    {'error': 'File is not ready for download'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not processed_file.processed_file:
                return Response(
                    {'error': 'No processed file available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return the file
            return FileResponse(
                processed_file.processed_file.open('rb'),
                content_type='application/octet-stream',
                as_attachment=True,
                filename=processed_file.processed_filename
            )
        except:
            # If not a processed file, try a merge job
            merge_job = get_object_or_404(MergeJob, id=file_id)
            
            if merge_job.status != 'completed':
                return Response(
                    {'error': 'File is not ready for download'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not merge_job.merged_file:
                return Response(
                    {'error': 'No merged file available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return the file
            output_filename = f"{merge_job.output_filename}.{merge_job.file_type}"
            return FileResponse(
                merge_job.merged_file.open('rb'),
                content_type='application/octet-stream',
                as_attachment=True,
                filename=output_filename
            )


class HealthCheckView(APIView):
    """API endpoint for health check"""
    
    def get(self, request, format=None):
        """Health check method to verify API and database connection status"""
        logger.info("HealthCheckView: Received GET request")
        
        health_status = {
            "status": "ok",
            "api": "up",
            "database": "unknown"
        }
        
        # Check database connection
        try:
            logger.info("HealthCheckView: Testing database connection")
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            health_status["database"] = "up"
            logger.info("HealthCheckView: Database connection successful")
        except Exception as e:
            health_status["database"] = "down"
            health_status["status"] = "degraded"
            health_status["database_error"] = str(e)
            logger.error(f"HealthCheckView: Database connection failed - {str(e)}")
        
        return Response(health_status) 