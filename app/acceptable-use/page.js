export default function AcceptableUsePolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Acceptable Use Policy</h1>
            <p className="mb-4 text-gray-400">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-gray-300">
                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">1. Prohibited Content</h2>
                    <p>You may not use OFCharmer to generate, host, or share content that allows for:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>Illegal acts or promoting illegal acts.</li>
                        <li>Harassment, bullying, or threatening behavior.</li>
                        <li>Hate speech or discrimination.</li>
                        <li>Distribution of malware or viruses.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">2. System Abuse</h2>
                    <p>You agree not to attempt to damage, deny service to, hack, crack, reverse-engineer, or otherwise interfere with the OFCharmer platform in any manner.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">3. Account Responsibility</h2>
                    <p>You are responsible for maintaining the security of your account and are fully responsible for all activities that occur under the account.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">4. Violation Consequences</h2>
                    <p>OFCharmer reserves the right to terminate your access to the services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                </section>
            </div>
        </div>
    );
}
