from rest_framework.routers import DefaultRouter

from apps.accounts.views import InvitationViewSet, MembershipViewSet

router = DefaultRouter()
router.register("users", MembershipViewSet, basename="users")
router.register("invitations", InvitationViewSet, basename="invitations")

urlpatterns = router.urls
