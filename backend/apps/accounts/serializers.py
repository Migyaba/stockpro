import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Invitation, Membership, MembershipWarehouse, Role, User
from apps.core.permissions import CUSTOMIZABLE_ROLES, GRANTABLE_PERMISSIONS, ROLE_PERMISSIONS
from apps.core.exceptions import BusinessError
from apps.core.serializers import TenantScopedSerializerMixin
from apps.inventory.models import Warehouse
from apps.organizations.models import (
    Organization,
    OrganizationStatus,
    PlatformSubscriptionConfig,
    SubscriptionPlan,
)


def invitation_url(raw_token: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/invitation?token={raw_token}"


class OrganizationRequired(BusinessError):
    """Compte rattaché à plusieurs organisations : le client doit en choisir une."""

    def __init__(self, memberships):
        super().__init__(
            detail="Choisissez l'organisation à laquelle vous connecter.",
            code="ORGANIZATION_REQUIRED",
            extra={
                "organizations": [
                    {"id": str(m.organization_id), "name": m.organization.name}
                    for m in memberships
                ]
            },
        )


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    organization_name = serializers.CharField(max_length=200)
    country = serializers.CharField(max_length=2, default="BJ")
    currency = serializers.CharField(max_length=3, default="XOF")
    timezone = serializers.CharField(max_length=64, default="Africa/Porto-Novo")
    warehouse_name = serializers.CharField(max_length=160, default="Dépôt principal")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value.lower()

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def create(self, validated):
        user = User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            first_name=validated["first_name"],
            last_name=validated["last_name"],
            phone=validated.get("phone", ""),
        )
        trial_days = PlatformSubscriptionConfig.get_config().trial_days
        # En attente de la confirmation de l'email : l'essai démarre à ce
        # moment-là (start_pending_trials), pas à l'inscription.
        org = Organization.objects.create(
            name=validated["organization_name"],
            email=user.email,
            country=validated["country"].upper(),
            currency=validated["currency"].upper(),
            timezone=validated["timezone"],
            status=OrganizationStatus.SUSPENDED,
            subscription_plan=SubscriptionPlan.TRIAL if trial_days else SubscriptionPlan.MONTHLY,
            trial_ends_at=None,
        )
        membership = Membership.objects.create(
            user=user, organization=org, role=Role.OWNER, is_active=True
        )
        Warehouse.objects.create(
            organization=org,
            name=validated["warehouse_name"],
            code="MAIN",
        )
        return user, membership


def start_pending_trials(user):
    """Démarre l'essai des organisations créées par ce compte et restées en
    attente de la confirmation de son email."""
    trial_days = PlatformSubscriptionConfig.get_config().trial_days
    if not trial_days:
        return
    now = timezone.now()
    Organization.objects.filter(
        memberships__user=user,
        memberships__role=Role.OWNER,
        status=OrganizationStatus.SUSPENDED,
        subscription_plan=SubscriptionPlan.TRIAL,
        trial_ends_at__isnull=True,
    ).update(status=OrganizationStatus.TRIAL, trial_ends_at=now + timedelta(days=trial_days))


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    organization_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        try:
            user = User.objects.get(email__iexact=attrs["email"])
        except User.DoesNotExist as exc:
            # Même coût qu'un vrai contrôle (Argon2) : le temps de réponse ne
            # doit pas révéler si le compte existe (cf. ModelBackend de Django).
            User().set_password(attrs["password"])
            raise serializers.ValidationError("Identifiants incorrects.") from exc
        if not user.is_active or not user.check_password(attrs["password"]):
            raise serializers.ValidationError("Identifiants incorrects.")
        # Signalé seulement avec le bon mot de passe : ne révèle rien à un tiers.
        if user.email_verified_at is None:
            raise BusinessError(
                "Confirmez votre adresse email : ouvrez le lien reçu à l'inscription.",
                code="EMAIL_NOT_VERIFIED",
            )
        memberships = list(
            user.memberships.select_related("organization").filter(is_active=True)
        )
        if not memberships:
            raise serializers.ValidationError("Aucun espace n'est associé à ce compte.")
        org_id = attrs.get("organization_id")
        if org_id:
            membership = next((m for m in memberships if m.organization_id == org_id), None)
            if membership is None:
                raise serializers.ValidationError("Organisation introuvable pour ce compte.")
        elif len(memberships) == 1:
            membership = memberships[0]
        else:
            raise OrganizationRequired(memberships)
        attrs["user"] = user
        attrs["membership"] = membership
        return attrs


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        try:
            token = RefreshToken(attrs["refresh"])
        except TokenError as exc:
            raise serializers.ValidationError("Refresh token invalide.") from exc
        attrs["token"] = token
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context["request"].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class MembershipSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = Membership
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "is_active",
            "created_at",
            "warehouse_ids",
            "granted_permissions",
            "revoked_permissions",
        ]
        read_only_fields = ["id", "created_at"]

    # Écriture : liste des dépôts autorisés (vide = tous, cf. §14.3).
    warehouse_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Warehouse.objects.all(), required=False, write_only=True
    )
    # Ajustements individuels : ne concernent que gestionnaire et caissier.
    granted_permissions = serializers.ListField(
        child=serializers.ChoiceField(choices=sorted(GRANTABLE_PERMISSIONS)), required=False
    )
    revoked_permissions = serializers.ListField(
        child=serializers.ChoiceField(choices=sorted(GRANTABLE_PERMISSIONS)), required=False
    )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["warehouse_ids"] = [str(i) for i in instance.warehouse_ids()]
        data["permissions"] = sorted(instance.permissions())
        return data

    def validate(self, attrs):
        # Ajustements recalculés par rapport au rôle final : un ajout déjà
        # inclus dans le rôle ou un retrait absent du rôle n'a pas de sens, et
        # les rôles propriétaire / administrateur n'en ont aucun.
        instance = self.instance
        role = attrs.get("role", instance.role if instance else None)
        granted = set(attrs.get("granted_permissions", instance.granted_permissions if instance else []))
        revoked = set(attrs.get("revoked_permissions", instance.revoked_permissions if instance else []))
        if role in CUSTOMIZABLE_ROLES:
            role_perms = ROLE_PERMISSIONS.get(role, set())
            attrs["granted_permissions"] = sorted(granted - role_perms)
            attrs["revoked_permissions"] = sorted(revoked & role_perms)
        else:
            attrs["granted_permissions"] = []
            attrs["revoked_permissions"] = []
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        warehouses = validated_data.pop("warehouse_ids", None)
        instance = super().update(instance, validated_data)
        if warehouses is not None:
            instance.warehouse_links.all().delete()
            MembershipWarehouse.objects.bulk_create(
                MembershipWarehouse(membership=instance, warehouse=w) for w in warehouses
            )
        return instance


class InvitationSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    warehouse_ids = serializers.PrimaryKeyRelatedField(
        source="warehouses", many=True, queryset=Warehouse.objects.all(), required=False
    )
    invited_by_name = serializers.CharField(source="invited_by.full_name", read_only=True)

    class Meta:
        model = Invitation
        fields = [
            "id",
            "email",
            "role",
            "warehouse_ids",
            "invited_by_name",
            "expires_at",
            "accepted_at",
            "created_at",
        ]
        read_only_fields = ["id", "expires_at", "accepted_at", "created_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Le lien n'est connu qu'à la création (seul le hash est stocké) : on le
        # renvoie une fois pour permettre un partage par WhatsApp/SMS.
        raw = getattr(instance, "raw_token", None)
        if raw:
            data["invitation_url"] = invitation_url(raw)
        return data

    def validate_role(self, value):
        if value == Role.OWNER:
            raise serializers.ValidationError("Impossible d'inviter un second owner via invitation.")
        if value == Role.ADMINISTRATOR and self.context["request"].membership.role != Role.OWNER:
            raise serializers.ValidationError("Seul le propriétaire peut inviter un administrateur.")
        return value

    @transaction.atomic
    def create(self, validated):
        request = self.context["request"]
        email = validated["email"].lower()
        warehouses = validated.pop("warehouses", [])
        org = request.organization
        if Membership.objects.filter(organization=org, user__email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "Cet utilisateur appartient déjà à l'organisation."}
            )
        if Invitation.objects.filter(
            organization=org, email__iexact=email, accepted_at__isnull=True, expires_at__gt=timezone.now()
        ).exists():
            raise serializers.ValidationError({"email": "Une invitation est déjà en cours."})
        raw = secrets.token_urlsafe(32)
        invitation = Invitation.objects.create(
            organization=org,
            email=email,
            role=validated["role"],
            token_hash=hashlib.sha256(raw.encode()).hexdigest(),
            expires_at=timezone.now() + timedelta(days=7),
            invited_by=request.user,
        )
        invitation.warehouses.set(warehouses)
        invitation.raw_token = raw
        return invitation


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.CharField()
    # Compte existant : son mot de passe actuel (preuve d'identité).
    # Nouveau compte : le mot de passe choisi, avec prénom et nom.
    password = serializers.CharField()
    first_name = serializers.CharField(required=False, max_length=150)
    last_name = serializers.CharField(required=False, max_length=150)


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class AuthSessionSerializer(TokenPairSerializer):
    user = serializers.DictField()
    organization = serializers.DictField()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)


class OkSerializer(serializers.Serializer):
    ok = serializers.BooleanField()


class MeSerializer(serializers.Serializer):
    user = serializers.DictField()
    membership = serializers.DictField()
    organization = serializers.DictField()
