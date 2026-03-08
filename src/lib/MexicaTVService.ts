import { NewsArticle } from '../data/mockData';

const BASE_URL = 'https://mexicatv.com/wp-json/wp/v2';
const GOURMET_CATEGORY_ID = 9;

export const fetchMexicaGourmetNews = async (): Promise<NewsArticle[]> => {
    try {
        const response = await fetch(
            `${BASE_URL}/posts?categories=${GOURMET_CATEGORY_ID}&_embed&per_page=5`,
            { next: { revalidate: 60 } } // Refresh every minute for "real-time"
        );

        if (!response.ok) {
            throw new Error('Failed to fetch from MexicaTV');
        }

        const data = await response.json();

        return data.map((post: any) => {
            // Extract image from _embedded if available
            let image = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60';
            if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
                image = post._embedded['wp:featuredmedia'][0].source_url;
            } else if (post.jetpack_featured_media_url) {
                image = post.jetpack_featured_media_url;
            }

            // Extract Video URL (YouTube embed)
            let videoUrl: string | undefined = undefined;
            const content = post.content.rendered;
            const ytMatch = content.match(/https:\/\/www\.youtube\.com\/embed\/([^"?\s]+)/);
            if (ytMatch) {
                videoUrl = ytMatch[0];
            }

            // Format date
            const dateObj = new Date(post.date);
            const formattedDate = dateObj.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            // Clean excerpt (strip HTML)
            const cleanExcerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').replace('[&hellip;]', '...').trim();

            return {
                id: post.id.toString(),
                title: post.title.rendered,
                date: formattedDate,
                excerpt: cleanExcerpt,
                image: image,
                videoUrl: videoUrl,
                relatedRestaurantIds: []
            };
        });
    } catch (error) {
        console.error('Error fetching MexicaTV news:', error);
        throw error;
    }
};
