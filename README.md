# AGAM - File Conversion & Merging Web Application

AGAM is a modern web application for converting and merging various file formats with a colorful, doodle-like interface featuring hexagonal and circular designs.

## Features

- Drag-and-drop file uploads
- Multiple file format support (DOCX, PPTX, XLSX, TXT, PNG, JPG, JPEG, PDF)
- File conversion capabilities:
  - Office/images/text to PDF
  - PDF to DOCX
  - PDF to TXT
- File merging for similar file types
- Dynamic conversion options
- Progress indicators
- File preview capabilities
- Responsive design with light pinkish theme

## Tech Stack

### Frontend
- Next.js 14+
- Tailwind CSS
- React DnD (Drag and Drop)

### Backend
- Django
- Python 3.8+
- Various conversion libraries:
  - LibreOffice CLI
  - docx2pdf
  - Pillow
  - reportlab
  - pdf2docx
  - PyMuPDF
  - pypdf
  - python-docx
  - python-pptx

## Setup Instructions

### Using Docker (Recommended)

The easiest way to run the application is using Docker Compose:

1. Make sure you have Docker and Docker Compose installed
2. Clone the repository
3. Run the application:
   ```
   docker-compose up
   ```
4. Access the frontend at http://localhost:3000 and the backend API at http://localhost:8000/api

### Manual Setup

#### Backend Setup

1. Install LibreOffice (required for file conversions):
   - On Ubuntu/Debian: `sudo apt-get install libreoffice`
   - On macOS: `brew install --cask libreoffice`
   - On Windows: Download and install from https://www.libreoffice.org/download/

2. Navigate to the backend directory:
   ```
   cd backend
   ```

3. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Run migrations:
   ```
   python manage.py migrate
   ```

6. Create media directories:
   ```
   mkdir -p media/temp media/uploads media/processed media/merged media/merge_files
   ```

7. Start the Django server:
   ```
   python manage.py runserver
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env.local file with the API URL:
   ```
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Access the application at http://localhost:3000

## API Documentation

The API documentation is available through Swagger UI when the backend is running:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

### Main Endpoints

- `POST /api/upload/`: Upload files with validation
- `POST /api/convert-to-pdf/`: Convert Office/images/text to PDF
- `POST /api/pdf-to-docx/`: Convert PDF to DOCX
- `POST /api/pdf-to-txt/`: Convert PDF to text
- `POST /api/merge/`: Combine similar file types
- `GET /api/download/{fileId}/`: Download processed files
- `GET /api/processed-files/`: List all processed files
- `GET /api/processed-files/{id}/`: Get details of a processed file
- `GET /api/merge-jobs/`: List all merge jobs
- `GET /api/merge-jobs/{id}/`: Get details of a merge job

### File Conversion Example

```bash
# Convert a DOCX file to PDF
curl -X POST http://localhost:8000/api/upload/ \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.docx" \
  -F "operation=convert_to_pdf"
```

### File Merging Example

```bash
# Merge multiple PDF files
curl -X POST http://localhost:8000/api/merge/ \
  -H "Content-Type: multipart/form-data" \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf" \
  -F "output_filename=merged_document"
```

## Error Handling

The application implements comprehensive error handling:
- File type validation
- Size limit enforcement (25MB per file)
- Appropriate error messages and status codes
- Logging of errors for debugging

## Performance Optimization

- Automatic temporary file cleanup
- Rate limiting to prevent abuse
- Efficient file processing algorithms
- Optimized frontend assets

## Deployment

### Backend Deployment

The Django backend can be deployed to any platform that supports Python applications:

1. Set environment variables:
   - `SECRET_KEY`: A secure random string
   - `DEBUG`: Set to `0` for production
   - `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

2. Collect static files:
   ```
   python manage.py collectstatic --no-input
   ```

3. Use a production-ready server like Gunicorn:
   ```
   gunicorn agam.wsgi:application
   ```

4. Set up a reverse proxy (Nginx or Apache) to serve static and media files

### Frontend Deployment

The Next.js frontend can be deployed to Vercel, Netlify, or any platform that supports Node.js:

1. Build the application:
   ```
   npm run build
   ```

2. Set the environment variable:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend API

3. Start the production server:
   ```
   npm run start
   ```

### Docker Deployment

For containerized deployment:

1. Build the Docker images:
   ```
   docker-compose build
   ```

2. Deploy using Docker Compose or Kubernetes

3. For production, modify the Docker Compose file to use production settings

# AGAM - Document Conversion Web App

AGAM is a web application that provides various document conversion features.

## Features
- Convert various file formats to PDF
- Convert PDF to DOCX, TXT, and PPTX
- Merge multiple PDFs into one
- Convert multiple images to a single PDF

## Architecture
- Frontend: Next.js with TypeScript
- Backend: Django REST Framework
- Database: PostgreSQL (with fallback for database-free operation)


## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AGAM-docs.git
cd AGAM-docs
```

2. Install dependencies:
```bash
# For frontend
cd frontend
npm install
# or
yarn install

# For backend
cd ../backend
pip install -r requirements.txt
```

3. Configure environment variables:
   - Create `.env.local` in the frontend directory with:
     ```
     NEXT_PUBLIC_API_URL=http://localhost:8000/api
     ```
   - Create `.env` in the backend directory with your database settings

4. Start the development servers:
```bash
# Frontend
cd frontend
npm run dev
# or
yarn dev

# Backend
cd ../backend
python manage.py runserver
```

5. Open your browser and navigate to `http://localhost:3000`

## Implementation Notes

- The application uses a responsive design with Tailwind CSS
- Backend implements direct streaming responses for improved performance
- Automatic fallback to database-free mode when database is unavailable
- Health check endpoint for monitoring application status

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js for the frontend framework
- Django for the backend framework
- Various document conversion libraries that make this application possible

## Database-Free Operation Mode

The application now includes a database-free operation mode that activates automatically when the database connection is unavailable.

### Key Features of Database-Free Mode:

1. **Direct File Processing**
   - Files are processed and streamed directly back to the user without database storage
   - All API endpoints use streaming responses to immediately return processed files
   - No temporary storage of files in the database

2. **Optimized Performance**
   - Reduced latency by skipping database operations
   - Files are cleaned up automatically after being sent to the client
   - Comprehensive logging helps track operation progress and troubleshoot issues

3. **API Endpoints**
   - All core functionality works without requiring database access:
     - `/upload/` - File conversion operations
     - `/merge/` - Merge multiple files 
     - `/images-to-pdf/` - Convert images to PDF
   - Health check endpoint `/health/` for monitoring database status

This mode ensures the application remains functional even during database outages or connectivity issues, providing a seamless experience for users. 