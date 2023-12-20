export const contains = (target: string, pattern: string[]) => {
    let value = false;

    pattern.forEach(function (word) {
        if (!target.includes(word)) return

        value = true
    });

    return value
}