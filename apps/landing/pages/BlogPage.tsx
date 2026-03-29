import React, { useEffect, useState } from 'react';
import { getAllPosts } from '../lib/sanity';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { generateBreadcrumbSchema } from '../lib/schema';

const BlogPage: React.FC = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const breadcrumbs = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://vunachain.com' },
        { name: 'Insights', url: 'https://vunachain.com/blog' }
    ]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getAllPosts();
                setPosts(data);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <SEO
                title="VunaInsights - Supply Chain Intelligence"
                description="Deep dives into EUDR compliance, sustainable supply chains, and the future of agricultural traceability in East Africa."
                schema={breadcrumbs}
            />
            <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">VunaInsights</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                    Deep dives into EUDR compliance, sustainable supply chains, and the future of agricultural traceability in East Africa.
                </p>
            </header>

            {loading ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-lg h-80"></div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, idx) => (
                        <motion.a
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group flex flex-col bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden hover:shadow-xl transition-all"
                        >
                            {post.image && (
                                <div className="aspect-[16/9] overflow-hidden">
                                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            )}
                            <div className="p-6 flex-grow flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded">{post.category}</span>
                                    <span className="text-xs text-gray-400">{new Date(post.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">{post.title}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-grow">{post.excerpt}</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                                    Read Analysis <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}

            {posts.length === 0 && !loading && (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-lg border border-dashed border-gray-300 dark:border-white/10">
                    <p className="text-gray-500">No reports published yet. Check back soon!</p>
                </div>
            )}
        </div>
    );
};

export default BlogPage;
