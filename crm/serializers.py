from rest_framework import serializers
from .models import Prospect, Quote, QuoteItem, Note, ClientProfile


# -------------------------
# PROSPECT (Jour 11)
# -------------------------

class ProspectPublicCreateSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé uniquement pour le formulaire public (POST /prospects/).
    -> Tous les champs obligatoires + pas de champs admin modifiables.
    """

    class Meta:
        model = Prospect
        # ⚠️ adapte cette liste EXACTEMENT à tes champs Prospect
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "company",
            "city",
            "message",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "status", "created_at")

    def validate(self, attrs):
        # Tous champs obligatoires (même si ton modèle autorise blank=True)
        required_fields = ["first_name", "last_name", "email", "phone", "company", "city", "message"]
        errors = {}

        for f in required_fields:
            val = attrs.get(f)
            if val is None or (isinstance(val, str) and not val.strip()):
                errors[f] = "Ce champ est obligatoire."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    def create(self, validated_data):
        # sécurité : on ignore "status" si envoyé, et le modèle mettra le défaut
        validated_data.pop("status", None)
        return Prospect.objects.create(**validated_data)


class ProspectAdminSerializer(serializers.ModelSerializer):
    """
    Serializer admin (GET /prospects/, GET /prospects/{id}/) : tout voir.
    """
    class Meta:
        model = Prospect
        fields = "__all__"
        read_only_fields = ("created_at",)


class ProspectStatusSerializer(serializers.ModelSerializer):
    """
    PATCH admin-only (PATCH /prospects/{id}/status/) : ne modifie que le statut.
    """
    class Meta:
        model = Prospect
        fields = ("status",)


# -------------------------
# EXISTANT (tu gardes)
# -------------------------

class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = "__all__"
        read_only_fields = ("user",)


class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ("id", "label", "amount_ht")


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, required=False)
    total_ht = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_tva = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_ttc = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Quote
        fields = (
            "id",
            "client",
            "prospect",
            "status",
            "tva_rate",
            "created_at",
            "items",
            "total_ht",
            "total_tva",
            "total_ttc",
        )
        read_only_fields = ("status", "created_at")

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        quote = Quote.objects.create(**validated_data)
        for it in items_data:
            QuoteItem.objects.create(quote=quote, **it)
        return quote


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = "__all__"
        read_only_fields = ("author", "created_at")
