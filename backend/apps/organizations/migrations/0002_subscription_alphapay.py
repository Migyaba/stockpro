import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='subscription_plan',
            field=models.CharField(
                choices=[
                    ('TRIAL', 'Essai Gratuit 14j'),
                    ('MONTHLY', 'Mensuel (5 000 F)'),
                    ('QUARTERLY', 'Trimestriel (12 500 F)'),
                    ('CUSTOM', 'Déploiement Sur-Mesure')
                ],
                default='TRIAL',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='organization',
            name='subscription_ends_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='SubscriptionPayment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reference', models.CharField(max_length=64, unique=True)),
                ('plan', models.CharField(choices=[('TRIAL', 'Essai Gratuit 14j'), ('MONTHLY', 'Mensuel (5 000 F)'), ('QUARTERLY', 'Trimestriel (12 500 F)'), ('CUSTOM', 'Déploiement Sur-Mesure')], max_length=20)),
                ('amount', models.PositiveIntegerField(help_text='Montant en FCFA')),
                ('currency', models.CharField(default='XOF', max_length=3)),
                ('alphapay_checkout_id', models.CharField(blank=True, max_length=128, null=True)),
                ('alphapay_slug', models.CharField(blank=True, max_length=128, null=True)),
                ('status', models.CharField(choices=[('PENDING', 'En attente'), ('COMPLETED', 'Payé'), ('FAILED', 'Échoué'), ('CANCELLED', 'Annulé')], default='PENDING', max_length=20)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('customer_phone', models.CharField(blank=True, max_length=32)),
                ('customer_email', models.EmailField(blank=True, max_length=254)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subscription_payments', to='organizations.organization')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
