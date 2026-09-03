from rest_framework import serializers

from .models import (
    ClientProfile,
    ContactMessage,
    Note,
    Prospect,
    Quote,
    QuoteItem,
)


def clean_single_line_text(
    value,
):
    value = (
        value or ""
    ).strip()

    if any(
        ord(character) < 32
        for character in value
    ):
        raise serializers.ValidationError(
            "Ce champ contient des caractères non autorisés."
        )

    return value


def clean_multiline_text(
    value,
):
    value = (
        value or ""
    ).strip()

    for character in value:
        if (
            ord(character) < 32
            and character
            not in "\n\r\t"
        ):
            raise serializers.ValidationError(
                "Ce champ contient des caractères non autorisés."
            )

    return value


class ProspectPublicCreateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Prospect

        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "company",
            "city",
            "message",
            "event_type",
            "desired_date",
            "participant_count",
            "status",
            "created_at",
        )

        read_only_fields = (
            "id",
            "status",
            "created_at",
        )

        extra_kwargs = {
            "phone": {
                "required": False,
                "allow_blank": True,
            },
            "company": {
                "required": False,
                "allow_blank": True,
            },
            "city": {
                "required": False,
                "allow_blank": True,
            },
            "event_type": {
                "required": False,
                "allow_blank": True,
            },
            "desired_date": {
                "required": False,
                "allow_null": True,
            },
            "participant_count": {
                "required": False,
                "allow_null": True,
            },
        }

    def validate_first_name(
        self,
        value,
    ):
        return clean_single_line_text(
            value
        )

    def validate_last_name(
        self,
        value,
    ):
        return clean_single_line_text(
            value
        )

    def validate_phone(
        self,
        value,
    ):
        return clean_single_line_text(
            value
        )

    def validate_company(
        self,
        value,
    ):
        return clean_single_line_text(
            value
        )

    def validate_city(
        self,
        value,
    ):
        return clean_single_line_text(
            value
        )

    def validate_event_type(
        self,
        value,
    ):
        return clean_single_line_text(
            value
        )

    def validate_message(
        self,
        value,
    ):
        value = clean_multiline_text(
            value
        )

        if not value:
            raise serializers.ValidationError(
                "Ce champ est obligatoire."
            )

        return value

    def create(
        self,
        validated_data,
    ):
        validated_data.pop(
            "status",
            None,
        )

        return Prospect.objects.create(
            **validated_data
        )


class ProspectAdminSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Prospect
        fields = "__all__"

        read_only_fields = (
            "created_at",
            "converted_client",
        )


class ProspectStatusSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Prospect

        fields = (
            "status",
        )


class ContactMessageSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ContactMessage

        fields = (
            "id",
            "name",
            "email",
            "subject",
            "message",
            "status",
            "handled_by",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "handled_by",
            "created_at",
            "updated_at",
        )

    def validate_name(
        self,
        value,
    ):
        value = clean_single_line_text(
            value
        )

        if not value:
            raise serializers.ValidationError(
                "Ce champ est obligatoire."
            )

        return value

    def validate_subject(
        self,
        value,
    ):
        value = clean_single_line_text(
            value
        )

        if not value:
            raise serializers.ValidationError(
                "Ce champ est obligatoire."
            )

        return value

    def validate_message(
        self,
        value,
    ):
        value = clean_multiline_text(
            value
        )

        if not value:
            raise serializers.ValidationError(
                "Ce champ est obligatoire."
            )

        return value


class ClientProfileSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ClientProfile

        fields = "__all__"

        read_only_fields = (
            "user",
        )


class QuoteItemSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = QuoteItem

        fields = (
            "id",
            "label",
            "amount_ht",
        )


class QuoteSerializer(
    serializers.ModelSerializer
):
    items = QuoteItemSerializer(
        many=True,
        required=False,
    )

    total_ht = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    total_tva = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    total_ttc = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Quote

        fields = (
            "id",
            "client",
            "prospect",
            "event",
            "status",
            "tva_rate",
            "created_at",
            "items",
            "total_ht",
            "total_tva",
            "total_ttc",
        )

        read_only_fields = (
            "status",
            "created_at",
        )

    def validate(
        self,
        attrs,
    ):
        event = attrs.get(
            "event"
        )

        client = attrs.get(
            "client"
        )

        if event is not None:
            if event.client_id is None:
                raise serializers.ValidationError(
                    {
                        "event": (
                            "Le devis doit être rattaché "
                            "à un événement privé appartenant "
                            "à un client."
                        )
                    }
                )

            if (
                client is not None
                and client.id
                != event.client_id
            ):
                raise serializers.ValidationError(
                    {
                        "client": (
                            "Le client du devis doit correspondre "
                            "au client propriétaire de l'événement."
                        )
                    }
                )

        return attrs

    def create(
        self,
        validated_data,
    ):
        items_data = (
            validated_data.pop(
                "items",
                [],
            )
        )

        event = (
            validated_data.get(
                "event"
            )
        )

        prospect = (
            validated_data.get(
                "prospect"
            )
        )

        client = (
            validated_data.get(
                "client"
            )
        )

        if event is not None:
            validated_data[
                "client"
            ] = event.client

        elif (
            client is None
            and prospect
            is not None
            and prospect.converted_client_id
        ):
            validated_data[
                "client"
            ] = (
                prospect.converted_client
            )

        quote = Quote.objects.create(
            **validated_data
        )

        for item in items_data:
            QuoteItem.objects.create(
                quote=quote,
                **item,
            )

        return quote


class NoteSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Note

        fields = "__all__"

        read_only_fields = (
            "author",
            "created_at",
        )