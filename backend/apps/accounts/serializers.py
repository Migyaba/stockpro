import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Invitation, Membership, Role, User
from apps.accounts.tokens import issue_tokens
from apps.inventory.models import Warehouse
from apps.organizations.models import Organization


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
        org = Organization.objects.create(
            name=validated["organization_name"],
            email=user.email,
            country=validated["country"].upper(),
            currency=validated["currency"].upper(),
            timezone=validated["timezone"],
            status="TRIAL",
            trial_ends_at=timezone.now() + timedelta(days=14),
        )
        membership = Membership.objects.create(
            user=user, organization=org, role=Role.OWNER, is_active=True
        )
        Warehouse.objects.create(
            organization=org,
            name=validated["warehouse_name"],
            code="MAIN",
        )
        tokens = issue_tokens(user, membership)
        return user, membership, tokens


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    organization_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        try:
            user = User.objects.get(email__iexact=attrs["email"])
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Identifiants incorrects.") from exc
        if not user.is_active or not user.check_password(attrs["password"]):
            raise serializers.ValidationError("Identifiants incorrects.")
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
            raise serializers.ValidationError(
                {"organization_id": "Plusieurs organisations : précisez organization_id."}
            )
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


class MembershipSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = ["id", "created_at"]


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["id", "email", "role", "expires_at", "accepted_at", "created_at"]
        read_only_fields = ["id", "expires_at", "accepted_at", "created_at"]

    def validate_role(self, value):
        if value == Role.OWNER:
            raise serializers.ValidationError("Impossible d'inviter un second owner via invitation.")
        return value

    def create(self, validated):
        request = self.context["request"]
        email = validated["email"].lower()
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
        invitation.raw_token = raw
        return invitation


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(required=False, min_length=8)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)


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
