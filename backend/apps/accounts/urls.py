from django.urls import path

from apps.accounts.views import (
    AcceptInvitationView,
    InvitationInfoView,
    ChangePasswordView,
    LoginView,
    LogoutView,
    PasswordForgotView,
    PasswordResetView,
    RefreshView,
    RegisterView,
    MeView,
    MyMembershipView,
    PermissionCatalogView,
    ResendVerificationView,
    VerifyEmailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("token/refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", MeView.as_view()),
    path("membership/", MyMembershipView.as_view()),
    path("permissions/", PermissionCatalogView.as_view()),
    path("password/change/", ChangePasswordView.as_view()),
    path("password/forgot/", PasswordForgotView.as_view()),
    path("password/reset/", PasswordResetView.as_view()),
    path("email/verify/", VerifyEmailView.as_view()),
    path("email/resend/", ResendVerificationView.as_view()),
    path("invitations/info/", InvitationInfoView.as_view()),
    path("invitations/accept/", AcceptInvitationView.as_view()),
]
