from django.db import migrations


def create_homephoto_slots(apps, schema_editor):
    HomePhoto = apps.get_model(
        "events",
        "HomePhoto",
    )

    for slot in range(1, 13):
        HomePhoto.objects.get_or_create(
            slot=slot,
            defaults={
                "image_url": "",
                "cloudinary_public_id": "",
                "alt_text": "",
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        (
            "events",
            "0005_homehero",
        ),
    ]

    operations = [
        migrations.RunPython(
            create_homephoto_slots,
            migrations.RunPython.noop,
        ),
    ]