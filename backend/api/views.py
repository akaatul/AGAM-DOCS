import os
import threading
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


class FileUploadView(APIView):
    """View for handling file uploads and conversions"""
    
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = serializer.validated_data['file']
        operation = serializer.validated_data['operation']
        
        try:
            # Get file extension
            file_name = uploaded_file.name
            extension = file_name.split('.')[-1].lower()
            
            # Create a ProcessedFile instance
            processed_file = ProcessedFile.objects.create(
                original_filename=file_name,
                file_type=extension,
                file=uploaded_file,
                operation=operation,
                status='processing'
            )
            
            # Start processing in a separate thread
            thread = threading.Thread(
                target=self._process_file,
                args=(processed_file, operation)
            )
            thread.daemon = True
            thread.start()
            
            # Return the created instance
            serializer = ProcessedFileSerializer(
                processed_file, 
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            # If database connection fails, use the no-DB fallback
            return FileProcessNoDBView().post(request)
    
    def _process_file(self, processed_file, operation):
        """Process the file based on the operation"""
        try:
            input_path = processed_file.file.path
            
            if operation == 'convert_to_pdf':
                # Check if file is already a PDF
                if processed_file.file_type == 'pdf':
                    processed_file.processed_filename = processed_file.original_filename
                    processed_file.processed_file = processed_file.file
                    processed_file.status = 'completed'
                    processed_file.save()
                    return
                
                # Convert to PDF
                output_path = convert_to_pdf(input_path)
                output_filename = f"{os.path.splitext(processed_file.original_filename)[0]}.pdf"
                
                # Update the processed file
                with open(output_path, 'rb') as f:
                    processed_file.processed_file.save(output_filename, f)
                
                processed_file.processed_filename = output_filename
                processed_file.status = 'completed'
                
                # Clean up temporary file
                try:
                    os.remove(output_path)
                except:
                    pass
            
            elif operation == 'pdf_to_docx':
                # Check if file is a PDF
                if processed_file.file_type != 'pdf':
                    processed_file.status = 'failed'
                    processed_file.error_message = 'Only PDF files can be converted to DOCX'
                    processed_file.save()
                    return
                
                # Convert PDF to DOCX
                output_path = pdf_to_docx(input_path)
                output_filename = f"{os.path.splitext(processed_file.original_filename)[0]}.docx"
                
                # Update the processed file
                with open(output_path, 'rb') as f:
                    processed_file.processed_file.save(output_filename, f)
                
                processed_file.processed_filename = output_filename
                processed_file.status = 'completed'
                
                # Clean up temporary file
                try:
                    os.remove(output_path)
                except:
                    pass
            
            elif operation == 'pdf_to_txt':
                # Check if file is a PDF
                if processed_file.file_type != 'pdf':
                    processed_file.status = 'failed'
                    processed_file.error_message = 'Only PDF files can be converted to TXT'
                    processed_file.save()
                    return
                
                # Convert PDF to TXT
                output_path = pdf_to_txt(input_path)
                output_filename = f"{os.path.splitext(processed_file.original_filename)[0]}.txt"
                
                # Update the processed file
                with open(output_path, 'rb') as f:
                    processed_file.processed_file.save(output_filename, f)
                
                processed_file.processed_filename = output_filename
                processed_file.status = 'completed'
                
                # Clean up temporary file
                try:
                    os.remove(output_path)
                except:
                    pass
            
            elif operation == 'pdf_to_pptx':
                if processed_file.file_type != 'pdf':
                    processed_file.status = 'failed'
                    processed_file.error_message = 'Only PDF files can be converted to PPTX'
                    processed_file.save()
                    return
                
                # Convert PDF to PPTX
                output_path = pdf_to_pptx(input_path)
                output_filename = f"{os.path.splitext(processed_file.original_filename)[0]}.pptx"
                
                # Update the processed file
                with open(output_path, 'rb') as f:
                    processed_file.processed_file.save(output_filename, f)
                
                processed_file.processed_filename = output_filename
                processed_file.status = 'completed'
                
                # Clean up temporary file
                try:
                    os.remove(output_path)
                except:
                    pass
            
            else:
                processed_file.status = 'failed'
                processed_file.error_message = f'Unsupported operation: {operation}'
        
        except Exception as e:
            processed_file.status = 'failed'
            processed_file.error_message = str(e)
        
        finally:
            processed_file.save()
            # Clean up old temporary files
            clean_temp_files()


class FileProcessNoDBView(APIView):
    """View for handling file processing without database dependency"""
    
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = serializer.validated_data['file']
        operation = serializer.validated_data['operation']
        
        try:
            # Process the file without database
            output_path, output_filename = process_file_without_db(uploaded_file, operation)
            
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
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _cleanup_file(self, file_path):
        """Clean up the file after it's been sent"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            pass


class MergeFilesView(APIView):
    """View for handling file merging"""
    
    def post(self, request):
        serializer = MergeFilesSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        files = serializer.validated_data['files']
        output_filename = serializer.validated_data['output_filename']
        
        # Validate files
        if not files or len(files) < 2:
            return Response(
                {'error': 'At least two files are required for merging'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure all files are of the same type
        file_types = {get_file_extension(file.name) for file in files}
        if len(file_types) > 1:
            return Response(
                {'error': 'All files must be of the same type for merging'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get file type from the first file
        file_type = get_file_extension(files[0].name).lower()
        
        # Check if file type is supported
        if file_type not in ['pdf', 'docx', 'pptx']:
            return Response(
                {'error': f'File type {file_type} is not supported for merging. Only PDF, DOCX, and PPTX are supported.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sanitize output filename
        safe_output_filename = os.path.basename(output_filename)
        if safe_output_filename != output_filename:
            output_filename = safe_output_filename
        
        try:
            # Create a MergeJob instance
            merge_job = MergeJob.objects.create(
                output_filename=output_filename,
                file_type=file_type,
                status='processing'
            )
            
            # Save all files
            for file in files:
                MergeFile.objects.create(
                    merge_job=merge_job,
                    original_filename=file.name,
                    file=file
                )
            
            # Start processing in a separate thread
            thread = threading.Thread(
                target=self._process_merge,
                args=(merge_job,)
            )
            thread.daemon = True
            thread.start()
            
            # Return the created instance
            serializer = MergeJobSerializer(
                merge_job, 
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            # If database connection fails, use the no-DB fallback
            return MergeFilesNoDBView().post(request)
    
    def _process_merge(self, merge_job):
        """Process the merge job"""
        try:
            # Get all files
            merge_files = merge_job.files.all()
            
            if not merge_files:
                merge_job.status = 'failed'
                merge_job.error_message = 'No files found for processing'
                merge_job.save()
                return
            
            # Get file paths
            file_paths = [merge_file.file.path for merge_file in merge_files]
            
            # Merge files
            output_path = merge_files(
                file_paths, 
                merge_job.output_filename, 
                merge_job.file_type
            )
            
            output_filename = f"{merge_job.output_filename}.{merge_job.file_type}"
            
            # Update the merge job
            with open(output_path, 'rb') as f:
                merge_job.merged_file.save(output_filename, f)
            
            merge_job.status = 'completed'
            
            # Clean up temporary file
            try:
                os.remove(output_path)
            except:
                pass
                
        except Exception as e:
            merge_job.status = 'failed'
            merge_job.error_message = str(e)
        
        finally:
            merge_job.save()
            # Clean up old temporary files
            clean_temp_files()


class MergeFilesNoDBView(APIView):
    """View for handling file merging without database dependency"""
    
    def post(self, request):
        serializer = MergeFilesSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        files = serializer.validated_data['files']
        output_filename = serializer.validated_data['output_filename']
        
        # Validate files
        if not files or len(files) < 2:
            return Response(
                {'error': 'At least two files are required for merging'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure all files are of the same type
        file_types = {get_file_extension(file.name) for file in files}
        if len(file_types) > 1:
            return Response(
                {'error': 'All files must be of the same type for merging'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get file type from the first file
        file_type = get_file_extension(files[0].name).lower()
        
        # Check if file type is supported
        if file_type not in ['pdf', 'docx', 'pptx']:
            return Response(
                {'error': f'File type {file_type} is not supported for merging. Only PDF, DOCX, and PPTX are supported.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sanitize output filename
        safe_output_filename = os.path.basename(output_filename)
        if safe_output_filename != output_filename:
            output_filename = safe_output_filename
        
        try:
            # Process the merge without database
            output_path, output_filename = merge_files_without_db(files, output_filename, file_type)
            
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
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _cleanup_file(self, file_path):
        """Clean up the file after it's been sent"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            pass


class ImagesToPdfView(APIView):
    """View for handling images to PDF conversion with custom order"""
    
    def post(self, request):
        # Check if files are provided
        if 'files' not in request.FILES:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        files = request.FILES.getlist('files')
        
        # Check if all files are images
        for file in files:
            ext = get_file_extension(file.name)
            if ext not in ['png', 'jpg', 'jpeg']:
                return Response(
                    {'error': f'Unsupported file format: {ext}. Only PNG, JPG, and JPEG are supported'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get output filename
        output_filename = request.data.get('output_filename', 'combined_images')
        
        try:
            # Create a MergeJob instance
            merge_job = MergeJob.objects.create(
                output_filename=output_filename,
                file_type='pdf',
                status='processing'
            )
            
            # Save all files in the order they were received
            for i, file in enumerate(files):
                MergeFile.objects.create(
                    merge_job=merge_job,
                    original_filename=file.name,
                    file=file,
                    order=i
                )
            
            # Start processing in a separate thread
            thread = threading.Thread(
                target=self._process_images_to_pdf,
                args=(merge_job,)
            )
            thread.daemon = True
            thread.start()
            
            # Return the created instance
            serializer = MergeJobSerializer(
                merge_job, 
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
        except Exception as e:
            # If database connection fails, use the no-DB fallback
            return ImagesToPdfNoDBView().post(request)
    
    def _process_images_to_pdf(self, merge_job):
        """Process the images to create a PDF"""
        try:
            # Get all files ordered by the 'order' field
            merge_files = merge_job.files.all().order_by('order')
            
            if not merge_files:
                merge_job.status = 'failed'
                merge_job.error_message = 'No files found for processing'
                merge_job.save()
                return
            
            # Get file paths
            file_paths = [merge_file.file.path for merge_file in merge_files]
            
            # Merge images to PDF
            output_path = merge_images_to_pdf(file_paths)
            output_filename = f"{merge_job.output_filename}.pdf"
            
            # Update the merge job
            with open(output_path, 'rb') as f:
                merge_job.merged_file.save(output_filename, f)
            
            merge_job.status = 'completed'
            
            # Clean up temporary file
            try:
                os.remove(output_path)
            except:
                pass
                
        except Exception as e:
            merge_job.status = 'failed'
            merge_job.error_message = str(e)
        
        finally:
            merge_job.save()
            # Clean up old temporary files
            clean_temp_files()


class ImagesToPdfNoDBView(APIView):
    """View for handling images to PDF conversion without database dependency"""
    
    def post(self, request):
        # Check if files are provided
        if 'files' not in request.FILES:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        files = request.FILES.getlist('files')
        
        # Check if all files are images
        for file in files:
            ext = get_file_extension(file.name)
            if ext not in ['png', 'jpg', 'jpeg']:
                return Response(
                    {'error': f'Unsupported file format: {ext}. Only PNG, JPG, and JPEG are supported'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get output filename
        output_filename = request.data.get('output_filename', 'combined_images')
        
        try:
            # Process images to PDF without database
            output_path, output_filename = process_images_to_pdf_without_db(files, output_filename)
            
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
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _cleanup_file(self, file_path):
        """Clean up the file after it's been sent"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
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
    """View for checking the health of the application and database connection"""
    
    def get(self, request):
        # Check database connection
        db_status = "connected"
        db_error = None
        
        try:
            # Attempt a simple database query
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception as e:
            db_status = "disconnected"
            db_error = str(e)
        
        # Return health status
        response_data = {
            "status": "healthy" if db_status == "connected" else "unhealthy",
            "database": {
                "status": db_status,
                "error": db_error
            },
            "api": "online"
        }
        
        status_code = status.HTTP_200_OK if db_status == "connected" else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return Response(response_data, status=status_code) 