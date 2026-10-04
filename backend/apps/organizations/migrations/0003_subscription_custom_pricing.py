from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0002_subscription_alphapay'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='custom_monthly_price',
            field=models.PositiveIntegerField(
                blank=True,
                help_text='Tarif mensuel personnalisé (FCFA). Laissez vide pour utiliser le tarif global de la plateforme.',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='organization',
            name='custom_quarterly_price',
            field=models.PositiveIntegerField(
                blank=True,
                help_text='Tarif trimestriel personnalisé (FCFA). Laissez vide pour utiliser le tarif global de la plateforme.',
                null=True
            ),
        ),
        migrations.CreateModel(
            name='PlatformSubscriptionConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('default_monthly_price', models.PositiveIntegerField(default=5000, help_text='Tarif mensuel global par défaut en FCFA (ex: 5000).')),
                ('default_quarterly_price', models.PositiveIntegerField(default=12500, help_text='Tarif trimestriel global par défaut en FCFA (ex: 12500).')),
                ('trial_days', models.PositiveSmallIntegerField(default=14, help_text="Durée de la période d'essai gratuit en jours (ex: 14).")),
                ('support_phone', models.CharField(default='+22943507805', help_text="Numéro WhatsApp d'assistance et de contact sur-mesure.", max_length=32)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Configuration globale des abonnements',
                'verbose_name_plural': 'Configuration globale des abonnements',
            },
        ),
    ]
