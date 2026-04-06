
const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

async function fetchAPI(query: string, { variables }: { variables?: Record<string, unknown> } = {}) {
  const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };

  if (process.env.WORDPRESS_AUTH_REFRESH_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.WORDPRESS_AUTH_REFRESH_TOKEN}`;
  }

  const res = await fetch(API_URL!, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error(json.errors);
    throw new Error('Failed to fetch API');
  }
  return json.data;
}

export async function getLatestNews(perPage = 10, categoryId?: number | string, tagSlugs?: string[]) {
  try {
    const categoryIds = typeof categoryId === 'string' 
      ? categoryId.split(',').map(id => parseInt(id.trim())) 
      : categoryId ? [categoryId] : null;

    const data = await fetchAPI(
      `
      query GetLatestNews($first: Int, $categoryIn: [ID], $tagSlugIn: [String]) {
        posts(first: $first, where: { categoryIn: $categoryIn, tagSlugIn: $tagSlugIn }) {
          nodes {
            id
            title
            excerpt
            slug
            date
            featuredImage {
              node {
                sourceUrl
              }
            }
            categories {
              nodes {
                name
              }
            }
          }
        }
      }
    `,
      {
        variables: {
          first: perPage,
          categoryIn: categoryIds,
          tagSlugIn: tagSlugs || null,
        },
      }
    );

    return data?.posts?.nodes || [];
  } catch (error) {
    console.error("Error fetching news from WordPress GraphQL:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const data = await fetchAPI(
      `
      query GetPostBySlug($id: ID!) {
        post(id: $id, idType: SLUG) {
          id
          title
          content
          slug
          date
          author {
            node {
              name
            }
          }
          featuredImage {
            node {
              sourceUrl
            }
          }
          categories {
            nodes {
              name
            }
          }
        }
      }
    `,
      {
        variables: { id: slug },
      }
    );

    const post = data?.post;
    if (!post) return null;

    return {
      ...post,
      author: post.author?.node?.name || 'Staff'
    };
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return null;
  }
}

export async function searchArticles(query: string, first = 3) {
  try {
    const data = await fetchAPI(
      `
      query SearchArticles($first: Int, $search: String) {
        posts(first: $first, where: { search: $search }) {
          nodes {
            id
            title
            excerpt
            slug
            date
            featuredImage {
              node {
                sourceUrl
              }
            }
          }
        }
      }
    `,
      {
        variables: {
          first,
          search: query,
        },
      }
    );

    return data?.posts?.nodes || [];
  } catch (error) {
    console.error("Error searching articles from WordPress:", error);
    return [];
  }
}
