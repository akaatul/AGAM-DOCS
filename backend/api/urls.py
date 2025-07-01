from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'processed-files', views.ProcessedFileViewSet)
router.register(r'merge-jobs', views.MergeJobViewSet)

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Health check
    path('health/', views.HealthCheckView.as_view(), name='health'),
    
    # File processing endpoints (direct streaming)
    path('upload/', views.FileUploadView.as_view(), name='upload-file'),
    path('upload-no-db/', views.FileProcessNoDBView.as_view(), name='file-upload-no-db'),
    
    # For backwards compatibility
    path('convert-to-pdf/', views.FileUploadView.as_view(), name='convert-to-pdf'),
    path('pdf-to-docx/', views.FileUploadView.as_view(), name='pdf-to-docx'),
    path('pdf-to-txt/', views.FileUploadView.as_view(), name='pdf-to-txt'),
    
    # File merge endpoint (direct streaming)
    path('merge/', views.MergeFilesView.as_view(), name='merge-files'),
    
    # Images to PDF endpoint (direct streaming)
    path('images-to-pdf/', views.ImagesToPdfView.as_view(), name='images-to-pdf'),
    
    # Token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] 