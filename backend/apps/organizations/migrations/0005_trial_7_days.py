from django.db import migrations, models


def enable_trial(apps, schema_editor):
    Config = apps.get_model("organizations", "PlatformSubscriptionConfig")
    Config.objects.filter(trial_days=0).update(trial_days=7)


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0004_alter_organization_status_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="organization",
            name="subscription_plan",
            field=models.CharField(
                choices=[
                    ("TRIAL", "Essai Gratuit 7j"),
                    ("MONTHLY", "Mensuel (5 000 F)"),
                    ("QUARTERLY", "Trimestriel (12 500 F)"),
                    ("CUSTOM", "Déploiement Sur-Mesure"),
                ],
                default="MONTHLY",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="platformsubscriptionconfig",
            name="trial_days",
            field=models.PositiveSmallIntegerField(
                default=7,
                help_text="Durée de la période d'essai gratuit en jours (0 = désactivé).",
            ),
        ),
        migrations.RunPython(enable_trial, migrations.RunPython.noop),
    ]
