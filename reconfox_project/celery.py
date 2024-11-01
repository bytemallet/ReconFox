import os
from celery import Celery


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "reconfox_project.settings")
app = Celery("reconfox_project_site")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

