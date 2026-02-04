export default function TermsOfService() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="mb-4 text-gray-400">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-gray-300">
                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">1. Agreement to Terms</h2>
                    <p>By accessing or using OFCharmer, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">2. Usage License</h2>
                    <p>Permission is granted to temporarily access the materials (information or software) on OFCharmer's website for personal, non-commercial transitory viewing only.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">3. Disclaimer</h2>
                    <p>The materials on OFCharmer's website are provided on an 'as is' basis. OFCharmer makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-white">4. Limitations</h2>
                    <p>In no event shall OFCharmer or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on OFCharmer's website.</p>
                </section>
            </div>
        </div>
    );
}
