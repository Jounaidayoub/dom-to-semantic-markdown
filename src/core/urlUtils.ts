import {SemanticMarkdownAST} from "../types/markdownTypes";

/**
 * Resolves a URL using a base URL. This is useful when the URL is relative
 * and needs to be resolved against a specific base URL.
 * @param url The URL to resolve (can be relative or absolute)
 * @param baseUrl The base URL to use for resolution
 * @returns The resolved URL, or the original URL if baseUrl is not provided or URL is already absolute
 */
export function resolveUrl(url: string | null | undefined, baseUrl?: string): string {
    // Handle null/undefined but not empty string (empty string is a valid relative URL)
    if (url === null || url === undefined) {
        return '';
    }
    
    // If no base URL provided, return the URL as-is
    if (!baseUrl) {
        return url;
    }
    
    // If the URL is already absolute (has a protocol), return it as-is
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
        return url;
    }
    
    try {
        // Use URL constructor to resolve relative URLs (including empty string)
        const resolvedUrl = new URL(url, baseUrl);
        return resolvedUrl.href;
    } catch (e) {
        // If URL resolution fails, return the original URL
        return url;
    }
}

const mediaSuffixes = ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "tif", "svg",
    "webp", "ico", "avi", "mov", "mp4", "mkv", "flv", "wmv", "webm", "mpeg",
    "mpg", "mp3", "wav", "aac", "ogg", "flac", "m4a", "pdf", "doc", "docx",
    "ppt", "pptx", "xls", "xlsx", "txt", "css", "js", "xml", "json",
    "html", "htm"
];
const addRefPrefix = (prefix: string, prefixesToRefs: Record<string, string>): string => {
    if (!prefixesToRefs[prefix]) {
        prefixesToRefs[prefix] = 'ref' + Object.values(prefixesToRefs).length;
    }
    return prefixesToRefs[prefix];
}
const processUrl = (url: string, prefixesToRefs: Record<string, string>) => {
    if (!url.startsWith('http')) {
        return url;
    } else {
        const mediaSuffix = url.split('.').slice(-1)[0];
        if (mediaSuffix && mediaSuffixes.includes(mediaSuffix)) {
            const parts = url.split('/'); // Split URL keeping the slash before text
            const prefix = parts.slice(0, -1).join('/'); // Get the prefix by removing last part
            const refPrefix = addRefPrefix(prefix, prefixesToRefs);
            return `${refPrefix}://${parts.slice(-1).join('')}`
        } else {
            if (url.split('/').length > 4) {
                return addRefPrefix(url, prefixesToRefs);
            } else {
                return url;
            }
        }

    }

}

export function refifyUrls(markdownElement: SemanticMarkdownAST | SemanticMarkdownAST[], prefixesToRefs: Record<string, string> = {}) {
    if (Array.isArray(markdownElement)) {
        markdownElement.forEach(element => refifyUrls(element, prefixesToRefs));
    } else {
        switch (markdownElement.type) {
            case 'link':
                markdownElement.href = processUrl(markdownElement.href, prefixesToRefs);
                refifyUrls(markdownElement.content, prefixesToRefs);
                break;
            case 'image':
            case 'video':
                markdownElement.src = processUrl(markdownElement.src, prefixesToRefs);
                break;
            case 'list':
                markdownElement.items.forEach(item => item.content.forEach(_ => refifyUrls(_, prefixesToRefs)));
                break;
            case 'table':
                markdownElement.rows.forEach(row =>
                    row.cells.forEach(cell =>
                        typeof cell.content === 'string' ? null : refifyUrls(cell.content, prefixesToRefs)
                    )
                );
                break;
            case 'blockquote':
            case 'semanticHtml':
                refifyUrls(markdownElement.content, prefixesToRefs);
                break;
        }
    }
    return prefixesToRefs;
}
