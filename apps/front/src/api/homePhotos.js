import { apiFetch } from "./client";


export async function getHomePhotos() {
  const data = await apiFetch(
    "/api/home-photos/"
  );

  return data?.results || data || [];
}


export async function uploadHomePhoto(
  photoId,
  {
    image,
    altText,
  }
) {
  const formData = new FormData();

  if (image) {
    formData.append(
      "image",
      image
    );
  }

  formData.append(
    "alt_text",
    altText || ""
  );

  return apiFetch(
    `/api/home-photos/${photoId}/upload/`,
    {
      method: "POST",
      body: formData,
    }
  );
}