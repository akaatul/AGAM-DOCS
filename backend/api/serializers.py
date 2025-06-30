from rest_framework import serializers
from .models import ProcessedFile, MergeJob, MergeFile


class ProcessedFileSerializer(serializers.ModelSerializer):
    """Serializer for the ProcessedFile model"""
    
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcessedFile
        fields = [
            'id', 'original_filename', 'processed_filename', 'file_type', 
            'operation', 'status', 'error_message', 'created_at', 
            'updated_at', 'download_url'
        ]
        read_only_fields = ['id', 'status', 'error_message', 'created_at', 'updated_at']
    
    def get_download_url(self, obj):
        if obj.processed_file and obj.status == 'completed':
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.processed_file.url)
        return None


class MergeFileSerializer(serializers.ModelSerializer):
    """Serializer for the MergeFile model"""
    
    class Meta:
        model = MergeFile
        fields = ['id', 'original_filename', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']


class MergeJobSerializer(serializers.ModelSerializer):
    """Serializer for the MergeJob model"""
    
    files = MergeFileSerializer(many=True, read_only=True)
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MergeJob
        fields = [
            'id', 'output_filename', 'file_type', 'status', 
            'error_message', 'created_at', 'updated_at', 
            'files', 'download_url'
        ]
        read_only_fields = ['id', 'status', 'error_message', 'created_at', 'updated_at']
    
    def get_download_url(self, obj):
        if obj.merged_file and obj.status == 'completed':
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.merged_file.url)
        return None


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file upload"""
    
    file = serializers.FileField()
    operation = serializers.CharField(max_length=20, required=False)
    
    def validate_file(self, value):
        # Check file size (25MB limit)
        if value.size > 26214400:  # 25MB in bytes
            raise serializers.ValidationError("File size exceeds the 25MB limit.")
        
        # Get file extension
        file_name = value.name
        extension = file_name.split('.')[-1].lower()
        
        # Check if extension is supported
        supported_extensions = ['docx', 'pptx', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'pdf']
        if extension not in supported_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format. Supported formats: {', '.join(supported_extensions)}"
            )
        
        return value
    
    def validate_operation(self, value):
        valid_operations = [
            'convert_to_pdf', 'pdf_to_docx', 'pdf_to_txt',
            'pdf_to_pptx', 'pdf_to_xlsx'
        ]
        if value not in valid_operations:
            raise serializers.ValidationError(f"Invalid operation. Valid operations: {', '.join(valid_operations)}")
        return value


class MergeFilesSerializer(serializers.Serializer):
    """Serializer for merging multiple files"""
    
    files = serializers.ListField(
        child=serializers.FileField(),
        min_length=2,
        max_length=20
    )
    output_filename = serializers.CharField(max_length=255, required=False)
    
    def validate_files(self, files):
        if not files:
            raise serializers.ValidationError("No files provided for merging.")
        
        if len(files) < 2:
            raise serializers.ValidationError("At least two files are required for merging.")
        
        # Check total size
        total_size = sum(file.size for file in files)
        if total_size > 52428800:  # 50MB in bytes
            raise serializers.ValidationError("Total file size exceeds the 50MB limit.")
        
        # Check individual file sizes
        for file in files:
            if file.size > 26214400:  # 25MB in bytes
                raise serializers.ValidationError(f"File {file.name} exceeds the 25MB limit.")
        
        # Check file types
        extensions = [file.name.split('.')[-1].lower() for file in files]
        
        # Check if all files have the same extension
        if len(set(extensions)) != 1:
            raise serializers.ValidationError("All files must be of the same type for merging.")
        
        # Check if extension is supported for merging
        supported_merge_extensions = ['pdf', 'docx', 'pptx']
        if extensions[0] not in supported_merge_extensions:
            raise serializers.ValidationError(
                f"Unsupported file format for merging. Supported formats: {', '.join(supported_merge_extensions)}"
            )
        
        return files 