const PATTERN = /window.APP_INITIALIZATION_STATE=\[\[\[\d+.\d+,(\d+.\d+),(\d+.\d+)/

export default async function urlToCoordinate(url: string) {
    const res = await fetch(url)
    const matcher = (await res.text()).match(PATTERN)
    if (matcher != null) {
        const [latitude, longitude] = matcher.slice(1, 3).map(Number)
        return { latitude, longitude }
    }
    return { latitude: null, longitude: null }
}