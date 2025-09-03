'use client';

import NextLink from 'next/link';

export default function SiteHeader() {
    return (
        <header className="site-header">
            <div className="site-header__inner">
                <NextLink href="/" aria-label="Taroscoper Home">
                    {/* MOD: point to your logo path in Big5/public */}
                    <img className="brand-logo" src="/logo.svg" alt="Taroscoper" />
                </NextLink>

                <nav className="header-actions">
                    <NextLink href="/test" className="btn btn--gold">Start Test</NextLink>
                    <NextLink href="/articles" className="btn btn--bronze">Articles</NextLink>
                </nav>
            </div>
        </header>
    );
}