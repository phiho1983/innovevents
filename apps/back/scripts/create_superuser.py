import os
import subprocess

username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@innovevents.local")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin1234")

code = f"""
from django.contrib.auth import get_user_model
User = get_user_model()

u, created = User.objects.get_or_create(username="{username}", defaults={{"email": "{email}"}})
if created:
    u.set_password("{password}")
    u.is_staff = True
    u.is_superuser = True
    u.is_active = True 
    u.save()
    print("✅ Superuser créé : {username}")
else:
    # On force les droits + mdp au cas où
    u.email = "{email}"
    u.set_password("{password}")
    u.is_staff = True
    u.is_superuser = True
    u.is_active = True
    u.save()
    print("ℹ️ Superuser déjà présent (mdp/droits remis) : {username}")
"""

subprocess.check_call(["python", "manage.py", "shell", "-c", code])
