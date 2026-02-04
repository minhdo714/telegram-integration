export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="mb-4 text-gray-400">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-gray-300">
                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">1. Information Collection</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or communicate with us.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">2. Use of Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect OFCharmer and our users.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">3. Information Sharing</h2>
                    <p>We do not share your personal information with companies, organizations, or individuals outside of OFCharmer except in the following cases: with your consent, for legal reasons, or to protect rights and safety.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">4. Data Security</h2>
                    <p>We work hard to protect OFCharmer and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.</p>
                </section>
            </div>
        </div>
    );
}
