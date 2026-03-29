import os
import requests
from typing import List, Dict, Any, Optional

def portable_text_to_markdown(blocks: List[Dict[str, Any]]) -> str:
    """
    Converts Sanity's Portable Text blocks to Markdown.
    Ported from Vunachain_landing/lib/markdown.ts
    """
    if not blocks:
        return ""

    markdown_parts = []
    for block in blocks:
        block_type = block.get("_type")

        if block_type == "block":
            children = block.get("children", [])
            text_parts = []
            for child in children:
                text = child.get("text", "")
                marks = child.get("marks", [])

                if "strong" in marks:
                    text = f"**{text}**"
                if "em" in marks:
                    text = f"_{text}_"
                if "code" in marks:
                    text = f"`{text}`"
                
                text_parts.append(text)
            
            full_text = "".join(text_parts)
            style = block.get("style", "normal")

            if style == "h2":
                markdown_parts.append(f"## {full_text}")
            elif style == "h3":
                markdown_parts.append(f"### {full_text}")
            elif style == "h4":
                markdown_parts.append(f"#### {full_text}")
            elif style == "blockquote":
                markdown_parts.append(f"> {full_text}")
            else:
                markdown_parts.append(full_text)

        elif block_type == "image":
            alt = block.get("alt", "Image")
            image_url = block.get("asset", {}).get("url", "")
            caption = block.get("caption")
            img_markdown = f"![{alt}]({image_url})"
            if caption:
                img_markdown += f"\n\n_{caption}_"
            markdown_parts.append(img_markdown)

        elif block_type == "code":
            language = block.get("language", "javascript")
            code = block.get("code", "")
            markdown_parts.append(f"```{language}\n{code}\n```")

    return "\n\n".join(markdown_parts)

def fetch_sanity_content(slug: str) -> Optional[Dict[str, Any]]:
    """
    Fetches a post from Sanity by slug and converts it to Markdown.
    """
    project_id = os.getenv("SANITY_PROJECT_ID")
    dataset = os.getenv("SANITY_DATASET")
    
    if not project_id or not dataset:
        return None

    # GROQ query ported from Next.js route
    query = """
    *[_type == "post" && slug.current == $slug && isPublished == true][0]{
        title,
        "slug": slug.current,
        excerpt,
        publishedAt,
        "author": author->name,
        content,
        category,
        keywords,
        "featuredImage": featuredImage.asset->url
    }
    """
    
    url = f"https://{project_id}.api.sanity.io/v2021-10-21/data/query/{dataset}"
    params = {
        "query": query,
        "$slug": slug
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        result = response.json().get("result")
        
        if not result:
            return None
            
        # Convert Portable Text to Markdown
        result["markdown_content"] = portable_text_to_markdown(result.get("content", []))
        
        # Format the final Markdown document
        markdown = f"# {result['title']}\n\n"
        markdown += f"**By** {result['author']} | **Published** {result['publishedAt']} | **Category** {result.get('category', 'General')}\n\n"
        markdown += f"{result.get('excerpt', '')}\n\n"
        markdown += "---\n\n"
        markdown += result["markdown_content"] + "\n\n"
        markdown += "---\n\n"
        
        keywords = result.get("keywords", [])
        if keywords:
            markdown += f"**Keywords:** {', '.join(keywords)}\n"
            
        result["full_markdown"] = markdown
        return result
        
    except Exception as e:
        print(f"Error fetching from Sanity: {e}")
        return None
