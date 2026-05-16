from django.db import models

class GenderEnum(models.TextChoices):
    MALE   = "male",   "Male"
    FEMALE = "female", "Female"

class User(models.Model):
    first_name  = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, null=True, blank=True)
    last_name   = models.CharField(max_length=255)
    birthday    = models.DateField(null=True, blank=True)
    job_title   = models.CharField(max_length=255, null=True, blank=True)
    gender      = models.CharField(max_length=10, choices=GenderEnum.choices, null=True, blank=True)
    height_cm   = models.IntegerField(null=True, blank=True)
    weight_kg   = models.FloatField(null=True, blank=True)

    class Meta:
        managed  = False # FastAPI owns it
        db_table = "users"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"