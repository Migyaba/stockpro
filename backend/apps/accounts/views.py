import hashlib
import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Invitation, Membership, Role, User
from apps.accounts.serializers import (
    AcceptInvitationSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    InvitationSerializer,
    LoginSerializer,
    MeSerializer,
    MembershipSerializer,
    PasswordResetSerializer,
    RefreshSerializer,
    RegisterSerializer,
)
from apps.accounts.tokens import issue_tokens
from apps.audit.services import AuditAction, write_audit
from apps.core.exceptions import InvalidStateTransition
from apps.core.permissions import ROLE_PERMISSIONS, require_permission
from apps.core.viewsets import TenantViewSet

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, membership, tokens = serializer.save()
        return Response(
            {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "organization": {
                    "id": str(membership.organization_id),
                    "name": membership.organization.name,
                },
                **tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        membership = serializer.validated_data["membership"]
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        tokens = issue_tokens(user, membership)
        request.organization = membership.organization
        request.user = user
        write_audit(request, action=AuditAction.LOGIN, entity=user)
        return Response(
            {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": membership.role,
                },
                "organization": {
                    "id": str(membership.organization_id),
                    "name": membership.organization.name,
                    "currency": membership.organization.currency,
                    "currency_exponent": membership.organization.currency_exponent,
                    "timezone": membership.organization.timezone,
                },
                **tokens,
            }
        )


class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = RefreshSerializer

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old = serializer.validated_data["token"]
        try:
            user_id = old["user_id"]
            membership_id = old["membership_id"]
        except KeyError:
            return Response({"error": {"code": "invalid", "message": "Jeton incomplet."}}, status=400)
        membership = (
            Membership.objects.select_related("user", "organization")
            .filter(id=membership_id, user_id=user_id, is_active=True, user__is_active=True)
            .first()
        )
        if membership is None or membership.organization.status == "CANCELLED":
            return Response(
                {"error": {"code": "authentication_failed", "message": "Accès révoqué : reconnectez-vous."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = membership.user
        old.blacklist()
        tokens = issue_tokens(user, membership)
        return Response(tokens)


class LogoutView(APIView):
    serializer_class = RefreshSerializer
    def post(self, request):
        refresh = request.data.get("refresh")
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass
        write_audit(request, action=AuditAction.LOGOUT, entity=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


def _organization_payload(org):
    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "country": org.country,
        "currency": org.currency,
        "currency_exponent": org.currency_exponent,
        "timezone": org.timezone,
        "status": org.status,
        "tax_enabled": org.tax_enabled,
        "tax_rate_bps": org.tax_rate_bps,
        "prices_include_tax": org.prices_include_tax,
        "max_discount_percent_manager": org.max_discount_percent_manager,
    }


class MeView(APIView):
    serializer_class = MeSerializer

    def get(self, request):
        m = request.membership
        org = request.organization
        return Response(
            {
                "user": {
                    "id": str(request.user.id),
                    "email": request.user.email,
                    "first_name": request.user.first_name,
                    "last_name": request.user.last_name,
                    "phone": request.user.phone,
                    "email_verified": bool(request.user.email_verified_at),
                },
                "membership": {
                    "id": str(m.id),
                    "role": m.role,
                    "permissions": sorted(ROLE_PERMISSIONS.get(m.role, [])),
                },
                "organization": _organization_payload(org),
            }
        )


class MyMembershipView(APIView):
    def get(self, request):
        m = request.membership
        return Response(
            {
                "id": str(m.id),
                "role": m.role,
                "is_active": m.is_active,
                "permissions": sorted(ROLE_PERMISSIONS.get(m.role, [])),
                "warehouse_ids": [str(i) for i in m.warehouse_ids()],
                "organization": _organization_payload(request.organization),
            }
        )


class ChangePasswordView(APIView):
    serializer_class = ChangePasswordSerializer
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"error": {"code": "invalid", "message": "Ancien mot de passe incorrect."}},
                status=400,
            )
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"ok": True})


class PasswordForgotView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_password"
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        email = (request.data.get("email") or "").lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"ok": True})
        if not user.is_active:
            return Response({"ok": True})
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?uid={uid}&token={token}"
        try:
            send_mail(
                subject="STOCKPRO — Réinitialisation de votre mot de passe",
                message=(
                    f"Bonjour {user.first_name},\n\n"
                    "Pour choisir un nouveau mot de passe, ouvrez ce lien :\n"
                    f"{link}\n\n"
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
                ),
                from_email=None,
                recipient_list=[user.email],
            )
        except Exception:
            # Réponse identique dans tous les cas : ne pas révéler l'existence du compte.
            logger.exception("Échec d'envoi de l'email de réinitialisation.")
        return Response({"ok": True})


