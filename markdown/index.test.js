const renderMarkdown = require('./index')

test('Markdown', it => {

  it('runs', renderMarkdown())

  const source =
`---
title: Title
tags: [abc, def]
---

# H1

[Link](http://example.com)

`

  const snapshot = {
    html: '<h1><a name="h1" class="markdown-heading-anchor" href="#"></a>H1</h1>\n<p><a href="http://example.com">Link</a></p>\n',
    attributes: {
      title: 'Title',
      tags: [ 'abc', 'def' ]
    }
  }

  const result = renderMarkdown(source)

  it('returns rendered html and attributes from Markdown front matter', result.html && result.attributes)
  it('renders html correctly', result.html===snapshot.html, { snapshot: snapshot.html, result: result.html })
  it('parses Markdown frontmatter correctly',
    it.is(snapshot.attributes, result.attributes)
  )
})
