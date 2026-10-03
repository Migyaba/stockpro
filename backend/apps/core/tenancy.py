from contextvars import ContextVar

_organization = ContextVar("organization", default=None)
_membership = ContextVar("membership", default=None)


class TenantContextError(Exception):
    pass


def set_tenant(organization, membership):
    _organization.set(organization)
    _membership.set(membership)


def clear_tenant():
    _organization.set(None)
    _membership.set(None)


def get_organization():
    org = _organization.get()
    if org is None:
        raise TenantContextError("Aucun contexte d'organisation.")
    return org


def get_membership():
    membership = _membership.get()
    if membership is None:
        raise TenantContextError("Aucun membership actif.")
    return membership


def get_organization_or_none():
    return _organization.get()
