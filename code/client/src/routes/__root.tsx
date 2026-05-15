import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const navClass = "px-4 py-2 rounded font-medium transition";
const active = `${navClass} bg-blue-500 text-white`;
const inactive = `${navClass} bg-gray-200 text-gray-700 hover:bg-gray-300`;

export const Route = createRootRoute({
    component: () => (
        <div className="p-4 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">SimpleCRM</h1>
                <div className="flex gap-2">
                    <Link to="/" activeProps={{ className: active }} inactiveProps={{ className: inactive }} activeOptions={{ exact: true }}>
                        Home
                    </Link>
                    <Link to="/pipeline" activeProps={{ className: active }} inactiveProps={{ className: inactive }}>
                        Pipeline
                    </Link>
                    <Link to="/forecast" activeProps={{ className: active }} inactiveProps={{ className: inactive }}>
                        Forecast
                    </Link>
                    <Link to="/settings" activeProps={{ className: active }} inactiveProps={{ className: inactive }}>
                        Settings
                    </Link>
                </div>
            </div>
            <Outlet />
            <ReactQueryDevtools initialIsOpen={false} />
            <TanStackRouterDevtools />
        </div>
    ),
});
