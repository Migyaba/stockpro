import ipaddress

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, HttpResponseNotFound
from rest_framework.throttling import BaseThrottle

from apps.core.tenancy import clear_tenant


class ClearTenantMiddleware:
    """Empêche un contexte tenant de fuir d'une requête à l'autre."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        clear_tenant()
        try:
            return self.get_response(request)
        finally:
            clear_tenant()


class AdminGuardMiddleware:
    """Protège l'admin Django et la documentation de l'API.

    - DJANGO_ADMIN_ALLOWED_IPS (adresses ou réseaux, séparés par des virgules) :
      hors de cette liste, l'admin et la doc répondent 404 ;
    - connexion à l'admin limitée par IP (ADMIN_LOGIN_ATTEMPTS par
      ADMIN_LOGIN_WINDOW secondes), quelle que soit l'issue de la tentative.
    L'IP est lue comme pour le throttling DRF (NUM_PROXIES) : non falsifiable.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        admin_prefix = "/" + settings.ADMIN_URL
        path = request.path
        protected = path.startswith(admin_prefix) or path.startswith(settings.API_DOCS_PATHS)
        if not protected:
            return self.get_response(request)

        ip = _client_ip(request)
        if settings.ADMIN_ALLOWED_NETWORKS and not _ip_allowed(ip, settings.ADMIN_ALLOWED_NETWORKS):
            return HttpResponseNotFound()

        if request.method == "POST" and path == admin_prefix + "login/":
            key = f"admin-login:{ip}"
            cache.add(key, 0, settings.ADMIN_LOGIN_WINDOW)
            if cache.incr(key) > settings.ADMIN_LOGIN_ATTEMPTS:
                return HttpResponse("Trop de tentatives. Réessayez plus tard.", status=429)
        return self.get_response(request)


def _client_ip(request):
    return BaseThrottle().get_ident(request)


def _ip_allowed(ip, networks):
    try:
        address = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(address in network for network in networks)
