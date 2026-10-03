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
