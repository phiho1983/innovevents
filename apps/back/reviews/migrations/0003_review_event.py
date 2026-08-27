import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0004_homephoto"),
        ("reviews", "0002_remove_review_validated"),
    ]

    operations = [
        migrations.AddField(
            model_name="review",
            name="event",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="review",
                to="events.event",
            ),
        ),
    ]
