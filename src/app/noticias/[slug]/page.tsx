import React from 'react';
import { getPostBySlug } from '@/lib/wordpress';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaRegClock, FaUser } from 'react-icons/fa';
import Link from 'next/link';
import styles from './ArticlePage.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className={styles.page}>
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
