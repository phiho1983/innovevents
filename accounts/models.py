from django.db import models

from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN    = "ADMIN",    "Administrateur"
        EMPLOYEE = "EMPLOYEE", "Employé"
        CLIENT   = "CLIENT",   "Client"
    role=models.CharField(max_length=20,choices=Role.choices,default=Role.CLIENT)
    must_change_password=models.BooleanField(default=False)
