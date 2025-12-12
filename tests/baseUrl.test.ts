import {JSDOM} from 'jsdom';
import {
    convertHtmlToMarkdown
} from '../src';

describe('Base URL resolution', () => {
    let dom: JSDOM;

    beforeAll(() => {
        dom = new JSDOM();
    });

    test('resolves relative link with baseUrl', () => {
        const html = '<a href="/about">About</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown.trim()).toBe('[About](https://example.com/about)');
    });

    test('resolves relative image with baseUrl', () => {
        const html = '<img src="/images/logo.png" alt="Logo">';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown.trim()).toBe('![Logo](https://example.com/images/logo.png)');
    });

    test('resolves relative video with baseUrl', () => {
        const html = '<video src="/videos/intro.mp4"></video>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown).toContain('![Video](https://example.com/videos/intro.mp4)');
    });

    test('resolves path-relative link with baseUrl', () => {
        const html = '<a href="contact.html">Contact</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com/pages/'
        });
        expect(markdown.trim()).toBe('[Contact](https://example.com/pages/contact.html)');
    });

    test('keeps absolute URLs unchanged when baseUrl is provided', () => {
        const html = '<a href="https://other.com/page">External</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown.trim()).toBe('[External](https://other.com/page)');
    });

    test('resolves protocol-relative URLs with baseUrl', () => {
        const html = '<img src="//cdn.example.com/image.png" alt="CDN Image">';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        // Protocol-relative URLs are resolved to use the same protocol as baseUrl
        expect(markdown.trim()).toBe('![CDN Image](https://cdn.example.com/image.png)');
    });

    test('works without baseUrl (returns literal attribute values)', () => {
        const html = '<a href="/about">About</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser()
        });
        expect(markdown.trim()).toBe('[About](/about)');
    });

    test('handles empty href with baseUrl', () => {
        const html = '<a href="">Empty</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        // Empty href is resolved against the base URL
        expect(markdown.trim()).toBe('[Empty](https://example.com/)');
    });

    test('handles missing href attribute', () => {
        const html = '<a>No href</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown.trim()).toBe('[No href](#)');
    });

    test('resolves multiple relative links with baseUrl', () => {
        const html = `
            <div>
                <a href="/home">Home</a>
                <a href="/about">About</a>
                <img src="/logo.png" alt="Logo">
            </div>
        `;
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown).toContain('[Home](https://example.com/home)');
        expect(markdown).toContain('[About](https://example.com/about)');
        expect(markdown).toContain('![Logo](https://example.com/logo.png)');
    });

    test('baseUrl works with websiteDomain to strip domain', () => {
        const html = '<a href="/page">Page</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com',
            websiteDomain: 'https://example.com'
        });
        expect(markdown.trim()).toBe('[Page](/page)');
    });

    test('handles data URLs correctly with baseUrl', () => {
        const html = '<img src="data:image/png;base64,iVBORw0KG" alt="Data">';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown.trim()).toBe('![Data](-)');
    });

    test('handles data URLs in links correctly with baseUrl', () => {
        const html = '<a href="data:image/png;base64,iVBORw0KG">Data Link</a>';
        const markdown = convertHtmlToMarkdown(html, {
            overrideDOMParser: new dom.window.DOMParser(),
            baseUrl: 'https://example.com'
        });
        expect(markdown.trim()).toBe('[Data Link](-)');
    });
});
