import os
import uuid
from django.db import models
from django.utils import timezone

class ProcessedFile(models.Model):
    """Model to store information about processed files"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_filename = models.CharField(max_length=255)
    processed_filename = models.CharField(max_length=255, blank=True, null=True)
    file_type = models.CharField(max_length=10)  # e.g., 'pdf', 'docx', etc.
    file = models.FileField(upload_to='uploads/')
    processed_file = models.FileField(upload_to='processed/', blank=True, null=True)
    operation = models.CharField(max_length=20)  # e.g., 'convert_to_pdf', 'merge', etc.
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.original_filename} ({self.operation})"
    
    def file_path(self):
        return os.path.join('media', self.file.name)
    
    def processed_file_path(self):
        if self.processed_file:
            return os.path.join('media', self.processed_file.name)
        return None
    
    def delete(self, *args, **kwargs):
        # Delete the associated files when the model instance is deleted
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        if self.processed_file:
            if os.path.isfile(self.processed_file.path):
                os.remove(self.processed_file.path)
        super().delete(*args, **kwargs)


class MergeJob(models.Model):
    """Model to store information about file merge jobs"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    output_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)  # Type of files being merged
    merged_file = models.FileField(upload_to='merged/', blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Merge Job {self.id} - {self.output_filename}"
    
    def merged_file_path(self):
        if self.merged_file:
            return os.path.join('media', self.merged_file.name)
        return None
    
    def delete(self, *args, **kwargs):
        # Delete the associated file when the model instance is deleted
        if self.merged_file:
            if os.path.isfile(self.merged_file.path):
                os.remove(self.merged_file.path)
        super().delete(*args, **kwargs)


class MergeFile(models.Model):
    """Model to store files associated with a merge job"""
    
    merge_job = models.ForeignKey(MergeJob, related_name='files', on_delete=models.CASCADE)
    original_filename = models.CharField(max_length=255)
    file = models.FileField(upload_to='merge_files/')
    order = models.PositiveIntegerField(default=0)  # Order in which files should be merged
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.original_filename} (Job: {self.merge_job.id})"
    
    def file_path(self):
        return os.path.join('media', self.file.name)
    
    def delete(self, *args, **kwargs):
        # Delete the associated file when the model instance is deleted
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs) 