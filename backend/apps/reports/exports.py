import csv

from django.http import HttpResponse

# Excel en français attend « ; » et reconnaît l'UTF-8 grâce au BOM.
CSV_DELIMITER = ";"
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _safe(value):
    """Neutralise l'injection de formules (=HYPERLINK…) dans les cellules texte."""
    if value is None:
        return ""
    if isinstance(value, str) and value.startswith(FORMULA_PREFIXES):
        return f"'{value}"
    return value


def csv_response(filename, header, rows):
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response.write("﻿")
    writer = csv.writer(response, delimiter=CSV_DELIMITER)
    writer.writerow(header)
    for row in rows:
        writer.writerow([_safe(value) for value in row])
    return response
