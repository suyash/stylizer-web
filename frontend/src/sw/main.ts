// NOTE: this is a problem because we cannot tell typescript to set global this explicitly
// tslint:disable-next-line:variable-name
const _self = (self as any) as ServiceWorkerGlobalScope;

const CACHE_NAME: string = "SERVICE_WORKER_CACHE_NAME";

const PRECACHE_URLS: string[] = [
    "/",
    "/static/main.css",
    "/static/main.js",
];

_self.addEventListener("install", (event: any): void => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache: Cache) => {
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                return _self.skipWaiting();
            }),
    );
});

_self.addEventListener("activate", (event: any) => {
    event.waitUntil(
        caches.keys().then((keyList: string[]) => {
            return Promise.all(
                keyList
                .filter((key: string): boolean => key !== CACHE_NAME)
                .map((key: string): Promise<boolean> => caches.delete(key),
            ));
        }),
    );
    return _self.clients.claim();
});

_self.addEventListener("fetch", (event: any) => {
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then((response: Response|undefined): Response|Promise<Response> => {
                if (response) {
                    return response;
                }

                // tslint:disable-next-line:no-shadowed-variable
                return fetch(event.request).then((response: Response) => {
                    if (
                        response.status === 200
                        && (event.request.url.endsWith(".jpg") || event.request.url.endsWith(".png"))
                    ) {
                        return caches.open(CACHE_NAME).then((cache: Cache) => {
                            cache.put(event.request.url, response.clone());
                            return response;
                        });
                    } else {
                        return response;
                    }
                });
            }),
    );
});
