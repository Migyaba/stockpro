import hashlib

from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
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


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
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
        user = User.objects.get(id=user_id)
        membership = Membership.objects.get(id=membership_id, user=user, is_active=True)
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
                "organization": {
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
                },
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
                "organization": {
                    "id": str(request.organization.id),
                    "name": request.organization.name,
                    "currency": request.organization.currency,
                },
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
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        email = (request.data.get("email") or "").lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"ok": True})
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        print(f"[STOCKPRO] Reset password: {email} uid={uid} token={token}")
        return Response({"ok": True})


class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
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
        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": {"code": "invalid", "message": "Lien expiré."}}, status=400
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
            return Response(status=403)
        instance = self.get_object()
        if instance.role == Role.OWNER and request.data.get("role") not in (None, Role.OWNER):
            owners = Membership.objects.filter(
                organization=request.organization, role=Role.OWNER, is_active=True
            ).count()
            if owners <= 1:
                raise InvalidStateTransition("L'organisation doit conserver au moins un owner.")
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
