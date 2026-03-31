import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

username = os.environ.get('ADMIN_USERNAME', 'admin')
email = os.environ.get('ADMIN_EMAIL', 'admin@vunachain.com')
password = os.environ.get('ADMIN_PASSWORD')

if not password:
    raise SystemExit(
        "ERROR: ADMIN_PASSWORD environment variable is required. "
        "Set it before running this script."
    )

user, created = User.objects.get_or_create(username=username, defaults={'email': email})

if created:
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print(f"Superuser '{username}' created successfully.")
else:
    user.set_password(password)
    user.save()
    print(f"Superuser '{username}' password updated successfully.")
