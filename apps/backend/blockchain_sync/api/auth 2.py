from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        
        # Add roles (group names)
        groups = list(user.groups.values_list('name', flat=True))
        token['roles'] = groups
        
        # Primary role logic (simplification for frontend routing)
        primary_role = 'Staff' if user.is_staff else 'User'
        if 'CoopManager' in groups:
            primary_role = 'CoopManager'
        elif 'FieldAgent' in groups:
            primary_role = 'FieldAgent'
        elif 'Agronomist' in groups:
            primary_role = 'Agronomist'
        elif 'Offtaker' in groups:
            primary_role = 'Offtaker'
        elif 'Auditor' in groups:
            primary_role = 'Auditor'
            
        token['primary_role'] = primary_role

        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
