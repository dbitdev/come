import React from 'react';
import { getPostBySlug } from '@/lib/wordpress';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaRegClock, FaUser } from 'react-icons/fa';
import Link from 'next/link';
import styles from './ArticlePage.module.css';

import { Metadata } from 'next';
import Script from 'next/script';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: 'Noticia no encontrada | Néctar' };
  }

  const title = `${post.title} | Néctar Editorial`;
  const description = post.excerpt?.replace(/<[^>]*>?/gm, '').substring(0, 160) || `Lee la crónica completa sobre ${post.title} en Néctar.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [post.featuredImage?.node?.sourceUrl || '/come.jpg'],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [post.featuredImage?.node?.sourceUrl || '/come.jpg'],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    image: [post.featuredImage?.node?.sourceUrl || '/come.jpg'],
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Néctar Editorial',
      logo: {
        '@type': 'ImageObject',
        url: 'https://comeweb.mx/logo-c.png',
      },
    },
  };

  return (
    <div className={styles.page}>
      <Script
        id="news-article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.main}>
        <div className={styles.hero} style={{ backgroundImage: `url(${post.featuredImage?.node?.sourceUrl || '/news-placeholder.jpg'})` }}>
          <div className={styles.heroOverlay}>
            <div className={styles.container}>
              <Link href="/#noticias" className={styles.backLink}>
                <FaArrowLeft /> Volver a noticias
              </Link>
              <div className={styles.badge}>{post.categories?.nodes?.[0]?.name || 'Editorial'}</div>
              <h1 className={styles.title}>{post.title}</h1>
              <div className={styles.meta}>
                <span><FaUser /> {post.author}</span>
                <span><FaRegClock /> {new Date(post.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contentContainer}>
          <div className={`${styles.contentCard} liquid-glass`}>
            <div 
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
