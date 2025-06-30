from django.contrib import admin
from .models import ProcessedFile, MergeJob, MergeFile


class MergeFileInline(admin.TabularInline):
    model = MergeFile
    extra = 0
    readonly_fields = ['original_filename', 'file', 'order', 'created_at']


@admin.register(ProcessedFile)
class ProcessedFileAdmin(admin.ModelAdmin):
    list_display = ['id', 'original_filename', 'file_type', 'operation', 'status', 'created_at']
    list_filter = ['status', 'operation', 'file_type']
    search_fields = ['original_filename', 'processed_filename']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MergeJob)
class MergeJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'output_filename', 'file_type', 'status', 'created_at']
    list_filter = ['status', 'file_type']
    search_fields = ['output_filename']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [MergeFileInline]


@admin.register(MergeFile)
class MergeFileAdmin(admin.ModelAdmin):
    list_display = ['id', 'merge_job', 'original_filename', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['original_filename']
    readonly_fields = ['created_at'] 