class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_password"
    serializer_class = PasswordResetSerializer

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password")
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response(
                {"error": {"code": "invalid", "message": "Lien invalide."}}, status=400
            )
        if not user.is_active or not default_token_generator.check_token(user, token):
            return Response(
                {"error": {"code": "invalid", "message": "Lien expiré."}}, status=400
            )
        try:
            validate_password(password or "", user=user)
        except DjangoValidationError as exc:
            return Response(
                {"error": {"code": "invalid", "message": " ".join(exc.messages)}}, status=400
            )
        user.set_password(password)
        user.save()
        return Response({"ok": True})


class MembershipViewSet(TenantViewSet):
    serializer_class = MembershipSerializer
    queryset = Membership.objects.select_related("user").all()
    http_method_names = ["get", "patch", "head", "options"]

    def get_permissions(self):
        return [require_permission("users.view")()]

    def partial_update(self, request, *args, **kwargs):
        if not request.membership.has_perm("users.update"):
            raise PermissionDenied()
        instance = self.get_object()
        new_role = request.data.get("role", instance.role)
        deactivating = str(request.data.get("is_active", instance.is_active)).lower() in {"false", "0"}
        if instance.pk == request.membership.pk:
            raise InvalidStateTransition("Vous ne pouvez pas modifier votre propre rôle ou accès.")
        touches_owner = instance.role == Role.OWNER or new_role == Role.OWNER
        if touches_owner and request.membership.role != Role.OWNER:
            raise PermissionDenied("Seul un owner peut attribuer ou modifier le rôle owner.")
        loses_owner = instance.role == Role.OWNER and (new_role != Role.OWNER or deactivating)
        if loses_owner:
            with transaction.atomic():
                # FOR UPDATE n'accepte pas COUNT() sous PostgreSQL : on matérialise la liste.
                active_owners = list(
                    Membership.objects.select_for_update().filter(
                        organization=request.organization, role=Role.OWNER, is_active=True
                    )
                )
                if len(active_owners) <= 1:
                    raise InvalidStateTransition("L'organisation doit conserver au moins un owner actif.")
                return super().partial_update(request, *args, **kwargs)
        return super().partial_update(request, *args, **kwargs)


class InvitationViewSet(TenantViewSet):
    serializer_class = InvitationSerializer
    queryset = Invitation.objects.all()
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        perm = "users.invite" if self.action == "create" else "users.view"
        return [require_permission(perm)()]

    def create(self, request, *args, **kwargs):
        if not request.user.email_verified_at and not request.user.is_superuser:
            # Pilote : on autorise l'invitation, un rappel pourra être ajouté.
            pass
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        invitation = serializer.save()
        write_audit(
            self.request,
            action=AuditAction.CREATE,
            entity=invitation,
            extra={"email": invitation.email, "role": invitation.role},
        )


class AcceptInvitationView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"
    serializer_class = AcceptInvitationSerializer

    def post(self, request):
        serializer = AcceptInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw = serializer.validated_data["token"]
        digest = hashlib.sha256(raw.encode()).hexdigest()
        try:
            invitation = Invitation.objects.select_related("organization").get(
                token_hash=digest, accepted_at__isnull=True
            )
        except Invitation.DoesNotExist:
            return Response(
                {"error": {"code": "invalid", "message": "Invitation invalide."}}, status=400
            )
        if invitation.expires_at < timezone.now():
            return Response(
                {"error": {"code": "invalid", "message": "Invitation expirée."}}, status=400
            )
        user = User.objects.filter(email__iexact=invitation.email).first()
        if user is None:
            password = serializer.validated_data.get("password")
            first_name = serializer.validated_data.get("first_name")
            last_name = serializer.validated_data.get("last_name")
            if not password or not first_name or not last_name:
                return Response(
                    {
                        "error": {
                            "code": "invalid",
                            "message": "Compte à créer : password, first_name et last_name requis.",
                        }
                    },
                    status=400,
                )
            user = User.objects.create_user(
                email=invitation.email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                email_verified_at=timezone.now(),
            )
        if Membership.objects.filter(user=user, organization=invitation.organization).exists():
            raise InvalidStateTransition("Cet utilisateur appartient déjà à l'organisation.")
        membership = Membership.objects.create(
            user=user,
            organization=invitation.organization,
            role=invitation.role,
            is_active=True,
        )
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["accepted_at"])
        tokens = issue_tokens(user, membership)
        return Response({**tokens, "organization_id": str(invitation.organization_id)})
