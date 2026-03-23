import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mmi_project.settings')
app = Celery('mmi_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
