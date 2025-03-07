# PROEDU Project

## Overview
This project is an eLearning platform built with Django and Django Rest Framework. It includes features for user authentication, course management, and chat functionality.

## Prerequisites
Before you begin, ensure you have met the following requirements:
- Project was tested using Windows 11
- Visual Studio Code
- Python 3.10 (path needs to be included in the environmental variables)
- pip (Python package installer)


## Installation Steps

### 1. Open Folder in VSCode or use the terminal
```bash
# Place the folder in visual studio, and navigate to elearning
cd elearning
```

### 2. Create a Virtual Environment
It's recommended to use a virtual environment to manage dependencies.
```bash
# Create virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
# source venv/bin/activate
```

### 3. Install Required Packages
Install the required Python packages using pip.
```bash
pip install -r requirements.txt
```

### 4. Set Up the Database
Make sure you have SQLite set up (or configure another database in `settings.py`).
Run the following commands to create the database and apply migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create a Superuser
Create a superuser to access the Django admin panel.
```bash
python manage.py createsuperuser
```

### 6. Run the Development Server
Start the Django development server.
```bash
# Standard Django server
python manage.py runserver

# For chat option with websockets
daphne -p 8000 elearning.asgi:application
```

### 7. Access the Application
Open your web browser and go to `http://127.0.0.1:8000/` to access the application.

## Test Credentials

### Admin (Superuser) (Used the teacher johny as a super user)
This needs to be created in terminal to be able to open admin panel.

### Teacher (Superuser)
- Username: johny
- Password: testing123

### Student
- Username: johny4555
- Password: hghHGHG788&*
