import { LoadingSpinner } from "./loading-spinner";

export function PageLoader() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
            <LoadingSpinner />
        </div>
    );
}
