import ImageUpload from "./components/ImageUpload";

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="container mx-auto pt-20">
                <h1 className="text-4xl font-bold text-center mb-2">GreenChainz Alpha</h1>
                <p className="text-center text-gray-500 mb-10">System Check: S3 Asset Pipeline</p>

                {/* Render the component */}
                <ImageUpload />

            </div>
        </main>
    );
}
