import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostBySlug } from '../lib/sanity';
import { markdownToHtml } from '../lib/markdown';
import SEO from '../components/SEO';
import { generateArticleSchema } from '../lib/schema';

interface BlogPost {
    [key: string]: unknown;
}

const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    const articleSchema = post ? generateArticleSchema({
        title: post.title,
        description: post.excerpt,
        image: post.image || 'https://vunachain.com/og-image.png',
        datePublished: post.publishedAt,
        author: post.author?.name || 'Vunachain Expert',
        url: `https://vunachain.com/blog/${slug}`,
        category: post.category
    }) : undefined;

    useEffect(() => {
        if (!slug) return;
        const fetchPost = async () => {
            try {
                const data = await getPostBySlug(slug);
                setPost(data);
            } catch (error) {
                console.error('Error fetching post:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    if (loading) return <div className="pt-32 text-center animate-pulse">Loading analysis...</div>;
    if (!post) return <div className="pt-32 text-center">Report not found. <Link to="/blog" className="text-primary underline">Back to list</Link></div>;

    return (
        <article className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <SEO
                title={post.title}
                description={post.excerpt}
                image={post.image}
                article={true}
                schema={articleSchema}
            />
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-8 transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Insights
            </Link>

            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded">{post.category}</span>
                    <span className="text-gray-400 font-mono text-sm">{new Date(post.publishedAt).toLocaleDateString()}</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                    {post.title}
                </h1>
                {post.author && (
                    <div className="flex items-center gap-3 border-t border-gray-100 dark:border-white/5 pt-6">
                        {post.author.image && <img src={post.author.image} className="h-10 w-10 rounded-full" alt={post.author.name} />}
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{post.author.name}</p>
                            <p className="text-xs text-gray-500">Traceability Compliance Expert</p>
                        </div>
                    </div>
                )}
            </header>

            {post.image && (
                <figure className="mb-12 -mx-4 sm:mx-0">
                    <img src={post.image} alt={post.title} className="w-full rounded-lg shadow-2xl" />
                </figure>
            )}

            <div
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(post.excerpt + "\n\n" + (post.content ? "Content coming from Sanity..." : "")) }}
            >
                {/* Note: Mapping PortableText to React components is better than dangerouslySetInnerHTML with markdownToHtml, 
            but using markdownToHtml for now as it exists in lib/markdown.ts */}
            </div>

            {/* Fallback for the demo since we haven't implemented a full PortableText to React renderer yet */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-bold mb-4">Verification Required</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
                    This report summary was generated via Sanity CMS. To view the full verified blockchain certificate for this batch, please request a pilot.
                </p>
                <Link to="/#roi" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">
                    Request Pilot Verification
                </Link>
            </div>
        </article>
    );
};

export default BlogPostPage;
