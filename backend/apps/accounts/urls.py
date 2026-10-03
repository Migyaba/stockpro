from django.urls import path

from apps.accounts.views import (
    AcceptInvitationView,
    ChangePasswordView,
    LoginView,
    LogoutView,
    PasswordForgotView,
    PasswordResetView,
    RefreshView,
    RegisterView,
    MeView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", MeView.as_view()),
    path("password/change/", ChangePasswordView.as_view()),
    path("password/forgot/", PasswordForgotView.as_view()),
    path("password/reset/", PasswordResetView.as_view()),
    path("invitations/accept/", AcceptInvitationView.as_view()),
]
