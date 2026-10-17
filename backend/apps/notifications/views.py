from django.utils import timezone
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.models import (
    KIND_DESCRIPTIONS,
    KIND_PERMISSIONS,
    Notification,
    NotificationKind,
    wants_email,
)
from apps.notifications.serializers import NotificationSerializer


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Notifications du membre connecté uniquement."""

    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(
            organization=self.request.organization, recipient=self.request.membership
        )
        if self.request.query_params.get("unread") in ("1", "true"):
            qs = qs.filter(read_at__isnull=True)
        return qs

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        return Response({"count": self.get_queryset().filter(read_at__isnull=True).count()})

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at", "updated_at"])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        updated = self.get_queryset().filter(read_at__isnull=True).update(read_at=timezone.now())
        return Response({"updated": updated})

    @action(detail=False, methods=["get", "patch"])
    def preferences(self, request):
        """Emails choisis par le membre, parmi les types qu'il peut recevoir.

        PATCH {"email": {"STOCK_LOW": false, ...}} : seuls les types listés changent.
        """
        membership = request.membership
        available = [k for k in NotificationKind if membership.has_perm(KIND_PERMISSIONS[k])]
        if request.method == "PATCH":
            choices = request.data.get("email")
            if not isinstance(choices, dict) or not all(
                k in available and isinstance(v, bool) for k, v in choices.items()
            ):
                raise serializers.ValidationError(
                    {"email": "Attendu : {type de notification: true/false} parmi vos notifications."}
                )
            membership.email_notifications = {**(membership.email_notifications or {}), **choices}
            membership.save(update_fields=["email_notifications", "updated_at"])
        return Response(
            {
                "email_verified": request.user.email_verified_at is not None,
                "kinds": [
                    {
                        "kind": k.value,
                        "label": k.label,
                        "description": KIND_DESCRIPTIONS[k],
                        "email": wants_email(membership, k),
                    }
                    for k in available
                ],
            }
        )
