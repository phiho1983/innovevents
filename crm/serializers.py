from rest_framework import serializers
from .models import Prospect, Quote, QuoteItem, Note, ClientProfile


class ProspectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prospect
        fields = "__all__"
        read_only_fields = ("status", "created_at")


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
