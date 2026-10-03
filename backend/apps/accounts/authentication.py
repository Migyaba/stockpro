from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

from apps.accounts.models import Membership
from apps.core.tenancy import set_tenant


class TenantJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        membership_id = token.get("membership_id")
        organization_id = token.get("organization_id")
        if not membership_id or not organization_id:
            raise InvalidToken("Jeton incomplet : membership manquant.")
        try:
            membership = Membership.objects.select_related("organization", "user").get(
                id=membership_id,
                user=user,
                organization_id=organization_id,
                is_active=True,
            )
        except Membership.DoesNotExist as exc:
            raise AuthenticationFailed("Membership introuvable ou inactif.") from exc
        if not membership.organization:
            raise AuthenticationFailed("Organisation introuvable.")
        if membership.organization.status == "CANCELLED":
            raise AuthenticationFailed("Cette organisation est résiliée.")
        set_tenant(membership.organization, membership)
        request.membership = membership
        request.organization = membership.organization
        return user, token
