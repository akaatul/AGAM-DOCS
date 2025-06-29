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

# AGAM Valentine's Theme

A heartwarming and enchanting Valentine-themed website for AGAM document conversion services.

## Features

### Navigation Design
- Floating heart-shaped navbar that gently pulses with scroll
- Menu items transform into floating love letters on hover
- Navigation text in romantic cursive with sparkly underlines
- Heart-shaped cursor that leaves trailing sparkles
- Floating cupid arrows and tiny hearts that follow mouse movement
- Mobile menu unfolds like a Valentine's card with flutter animation

### Landing Page Elements
- **Hero Section:**
  * Animated love birds and butterflies that flutter across the screen
  * Love-letter style value proposition with golden ink effects
  * "Made with Love, No Ads" heart badge with gentle rotation
  * Floating heart balloons with parallax movement
  * Soft rose petal animations falling in background

- **Features Showcase:**
  * Heart-shaped feature cards with ribbon borders
  * Cute love-themed icons (hearts, cupids, roses)
  * Features appear with love letter unfolding animation
  * Section dividers as lace patterns and ribbon designs

- **Testimonials Area:**
  * Heart-shaped testimonial bubbles
  * Adorable couple avatars with sweet interactions
  * Reviews float on cloud-shaped cards
  * Background with subtle floating hearts pattern

- **Call-to-Action Sections:**
  * Heart-shaped buttons with love potion glow effect
  * Animated Cupid's arrows pointing to CTAs
  * Love letter envelopes that open on hover
  * Romantic gradient transitions

### Visual Style Guide
- **Primary Color:** Sweet pink (#FFD1DC)
- **Secondary Colors:**
  * Rose red (#FF8BA7)
  * Soft lavender (#E6E6FA)
  * Golden accent (#FFD700)
- **Typography:** Romantic script fonts paired with sweet rounded sans-serif
- **Love-letter and Valentine's card aesthetic throughout**

### Technical Features
- Smooth love-themed animations using Framer Motion
- Heart-beat loading animations
- Mobile-responsive love theme adaptations
- Gentle chime sounds for interactions (user-activated)
- Optimized romantic imagery loading
- Accessible love-themed elements

### Micro-interactions
- Buttons bloom like roses on hover
- Form fields decorated with heart indicators
- Loading spinners as rotating heart animations
- Love-letter unfold effects on scroll
- Hidden Valentine's Day themed surprises throughout

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

3. Add sound files:
   - Download a chime sound effect and place it in `frontend/public/sounds/chime.mp3`
   - You can find free sounds at:
     - https://soundbible.com/1598-Electronic-Chime.html
     - https://freesound.org/people/BristolStories/sounds/51710/
     - https://soundjax.com/chime-1.html

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

- The Valentine's theme uses custom CSS animations and Framer Motion for interactive elements
- Font imports are handled in `globals.css` with Google Fonts
- Sound effects are optional and only play on user interaction
- The theme is fully responsive and works on mobile devices

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Framer Motion for animation capabilities
- React Icons for the heart and other Valentine's themed icons
- Google Fonts for the cursive font family 