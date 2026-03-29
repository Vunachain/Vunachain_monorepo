import os
import sys
from django.core.management.utils import get_random_secret_key

def check_env():
    print("Locked Down: Verifying Production Environment Security...\n")
    issues = []
    
    # 1. Check DEBUG
    debug = os.getenv('DEBUG', 'True')
    if debug == 'True':
        issues.append("❌ DEBUG is set to True. It must be False in production.")
    else:
        print("✅ DEBUG is False")

    # 2. Check SECRET_KEY
    secret_key = os.getenv('SECRET_KEY', '')
    if not secret_key:
        issues.append("❌ SECRET_KEY is missing.")
    elif 'django-insecure' in secret_key:
        issues.append("❌ SECRET_KEY appears to be a default insecure key. Generate a new one.")
    elif len(secret_key) < 50:
        issues.append("⚠️ SECRET_KEY might be too short.")
    else:
        print("✅ SECRET_KEY looks sufficient")

    # 3. Check DATABASE_URL
    db_url = os.getenv('DATABASE_URL', '')
    if 'sqlite' in db_url:
        issues.append("❌ DATABASE_URL is using SQLite. Use PostgreSQL for production.")
    elif not db_url:
        issues.append("❌ DATABASE_URL is missing.")
    else:
        print("✅ DATABASE_URL is configured")

    # 4. Check ALLOWED_HOSTS
    allowed_hosts = os.getenv('ALLOWED_HOSTS', '')
    if 'localhost' in allowed_hosts or '127.0.0.1' in allowed_hosts:
         issues.append("⚠️ ALLOWED_HOSTS contains localhost/127.0.0.1. Verify this is intended for production.")
    
    if not allowed_hosts:
        issues.append("❌ ALLOWED_HOSTS is empty.")
    else:
        print(f"✅ ALLOWED_HOSTS is set: {allowed_hosts}")

    print("\n------------------------------------------------")
    if issues:
        print("\n⚠️  SECURITY ISSUES FOUND:")
        for issue in issues:
            print(issue)
        print("\nTo generate a new secret key, you can use:")
        print(f"python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'")
    else:
        print("\n✅ All checks passed! Your environment looks secure.")

if __name__ == "__main__":
    # Mocking loading .env for local test usage if needed, but in prod it should be loaded by the system
    # form dotenv import load_dotenv
    # load_dotenv()
    check_env()
