import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel, UUIDModel
from apps.core.permissions import ROLE_PERMISSIONS


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("L'email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("email_verified_at", timezone.now())
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin, UUIDModel):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Role(models.TextChoices):
    OWNER = "OWNER", "Owner"
    ADMINISTRATOR = "ADMINISTRATOR", "Administrator"
    MANAGER = "MANAGER", "Manager"
    STAFF = "STAFF", "Staff"


class Membership(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "organization"], name="uniq_membership_user_org"
            )
        ]

    def __str__(self):
        return f"{self.user.email} @ {self.organization_id} ({self.role})"

    def has_perm(self, code: str) -> bool:
        if not self.is_active:
            return False
        return code in ROLE_PERMISSIONS.get(self.role, set())

    def warehouse_ids(self):
        return list(self.warehouse_links.values_list("warehouse_id", flat=True))

    def can_access_warehouse(self, warehouse) -> bool:
        if warehouse.organization_id != self.organization_id:
            return False
        if self.role in {Role.OWNER, Role.ADMINISTRATOR}:
            return True
        ids = self.warehouse_ids()
        if not ids:
            return True
        return warehouse.id in ids

    def max_discount_percent(self) -> int:
        if self.role in {Role.OWNER, Role.ADMINISTRATOR}:
            return 100
        if self.role == Role.MANAGER:
            return self.organization.max_discount_percent_manager
        return 0


class MembershipWarehouse(UUIDModel):
    membership = models.ForeignKey(
        Membership, on_delete=models.CASCADE, related_name="warehouse_links"
    )
    warehouse = models.ForeignKey(
        "inventory.Warehouse", on_delete=models.CASCADE, related_name="membership_links"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["membership", "warehouse"], name="uniq_membership_warehouse"
            )
        ]


class Invitation(TimeStampedModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=Role.choices)
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    invited_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="sent_invitations"
    )
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
