/**
 * Simple recursive Lexical JSON to HTML converter for server-side PDF generation.
 * Handles: root, paragraph, text, heading, list, listitem, quote.
 */

export function lexicalToHtml(jsonString: string | null | undefined): string {
    if (!jsonString) return "";
    try {
        const data = JSON.parse(jsonString);
        return renderNode(data.root);
    } catch (e) {
        console.error("Error parsing Lexical JSON:", e);
        return jsonString || "";
    }
}

function renderNode(node: any): string {
    if (!node) return "";

    let childrenHtml = "";
    if (node.children) {
        childrenHtml = node.children.map((child: any) => renderNode(child)).join("");
    }

    switch (node.type) {
        case "root":
            return `<div class="lexical-root">${childrenHtml}</div>`;
        case "paragraph":
            return `<p class="lexical-p">${childrenHtml}</p>`;
        case "text":
            let text = node.text || "";
            // Handle formats (bold, italic, etc.)
            if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
            if (node.format & 2) text = `<em>${text}</em>`;        // Italic
            if (node.format & 4) text = `<u>${text}</u>`;        // Underline
            if (node.format & 8) text = `<del>${text}</del>`;      // Strikethrough
            return text;
        case "heading":
            const tag = node.tag || "h1";
            return `<${tag} class="lexical-heading">${childrenHtml}</${tag}>`;
        case "list":
            const listTag = node.listType === "number" ? "ol" : "ul";
            return `<${listTag} class="lexical-list">${childrenHtml}</${listTag}>`;
        case "listitem":
            return `<li class="lexical-listitem">${childrenHtml}</li>`;
        case "quote":
            return `<blockquote class="lexical-quote">${childrenHtml}</blockquote>`;
        case "linebreak":
            return `<br />`;
        default:
            return childrenHtml;
    }
}
