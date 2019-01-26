const { promisify } = require('util')

module.exports = function extendFind({ db, instance }) {

  // Find one: Wrap to accept empty query

  const findOne = promisify(instance.findOne.bind(instance))

  db.findOne = (query = {}, ...args) => findOne(query, ...args)

  // Find: Extend query with several operators

  db.find = (extendedQuery = {}, options = {}) => new Promise((resolve, reject) => {

    const {
      $page, $pageMax = 10,
      $sort, $skip,
      $include, $exclude, // Fields
      $projection = options.projection,
      $count,
      ...query
    } = extendedQuery

    if ($include) {
      $include.forEach(key => $projection[key] = 1)
    } else if ($exclude) {
      $exclude.forEach(key => $projection[key] = 0)
    }

    if (!$page && !$sort && !$skip) {
      return instance.find(query, $projection, (err, docs) => err ? reject(err) :
        resolve(!docs ? [] :
          (!$count ? docs : docs.slice(0, parseInt($count, 10)))
        )
      )
    }

    db.count(query).then(maxItems => {

      const { id: queryId, slug: querySlug, ...commonQuery } = query

      let cursor = instance.find(commonQuery || {}, $projection)

      if ($sort) cursor = cursor.sort($sort)
      if ($skip) cursor = cursor.skip($skip)

      if (!$page) {
        return cursor.exec((err, docs) => err ? reject(err) :
          resolve(!docs ? [] : docs.filter(doc =>
            queryId ? doc.id===queryId
              : (querySlug ? doc.slug===querySlug : true)
          ))
        )
      }

      // Paged result

      const maxPages = Math.ceil(maxItems / $pageMax)
      const startIndex = ($page - 1) * $pageMax
      const endIndex = $pageMax

      return cursor
        .skip(startIndex)
        .limit(endIndex)
        .exec((err, docs) => err ? reject(err) :
          resolve({
            result: docs,
            currentPage: $page,
            pageMax: $pageMax,
            maxItems,
            maxPages
          })
        )
    })
  })

  return db
}