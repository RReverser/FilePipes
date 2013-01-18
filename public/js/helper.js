function $(id) {
    return id in $._cache ? $._cache[id] : $._cache[id] = document.getElementById(id);
}
$._cache = {};

function getPageSocket() {
    return io.connect(location.pathname.replace(/\/$/, ''), {
        'max reconnection attempts': Infinity,
        'reconnection delay': 0
    });
}
