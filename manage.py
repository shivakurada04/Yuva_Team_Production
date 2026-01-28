#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import os
import sys

# --- ADD THIS PATCH HERE ---
try:
    import MySQLdb
    # This tricks Django 3.2 into thinking the version is modern
    MySQLdb.version_info = (2, 2, 7, 'final', 0)
except ImportError:
    pass
# ---------------------------

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yuva_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
