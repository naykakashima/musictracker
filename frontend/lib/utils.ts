import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SunburstData } from "@/types/genres"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const fetcher: (...args: [input: RequestInfo | URL, init?: RequestInit | undefined]) => Promise<unknown> = (...args) => 
	fetch(...args).then((res) => res.json());
export async function convertImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

}
/**
 * The above type defines a data structure for genres with a name and a numerical value.
 * @property {string} name - The `name` property in the `GenreData` type represents the name of a
 * genre.
 * @property {number} value - The `value` property in the `GenreData` type represents a numerical value
 * associated with a particular genre.
 */
export function transformGenreData(apiData: Record<string, number>): SunburstData {
	return {
	  name: 'genres',
	  children: Object.entries(apiData)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([name, value]) => ({
		  name: name.split(' ')[0], // Take first word of genre
		  value
		}))
	}
};