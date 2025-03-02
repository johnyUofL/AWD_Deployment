# eLearning Project

## Overview
This project is an eLearning platform built with Django and Django Rest Framework. It includes features for user authentication, course management, and more.

## Prerequisites
Before you begin, ensure you have met the following requirements:
- Python 3.8 or higher
- pip (Python package installer)
- Redis (for Celery)
- Node.js and npm (for frontend dependencies)
## Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/johnyUofL/elearn.git
   cd elearning
   ```

2. **Create a Virtual Environment**
   It's recommended to use a virtual environment to manage dependencies.
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Required Packages**
   Install the required Python packages using pip.
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Up the Database**
   Make sure you have SQLite set up (or configure another database in `settings.py`).
   Run the following commands to create the database and apply migrations:
   ```bash
   python manage.py migrate
   ```

5. **Create a Superuser**
   Create a superuser to access the Django admin panel.
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the Development Server**
   Start the Django development server.
   ```bash
   python manage.py runserver
   ```

7. **Access the Application**
   Open your web browser and go to `http://127.0.0.1:8000/` to access the application.

8. **Frontend Setup (if applicable)**
   If your project includes a frontend built with JavaScript, navigate to the frontend directory and install the necessary packages:
   ```bash
   cd static/js  # Adjust the path as necessary
   npm install
   ```

## Additional Configuration
- **CORS Settings**: Ensure that the CORS settings in `settings.py` are configured according to your needs.
- **Redis**: Make sure Redis is running if you are using it for Celery.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Django
- Django Rest Framework
- Bootstrap