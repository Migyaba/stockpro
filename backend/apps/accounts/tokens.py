from rest_framework_simplejwt.tokens import RefreshToken


def issue_tokens(user, membership):
    refresh = RefreshToken.for_user(user)
    refresh["membership_id"] = str(membership.id)
    refresh["organization_id"] = str(membership.organization_id)
    refresh["role"] = membership.role
    access = refresh.access_token
    access["membership_id"] = str(membership.id)
    access["organization_id"] = str(membership.organization_id)
    access["role"] = membership.role
    return {
        "access": str(access),
        "refresh": str(refresh),
    }
