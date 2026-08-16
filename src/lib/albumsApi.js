export async function fetchStaticSiteData() {
  const response = await fetch("/site-data.json");

  if (!response.ok) {
    throw new Error("Failed to load static site data.");
  }

  return response.json();
}

export async function fetchSiteData() {
  const response = await fetch("/api/site-data");

  if (!response.ok) {
    return fetchStaticSiteData();
  }

  return response.json();
}
