from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import ProcessedFile, MergeJob, MergeFile
from .utils import clean_temp_files


@receiver(post_delete, sender=ProcessedFile)
def clean_after_processed_file_delete(sender, instance, **kwargs):
    """Clean temporary files after a ProcessedFile is deleted"""
    clean_temp_files()


@receiver(post_delete, sender=MergeJob)
def clean_after_merge_job_delete(sender, instance, **kwargs):
    """Clean temporary files after a MergeJob is deleted"""
    clean_temp_files() 