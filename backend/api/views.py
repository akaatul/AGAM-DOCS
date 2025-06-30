import os
import threading
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProcessedFile, MergeJob, MergeFile
from .serializers import (
    ProcessedFileSerializer, MergeJobSerializer,
    FileUploadSerializer, MergeFilesSerializer
)
from .utils import (
    get_file_extension, convert_to_pdf, pdf_to_docx,
    pdf_to_txt, merge_files, clean_temp_files, 
    merge_images_to_pdf, pdf_to_pptx
)


class FileUploadView(APIView):
    """View for handling file uploads and conversions"""
    
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = serializer.validated_data['file']
        operation = serializer.validated_data['operation']
        
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
        
        # Create a MergeJob instance
        merge_job = MergeJob.objects.create(
            output_filename=output_filename,
            file_type=file_type,
            status='processing'
        )
        
        try:
            # Save all files
            for i, file in enumerate(files):
                MergeFile.objects.create(
                    merge_job=merge_job,
                    original_filename=file.name,
                    file=file,
                    order=i
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
            # Clean up if there's an error during setup
            merge_job.status = 'failed'
            merge_job.error_message = f"Error during job setup: {str(e)}"
            merge_job.save()
            
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _process_merge(self, merge_job):
        """Process the file merge"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Starting merge job {merge_job.id} for file type {merge_job.file_type}")
        
        try:
            # Get all files in order
            merge_file_instances = merge_job.files.all().order_by('order')
            
            if not merge_file_instances:
                raise ValueError("No files found to merge")
                
            file_paths = []
            for file_instance in merge_file_instances:
                file_path = file_instance.file.path
                if not os.path.exists(file_path):
                    raise ValueError(f"File not found: {file_path}")
                file_paths.append(file_path)
            
            logger.info(f"Merging {len(file_paths)} files for job {merge_job.id}")
            
            # Merge files
            output_path = merge_files(
                file_paths,
                merge_job.output_filename,
                merge_job.file_type
            )
            
            logger.info(f"Merge complete, output file at {output_path}")
            
            # Verify output file exists
            if not os.path.exists(output_path):
                raise ValueError(f"Merged file not found at {output_path}")
            
            # Update the merge job with the result
            with open(output_path, 'rb') as f:
                output_filename = f"{merge_job.output_filename}.{merge_job.file_type}"
                merge_job.merged_file.save(output_filename, f)
            
            # Verify merged file was saved properly
            if not merge_job.merged_file or not os.path.exists(merge_job.merged_file.path):
                raise ValueError("Failed to save merged file to storage")
            
            merge_job.status = 'completed'
            logger.info(f"Merge job {merge_job.id} completed successfully")
            
            # Clean up temporary file
            try:
                if os.path.exists(output_path):
                    os.remove(output_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to clean up temporary file: {str(cleanup_error)}")
        
        except Exception as e:
            logger.error(f"Error processing merge job {merge_job.id}: {str(e)}")
            merge_job.status = 'failed'
            merge_job.error_message = str(e)
        
        finally:
            merge_job.save()
            # Clean up old temporary files
            clean_temp_files()


class ProcessedFileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing processed files"""
    
    queryset = ProcessedFile.objects.all().order_by('-created_at')
    serializer_class = ProcessedFileSerializer
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the processed file"""
        processed_file = self.get_object()
        
        if processed_file.status != 'completed' or not processed_file.processed_file:
            return Response(
                {'error': 'Processed file not available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        file_path = processed_file.processed_file.path
        return FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename=processed_file.processed_filename
        )


class MergeJobViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing merge jobs"""
    
    queryset = MergeJob.objects.all().order_by('-created_at')
    serializer_class = MergeJobSerializer
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the merged file"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            merge_job = self.get_object()
            
            if merge_job.status != 'completed':
                logger.warning(f"Attempted to download incomplete merge job: {merge_job.id}, status: {merge_job.status}")
                return Response(
                    {'error': f'Merge job is not completed. Current status: {merge_job.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if not merge_job.merged_file:
                logger.error(f"Completed merge job {merge_job.id} has no merged file")
                return Response(
                    {'error': 'Merged file not available'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            file_path = merge_job.merged_file.path
            
            if not os.path.exists(file_path):
                logger.error(f"Merged file for job {merge_job.id} not found at path: {file_path}")
                return Response(
                    {'error': 'Merged file not found on server'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            try:
                response = FileResponse(
                    open(file_path, 'rb'),
                    as_attachment=True,
                    filename=f"{merge_job.output_filename}.{merge_job.file_type}"
                )
                logger.info(f"Successfully serving merged file for job {merge_job.id}")
                return response
                
            except Exception as file_error:
                logger.error(f"Error serving merged file for job {merge_job.id}: {str(file_error)}")
                return Response(
                    {'error': f'Error serving file: {str(file_error)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in download endpoint: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FileDownloadView(APIView):
    """View for downloading files by ID"""
    
    def get(self, request, file_id):
        # Try to find the file in ProcessedFile
        try:
            file_obj = ProcessedFile.objects.get(id=file_id)
            if file_obj.status == 'completed' and file_obj.processed_file:
                return FileResponse(
                    open(file_obj.processed_file.path, 'rb'),
                    as_attachment=True,
                    filename=file_obj.processed_filename
                )
        except ProcessedFile.DoesNotExist:
            pass
        
        # Try to find the file in MergeJob
        try:
            file_obj = MergeJob.objects.get(id=file_id)
            if file_obj.status == 'completed' and file_obj.merged_file:
                return FileResponse(
                    open(file_obj.merged_file.path, 'rb'),
                    as_attachment=True,
                    filename=f"{file_obj.output_filename}.{file_obj.file_type}"
                )
        except MergeJob.DoesNotExist:
            pass
        
        # File not found
        return Response(
            {'error': 'File not found or not ready for download'},
            status=status.HTTP_404_NOT_FOUND
        )


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