import hashlib
import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Invitation, Membership, MembershipWarehouse, Role, User
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
    invitation_url,
    start_pending_trials,
)
from apps.accounts.emails import (
    email_verification_token,
    send_invitation_email,
    send_password_reset_email,
    send_verification_email,
)
from apps.accounts.tokens import issue_tokens, password_fingerprint, session_expired
from apps.audit.services import AuditAction, write_audit
from apps.core.exceptions import InvalidStateTransition
from apps.core.permissions import CUSTOMIZABLE_ROLES, GRANTABLE_PERMISSIONS, ROLE_PERMISSIONS, require_permission
from apps.core.viewsets import AuditedViewSetMixin, TenantViewSet

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
        with transaction.atomic():
            user, _membership = serializer.save()
        # Pas de session tant que l'email n'est pas confirmé.
        send_verification_email(user)
        return Response(
            {"email": user.email, "verification_required": True},
            status=status.HTTP_201_CREATED,
        )


def _session_payload(request, user, membership):
    """Réponse d'ouverture de session (login, confirmation d'email)."""
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    tokens = issue_tokens(user, membership)
    request.organization = membership.organization
    request.user = user
    write_audit(request, action=AuditAction.LOGIN, entity=user)
    return {
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


class VerifyEmailView(APIView):
    """Confirme l'email à partir du lien reçu, démarre l'essai et ouvre la session."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_password"

    def post(self, request):
        invalid = Response({"error": {"code": "invalid", "message": "Lien invalide ou expiré."}}, status=400)
        try:
            user = User.objects.get(pk=urlsafe_base64_decode(request.data.get("uid") or "").decode())
        except Exception:
            return invalid
        if not user.is_active or not email_verification_token.check_token(user, request.data.get("token") or ""):
            return invalid
        with transaction.atomic():
            user.email_verified_at = timezone.now()
            user.save(update_fields=["email_verified_at"])
            start_pending_trials(user)
        membership = (
            user.memberships.select_related("organization").filter(is_active=True).order_by("created_at").first()
        )
        if membership is None:
            return Response({"ok": True})
        return Response(_session_payload(request, user, membership))


class ResendVerificationView(APIView):
    """Renvoie le lien de confirmation. Réponse identique que le compte existe ou non."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_password"

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        user = User.objects.filter(email__iexact=email, is_active=True, email_verified_at__isnull=True).first()
        if user is not None:
            send_verification_email(user)
        return Response({"ok": True})


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
        return Response(_session_payload(request, user, membership))


class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_refresh"
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
        # Mot de passe changé depuis l'émission, ou session trop ancienne :
        # la rotation ne doit pas prolonger indéfiniment un jeton volé.
        auth_time = old.get("auth_time")
        if old.get("pwd") != password_fingerprint(user) or session_expired(auth_time):
            old.blacklist()
            return Response(
                {"error": {"code": "authentication_failed", "message": "Session expirée : reconnectez-vous."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        old.blacklist()
        tokens = issue_tokens(user, membership, auth_time=auth_time)
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
                    "permissions": sorted(m.permissions()),
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
                "permissions": sorted(m.permissions()),
                "warehouse_ids": [str(i) for i in m.warehouse_ids()],
                "organization": _organization_payload(request.organization),
            }
        )


class PermissionCatalogView(APIView):
    """Permissions de chaque rôle et celles ajustables membre par membre."""

    permission_classes = [require_permission("users.view")]

    def get(self, request):
        return Response(
            {
                "roles": {role: sorted(perms) for role, perms in ROLE_PERMISSIONS.items()},
                "grantable": sorted(GRANTABLE_PERMISSIONS),
                "customizable_roles": sorted(CUSTOMIZABLE_ROLES),
            }
        )


class ChangePasswordView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_password_change"
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
        # Les jetons existants (autres appareils compris) ne sont plus valides :
        # on renvoie un nouveau couple pour garder la session en cours.
        return Response({"ok": True, **issue_tokens(request.user, request.membership)})


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
        send_password_reset_email(user, link)
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


class MembershipViewSet(AuditedViewSetMixin, TenantViewSet):
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
        # Même lecture que le sérialiseur (« off », « no », « f »… valent False).
        try:
            deactivating = not serializers.BooleanField().to_internal_value(
                request.data.get("is_active", instance.is_active)
            )
        except serializers.ValidationError:
            deactivating = False
        if instance.pk == request.membership.pk:
            raise InvalidStateTransition("Vous ne pouvez pas modifier votre propre rôle ou accès.")
        touches_owner = instance.role == Role.OWNER or new_role == Role.OWNER
        if touches_owner and request.membership.role != Role.OWNER:
            raise PermissionDenied("Seul un owner peut attribuer ou modifier le rôle owner.")
        # Un administrateur ne gère que les gestionnaires et caissiers : modifier
        # un administrateur, ou en nommer un, est réservé au propriétaire.
        touches_admin = instance.role == Role.ADMINISTRATOR or new_role == Role.ADMINISTRATOR
        if touches_admin and request.membership.role != Role.OWNER:
            raise PermissionDenied("Seul le propriétaire peut modifier ou nommer un administrateur.")
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

    def perform_update(self, serializer):
        # Le mixin journalise rôle et activation ; les dépôts autorisés sont
        # des liens séparés, tracés ici dans la même transaction.
        before = sorted(str(i) for i in serializer.instance.warehouse_ids())
        with transaction.atomic():
            super().perform_update(serializer)
            after = sorted(str(i) for i in serializer.instance.warehouse_ids())
            if "warehouse_ids" in serializer.validated_data and before != after:
                write_audit(
                    self.request,
                    action=AuditAction.UPDATE,
                    entity=serializer.instance,
                    label=serializer.instance.user.email,
                    old_values={"warehouse_ids": before},
                    extra={"warehouse_ids": after},
                )


class InvitationViewSet(TenantViewSet):
    serializer_class = InvitationSerializer
    queryset = Invitation.objects.select_related("invited_by").prefetch_related("warehouses")
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_permissions(self):
        perm = "users.view" if self.action in ("list", "retrieve") else "users.invite"
        return [require_permission(perm)()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("status") == "pending":
            qs = qs.filter(accepted_at__isnull=True, expires_at__gt=timezone.now())
        return qs

    def perform_create(self, serializer):
        invitation = serializer.save()
        _send_invitation_email(invitation, self.request.user)
        write_audit(
            self.request,
            action=AuditAction.CREATE,
            entity=invitation,
            extra={"email": invitation.email, "role": invitation.role},
        )

    def perform_destroy(self, instance):
        if instance.accepted_at:
            raise InvalidStateTransition("Cette invitation a déjà été acceptée.")
        write_audit(self.request, action=AuditAction.DELETE, entity=instance, extra={"email": instance.email})
        instance.delete()


def _send_invitation_email(invitation, inviter):
    # En arrière-plan ; en cas d'échec, le lien reste partageable depuis
    # l'interface (WhatsApp, SMS).
    send_invitation_email(invitation, inviter, invitation_url(invitation.raw_token))


def _find_invitation(raw_token, *, lock=False):
    digest = hashlib.sha256((raw_token or "").encode()).hexdigest()
    qs = Invitation.objects.select_related("organization")
    if lock:
        qs = qs.select_for_update()
    invitation = qs.filter(token_hash=digest).first()
    if invitation is None or invitation.accepted_at:
        raise InvalidStateTransition("Cette invitation est invalide ou a déjà été utilisée.")
    if invitation.expires_at < timezone.now():
        raise InvalidStateTransition("Cette invitation a expiré. Demandez-en une nouvelle.")
    if invitation.organization.status == "CANCELLED":
        raise InvalidStateTransition("Cette organisation n'est plus active.")
    return invitation


class InvitationInfoView(APIView):
    """Informations affichées sur la page d'acceptation (sans authentification)."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    def get(self, request):
        invitation = _find_invitation(request.query_params.get("token"))
        return Response(
            {
                "email": invitation.email,
                "role": invitation.role,
                "organization_name": invitation.organization.name,
                "account_exists": User.objects.filter(email__iexact=invitation.email).exists(),
                "expires_at": invitation.expires_at,
            }
        )


class AcceptInvitationView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"
    serializer_class = AcceptInvitationSerializer

    @transaction.atomic
    def post(self, request):
        serializer = AcceptInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        invitation = _find_invitation(data["token"], lock=True)
        user = User.objects.filter(email__iexact=invitation.email).first()
        if user is not None:
            # Compte existant : le détenteur du lien doit prouver qu'il en est le propriétaire.
            if not user.is_active or not user.check_password(data["password"]):
                raise InvalidStateTransition("Mot de passe incorrect pour ce compte.")
        else:
            if not data.get("first_name") or not data.get("last_name"):
                raise InvalidStateTransition("Indiquez votre prénom et votre nom.")
            try:
                validate_password(data["password"])
            except DjangoValidationError as exc:
                raise InvalidStateTransition(" ".join(exc.messages)) from exc
            user = User.objects.create_user(
                email=invitation.email,
                password=data["password"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                email_verified_at=timezone.now(),
            )
        if Membership.objects.filter(user=user, organization=invitation.organization).exists():
            raise InvalidStateTransition("Ce compte appartient déjà à cette organisation.")
        membership = Membership.objects.create(
            user=user,
            organization=invitation.organization,
            role=invitation.role,
            is_active=True,
        )
        MembershipWarehouse.objects.bulk_create(
            MembershipWarehouse(membership=membership, warehouse=w)
            for w in invitation.warehouses.all()
        )
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["accepted_at", "updated_at"])
        tokens = issue_tokens(user, membership)
        return Response({**tokens, "organization_id": str(invitation.organization_id)})
