export async function fetcher<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Request to ${url} failed with status ${response.status}`);
	}
	return response.json();
}
