from django.db import migrations
from django.db.models.functions import Coalesce, Now


def mark_existing_users_verified(apps, schema_editor):
    # La confirmation d'email devient obligatoire pour les nouvelles
    # inscriptions ; les comptes existants ne doivent pas être bloqués.
    User = apps.get_model("accounts", "User")
    User.objects.filter(email_verified_at__isnull=True).update(
        email_verified_at=Coalesce("created_at", Now())
    )


class Migration(migrations.Migration):
    dependencies = [("accounts", "0004_membership_permission_overrides")]

    operations = [migrations.RunPython(mark_existing_users_verified, migrations.RunPython.noop)]
