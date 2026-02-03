from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name")

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.get_or_create(user=user)
        return user


class MeSerializer(serializers.Serializer):
    user = UserSerializer()
    profile = UserProfileSerializer()

    def update(self, instance, validated_data):
        user_data = validated_data.get("user", {})
        profile_data = validated_data.get("profile", {})

        user = instance["user"]
        profile = instance["profile"]

        for field, value in user_data.items():
            setattr(user, field, value)
        user.save()

        for field, value in profile_data.items():
            setattr(profile, field, value)
        profile.save()

        return {"user": user, "profile": profile}
