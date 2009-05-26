We = {  
  getURL: function(url, next) {
    new Request({
      method: 'get',
      url: url,
      onComplete: next
    }).send()
  },

  load: function(id, next) {
    We.getURL('../object/' + id, function(response) {
      next(JSON.decode(response))
    })
  },
  
  save: function(doc) {
    new Request({
      url: '../object/' + doc['_object-id'],
      data: {
        doc: JSON.encode(doc)
      },
      onSuccess: function(response) {
        We.reload(JSON.decode(response))
      }
    }).send()
  },
  
  view: function(doc, next, options) {
    // use $merge?
    var options = options || {}
    if (!options.enclosing)
      options.enclosing = doc
      
    var enclosing = options.enclosing
    var node = new Element(options.tag || 'span')

    var $we = function(id, oNode) {
      return (oNode || node).getElement('[weid=' + id + ']')
    }
    
    var $reload = function() {
      We.reload(doc)
    }

    var $save = function() {
      We.save(options.enclosing)
    }

    this.register(doc, node)

    var docViewUrl;

    if (doc._view)
      docViewUrl = '../view/' + doc._view // $fix: objects?
    else
      docViewUrl = '../view/core/' + $type(doc)

    // $fix3: write script to package .js, .html and .css into one .js file
    We.getURL(docViewUrl + '.html', function(html) {
      node.set('html', html)
      
      // $fix3: there is a bug here with the css selector - it can't be we-doc-key
      // it should actually be we:doc-key
      $each(node.getElements('[wedockey]'), function(element) {
        value = doc[element.get('wedockey')]
        We.view(value, function(subNode) {
          subNode.replaces(element)
        }, {tag: element.get('tag'), enclosing: enclosing})
      })

      We.getURL(docViewUrl + '.js', function(js) {
        eval(js)    
        next(node)
      })
    })
  },

  reload: function(doc, next) {
    var entry = this.active[doc['_object-id']]
    entry.doc = doc
    
    this.view(doc, function(newNode) {
      entry.node = newNode.replaces(entry.node)
    }, {tag: entry.node.get('tag')})
  },
  
  active: {},
  
  register: function(doc, node) {
    // $fix3: can this be done with something like php.net/compact()? maybe with an eval?
    // or actually we should wrap the arguments in an object?
    var id = doc['_object-id']
    if (!this.active[id])
      this.active[id] = {doc: doc, node: node}
  },
  
  registerUpdate: function(doc) {
    this.active[doc['_object-id']].update = true
  },
  
  // $fix4: comet
  checkUpdates: function() {
    $each(We.active, function(entry) {
      if (entry.update) {
        We.load(entry.doc['_object-id'], function(newDoc) {
          if (entry.doc['_revision-id'] != newDoc['_revision-id']) {
            We.reload(newDoc)
          }
        })
      }
    })
  },

  display: function(id) {
    We.load(id, function(doc) {
      console.log(doc.toSource())
      We.view(doc, function(node) {
        We.registerUpdate(doc)
        node.inject(document.body)
      })
    })
  }
}

We.checkUpdates.periodical(3000)

We.display(window.location.hash.substring(1))
