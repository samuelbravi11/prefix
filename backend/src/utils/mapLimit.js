// src/utils/mapLimit.js
export async function mapLimit(items, limit, worker) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const concurrency = Math.max(1, Number(limit || 1));
  const results = new Array(items.length);

  let i = 0;
  let active = 0;

  return new Promise((resolve, reject) => {
    const next = () => {
      if (i >= items.length && active === 0) return resolve(results);

      while (active < concurrency && i < items.length) {
        const idx = i++;
        active++;

        Promise.resolve(worker(items[idx], idx))
          .then((res) => {
            results[idx] = res;
            active--;
            next();
          })
          .catch(reject);
      }
    };

    next();
  });
}
