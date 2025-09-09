type DomainFailureType = {
    directFailures: number;
    proxyFailures: number;
    lastFailure: number;
};

const domainFailures: Record<string, DomainFailureType> = {};

const DIRECT_FAILURE_THRESHOLD = 2;
const PROXY_FAILURE_THRESHOLD = 2;
const COOLDOWN_PERIOD_MS = 10 * 60 * 1000;

export function markDomainFailure(domain: string, type: 'direct' | 'proxy') {
    const now = Date.now();
    const entry = domainFailures[domain] || {
        directFailures: 0,
        proxyFailures: 0,
        lastFailure: now,
    };

    entry.lastFailure = now;

    if (type === 'direct') {
        entry.directFailures += 1;
    } else {
        entry.proxyFailures += 1;
    }

    domainFailures[domain] = entry;
}

export function isDomainTotallyUnhealthy(domain: string): boolean {
    const entry = domainFailures[domain];
    if (!entry) return false;

    const now = Date.now();
    const isInCooldown = now - entry.lastFailure < COOLDOWN_PERIOD_MS;

    return (
        entry.directFailures >= DIRECT_FAILURE_THRESHOLD &&
        entry.proxyFailures >= PROXY_FAILURE_THRESHOLD &&
        isInCooldown
    );
}

