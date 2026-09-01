import { apiFetch } from "./client";


export async function getHomeHero() {
  return apiFetch(
    "/api/home-hero/"
  );
}


export async function uploadHomeHero({
  image,
  altText,
}) {
  const formData =
    new FormData();

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
    "/api/home-hero/upload/",
    {
      method: "POST",
      body: formData,
    }
  );
}