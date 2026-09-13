import warnings

from PIL import (
    Image,
    UnidentifiedImageError,
)

from rest_framework.exceptions import (
    ValidationError,
)


MAX_UPLOAD_SIZE_BYTES = (
    5 * 1024 * 1024
)

MAX_IMAGE_WIDTH = 8000
MAX_IMAGE_HEIGHT = 8000

MAX_IMAGE_PIXELS = (
    25_000_000
)

ALLOWED_IMAGE_FORMATS = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
}


def validate_uploaded_image_file(
    uploaded_file,
):
    """
    Valide un média image avant stockage.

    Protections :
    - taille maximale du fichier ;
    - format réel détecté par Pillow ;
    - dimensions maximales ;
    - nombre maximal de pixels ;
    - détection des decompression bombs.
    """

    if uploaded_file is None:
        raise ValidationError(
            {
                "image": (
                    "Veuillez sélectionner "
                    "une image."
                )
            }
        )

    file_size = getattr(
        uploaded_file,
        "size",
        None,
    )

    if (
        file_size is not None
        and file_size
        > MAX_UPLOAD_SIZE_BYTES
    ):
        raise ValidationError(
            {
                "image": (
                    "La taille maximale "
                    "autorisée est de 5 Mo."
                )
            }
        )

    image_format = None
    image_width = 0
    image_height = 0

    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning,
            )

            image = Image.open(
                uploaded_file
            )

            image_format = (
                image.format or ""
            ).upper()

            (
                image_width,
                image_height,
            ) = image.size

            image.verify()

    except (
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise ValidationError(
            {
                "image": (
                    "L'image est trop grande "
                    "ou présente un risque de "
                    "décompression excessive."
                )
            }
        )

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        TypeError,
    ):
        raise ValidationError(
            {
                "image": (
                    "Le fichier envoyé "
                    "n'est pas une image valide."
                )
            }
        )

    finally:
        try:
            uploaded_file.seek(0)

        except (
            AttributeError,
            OSError,
            ValueError,
        ):
            pass

    if (
        image_width > MAX_IMAGE_WIDTH
        or image_height > MAX_IMAGE_HEIGHT
    ):
        raise ValidationError(
            {
                "image": (
                    "Dimensions maximales "
                    "autorisées : "
                    "8000 x 8000 pixels."
                )
            }
        )

    pixel_count = (
        image_width
        * image_height
    )

    if pixel_count > MAX_IMAGE_PIXELS:
        raise ValidationError(
            {
                "image": (
                    "L'image dépasse la limite "
                    "de 25 millions de pixels."
                )
            }
        )

    if (
        image_format
        not in ALLOWED_IMAGE_FORMATS
    ):
        raise ValidationError(
            {
                "image": (
                    "Format d'image non autorisé. "
                    "Formats acceptés : "
                    "JPEG, PNG, WEBP."
                )
            }
        )

    return ALLOWED_IMAGE_FORMATS[
        image_format
    ]
