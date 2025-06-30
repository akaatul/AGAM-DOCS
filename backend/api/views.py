import os
import uuid
from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .utils import (
    get_file_extension, convert_to_pdf, pdf_to_docx,
    pdf_to_txt, merge_files, clean_temp_files, 
    merge_images_to_pdf, pdf_to_pptx
)

# Create temp directories if they don't exist
TEMP_DIR = os.path.join('media', 'temp')
os.makedirs(TEMP_DIR, exist_ok=True)

class FileUploadView(APIView):
    """View for handling file uploads and conversions"""
    
    def post(self, request):
        if 'file' not in request.FILES or 'operation' not in request.data:
            return Response(
                {'error': 'Both file and operation are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        operation = request.data['operation']
        
        # Get file extension
        file_name = uploaded_file.name
        extension = file_name.split('.')[-1].lower()
        
        # Create temporary file path
        temp_input_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{file_name}")
        
        try:
            # Save uploaded file
            with open(temp_input_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            
            # Process file based on operation
            if operation == 'convert_to_pdf':
                if extension == 'pdf':
                    output_path = temp_input_path
                else:
                    output_path = convert_to_pdf(temp_input_path)
                output_filename = f"{os.path.splitext(file_name)[0]}.pdf"
            
            elif operation == 'pdf_to_docx':
                if extension != 'pdf':
                    raise ValueError('Only PDF files can be converted to DOCX')
                output_path = pdf_to_docx(temp_input_path)
                output_filename = f"{os.path.splitext(file_name)[0]}.docx"
            
            elif operation == 'pdf_to_txt':
                if extension != 'pdf':
                    raise ValueError('Only PDF files can be converted to TXT')
                output_path = pdf_to_txt(temp_input_path)
                output_filename = f"{os.path.splitext(file_name)[0]}.txt"
            
            elif operation == 'pdf_to_pptx':
                if extension != 'pdf':
                    raise ValueError('Only PDF files can be converted to PPTX')
                output_path = pdf_to_pptx(temp_input_path)
                output_filename = f"{os.path.splitext(file_name)[0]}.pptx"
            
            else:
                raise ValueError(f'Unsupported operation: {operation}')
            
            # Return the processed file
            response = FileResponse(
                open(output_path, 'rb'),
                as_attachment=True,
                filename=output_filename
            )
            
            return response
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        finally:
            # Clean up temporary files
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            if 'output_path' in locals() and output_path != temp_input_path:
                if os.path.exists(output_path):
                    os.remove(output_path)
            clean_temp_files()


class MergeFilesView(APIView):
    """View for handling file merging"""
    
    def post(self, request):
        if 'files' not in request.FILES:
            return Response(
                {'error': 'Files are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        files = request.FILES.getlist('files')
        output_filename = request.data.get('output_filename', 'merged_file')
        
        # Validate files
        if len(files) < 2:
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
        
        file_type = get_file_extension(files[0].name).lower()
        if file_type not in ['pdf', 'docx', 'pptx']:
            return Response(
                {'error': f'File type {file_type} is not supported for merging'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create temporary directory for this merge operation
        merge_dir = os.path.join(TEMP_DIR, str(uuid.uuid4()))
        os.makedirs(merge_dir, exist_ok=True)
        
        try:
            # Save all files temporarily
            temp_files = []
            for i, file in enumerate(files):
                temp_path = os.path.join(merge_dir, f"{i}_{file.name}")
                with open(temp_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)
                temp_files.append(temp_path)
            
            # Merge files
            output_path = merge_files(temp_files, file_type)
            
            # Ensure output filename has correct extension
            if not output_filename.endswith(f'.{file_type}'):
                output_filename = f"{output_filename}.{file_type}"
            
            # Return merged file
            response = FileResponse(
                open(output_path, 'rb'),
                as_attachment=True,
                filename=output_filename
            )
            
            return response
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        finally:
            # Clean up temporary files
            for temp_file in temp_files:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            if os.path.exists(merge_dir):
                os.rmdir(merge_dir)
            if 'output_path' in locals():
                if os.path.exists(output_path):
                    os.remove(output_path)
            clean_temp_files()


class ImagesToPdfView(APIView):
    """View for converting images to PDF"""
    
    def post(self, request):
        if 'files' not in request.FILES:
            return Response(
                {'error': 'Files are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        files = request.FILES.getlist('files')
        output_filename = request.data.get('output_filename', 'converted_images.pdf')
        
        # Create temporary directory for this operation
        temp_dir = os.path.join(TEMP_DIR, str(uuid.uuid4()))
        os.makedirs(temp_dir, exist_ok=True)
        
        try:
            # Save all files temporarily
            temp_files = []
            for i, file in enumerate(files):
                temp_path = os.path.join(temp_dir, f"{i}_{file.name}")
                with open(temp_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)
                temp_files.append(temp_path)
            
            # Convert images to PDF
            output_path = merge_images_to_pdf(temp_files)
            
            # Ensure output filename has .pdf extension
            if not output_filename.endswith('.pdf'):
                output_filename = f"{output_filename}.pdf"
            
            # Return the PDF file
            response = FileResponse(
                open(output_path, 'rb'),
                as_attachment=True,
                filename=output_filename
            )
            
            return response
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        finally:
            # Clean up temporary files
            for temp_file in temp_files:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
            if 'output_path' in locals():
                if os.path.exists(output_path):
                    os.remove(output_path)
            clean_temp_files() 