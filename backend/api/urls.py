from django.urls import path
from . import views

urlpatterns = [
    # File conversion endpoints
    path('convert-to-pdf/', views.FileUploadView.as_view(), {'operation': 'convert_to_pdf'}, name='convert-to-pdf'),
    path('pdf-to-docx/', views.FileUploadView.as_view(), {'operation': 'pdf_to_docx'}, name='pdf-to-docx'),
    path('pdf-to-txt/', views.FileUploadView.as_view(), {'operation': 'pdf_to_txt'}, name='pdf-to-txt'),
    path('pdf-to-pptx/', views.FileUploadView.as_view(), {'operation': 'pdf_to_pptx'}, name='pdf-to-pptx'),
    
    # File merge endpoint
    path('merge/', views.MergeFilesView.as_view(), name='merge-files'),
    
    # Images to PDF endpoint
    path('images-to-pdf/', views.ImagesToPdfView.as_view(), name='images-to-pdf'),
] 