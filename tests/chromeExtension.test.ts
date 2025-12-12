import {JSDOM} from 'jsdom';
import {
    convertHtmlToMarkdown
} from '../src';

describe('Chrome Extension Use Case', () => {
    let dom: JSDOM;

    beforeAll(() => {
        dom = new JSDOM();
    });

    test('simulates Chrome extension context without baseUrl (broken behavior)', () => {
        // This simulates what would happen in a Chrome extension without the fix
        // In actual Chrome extension, accessing .href would return chrome-extension://...
        // We can't replicate that exactly in JSDOM, but we can show the literal values work
        const html = `
            <div>
                <a href="/about">About</a>
                <a href="contact.html">Contact</a>
                <img src="/images/logo.png" alt="Logo">
            </div>
        `;
        
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser()
        });
        
        // Without baseUrl, we get literal attribute values (which is what we want)
        expect(markdown).toContain('[About](/about)');
        expect(markdown).toContain('[Contact](contact.html)');
        expect(markdown).toContain('![Logo](/images/logo.png)');
    });

    test('simulates Chrome extension context with baseUrl (fixed behavior)', () => {
        // In a Chrome extension, user would pass the actual page URL as baseUrl
        const html = `
            <div>
                <a href="/about">About</a>
                <a href="contact.html">Contact</a>
                <img src="/images/logo.png" alt="Logo">
                <a href="https://external.com">External</a>
                <a href="#section">Section</a>
            </div>
        `;
        
        // User provides the actual page URL (e.g., from chrome.tabs API)
        const actualPageUrl = 'https://example.com/pages/index.html';
        
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: actualPageUrl
        });
        
        // Relative URLs are resolved against the actual page URL
        expect(markdown).toContain('[About](https://example.com/about)');
        expect(markdown).toContain('[Contact](https://example.com/pages/contact.html)');
        expect(markdown).toContain('![Logo](https://example.com/images/logo.png)');
        // Absolute URLs remain unchanged
        expect(markdown).toContain('[External](https://external.com)');
        // Fragment identifiers remain unchanged
        expect(markdown).toContain('[Section](#section)');
    });

    test('Chrome extension with websiteDomain to strip domain from resolved URLs', () => {
        // User wants relative paths in the output even after resolution
        const html = `
            <div>
                <a href="/about">About</a>
                <img src="/images/logo.png" alt="Logo">
            </div>
        `;
        
        const actualPageUrl = 'https://example.com/index.html';
        
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: actualPageUrl,
            websiteDomain: 'https://example.com'
        });
        
        // URLs are resolved then stripped back to relative paths
        expect(markdown).toContain('[About](/about)');
        expect(markdown).toContain('![Logo](/images/logo.png)');
    });

    test('Chrome extension processing current page DOM', () => {
        // Simulating processing the actual page DOM in a Chrome extension
        const pageHtml = `
            <html>
                <head><title>Example Page</title></head>
                <body>
                    <nav>
                        <a href="/home">Home</a>
                        <a href="/about">About</a>
                    </nav>
                    <main>
                        <h1>Welcome</h1>
                        <p>This is the content.</p>
                        <img src="./image.png" alt="Content Image">
                        <a href="more.html">Read More</a>
                    </main>
                </body>
            </html>
        `;
        
        // In a real Chrome extension, this would be the active tab's URL
        const tabUrl = 'https://example.com/pages/index.html';
        
        const markdown = convertHtmlToMarkdown(pageHtml, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: tabUrl,
            extractMainContent: true
        });
        
        // Main content is extracted with properly resolved URLs
        expect(markdown).toContain('# Welcome');
        expect(markdown).toContain('This is the content.');
        expect(markdown).toContain('![Content Image](https://example.com/pages/image.png)');
        expect(markdown).toContain('[Read More](https://example.com/pages/more.html)');
    });
});
