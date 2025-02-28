import os
from datetime import datetime, timedelta

# Build paths inside the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'y21*riec=rc#r8@-1(3lm1zib8l%lx67ppp5+hz1w8tbo02+-j'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']  # Add for development; update for production

AUTH_USER_MODEL = 'userauths.User'

# Application definition
INSTALLED_APPS = [
    # Custom Django admin
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'userauths.apps.UserauthsConfig',  # Ensure apps.py exists in userauths
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Custom apps
    'core',
    'addon',

    # Third-party apps
    'corsheaders',  # Added for frontend API access
    'rest_framework',
    'rest_framework_simplejwt',
    'channels',
    'celery',
    'taggit',  # Optional unless used
    'crispy_forms',  # Optional unless used
    'import_export',  # Optional unless used
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

# JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Added for CORS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'elearning.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'elearning.wsgi.application'
ASGI_APPLICATION = 'elearning.asgi.application'

# Channels settings for WebSockets
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Login and Logout Redirects
LOGIN_REDIRECT_URL = '/'  # Redirects to http://127.0.0.1:8000/
LOGOUT_REDIRECT_URL = '/accounts/logout/'  

# Celery settings
CELERY_BROKER_URL = 'redis://localhost:6379/1'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/1'
CELERY_ACCEPT_CONTENT = ['json']  # Added for safety
CELERY_TASK_SERIALIZER = 'json'   # Added for safety
CELERY_RESULT_SERIALIZER = 'json' # Added for safety

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS settings (for frontend API access)
CORS_ALLOW_ALL_ORIGINS = True  # THIS SHOULD BE FALSE WHEN UPLOADED IN SERVER
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',  
]

# Jazzmin settings
JAZZMIN_SETTINGS = {
    'site_title': 'PHOTOEDU ADMIN',
    'site_header': 'PHOTOEDU',
    'site_brand': 'Welcome',
    "site_logo": "images/logo.svg",
    'copyright': f'All Rights Reserved © {datetime.now().year}',
    'welcome_sign': 'Welcome to PHOTO EDU Admin - Login Now',
    'topmenu_links': [
        {'name': 'Home', 'url': 'admin:index', 'permissions': ['auth.view_user']},
        {'name': 'Users', 'url': '/admin/userauths/user/', 'new_window': False},
        {'name': 'Courses', 'url': '/admin/core/course/', 'new_window': False},
        {'name': 'Chat Rooms', 'url': '/admin/addon/chatroom/', 'new_window': False},
    ],
    'order_with_respect_to': ['core', 'userauths', 'addon'],
    'icons': {
        'admin.LogEntry': 'fas fa-file-alt',
        'auth': 'fas fa-users-cog',
        'auth.user': 'fas fa-user',
        'auth.group': 'fas fa-users',
        'userauths.User': 'fas fa-user-circle',
        'userauths.Profile': 'fas fa-address-card',
    },
    'show_ui_builder': True,
    'changeform_format': 'horizontal_tabs',
    'related_modal_active': True,
}

JAZZMIN_UI_TWEAKS = {
    'navbar_small_text': False,
    'footer_small_text': False,
    'body_small_text': False,
    'brand_small_text': False,
    'brand_colour': 'navbar-indigo',
    'accent': 'accent-teal',
    'navbar': 'navbar-indigo navbar-dark',
    'sidebar': 'sidebar-dark-teal',
    'no_navbar_border': True,
    'navbar_fixed': True,
    'layout_boxed': False,
    'footer_fixed': False,
    'sidebar_fixed': True,
    'sidebar_nav_small_text': False,
    'sidebar_disable_expand': False,
    'sidebar_nav_child_indent': True,
    'sidebar_nav_compact_style': False,
    'sidebar_nav_legacy_style': False,
    'sidebar_nav_flat_style': False,
    'theme': 'cosmo',
    'dark_mode_theme': 'darkly',
    'button_classes': {
        'primary': 'btn-outline-primary',
        'secondary': 'btn-outline-secondary',
        'info': 'btn-outline-info',
        'warning': 'btn-outline-warning',
        'danger': 'btn-outline-danger',
        'success': 'btn-outline-success',
    },
    'actions_sticky_top': True,
}