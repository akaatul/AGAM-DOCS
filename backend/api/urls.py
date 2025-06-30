from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'processed-files', views.ProcessedFileViewSet)
router.register(r'merge-jobs', views.MergeJobViewSet)

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # File upload and conversion endpoints
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),
    path('convert-to-pdf/', views.FileUploadView.as_view(), name='convert-to-pdf'),
    path('pdf-to-docx/', views.FileUploadView.as_view(), name='pdf-to-docx'),
    path('pdf-to-txt/', views.FileUploadView.as_view(), name='pdf-to-txt'),
    
    # File merge endpoint
    path('merge/', views.MergeFilesView.as_view(), name='merge-files'),
    
    # Images to PDF endpoint
    path('images-to-pdf/', views.ImagesToPdfView.as_view(), name='images-to-pdf'),
    
    # File download endpoint
    path('download/<uuid:file_id>/', views.FileDownloadView.as_view(), name='file-download'),
] 